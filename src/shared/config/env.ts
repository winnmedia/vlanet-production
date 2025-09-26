import { z } from 'zod';

// Supabase URL 패턴 검증
const supabaseUrlSchema = z
  .string()
  .url('올바른 Supabase URL을 입력해주세요')
  .regex(
    /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    'Supabase URL 형식이 올바르지 않습니다'
  );

// API 키 보안 검증 (최소 길이 및 패턴)
const apiKeySchema = z
  .string()
  .min(32, 'API 키는 최소 32자 이상이어야 합니다')
  .regex(/^[A-Za-z0-9._-]+$/, 'API 키 형식이 올바르지 않습니다');

const envSchema = z.object({
  // Supabase 설정
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,

  NEXT_PUBLIC_SUPABASE_ANON_KEY: apiKeySchema,

  SUPABASE_SERVICE_ROLE_KEY: apiKeySchema.optional(),

  // 앱 설정 (임시로 완화)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .default('https://vlanet.vercel.app'),

  // 보안 설정
  NEXT_PUBLIC_CSP_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  SECURITY_HEADERS_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // 세션 보안 (임시로 완화)
  SESSION_SECRET: z
    .string()
    .min(1, '세션 시크릿이 필요합니다')
    .optional()
    .default('temp-session-secret-for-build'),

  // 비디오 업로드 제한
  NEXT_PUBLIC_MAX_VIDEO_SIZE: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .positive('비디오 최대 크기는 양수여야 합니다')
        .max(524288000, '비디오 크기는 500MB를 초과할 수 없습니다') // 500MB 제한
    )
    .default('209715200'), // 200MB

  NEXT_PUBLIC_MAX_VIDEO_DURATION: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .positive('비디오 최대 길이는 양수여야 합니다')
        .max(600, '비디오 길이는 10분을 초과할 수 없습니다') // 10분 제한
    )
    .default('120'), // 2분

  NEXT_PUBLIC_MAX_VIDEO_RESOLUTION: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .positive('비디오 최대 해상도는 양수여야 합니다')
        .max(4320, '해상도는 4K를 초과할 수 없습니다') // 4K 제한
    )
    .default('1080'),

  // 레이트 리미팅
  RATE_LIMIT_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('100'),

  RATE_LIMIT_WINDOW: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('900'), // 15분

  // 모니터링 및 분석
  NEXT_PUBLIC_ANALYTICS_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, 'Google Analytics Measurement ID 형식이 올바르지 않습니다 (G-XXXXXXXXXX)')
    .optional(),

  NEXT_PUBLIC_ANALYTICS_ENDPOINT: z
    .string()
    .url('올바른 Analytics 엔드포인트 URL을 입력해주세요')
    .optional(),

  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url('올바른 Sentry DSN을 입력해주세요')
    .optional(),

  // Node 환경
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// 환경 변수 검증 및 타입 생성
function validateEnv() {
  try {
    const result = envSchema.parse(process.env);

    // 프로덕션 환경 보안 검증
    if (result.NODE_ENV === 'production') {
      validateProductionSecurity(result);
    }

    // 개발 환경에서 보안 경고
    if (result.NODE_ENV === 'development') {
      logDevelopmentWarnings(result);
    }

    return result;
  } catch (error) {
    console.error('❌ 환경 변수 검증 실패:', error);
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.');
        const message = err.message;
        return `  • ${path}: ${message}`;
      });
      console.error('환경 변수 오류:');
      console.error(errorMessages.join('\n'));

      // 보안 관련 오류 특별 처리
      const securityErrors = error.errors.filter((err) =>
        err.path.some(path =>
          typeof path === 'string' &&
          (path.includes('KEY') || path.includes('SECRET') || path.includes('URL'))
        )
      );

      if (securityErrors.length > 0) {
        console.error('\n🔒 보안 관련 설정을 확인해주세요.');
      }
    }
    process.exit(1);
  }
}

// 프로덕션 환경 보안 검증
function validateProductionSecurity(env: z.infer<typeof envSchema>) {
  const warnings: string[] = [];

  // HTTPS 강제
  if (!env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
    warnings.push('프로덕션에서는 HTTPS를 사용해야 합니다.');
  }

  // 세션 시크릿 검증
  if (!env.SESSION_SECRET) {
    warnings.push('프로덕션에서 세션 시크릿이 설정되지 않았습니다.');
  }

  // CSP 활성화 권장
  if (!env.NEXT_PUBLIC_CSP_ENABLED) {
    warnings.push('Content Security Policy 활성화를 권장합니다.');
  }

  if (warnings.length > 0) {
    console.warn('⚠️  프로덕션 보안 경고:');
    warnings.forEach(warning => console.warn(`  • ${warning}`));
  }
}

// 개발 환경 경고
function logDevelopmentWarnings(env: z.infer<typeof envSchema>) {
  if (!env.NEXT_PUBLIC_CSP_ENABLED) {
    console.info('💡 개발 중에도 CSP를 활성화하여 테스트해보세요.');
  }

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    console.info('💡 에러 모니터링을 위해 Sentry 설정을 고려해보세요.');
  }
}

export const env = validateEnv();

// 타입 정의
export type Env = typeof env;

// 보안 헤더 생성 유틸리티
export function getSecurityHeaders() {
  const headers: Record<string, string> = {};

  if (env.SECURITY_HEADERS_ENABLED) {
    // XSS 방어
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['Referrer-Policy'] = 'origin-when-cross-origin';

    // HTTPS 강제 (프로덕션)
    if (env.NODE_ENV === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    // Content Security Policy
    if (env.NEXT_PUBLIC_CSP_ENABLED) {
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        `connect-src 'self' ${env.NEXT_PUBLIC_SUPABASE_URL}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ];
      headers['Content-Security-Policy'] = cspDirectives.join('; ');
    }
  }

  return headers;
}

// 환경별 설정 확인
export function isProduction() {
  return env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return env.NODE_ENV === 'development';
}

export function isTest() {
  return env.NODE_ENV === 'test';
}

// 기능 플래그
export function isFeatureEnabled(feature: keyof Pick<Env, 'NEXT_PUBLIC_CSP_ENABLED' | 'SECURITY_HEADERS_ENABLED' | 'NEXT_PUBLIC_ANALYTICS_ENABLED'>) {
  return env[feature] === true;
}