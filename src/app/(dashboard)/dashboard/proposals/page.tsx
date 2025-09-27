/**
 * Dashboard Proposals Page
 * 제안 관리 대시보드 페이지
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../features/auth'
import { getProposalsByUser } from '../../../../entities/proposal/api'
import { ProposalStats } from '../../../../widgets/proposal-dashboard'
import { ProposalList } from '../../../../features/contact'
import { Card } from '../../../../shared/ui/card'
import { RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: '제안 관리 - VideoPlanet Dashboard',
  description: '보낸 제안과 받은 제안을 관리하세요'
}

interface ProposalsPageProps {
  searchParams: {
    tab?: 'sent' | 'received'
    status?: string
    search?: string
  }
}

/**
 * 제안 페이지 로딩 컴포넌트
 */
function ProposalsPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* 헤더 로딩 */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>

        {/* 통계 카드 로딩 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 제안 목록 로딩 */}
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * 제안 페이지 메인 컨텐츠
 */
async function ProposalsPageContent({
  searchParams
}: ProposalsPageProps) {
  // 현재 사용자 확인
  const user = await getCurrentUser()
  if (!user || !user.profile) {
    redirect('/login')
  }

  // URL 파라미터 처리
  const currentTab = searchParams.tab || 'received'
  const statusFilter = searchParams.status
  const searchQuery = searchParams.search

  // 제안 목록 조회
  const proposalsResponse = await getProposalsByUser({
    user_id: user.profile.id,
    role: currentTab === 'sent' ? 'FUNDER' : 'CREATOR',
    status: statusFilter as any,
    search: searchQuery,
    limit: 20,
    offset: 0,
    sort: 'newest'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            제안 관리
          </h1>
          <p className="text-gray-600">
            {user.profile.role === 'FUNDER'
              ? '투자 제안을 관리하고 창작자와 소통하세요'
              : '받은 제안을 확인하고 협업을 시작하세요'
            }
          </p>
        </div>

        {/* 통계 위젯 */}
        <ProposalStats user={user.profile} className="mb-8" />

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <a
                href={`/dashboard/proposals?tab=received${
                  statusFilter ? `&status=${statusFilter}` : ''
                }${searchQuery ? `&search=${searchQuery}` : ''}`}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'received'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                받은 제안
                {user.profile.role === 'CREATOR' && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {proposalsResponse.total_count}
                  </span>
                )}
              </a>

              {user.profile.role === 'FUNDER' && (
                <a
                  href={`/dashboard/proposals?tab=sent${
                    statusFilter ? `&status=${statusFilter}` : ''
                  }${searchQuery ? `&search=${searchQuery}` : ''}`}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentTab === 'sent'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  보낸 제안
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {proposalsResponse.total_count}
                  </span>
                </a>
              )}
            </nav>
          </div>
        </div>

        {/* 제안 목록 */}
        <ProposalList
          proposals={proposalsResponse.proposals}
          currentUser={user.profile}
          role={currentTab === 'sent' ? 'FUNDER' : 'CREATOR'}
          totalCount={proposalsResponse.total_count}
          hasMore={proposalsResponse.has_more}
        />
      </div>
    </div>
  )
}

/**
 * 제안 관리 페이지
 */
export default function ProposalsPage(props: ProposalsPageProps) {
  return (
    <Suspense fallback={<ProposalsPageLoading />}>
      <ProposalsPageContent {...props} />
    </Suspense>
  )
}

/**
 * 페이지 설정
 */
export const dynamic = 'force-dynamic' // 사용자별 데이터
export const revalidate = 0 // 실시간 업데이트 필요