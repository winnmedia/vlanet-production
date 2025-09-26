/**
 * Video Interactions Widget
 * 영상 상호작용 (좋아요, 투자 관심, 공유)
 */

'use client';

import { useState, useEffect } from 'react';
import type { VideoWithDetails } from '@/entities/video';
import type { User } from '@/entities/user';
import { toggleVideoReaction, addInvestmentInterest, shareVideo } from '@/features/video-interactions';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface VideoInteractionsProps {
  video: VideoWithDetails;
  user?: User | null;
  className?: string;
}

interface ReactionState {
  liked: boolean;
  disliked: boolean;
  likeCount: number;
  dislikeCount: number;
}

export function VideoInteractions({ video, user, className }: VideoInteractionsProps) {
  const [reactions, setReactions] = useState<ReactionState>({
    liked: false,
    disliked: false,
    likeCount: video.stats?.like_count || 0,
    dislikeCount: video.stats?.dislike_count || 0,
  });

  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 현재 사용자의 반응 상태 로드
  useEffect(() => {
    if (user && video.userReaction) {
      setReactions(prev => ({
        ...prev,
        liked: video.userReaction === 'like',
        disliked: video.userReaction === 'dislike',
      }));
    }
  }, [user, video.userReaction]);

  // 좋아요/싫어요 토글
  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await toggleVideoReaction({
        videoId: video.id,
        reactionType: type,
      });

      if (result.success) {
        setReactions(prev => ({
          ...prev,
          liked: type === 'like' && !prev.liked,
          disliked: type === 'dislike' && !prev.disliked,
          likeCount: result.stats?.likeCount || prev.likeCount,
          dislikeCount: result.stats?.dislikeCount || prev.dislikeCount,
        }));
      }
    } catch (error) {
      console.error('반응 처리 중 오류:', error);
      alert('반응을 처리할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 투자 관심 표시
  const handleInvestmentInterest = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (user.profile?.role !== 'FUNDER') {
      alert('투자자만 투자 관심을 표시할 수 있습니다.');
      return;
    }

    if (user.id === video.creator_id) {
      alert('자신의 영상에는 투자 관심을 표시할 수 없습니다.');
      return;
    }

    setShowInvestmentModal(true);
  };

  // 공유하기
  const handleShare = (method?: 'url' | 'social' | 'embed') => {
    const videoUrl = `${window.location.origin}/video/${video.id}`;

    switch (method) {
      case 'url':
        navigator.clipboard.writeText(videoUrl);
        alert('링크가 복사되었습니다.');
        break;
      case 'social':
        // 소셜 미디어 공유 (예: 트위터)
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(video.title)}&url=${encodeURIComponent(videoUrl)}`,
          '_blank'
        );
        break;
      case 'embed':
        const embedCode = `<iframe src="${videoUrl}/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
        navigator.clipboard.writeText(embedCode);
        alert('임베드 코드가 복사되었습니다.');
        break;
      default:
        setShowShareModal(true);
    }
  };

  return (
    <div className={`${className}`}>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {/* 좋아요/싫어요 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={reactions.liked ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleReaction('like')}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <span>{reactions.liked ? '👍' : '👍'}</span>
                <span>{reactions.likeCount.toLocaleString()}</span>
              </Button>

              <Button
                variant={reactions.disliked ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleReaction('dislike')}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <span>{reactions.disliked ? '👎' : '👎'}</span>
                <span>{reactions.dislikeCount.toLocaleString()}</span>
              </Button>
            </div>

            {/* 투자 관심 (Funder만) */}
            {user?.profile?.role === 'FUNDER' && user.id !== video.creator_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleInvestmentInterest}
                className="flex items-center space-x-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <span>💰</span>
                <span>투자 관심</span>
              </Button>
            )}
          </div>

          {/* 공유 */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare()}
              className="flex items-center space-x-2"
            >
              <span>📤</span>
              <span>공유</span>
            </Button>
          </div>
        </div>

        {/* 통계 표시 */}
        {video.stats && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 text-sm text-secondary-600">
            <div className="flex items-center space-x-4">
              <span>조회수 {video.stats.view_count.toLocaleString()}회</span>
              {video.stats.investment_interest_count > 0 && (
                <span>투자 관심 {video.stats.investment_interest_count}명</span>
              )}
            </div>

            {video.stats.completion_rate > 0 && (
              <span>완주율 {Math.round(video.stats.completion_rate)}%</span>
            )}
          </div>
        )}
      </Card>

      {/* 투자 관심 모달 */}
      {showInvestmentModal && (
        <InvestmentModal
          video={video}
          user={user!}
          onClose={() => setShowInvestmentModal(false)}
        />
      )}

      {/* 공유 모달 */}
      {showShareModal && (
        <ShareModal
          video={video}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

// 투자 관심 모달 컴포넌트
function InvestmentModal({
  video,
  user,
  onClose
}: {
  video: VideoWithDetails;
  user: User;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    amountMin: '',
    amountMax: '',
    message: '',
    contactEmail: user.email || '',
    isPublic: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await addInvestmentInterest({
        videoId: video.id,
        amountMin: formData.amountMin ? parseFloat(formData.amountMin) : undefined,
        amountMax: formData.amountMax ? parseFloat(formData.amountMax) : undefined,
        message: formData.message,
        contactEmail: formData.contactEmail,
        isPublic: formData.isPublic,
      });

      if (result.success) {
        alert('투자 관심이 등록되었습니다. 창작자가 연락드릴 예정입니다.');
        onClose();
      }
    } catch (error) {
      console.error('투자 관심 등록 오류:', error);
      alert('투자 관심을 등록할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          투자 관심 표시
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              투자 희망액 (선택)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="최소 금액"
                value={formData.amountMin}
                onChange={(e) => setFormData(prev => ({ ...prev, amountMin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                placeholder="최대 금액"
                value={formData.amountMax}
                onChange={(e) => setFormData(prev => ({ ...prev, amountMax: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              메시지 (선택)
            </label>
            <textarea
              placeholder="창작자에게 전달할 메시지를 입력해주세요..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              연락처 이메일
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isPublic" className="text-sm text-secondary-700">
              투자 의향을 공개적으로 표시
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// 공유 모달 컴포넌트
function ShareModal({
  video,
  onClose,
  onShare
}: {
  video: VideoWithDetails;
  onClose: () => void;
  onShare: (method: 'url' | 'social' | 'embed') => void;
}) {
  const videoUrl = `${window.location.origin}/video/${video.id}`;

  const shareOptions = [
    {
      method: 'url' as const,
      title: '링크 복사',
      description: '영상 링크를 클립보드에 복사',
      icon: '🔗',
    },
    {
      method: 'social' as const,
      title: '소셜 미디어',
      description: '트위터, 페이스북 등에 공유',
      icon: '📱',
    },
    {
      method: 'embed' as const,
      title: '임베드 코드',
      description: '웹사이트에 영상 삽입',
      icon: '💻',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          영상 공유하기
        </h3>

        <div className="space-y-3">
          {shareOptions.map((option) => (
            <button
              key={option.method}
              onClick={() => {
                onShare(option.method);
                onClose();
              }}
              className="w-full p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{option.icon}</span>
                <div>
                  <div className="font-medium text-secondary-900">{option.title}</div>
                  <div className="text-sm text-secondary-600">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-secondary-600 mb-2">미리보기:</div>
          <div className="text-sm text-secondary-900 font-medium">{video.title}</div>
          <div className="text-xs text-secondary-500 break-all">{videoUrl}</div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </Card>
    </div>
  );
}