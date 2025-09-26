/**
 * Video View Tracking
 * 영상 시청 기록 추적 기능
 */

import { createServerClient } from '@/shared/api/supabase/server';

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

/**
 * 영상 시청 기록 추가/업데이트
 */
export async function trackVideoView(params: TrackViewParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // 세션 ID 생성 (브라우저 측에서 제공되지 않은 경우)
    const sessionId = params.sessionId || generateSessionId();

    // 기존 시청 기록 확인 (같은 세션)
    const { data: existingView } = await supabase
      .from('video_views')
      .select('id, watch_duration')
      .eq('video_id', params.videoId)
      .eq('session_id', sessionId)
      .single();

    if (existingView) {
      // 기존 기록 업데이트 (더 긴 시청 시간으로만)
      if (params.watchDuration > existingView.watch_duration) {
        const { error } = await supabase
          .from('video_views')
          .update({
            watch_duration: params.watchDuration,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingView.id);

        if (error) {
          console.error('시청 기록 업데이트 오류:', error);
          return { success: false, error: error.message };
        }
      }
    } else {
      // 새 시청 기록 생성
      const { error } = await supabase
        .from('video_views')
        .insert({
          video_id: params.videoId,
          user_id: params.userId,
          session_id: sessionId,
          watch_duration: params.watchDuration,
          total_duration: params.totalDuration,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
          referrer: params.referrer,
        });

      if (error) {
        console.error('시청 기록 생성 오류:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('trackVideoView 예외:', error);
    return { success: false, error: 'Failed to track video view' };
  }
}

/**
 * 클라이언트 사이드 시청 추적
 */
export function trackVideoViewClient(params: Omit<TrackViewParams, 'ipAddress' | 'userAgent' | 'referrer' | 'sessionId'>) {
  // 브라우저 정보 수집
  const sessionId = getOrCreateSessionId();
  const userAgent = navigator.userAgent;
  const referrer = document.referrer;

  return trackVideoView({
    ...params,
    sessionId,
    userAgent,
    referrer,
  });
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