/**
 * Video Recommendations Widget
 * 추천 영상 목록 (사이드바용)
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { VideoWithDetails } from '@/entities/video';
import { getRelatedVideos, getTrendingVideos } from '@/entities/video';
import { formatDuration, formatFileSize } from '@/entities/video';

interface VideoRecommendationsProps {
  currentVideoId: string;
  creatorId?: string;
  className?: string;
}

interface RecommendationVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  creator: {
    username: string;
    id: string;
  } | null;
  stats: {
    view_count: number;
  } | null;
  duration: number | null;
  created_at: string;
}

export function VideoRecommendations({
  currentVideoId,
  creatorId,
  className
}: VideoRecommendationsProps) {
  const [videos, setVideos] = useState<RecommendationVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'related' | 'trending'>('related');

  // 관련 영상과 트렌딩 영상 로드
  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        let result;

        if (activeTab === 'related' && creatorId) {
          // 같은 창작자의 다른 영상 또는 관련 영상
          result = await getRelatedVideos(currentVideoId, {
            limit: 12,
            excludeVideoId: currentVideoId,
            preferSameCreator: true,
          });
        } else {
          // 트렌딩 영상
          result = await getTrendingVideos(12);
        }

        if (result) {
          // Transform the results to match RecommendationVideo interface
          const transformedVideos: RecommendationVideo[] = result
            .filter((video: any) => video.id !== currentVideoId)
            .map((video: any) => ({
              id: video.id,
              title: video.title,
              thumbnail_url: video.thumbnail_url || null,
              creator: video.creator || null,
              stats: video.stats || null,
              duration: video.duration || null,
              created_at: video.created_at,
            }));
          setVideos(transformedVideos);
        }
      } catch (error) {
        console.error('추천 영상 로드 오류:', error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [currentVideoId, creatorId, activeTab]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex space-x-2">
          <div className="h-8 bg-secondary-200 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-secondary-200 rounded w-20 animate-pulse"></div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <RecommendationVideoSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 탭 버튼 */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('related')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'related'
              ? 'bg-white text-secondary-900 shadow-sm'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          관련 영상
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trending'
              ? 'bg-white text-secondary-900 shadow-sm'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          인기 영상
        </button>
      </div>

      {/* 영상 목록 */}
      <div className="space-y-3">
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📺</div>
            <p className="text-secondary-600">
              {activeTab === 'related' ? '관련 영상이 없습니다' : '인기 영상이 없습니다'}
            </p>
          </div>
        ) : (
          videos.map((video) => (
            <RecommendationVideoCard
              key={video.id}
              video={video}
            />
          ))
        )}
      </div>
    </div>
  );
}

// 추천 영상 카드 컴포넌트
function RecommendationVideoCard({ video }: { video: RecommendationVideo }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/video/${video.id}`}
      className="block group"
    >
      <div className="flex space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
        {/* 썸네일 */}
        <div className="relative flex-shrink-0 w-24 h-16 bg-gray-200 rounded overflow-hidden">
          {!imageError && video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              width={96}
              height={64}
              onError={() => setImageError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              priority={false}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
          )}

          {/* 재생 시간 오버레이 */}
          {video.duration && (
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        {/* 영상 정보 */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-medium text-sm text-secondary-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
            {video.title}
          </h4>

          {/* 창작자 */}
          {video.creator && (
            <p className="text-xs text-secondary-600 truncate">
              {video.creator.username}
            </p>
          )}

          {/* 통계 */}
          <div className="flex items-center space-x-2 text-xs text-secondary-500">
            {video.stats && (
              <span>조회수 {video.stats.view_count.toLocaleString()}회</span>
            )}
            <span>•</span>
            <span>{getRelativeTime(video.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 추천 영상 스켈레톤
function RecommendationVideoSkeleton() {
  return (
    <div className="flex space-x-3 p-2">
      <div className="w-24 h-16 bg-secondary-200 rounded animate-pulse"></div>
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-secondary-200 rounded animate-pulse"></div>
        <div className="h-3 bg-secondary-200 rounded w-2/3 animate-pulse"></div>
        <div className="h-3 bg-secondary-200 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
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