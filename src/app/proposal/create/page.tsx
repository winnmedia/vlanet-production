/**
 * Proposal Creation Page
 * 투자 제안 생성 페이지
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../../../features/auth'
import { getVideoById } from '../../../entities/video/api'
import { getProfileById } from '../../../entities/user/api'
import { ProposalForm } from '../../../features/contact/components/ProposalForm'
import { Card } from '../../../shared/ui/card'
import { Button } from '../../../shared/ui/button'
import { ArrowLeft, Video, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '투자 제안하기 - VLANET',
  description: '창작자에게 투자 제안을 보내세요'
}

interface CreateProposalPageProps {
  searchParams: {
    videoId?: string
  }
}

/**
 * 영상 정보 카드 컴포넌트
 */
function VideoInfoCard({ video }: { video: any }) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center mb-4">
        <Video size={20} className="text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-secondary-900">제안 대상 영상</h3>
      </div>

      <div className="flex space-x-4">
        {/* 썸네일 */}
        <div className="w-32 h-20 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              width={128}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-secondary-400">
              <Video size={24} />
            </div>
          )}
        </div>

        {/* 영상 정보 */}
        <div className="flex-1">
          <h4 className="font-medium text-secondary-900 mb-2 line-clamp-2">
            {video.title}
          </h4>

          <div className="flex items-center text-sm text-secondary-600 mb-2">
            <User size={14} className="mr-1" />
            <span>@{video.creator?.username}</span>
          </div>

          {video.description && (
            <p className="text-sm text-secondary-600 line-clamp-2">
              {video.description}
            </p>
          )}

          <div className="flex items-center space-x-4 mt-3 text-xs text-secondary-500">
            <span>조회수 {video.stats?.view_count?.toLocaleString() || '0'}</span>
            <span>좋아요 {video.stats?.like_count?.toLocaleString() || '0'}</span>
            <span>{new Date(video.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <Link href={`/video/${video.id}`}>
          <Button variant="outline" size="sm">
            영상 보기
          </Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * 제안 생성 페이지 로딩 컴포넌트
 */
function CreateProposalPageLoading() {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* 헤더 로딩 */}
        <div className="mb-8">
          <div className="h-6 bg-secondary-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-8 bg-secondary-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-5 bg-secondary-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* 영상 정보 카드 로딩 */}
        <Card className="p-6 mb-6">
          <div className="flex space-x-4">
            <div className="w-32 h-20 bg-secondary-200 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-secondary-200 rounded animate-pulse"></div>
              <div className="h-4 bg-secondary-200 rounded w-2/3 animate-pulse"></div>
              <div className="h-3 bg-secondary-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </Card>

        {/* 폼 로딩 */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="h-6 bg-secondary-200 rounded w-48 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-4 bg-secondary-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-secondary-200 rounded animate-pulse"></div>
              <div className="h-4 bg-secondary-200 rounded w-24 animate-pulse"></div>
              <div className="h-32 bg-secondary-200 rounded animate-pulse"></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * 제안 생성 페이지 메인 컨텐츠
 */
async function CreateProposalPageContent({ searchParams }: CreateProposalPageProps) {
  // 현재 사용자 확인
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  if (user.profile?.role !== 'FUNDER') {
    redirect('/')
  }

  // 영상 ID 확인
  const videoId = searchParams.videoId
  if (!videoId) {
    notFound()
  }

  // 영상 정보 조회
  const videoResult = await getVideoById(videoId)
  if (!videoResult.success || !videoResult.video) {
    notFound()
  }

  const video = videoResult.video

  // 창작자 정보 조회
  const creatorResult = await getProfileById(video.creator_id)
  if (!creatorResult.profile) {
    notFound()
  }

  const creator = creatorResult.profile

  // 자신에게 제안하는 것 방지
  if (creator.id === user.id) {
    redirect('/explore')
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/explore">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft size={16} className="mr-1" />
              탐색으로 돌아가기
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            투자 제안하기
          </h1>
          <p className="text-secondary-600">
            {creator.username}님에게 협업 및 투자 제안을 보내세요
          </p>
        </div>

        {/* 영상 정보 카드 */}
        <VideoInfoCard video={video} />

        {/* 제안 폼 */}
        <ProposalForm
          creator={creator}
          videoId={video.id}
          videoTitle={video.title}
          onSuccess={(proposalId) => {
            // 성공 시 제안 관리 페이지로 이동
            window.location.href = '/dashboard/proposals'
          }}
          onCancel={() => {
            // 취소 시 이전 페이지로 이동
            window.history.back()
          }}
        />

        {/* 주의사항 */}
        <Card className="p-6 mt-6 bg-amber-50 border-amber-200">
          <h4 className="text-amber-900 font-medium mb-3">📋 제안 시 주의사항</h4>
          <ul className="text-sm text-amber-800 space-y-2">
            <li>• 구체적이고 명확한 제안 내용을 작성해주세요</li>
            <li>• 예상 예산과 일정을 명시하면 더 좋은 응답을 받을 수 있습니다</li>
            <li>• 정중하고 전문적인 톤으로 작성해주세요</li>
            <li>• 제안 후 창작자의 응답을 기다려주세요</li>
            <li>• 무분별한 제안 남발은 제재 대상이 될 수 있습니다</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

/**
 * 투자 제안 생성 페이지
 */
export default function CreateProposalPage(props: CreateProposalPageProps) {
  return (
    <Suspense fallback={<CreateProposalPageLoading />}>
      <CreateProposalPageContent {...props} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0