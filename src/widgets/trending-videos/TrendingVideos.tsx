/**
 * Trending Videos Widget
 * 홈페이지용 트렌딩 영상 섹션
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TrendingVideo } from '../../entities/video';
import { formatDuration } from '../../entities/video';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';

interface TrendingVideosProps {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function TrendingVideos({ limit = 6, showViewAll = true, className }: TrendingVideosProps) {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrendingVideos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/videos/trending?limit=${limit}`);
        const result = await response.json();

        if (result.success && result.data) {
          setVideos(result.data);
        } else {
          console.error('API 응답 오류:', result.error);
        }
      } catch (error) {
        console.error('트렌딩 영상 로드 오류:', error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendingVideos();
  }, [limit]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-7 bg-secondary-200 rounded w-32 animate-pulse"></div>
          {showViewAll && <div className="h-9 bg-secondary-200 rounded w-20 animate-pulse"></div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <TrendingVideoSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">🔥 트렌딩 영상</h2>
        </div>
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            아직 트렌딩 영상이 없습니다
          </h3>
          <p className="text-secondary-600">
            첫 번째 AI 영상을 업로드하여 트렌드를 만들어보세요!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-secondary-900">🔥 트렌딩 영상</h2>
        {showViewAll && (
          <Link href={'/explore' as any}>
            <Button variant="outline" size="sm">
              전체 보기
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <TrendingVideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

// 트렌딩 영상 카드 컴포넌트
function TrendingVideoCard({ video }: { video: TrendingVideo }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/video/${video.id}`} className="block group">
      <Card className="overflow-hidden card-hover">
        {/* 썸네일 */}
        <div className="relative aspect-video bg-gray-200 overflow-hidden">
          {!imageError && video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              <span className="text-4xl">🎬</span>
            </div>
          )}

          {/* 트렌딩 배지 */}
          <div className="absolute top-2 left-2 bg-danger-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            TRENDING
          </div>

          {/* 트렌딩 스코어 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            🔥 {video.trending_score.toFixed(1)}
          </div>
        </div>

        {/* 영상 정보 */}
        <div className="p-4">
          <h3 className="font-semibold text-secondary-900 line-clamp-2 mb-3 group-hover:text-primary-600 transition-colors">
            {video.title}
          </h3>

          {/* 통계 정보 */}
          <div className="flex items-center justify-between text-xs text-secondary-500">
            <span>👁 {video.view_count.toLocaleString()}</span>
            <span>{getRelativeTime(video.created_at)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// 트렌딩 영상 스켈레톤
function TrendingVideoSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-secondary-200 animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-secondary-200 rounded animate-pulse"></div>
        <div className="h-4 bg-secondary-200 rounded w-3/4 animate-pulse"></div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-secondary-200 rounded-full animate-pulse"></div>
          <div className="h-3 bg-secondary-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-secondary-200 rounded w-16 animate-pulse"></div>
          <div className="h-3 bg-secondary-200 rounded w-12 animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
}

// 상대 시간 계산
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}일 전`;
  } else if (diffHours > 0) {
    return `${diffHours}시간 전`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}분 전`;
  } else {
    return '방금 전';
  }
}