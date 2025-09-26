/**
 * Realtime Video Interactions Widget
 * 실시간 통계 업데이트를 지원하는 상호작용 버튼들
 */

'use client';

import { useState, useTransition, useOptimistic } from 'react';
import type { VideoWithDetails } from '@/entities/video';
import type { User } from '@/entities/user';
import { toggleVideoReaction, addInvestmentInterest, cancelInvestmentInterest } from '@/features/video-interactions';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface RealtimeVideoInteractionsProps {
  video: VideoWithDetails;
  user?: User | null;
  className?: string;
}

interface OptimisticStats {
  likeCount: number;
  dislikeCount: number;
  investmentInterestCount: number;
  userReaction: 'like' | 'dislike' | null;
  userInvestmentInterest: boolean;
}

export function RealtimeVideoInteractions({
  video,
  user,
  className
}: RealtimeVideoInteractionsProps) {
  const [isPending, startTransition] = useTransition();

  // Optimistic updates for immediate UI feedback
  const [optimisticStats, setOptimisticStats] = useOptimistic<OptimisticStats>({
    likeCount: video.stats?.like_count || 0,
    dislikeCount: video.stats?.dislike_count || 0,
    investmentInterestCount: video.stats?.investment_interest_count || 0,
    userReaction: video.userReaction || null,
    userInvestmentInterest: false, // TODO: 실제 사용자 투자 관심 상태
  });

  const handleReactionClick = async (reactionType: 'like' | 'dislike') => {
    if (!user) {
      // TODO: 로그인 모달 표시
      return;
    }

    // Optimistic update
    const wasAlreadyThisReaction = optimisticStats.userReaction === reactionType;
    const wasOppositeReaction = optimisticStats.userReaction && optimisticStats.userReaction !== reactionType;

    setOptimisticStats(prev => ({
      ...prev,
      userReaction: wasAlreadyThisReaction ? null : reactionType,
      likeCount: reactionType === 'like'
        ? (wasAlreadyThisReaction ? prev.likeCount - 1 : prev.likeCount + 1)
        : (wasOppositeReaction ? prev.likeCount - 1 : prev.likeCount),
      dislikeCount: reactionType === 'dislike'
        ? (wasAlreadyThisReaction ? prev.dislikeCount - 1 : prev.dislikeCount + 1)
        : (wasOppositeReaction ? prev.dislikeCount - 1 : prev.dislikeCount),
    }));

    startTransition(async () => {
      try {
        await toggleVideoReaction({
          videoId: video.id,
          reactionType,
        });
      } catch (error) {
        console.error('반응 토글 오류:', error);
        // TODO: 에러 상태 롤백
      }
    });
  };

  const handleInvestmentInterestClick = async () => {
    if (!user) {
      // TODO: 로그인 모달 표시
      return;
    }

    if (user.id === video.creator_id) {
      // 자신의 영상에는 투자 관심 표시 불가
      return;
    }

    // Optimistic update
    setOptimisticStats(prev => ({
      ...prev,
      userInvestmentInterest: !prev.userInvestmentInterest,
      investmentInterestCount: prev.userInvestmentInterest
        ? prev.investmentInterestCount - 1
        : prev.investmentInterestCount + 1,
    }));

    startTransition(async () => {
      try {
        if (optimisticStats.userInvestmentInterest) {
          // 투자 관심 취소
          await cancelInvestmentInterest(video.id);
        } else {
          // 투자 관심 추가
          await addInvestmentInterest({
            videoId: video.id,
          });
        }
      } catch (error) {
        console.error('투자 관심 토글 오류:', error);
        // TODO: 에러 상태 롤백
      }
    });
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {/* 좋아요/싫어요 버튼 */}
          <div className="flex items-center space-x-3">
            <Button
              variant={optimisticStats.userReaction === 'like' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleReactionClick('like')}
              disabled={isPending}
              className="flex items-center space-x-2"
            >
              <span>👍</span>
              <span>{optimisticStats.likeCount.toLocaleString()}</span>
            </Button>

            <Button
              variant={optimisticStats.userReaction === 'dislike' ? 'danger' : 'outline'}
              size="sm"
              onClick={() => handleReactionClick('dislike')}
              disabled={isPending}
              className="flex items-center space-x-2"
            >
              <span>👎</span>
              <span>{optimisticStats.dislikeCount.toLocaleString()}</span>
            </Button>
          </div>

          {/* 투자 관심 및 기타 액션 */}
          <div className="flex items-center space-x-3">
            {/* 투자 관심 버튼 (자신의 영상이 아닌 경우만) */}
            {user && user.id !== video.creator_id && (
              <Button
                variant={optimisticStats.userInvestmentInterest ? 'success' : 'outline'}
                size="sm"
                onClick={handleInvestmentInterestClick}
                disabled={isPending}
                className="flex items-center space-x-2"
              >
                <span>💰</span>
                <span>
                  {optimisticStats.userInvestmentInterest ? '관심 표시됨' : '투자 관심'}
                </span>
                <span className="text-xs">
                  ({optimisticStats.investmentInterestCount})
                </span>
              </Button>
            )}

            {/* 공유 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: 공유 기능 구현
                console.log('영상 공유');
              }}
              className="flex items-center space-x-2"
            >
              <span>📤</span>
              <span>공유</span>
            </Button>
          </div>
        </div>

        {/* 로딩 상태 표시 */}
        {isPending && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-secondary-500">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
              <span>업데이트 중...</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}