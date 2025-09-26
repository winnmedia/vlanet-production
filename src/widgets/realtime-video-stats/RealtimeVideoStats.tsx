/**
 * Realtime Video Stats Widget
 * 실시간으로 업데이트되는 영상 통계 표시
 */

'use client';

import { useRealtimeVideoStats } from '@/features/realtime-updates';
import type { VideoWithDetails } from '@/entities/video';
import type { VideoStats } from '@/entities/video';

interface RealtimeVideoStatsProps {
  video: VideoWithDetails;
  className?: string;
}

export function RealtimeVideoStats({ video, className }: RealtimeVideoStatsProps) {
  const { stats, isLoading, error } = useRealtimeVideoStats({
    videoId: video.id,
    onUpdate: (updatedStats: VideoStats) => {
      console.log('실시간 통계 업데이트:', updatedStats);
    }
  });

  // 실시간 통계가 있으면 사용하고, 없으면 기본 통계 사용
  const currentStats = stats || video.stats;

  if (error) {
    console.warn('실시간 통계 로드 오류:', error);
    // 에러가 있어도 기본 통계는 표시
  }

  return (
    <div className={`flex items-center space-x-6 ${className}`}>
      {/* 조회수 */}
      <div className="flex items-center space-x-2">
        <span className="text-secondary-600">👁</span>
        <span className="font-medium text-secondary-900">
          {currentStats?.view_count?.toLocaleString() || 0}회
        </span>
        {isLoading && (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
               title="실시간 업데이트 중"></div>
        )}
      </div>

      {/* 좋아요 */}
      <div className="flex items-center space-x-2">
        <span className="text-secondary-600">👍</span>
        <span className="font-medium text-secondary-900">
          {currentStats?.like_count?.toLocaleString() || 0}
        </span>
      </div>

      {/* 싫어요 */}
      <div className="flex items-center space-x-2">
        <span className="text-secondary-600">👎</span>
        <span className="font-medium text-secondary-900">
          {currentStats?.dislike_count?.toLocaleString() || 0}
        </span>
      </div>

      {/* 투자 관심 */}
      <div className="flex items-center space-x-2">
        <span className="text-secondary-600">💰</span>
        <span className="font-medium text-secondary-900">
          {currentStats?.investment_interest_count?.toLocaleString() || 0}
        </span>
      </div>

      {/* 실시간 상태 표시 */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isLoading
            ? 'bg-green-400 animate-pulse'
            : error
              ? 'bg-red-400'
              : 'bg-green-500'
        }`}></div>
        <span className="text-xs text-secondary-500">
          {isLoading ? '연결 중...' : error ? '오프라인' : '실시간'}
        </span>
      </div>
    </div>
  );
}