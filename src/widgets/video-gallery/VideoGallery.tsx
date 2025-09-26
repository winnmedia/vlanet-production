/**
 * 영상 갤러리 위젯
 * Creator의 영상들을 3x5 그리드로 표시하는 갤러리
 */

'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  MoreHorizontal,
  Edit3,
  Trash2,
  Share2,
  Globe,
  Lock,
  FileText
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { VideoWithStats } from '@/entities/video';

interface VideoGalleryProps {
  videos: VideoWithStats[];
  loading?: boolean;
  onSort?: (sort: 'newest' | 'popular' | 'comments' | 'funding') => void;
  onFilter?: (filter: 'all' | 'public' | 'private' | 'draft') => void;
  className?: string;
}

/**
 * 영상 카드 컴포넌트
 */
interface VideoCardProps {
  video: VideoWithStats;
}

const VideoCard = memo(function VideoCard({ video }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = {
    public: { icon: Globe, color: 'text-success-600', bg: 'bg-success-100' },
    private: { icon: Lock, color: 'text-warning-600', bg: 'bg-warning-100' },
    draft: { icon: FileText, color: 'text-secondary-600', bg: 'bg-secondary-100' }
  };

  const status = video.is_public ? 'public' : (video.status || 'draft');
  const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || Globe;
  const statusColor = statusConfig[status as keyof typeof statusConfig]?.color || 'text-success-600';
  const statusBg = statusConfig[status as keyof typeof statusConfig]?.bg || 'bg-success-100';

  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden hover:shadow-md transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="gridcell"
      aria-label={`영상: ${video.title}`}
      tabIndex={0}
    >
      {/* 썸네일 영역 */}
      <div className="relative aspect-video bg-secondary-100">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
            className="object-cover"
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400">
            <Play size={24} />
          </div>
        )}

        {/* 호버 오버레이 */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200">
            <div className="flex items-center space-x-2">
              <Link href={`/video/${video.id}`}>
                <Button size="sm" variant="primary" className="rounded-full">
                  <Play size={16} className="mr-1" />
                  재생
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 재생 시간 (있는 경우) */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </div>
        )}

        {/* 상태 배지 */}
        <div className="absolute top-2 left-2">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
            <StatusIcon size={12} className="mr-1" />
            {status === 'public' ? '공개' : status === 'private' ? '비공개' : '초안'}
          </div>
        </div>

        {/* 빠른 작업 메뉴 */}
        <div className="absolute top-2 right-2">
          <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center space-x-1">
              <Button size="sm" variant="ghost" className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100">
                <Edit3 size={14} />
              </Button>
              <Button size="sm" variant="ghost" className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100">
                <Share2 size={14} />
              </Button>
              <Button size="sm" variant="ghost" className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100">
                <MoreHorizontal size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-4">
        {/* 제목 */}
        <h3 className="font-semibold text-secondary-900 line-clamp-2 text-sm mb-2 leading-tight">
          {video.title}
        </h3>

        {/* 통계 */}
        <div className="flex items-center justify-between text-xs text-secondary-500 mb-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye size={12} className="mr-1" />
              {video.views_count?.toLocaleString() || 0}
            </span>
            <span className="flex items-center">
              <Heart size={12} className="mr-1" />
              {video.likes_count?.toLocaleString() || 0}
            </span>
            <span className="flex items-center">
              <MessageCircle size={12} className="mr-1" />
              {video.comments_count?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* 업로드 날짜 */}
        <div className="flex items-center text-xs text-secondary-400">
          <Clock size={12} className="mr-1" />
          {new Date(video.created_at).toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 호버 시 통계 오버레이 */}
      {isHovered && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="text-white text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span>이번 주 조회수</span>
              <span className="font-medium">+{Math.floor(Math.random() * 1000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>평균 시청 시간</span>
              <span className="font-medium">{Math.floor(Math.random() * 60 + 30)}초</span>
            </div>
            {Math.random() > 0.7 && (
              <div className="flex justify-between items-center">
                <span>펀딩 제안</span>
                <span className="font-medium text-primary-300">2건 대기중</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 스켈레톤 로딩 컴포넌트
 */
function VideoCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-secondary-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-secondary-200 rounded" />
        <div className="h-3 bg-secondary-200 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-3 bg-secondary-200 rounded w-1/4" />
          <div className="h-3 bg-secondary-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * 필터 및 정렬 컨트롤
 */
interface ControlsProps {
  onSort?: (sort: 'newest' | 'popular' | 'comments' | 'funding') => void;
  onFilter?: (filter: 'all' | 'public' | 'private' | 'draft') => void;
}

function GalleryControls({ onSort, onFilter }: ControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* 정렬 옵션 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-secondary-600">정렬:</span>
        <select
          onChange={(e) => onSort?.(e.target.value as any)}
          className="text-sm border border-secondary-300 rounded-md px-2 py-1 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option value="newest">최신순</option>
          <option value="popular">인기순</option>
          <option value="comments">댓글 많은순</option>
          <option value="funding">펀딩 제안순</option>
        </select>
      </div>

      {/* 필터 옵션 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-secondary-600">필터:</span>
        <div className="flex space-x-1">
          {[
            { value: 'all', label: '전체' },
            { value: 'public', label: '공개' },
            { value: 'private', label: '비공개' },
            { value: 'draft', label: '초안' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilter?.(value as any)}
              className="px-3 py-1 text-sm rounded-full border border-secondary-300 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 메인 갤러리 컴포넌트
 */
export function VideoGallery({
  videos,
  loading = false,
  onSort,
  onFilter,
  className
}: VideoGalleryProps) {
  return (
    <div className={className}>
      {/* 컨트롤 */}
      <GalleryControls onSort={onSort} onFilter={onFilter} />

      {/* 갤러리 그리드 */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        role="grid"
        aria-label="영상 갤러리"
      >
        {loading
          ? // 로딩 스켈레톤
            Array.from({ length: 15 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))
          : // 실제 영상 카드들
            videos.slice(0, 15).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
      </div>

      {/* 빈 상태 */}
      {!loading && videos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={24} className="text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">아직 업로드된 영상이 없습니다</h3>
          <p className="text-secondary-600 mb-4">첫 번째 영상을 업로드해보세요!</p>
          <Link href="/upload">
            <Button variant="primary">영상 업로드하기</Button>
          </Link>
        </div>
      )}
    </div>
  );
}