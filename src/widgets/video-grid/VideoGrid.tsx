/**
 * Video Grid Widget
 * 영상 목록을 그리드 레이아웃으로 표시하는 위젯
 */

'use client';

import { useState, useEffect } from 'react';
import { VideoCard } from './VideoCard';
import type { VideoWithDetails, VideoFilters, VideoSortOptions } from '@/entities/video';

interface VideoGridProps {
  videos: VideoWithDetails[];
  loading?: boolean;
  error?: string | null;
  showCreator?: boolean;
  showStatus?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  onEdit?: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
  onFiltersChange?: (filters: VideoFilters) => void;
  onSortChange?: (sort: VideoSortOptions) => void;
  hasMore?: boolean;
  className?: string;
}

export function VideoGrid({
  videos,
  loading = false,
  error = null,
  showCreator = true,
  showStatus = false,
  showStats = true,
  showFilters = false,
  showSort = false,
  emptyMessage = '영상이 없습니다.',
  onLoadMore,
  onEdit,
  onDelete,
  onFiltersChange,
  onSortChange,
  hasMore = false,
  className = '',
}: VideoGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortField, setSortField] = useState<VideoSortOptions['field']>('created_at');
  const [sortDirection, setSortDirection] = useState<VideoSortOptions['direction']>('desc');

  // 필터 변경 처리
  useEffect(() => {
    if (onFiltersChange) {
      const filters: VideoFilters = {};

      if (searchQuery.trim()) {
        filters.search_query = searchQuery.trim();
      }

      if (selectedCategory) {
        filters.categories = [selectedCategory];
      }

      onFiltersChange(filters);
    }
  }, [searchQuery, selectedCategory, onFiltersChange]);

  // 정렬 변경 처리
  useEffect(() => {
    if (onSortChange) {
      onSortChange({ field: sortField, direction: sortDirection });
    }
  }, [sortField, sortDirection, onSortChange]);

  // 검색어 입력 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 카테고리 선택 핸들러
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // 정렬 변경 핸들러
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, direction] = e.target.value.split('-') as [VideoSortOptions['field'], VideoSortOptions['direction']];
    setSortField(field);
    setSortDirection(direction);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 필터 및 정렬 바 */}
      {(showFilters || showSort) && (
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            {showFilters && (
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="영상 제목으로 검색..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            )}

            {/* 카테고리 필터 */}
            {showFilters && (
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">모든 카테고리</option>
                  <option value="ai-animation">AI 애니메이션</option>
                  <option value="ai-realistic">AI 실사</option>
                  <option value="music-video">음악 비디오</option>
                  <option value="short-film">단편 영화</option>
                  <option value="advertisement">광고/마케팅</option>
                  <option value="education">교육</option>
                  <option value="experimental">실험적</option>
                </select>
              </div>
            )}

            {/* 정렬 */}
            {showSort && (
              <div className="sm:w-48">
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={handleSortChange}
                  className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="created_at-desc">최신순</option>
                  <option value="created_at-asc">오래된순</option>
                  <option value="view_count-desc">조회수 높은순</option>
                  <option value="view_count-asc">조회수 낮은순</option>
                  <option value="like_count-desc">좋아요 많은순</option>
                  <option value="like_count-asc">좋아요 적은순</option>
                  <option value="title-asc">제목 A-Z</option>
                  <option value="title-desc">제목 Z-A</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="text-danger-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-danger-900 mb-1">영상 로드 오류</h3>
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && videos.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-secondary-200 rounded-lg overflow-hidden"
            >
              <div className="aspect-video bg-secondary-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-secondary-100 rounded animate-pulse" />
                <div className="h-3 bg-secondary-100 rounded w-2/3 animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-3 bg-secondary-100 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-secondary-100 rounded w-20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 영상 그리드 */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              showCreator={showCreator}
              showStatus={showStatus}
              showStats={showStats}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !error && videos.length === 0 && (
        <div className="text-center py-16">
          <div className="text-secondary-400 text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-secondary-600">
            {showFilters && (searchQuery || selectedCategory)
              ? '검색 조건을 변경해보세요.'
              : '첫 번째 영상을 업로드해보세요.'
            }
          </p>
        </div>
      )}

      {/* 더 보기 버튼 */}
      {onLoadMore && hasMore && !loading && (
        <div className="text-center pt-8">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
          >
            더 많은 영상 보기
          </button>
        </div>
      )}

      {/* 로딩 더보기 */}
      {loading && videos.length > 0 && (
        <div className="text-center pt-8">
          <div className="inline-flex items-center space-x-2 text-secondary-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            <span>더 많은 영상을 불러오는 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}