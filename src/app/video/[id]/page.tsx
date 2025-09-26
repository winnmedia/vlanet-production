/**
 * Video Watch Page
 * 영상 시청 전용 페이지 - 플레이어, 정보, 상호작용
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVideoById } from '@/entities/video/api';
import { getCurrentUser } from '@/features/auth';
import type { User } from '@/entities/user';
import { VideoPlayer } from '@/widgets/video-player';
import { VideoInfo } from '@/widgets/video-info';
import { RealtimeVideoInteractions } from '@/widgets/realtime-interactions';
import { VideoRecommendations } from '@/widgets/video-recommendations';
import { VideoComments } from '@/widgets/video-comments';
import { ContactCreatorButton } from '@/widgets/contact-creator';

interface VideoPageProps {
  params: {
    id: string;
  };
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const result = await getVideoById(params.id);

  if (!result.video) {
    return {
      title: '영상을 찾을 수 없습니다 - VideoPlanet',
      description: '요청하신 영상이 존재하지 않습니다.',
    };
  }

  const { video } = result;

  return {
    title: `${video.title} - VideoPlanet`,
    description: video.description || `${video.title} - AI 창작 영상`,
    openGraph: {
      title: video.title,
      description: video.description || undefined,
      images: video.thumbnail_url ? [
        {
          url: video.thumbnail_url,
          width: video.width || 1280,
          height: video.height || 720,
          alt: video.title,
        }
      ] : undefined,
      type: 'video.other',
      videos: video.video_url ? [
        {
          url: video.video_url,
          width: video.width || 1280,
          height: video.height || 720,
        }
      ] : undefined,
    },
    twitter: {
      card: 'player',
      title: video.title,
      description: video.description || undefined,
      images: video.thumbnail_url ? [video.thumbnail_url] : undefined,
      players: video.video_url ? [
        {
          playerUrl: `/video/${video.id}`,
          streamUrl: video.video_url,
          width: video.width || 1280,
          height: video.height || 720,
        }
      ] : undefined,
    },
  };
}

/**
 * 비디오 페이지 로딩 컴포넌트
 */
function VideoPageLoading() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* 영상 플레이어 로딩 */}
          <div className="xl:col-span-3">
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              <div className="aspect-video bg-secondary-200 animate-pulse flex items-center justify-center">
                <div className="text-secondary-400 text-6xl">▶️</div>
              </div>
            </div>

            {/* 영상 정보 로딩 */}
            <div className="space-y-4">
              <div className="h-8 bg-secondary-200 rounded animate-pulse"></div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-secondary-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
              <div className="h-20 bg-secondary-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* 사이드바 로딩 */}
          <div className="space-y-4">
            <div className="h-6 bg-secondary-200 rounded animate-pulse"></div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-24 h-16 bg-secondary-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-secondary-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 비디오 페이지 메인 컴포넌트
 */
async function VideoPageContent({ videoId }: { videoId: string }) {
  // 영상 정보와 현재 사용자 정보를 병렬로 조회
  const [videoResult, user] = await Promise.all([
    getVideoById(videoId),
    getCurrentUser(),
  ]);

  // 영상이 존재하지 않거나 비공개인 경우
  if (!videoResult.video) {
    notFound();
  }

  const { video } = videoResult;

  // 비공개 영상은 소유자만 볼 수 있음
  if (!video.is_public && video.creator_id !== user?.id) {
    notFound();
  }

  // 공개되지 않은 영상 (업로드 중, 처리 중, 실패)
  if (video.status !== 'published') {
    // 소유자가 아닌 경우 404
    if (video.creator_id !== user?.id) {
      notFound();
    }

    // 소유자인 경우 상태 표시
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">
            {video.status === 'uploading' && '⏳'}
            {video.status === 'processing' && '🔄'}
            {video.status === 'failed' && '❌'}
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            {video.status === 'uploading' && '업로드 진행 중'}
            {video.status === 'processing' && '영상 처리 중'}
            {video.status === 'failed' && '업로드 실패'}
          </h1>
          <p className="text-secondary-600">
            {video.status === 'uploading' && '영상 업로드가 진행되고 있습니다. 잠시만 기다려주세요.'}
            {video.status === 'processing' && '영상을 처리하고 있습니다. 곧 시청할 수 있습니다.'}
            {video.status === 'failed' && '영상 업로드 중 오류가 발생했습니다. 다시 시도해주세요.'}
          </p>
          {video.error_message && (
            <p className="text-danger-600 text-sm mt-2">
              오류: {video.error_message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* 메인 컨텐츠 영역 */}
          <div className="xl:col-span-3 space-y-6">
            {/* 영상 플레이어 */}
            <VideoPlayer
              video={video}
              user={user}
              autoPlay={false}
            />

            {/* 영상 정보 */}
            <VideoInfo
              video={video}
              user={user}
            />

            {/* 실시간 상호작용 버튼들 */}
            <RealtimeVideoInteractions
              video={video}
              user={user}
            />

            {/* 창작자 연락하기 */}
            <ContactCreatorButton
              video={video as any}
              currentUser={user}
            />

            {/* 댓글 섹션 */}
            <VideoComments
              videoId={video.id}
              currentUser={user?.profile || null}
            />
          </div>

          {/* 사이드바 - 추천 영상 */}
          <div className="xl:col-span-1">
            <VideoRecommendations
              currentVideoId={video.id}
              creatorId={video.creator_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 비디오 페이지 메인 컴포넌트
 */
export default function VideoPage({ params }: VideoPageProps) {
  return (
    <Suspense fallback={<VideoPageLoading />}>
      <VideoPageContent videoId={params.id} />
    </Suspense>
  );
}

/**
 * 정적 생성 설정
 */
export const dynamic = 'force-dynamic'; // 사용자별 권한 체크 필요
export const revalidate = 60; // 1분마다 재검증