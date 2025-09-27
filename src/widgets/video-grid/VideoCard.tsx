/**
 * Video Card Component
 * 개별 영상 카드 표시 컴포넌트
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { VideoWithDetails } from '../../entities/video';
import { formatDuration, formatFileSize, VIDEO_STATUS_LABELS, getVideoStatusColor } from '../../entities/video';

interface VideoCardProps {
  video: VideoWithDetails;
  showCreator?: boolean;
  showStatus?: boolean;
  showStats?: boolean;
  onEdit?: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
  className?: string;
}

export function VideoCard({
  video,
  showCreator = true,
  showStatus = false,
  showStats = true,
  onEdit,
  onDelete,
  className = '',
}: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isPublished = video.status === 'published';
  const canEdit = onEdit && (video.status === 'published' || video.status === 'failed');
  const canDelete = onDelete;

  // 썸네일 URL (기본값 처리)
  const thumbnailUrl = video.thumbnail_url || '/default-video-thumbnail.png';

  // 영상 링크 (공개된 영상만)
  const videoLink: string = isPublished ? `/video/${video.id}` : '#';

  return (
    <div
      className={`
        group bg-white rounded-lg border border-secondary-200 overflow-hidden
        hover:shadow-lg hover:border-secondary-300 transition-all duration-200
        ${className}
      `}
    >
      {/* 썸네일 */}
      <div className="relative aspect-video bg-secondary-100">
        {isPublished ? (
          <Link href={videoLink as any} className="block w-full h-full">
              {!imageError ? (
                <img
                  src={thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary-100">
                  <div className="text-secondary-400 text-4xl">🎬</div>
                </div>
              )}

              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white/90 rounded-full p-3">
                    <div className="text-primary-600 text-xl">▶️</div>
                  </div>
                </div>
              </div>
          </Link>
        ) : (
          <div className="w-full h-full">
            {!imageError ? (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover opacity-75"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary-100">
                <div className="text-secondary-400 text-4xl">🎬</div>
              </div>
            )}
          </div>
        )}

        {/* 영상 길이 */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* 상태 표시 */}
        {showStatus && video.status !== 'published' && (
          <div className="absolute top-2 left-2">
            <div
              className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white
              `}
              style={{ backgroundColor: getVideoStatusColor(video.status) }}
            >
              {VIDEO_STATUS_LABELS[video.status]}
            </div>
          </div>
        )}

        {/* 메뉴 버튼 (편집 가능한 경우) */}
        {(canEdit || canDelete) && (
          <div className="absolute top-2 right-2">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-black/75 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center">⋯</div>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 bg-white border border-secondary-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <div className="py-1">
                    {canEdit && (
                      <button
                        onClick={() => {
                          onEdit(video.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                      >
                        편집
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          onDelete(video.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 카드 내용 */}
      <div className="p-4">
        {/* 제목 */}
        <div className="mb-2">
          {isPublished ? (
            <Link
              href={videoLink as any}
              className="font-semibold text-secondary-900 hover:text-primary-600 transition-colors duration-200 line-clamp-2"
            >
              {video.title}
            </Link>
          ) : (
            <h3 className="font-semibold text-secondary-900 line-clamp-2">
              {video.title}
            </h3>
          )}
        </div>

        {/* Creator 정보 */}
        {showCreator && video.creator && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-secondary-200 rounded-full flex items-center justify-center">
              {video.creator.avatar_url ? (
                <img
                  src={video.creator.avatar_url}
                  alt={video.creator.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-secondary-600 text-xs">
                  {video.creator.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm text-secondary-600">
              {video.creator.username}
            </span>
          </div>
        )}

        {/* 통계 정보 */}
        {showStats && video.stats && (
          <div className="flex items-center justify-between text-sm text-secondary-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <span>👁️</span>
                <span>{video.stats.view_count.toLocaleString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>❤️</span>
                <span>{video.stats.like_count.toLocaleString()}</span>
              </span>
            </div>

            <time className="text-xs">
              {new Date(video.created_at).toLocaleDateString('ko-KR')}
            </time>
          </div>
        )}

        {/* 카테고리 */}
        {video.categories && video.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {video.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </span>
            ))}
            {video.categories.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                +{video.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 파일 정보 (대시보드에서만) */}
        {showStatus && video.file_size && (
          <div className="mt-3 pt-3 border-t border-secondary-100">
            <div className="text-xs text-secondary-500 space-y-1">
              <div>크기: {formatFileSize(video.file_size)}</div>
              {video.width && video.height && (
                <div>해상도: {video.width} × {video.height}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 클릭 외부 영역으로 메뉴 닫기 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}