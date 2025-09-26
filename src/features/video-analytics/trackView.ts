/**
 * Video View Tracking
 * 영상 시청 기록 추적 기능
 */

export interface TrackViewParams {
  videoId: string;
  userId?: string | null;
  watchDuration: number;
  totalDuration: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

// trackVideoView 함수는 별도의 서버 전용 파일로 이동되었습니다.
// API 라우트나 서버 액션에서만 사용하세요.

/**
 * 클라이언트 사이드 시청 추적 (API 호출)
 */
export async function trackVideoViewClient(params: Omit<TrackViewParams, 'ipAddress' | 'userAgent' | 'referrer' | 'sessionId'>): Promise<{ success: boolean; error?: string }> {
  try {
    // 브라우저 정보 수집
    const sessionId = getOrCreateSessionId();
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;

    // API 라우트로 요청 전송
    const response = await fetch('/api/analytics/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        sessionId,
        userAgent,
        referrer,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track view');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('클라이언트 시청 추적 오류:', error);
    return { success: false, error: 'Failed to track video view from client' };
  }
}

/**
 * 세션 ID 생성
 */
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * 세션 ID 가져오기 또는 생성 (브라우저용)
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();

  const storageKey = 'vplanet_session_id';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * 시청 완료율 기반 참여도 계산
 */
export function calculateEngagementScore(watchDuration: number, totalDuration: number): number {
  if (totalDuration <= 0) return 0;

  const completionRate = Math.min(watchDuration / totalDuration, 1);

  // 참여도 점수 (0~100)
  if (completionRate >= 0.9) return 100; // 90% 이상 시청
  if (completionRate >= 0.75) return 85; // 75% 이상 시청
  if (completionRate >= 0.5) return 70;  // 50% 이상 시청
  if (completionRate >= 0.25) return 50; // 25% 이상 시청
  if (completionRate >= 0.1) return 25;  // 10% 이상 시청

  return Math.max(10, completionRate * 100); // 최소 10점
}