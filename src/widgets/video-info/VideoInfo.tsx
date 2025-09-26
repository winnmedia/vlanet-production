/**
 * Video Info Widget
 * 영상 정보 표시 (제목, 설명, 창작자, 메타데이터)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { VideoWithDetails } from '@/entities/video';
import type { User } from '@/entities/user';
import { formatDuration, formatFileSize, getVideoAspectRatio } from '@/entities/video';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { RealtimeVideoStats } from '@/widgets/realtime-video-stats';

interface VideoInfoProps {
  video: VideoWithDetails;
  user?: User | null;
  className?: string;
}

export function VideoInfo({ video, user, className }: VideoInfoProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  // 설명 텍스트 자르기 (150자)
  const shortDescription = video.description && video.description.length > 150
    ? video.description.substring(0, 150) + '...'
    : video.description;

  // 창작자 정보 (VideoWithDetails에서 creator 정보가 있다고 가정)
  const creator = video.creator;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 영상 제목 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
          {video.title}
        </h1>

        {/* 실시간 통계 */}
        <div className="mb-4">
          <RealtimeVideoStats video={video} />
        </div>

        {/* 기본 정보 (업로드 날짜 등) */}
        <div className="flex items-center space-x-4 text-secondary-600 text-sm">
          <span>{new Date(video.created_at).toLocaleDateString('ko-KR')}</span>
          {video.published_at && (
            <>
              <span>•</span>
              <span>게시: {new Date(video.published_at).toLocaleDateString('ko-KR')}</span>
            </>
          )}
        </div>
      </div>

      {/* 창작자 정보 */}
      <Card className="p-4">
        <div className="flex items-start space-x-4">
          {/* 창작자 아바타 */}
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            {creator?.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.username}
                width={48}
                height={48}
                className="rounded-full object-cover"
                priority={false}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            ) : (
              <span className="text-primary-600 font-semibold text-lg">
                {creator?.username?.[0]?.toUpperCase() || 'C'}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* 창작자 이름과 팔로우 버튼 */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <Link
                  href={`/creator/${creator?.id || video.creator_id}` as any}
                  className="font-semibold text-secondary-900 hover:text-primary-600 transition-colors"
                >
                  {creator?.username || '알 수 없는 창작자'}
                </Link>
                {creator?.bio && (
                  <p className="text-secondary-600 text-sm mt-1">
                    {creator.bio}
                  </p>
                )}
              </div>

              {/* 팔로우 버튼 (본인 영상이 아닌 경우만) */}
              {user && user.id !== video.creator_id && (
                <Button variant="outline" size="sm">
                  팔로우
                </Button>
              )}
            </div>

            {/* 창작자 통계 */}
            {creator?.stats && (
              <div className="flex items-center space-x-4 text-secondary-500 text-xs">
                <span>영상 {creator.stats.total_videos}개</span>
                <span>•</span>
                <span>팔로워 {creator.stats.followers?.toLocaleString() || 0}명</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 영상 설명 */}
      {video.description && (
        <Card className="p-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-secondary-900">설명</h3>
            <div className="text-secondary-700 leading-relaxed">
              {showFullDescription ? (
                <div className="whitespace-pre-wrap">{video.description}</div>
              ) : (
                <div>{shortDescription}</div>
              )}

              {video.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2 font-medium"
                >
                  {showFullDescription ? '간략히 보기' : '더 보기'}
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* AI 생성 정보 */}
      {(video.ai_model || video.prompt) && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <h3 className="font-semibold text-secondary-900">AI 생성 정보</h3>
            </div>

            {video.ai_model && (
              <div>
                <span className="text-secondary-600 text-sm font-medium">사용 모델:</span>
                <span className="ml-2 text-secondary-900 font-mono">{video.ai_model}</span>
              </div>
            )}

            {video.prompt && (
              <div>
                <span className="text-secondary-600 text-sm font-medium">프롬프트:</span>
                <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                  <code className="text-sm text-secondary-800">{video.prompt}</code>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 기술적 정보 */}
      <Card className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-secondary-900">영상 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {video.duration && (
              <div>
                <span className="text-secondary-600">길이:</span>
                <span className="ml-2 text-secondary-900">{formatDuration(video.duration)}</span>
              </div>
            )}

            {video.width && video.height && (
              <div>
                <span className="text-secondary-600">해상도:</span>
                <span className="ml-2 text-secondary-900">
                  {video.width}×{video.height} ({getVideoAspectRatio(video.width, video.height)})
                </span>
              </div>
            )}

            {video.fps && (
              <div>
                <span className="text-secondary-600">프레임레이트:</span>
                <span className="ml-2 text-secondary-900">{video.fps}fps</span>
              </div>
            )}

            {video.file_size && (
              <div>
                <span className="text-secondary-600">파일 크기:</span>
                <span className="ml-2 text-secondary-900">{formatFileSize(video.file_size)}</span>
              </div>
            )}

            <div>
              <span className="text-secondary-600">형식:</span>
              <span className="ml-2 text-secondary-900">{video.format.toUpperCase()}</span>
            </div>

            <div>
              <span className="text-secondary-600">업로드:</span>
              <span className="ml-2 text-secondary-900">
                {new Date(video.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 태그 */}
      {video.tags && video.tags.length > 0 && (
        <div>
          <h3 className="font-semibold text-secondary-900 mb-3">태그</h3>
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag, index) => (
              <Link
                key={index}
                href={`/search?tag=${encodeURIComponent(tag)}` as any}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 관리자/소유자 전용 정보 */}
      {user && user.id === video.creator_id && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚙️</span>
              <h3 className="font-semibold text-secondary-900">관리 정보</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">상태:</span>
                <span className="ml-2 text-secondary-900">{video.status}</span>
              </div>

              <div>
                <span className="text-secondary-600">공개 설정:</span>
                <span className="ml-2 text-secondary-900">
                  {video.is_public ? '공개' : '비공개'}
                </span>
              </div>

              <div>
                <span className="text-secondary-600">추천 여부:</span>
                <span className="ml-2 text-secondary-900">
                  {video.is_featured ? '추천' : '일반'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button variant="outline" size="sm">
                편집
              </Button>
              <Button variant="outline" size="sm">
                분석
              </Button>
              <Button variant="outline" size="sm" className="text-danger-600 border-danger-200 hover:bg-danger-50">
                삭제
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}