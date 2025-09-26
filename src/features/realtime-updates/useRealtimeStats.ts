/**
 * Realtime Video Statistics Hook
 * Supabase Realtime을 사용한 영상 통계 실시간 업데이트
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import type { VideoStats } from '@/entities/video';

interface UseRealtimeVideoStatsOptions {
  videoId: string;
  onUpdate?: (stats: VideoStats) => void;
}

interface UseRealtimeVideoStatsReturn {
  stats: VideoStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useRealtimeVideoStats({
  videoId,
  onUpdate
}: UseRealtimeVideoStatsOptions): UseRealtimeVideoStatsReturn {
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const supabase = createClient();
    let channel: any = null;

    // Supabase Realtime을 사용한 실시간 통계 구독 시스템

    const initializeStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 초기 통계 데이터 로드
        const { data: initialStats, error: fetchError } = await supabase
          .from('video_stats')
          .select('*')
          .eq('video_id', videoId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
          throw fetchError;
        }

        if (initialStats) {
          setStats(initialStats);
          onUpdate?.(initialStats);
        }

        // Realtime 채널 구독 설정
        const channelName = `video_stats_${videoId}`;
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE 모든 이벤트
              schema: 'public',
              table: 'video_stats',
              filter: `video_id=eq.${videoId}` // 특정 영상의 통계만 구독
            },
            (payload: any) => {
              console.log('실시간 통계 업데이트:', payload);

              // 이벤트 타입별 처리
              switch (payload.eventType) {
                case 'INSERT':
                case 'UPDATE':
                  if (payload.new) {
                    const newStats = payload.new as VideoStats;
                    setStats(newStats);
                    onUpdate?.(newStats);
                  }
                  break;

                case 'DELETE':
                  // 통계 삭제 시 null로 설정
                  setStats(null);
                  break;

                default:
                  console.warn('알 수 없는 이벤트 타입:', payload.eventType);
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`실시간 구독 성공: ${channelName}`);
              setError(null);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('실시간 구독 오류:', err);
              setError('실시간 연결에 실패했습니다.');
            } else if (status === 'TIMED_OUT') {
              console.error('실시간 구독 타임아웃');
              setError('실시간 연결이 타임아웃되었습니다.');
            } else if (status === 'CLOSED') {
              console.log('실시간 구독이 종료되었습니다.');
            }
          });

      } catch (err: any) {
        console.error('실시간 통계 구독 오류:', err);
        setError(err.message || '통계 구독 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStats();

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [videoId, onUpdate]);

  return {
    stats,
    isLoading,
    error
  };
}