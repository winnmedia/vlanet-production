/**
 * API 레이트 리미팅 미들웨어
 * DDoS 공격 및 남용 방지를 위한 요청 제한
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';

interface RateLimitConfig {
  requests: number; // 허용 요청 수
  window: number; // 시간 윈도우 (초)
  skipSuccessful?: boolean; // 성공한 요청 제외 여부
  keyGenerator?: (req: NextRequest) => string; // 커스텀 키 생성기
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: Array<{
    timestamp: number;
    success: boolean;
  }>;
}

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  // 메모리 정리를 위한 주기적 클린업
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 10분마다 만료된 항목 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// 전역 레이트 리미트 저장소
const rateLimitStore = new RateLimitStore();

/**
 * IP 주소 추출
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-remote-addr');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  if (remoteAddr) {
    return remoteAddr.trim();
  }

  return 'unknown';
}

/**
 * 기본 키 생성기 (IP + 경로 기반)
 */
function defaultKeyGenerator(request: NextRequest): string {
  const ip = getClientIP(request);
  const pathname = new URL(request.url).pathname;
  return `${ip}:${pathname}`;
}

/**
 * 사용자 기반 키 생성기
 */
export function createUserBasedKeyGenerator(
  getUserId: (req: NextRequest) => Promise<string | null>
) {
  return async (request: NextRequest): Promise<string> => {
    const userId = await getUserId(request);
    const ip = getClientIP(request);
    const pathname = new URL(request.url).pathname;

    return userId ? `user:${userId}:${pathname}` : `ip:${ip}:${pathname}`;
  };
}

/**
 * 레이트 리미팅 체크
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
} {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const resetTime = now + windowMs;

  const entry = rateLimitStore.get(key);

  if (!entry) {
    // 첫 번째 요청
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime,
      requests: [{ timestamp: now, success: true }],
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime,
      totalRequests: 1,
    };
  }

  // 시간 윈도우 내 요청들만 필터링
  const validRequests = entry.requests.filter(
    req => now - req.timestamp < windowMs
  );

  // 성공한 요청만 카운트 (설정에 따라)
  const countableRequests = config.skipSuccessful
    ? validRequests.filter(req => !req.success)
    : validRequests;

  const currentCount = countableRequests.length + 1;
  const allowed = currentCount <= config.requests;

  // 요청 기록 업데이트
  const updatedEntry: RateLimitEntry = {
    count: currentCount,
    resetTime: Math.max(entry.resetTime, resetTime),
    requests: [
      ...validRequests,
      { timestamp: now, success: allowed }
    ].slice(-config.requests * 2), // 메모리 절약을 위해 제한
  };

  rateLimitStore.set(key, updatedEntry);

  return {
    allowed,
    remaining: Math.max(0, config.requests - currentCount),
    resetTime: updatedEntry.resetTime,
    totalRequests: currentCount,
  };
}

/**
 * 레이트 리미팅 미들웨어 생성기
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(request: NextRequest) {
    try {
      const keyGenerator = config.keyGenerator || defaultKeyGenerator;
      const key = typeof keyGenerator === 'function'
        ? await Promise.resolve(keyGenerator(request))
        : keyGenerator(request);

      const result = checkRateLimit(key, config);

      // 헤더 설정
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', config.requests.toString());
      headers.set('X-RateLimit-Remaining', result.remaining.toString());
      headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

      if (!result.allowed) {
        // 레이트 리미트 초과
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        headers.set('Retry-After', retryAfter.toString());

        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            retryAfter,
          },
          { status: 429, headers }
        );
      }

      // 요청 허용 - 헤더만 추가
      return NextResponse.next({
        request: {
          headers: new Headers(request.headers),
        },
        headers,
      });
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // 에러 발생시 요청 허용 (fail-open 정책)
      return NextResponse.next();
    }
  };
}

/**
 * 미리 정의된 레이트 리미트 설정
 */
export const rateLimitConfigs = {
  // 일반 API (분당 100회)
  default: {
    requests: env.RATE_LIMIT_REQUESTS,
    window: env.RATE_LIMIT_WINDOW / 15, // 15분을 1분으로 변환
  },

  // 인증 관련 (분당 5회)
  auth: {
    requests: 5,
    window: 60,
  },

  // 업로드 (분당 10회)
  upload: {
    requests: 10,
    window: 60,
  },

  // 검색 (분당 60회)
  search: {
    requests: 60,
    window: 60,
  },

  // 댓글 작성 (분당 20회)
  comments: {
    requests: 20,
    window: 60,
  },

  // 비디오 조회 (분당 200회)
  video: {
    requests: 200,
    window: 60,
  },
} as const;

/**
 * 미리 정의된 미들웨어들
 */
export const rateLimitMiddlewares = {
  default: createRateLimitMiddleware(rateLimitConfigs.default),
  auth: createRateLimitMiddleware(rateLimitConfigs.auth),
  upload: createRateLimitMiddleware(rateLimitConfigs.upload),
  search: createRateLimitMiddleware(rateLimitConfigs.search),
  comments: createRateLimitMiddleware(rateLimitConfigs.comments),
  video: createRateLimitMiddleware(rateLimitConfigs.video),
};

/**
 * 특정 키의 레이트 리미트 정보 조회
 */
export function getRateLimitInfo(key: string, config: RateLimitConfig) {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return {
      count: 0,
      remaining: config.requests,
      resetTime: Date.now() + config.window * 1000,
    };
  }

  const now = Date.now();
  const validRequests = entry.requests.filter(
    req => now - req.timestamp < config.window * 1000
  );

  return {
    count: validRequests.length,
    remaining: Math.max(0, config.requests - validRequests.length),
    resetTime: entry.resetTime,
  };
}

/**
 * 레이트 리미트 초기화 (테스트용)
 */
export function resetRateLimit(key?: string) {
  if (key) {
    rateLimitStore.clear();
  } else {
    rateLimitStore.clear();
  }
}

/**
 * 통계 조회
 */
export function getRateLimitStats() {
  return {
    totalKeys: rateLimitStore.size(),
    // 메모리 사용량 등 추가 통계 가능
  };
}