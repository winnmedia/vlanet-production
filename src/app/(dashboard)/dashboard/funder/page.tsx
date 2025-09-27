/**
 * Funder Dashboard Page
 * 투자자 전용 대시보드 - 투자 기회 발굴 및 포트폴리오 관리
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { getCurrentUser } from '../../../../features/auth'
import { getTrendingVideos } from '../../../../entities/video/api'
import { getProposalStatsByUser } from '../../../../entities/proposal/api'
import { VideoGallery } from '../../../../widgets/video-gallery'
import { Button } from '../../../../shared/ui/button'
import { Card } from '../../../../shared/ui/card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Eye,
  Star,
  BarChart3,
  Search,
  Filter,
  Target
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Funder 대시보드 - VLANET',
  description: '투자 기회를 발굴하고 포트폴리오를 관리하세요'
}

/**
 * 투자 지표 카드 컴포넌트
 */
function InvestmentMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  actionLabel,
  actionHref
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color?: 'primary' | 'success' | 'warning' | 'info'
  trend?: { value: number; isPositive: boolean }
  actionLabel?: string
  actionHref?: string
}) {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100',
    success: 'text-success-600 bg-success-100',
    warning: 'text-warning-600 bg-warning-100',
    info: 'text-blue-600 bg-blue-100'
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-secondary-900">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="outline" size="sm" className="w-full">
            {actionLabel}
          </Button>
        </Link>
      )}
    </Card>
  )
}

/**
 * Funder 대시보드 헤더 컴포넌트
 */
function FunderDashboardHeader({
  username,
  companyName
}: {
  username: string
  companyName?: string | null
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            안녕하세요, {username}님!
          </h1>
          <p className="text-secondary-600 mt-2">
            {companyName && `${companyName}의 `}새로운 투자 기회를 발굴해보세요
          </p>
        </div>

        <div className="flex space-x-3">
          <Link href="/explore">
            <Button variant="primary" size="lg" className="shadow-sm">
              <Search size={18} className="mr-2" />
              투자처 탐색
            </Button>
          </Link>
          <Link href="/dashboard/proposals">
            <Button variant="outline" size="lg">
              <FileText size={18} className="mr-2" />
              제안 관리
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * 추천 투자 기회 섹션
 */
function RecommendedOpportunities({ videos }: { videos: any[] }) {
  // TODO(human): 실제 매칭 점수 계산 로직 구현
  // 현재는 Mock 데이터를 사용하지만, 향후 사용자 선호도와 영상 메타데이터를
  // 기반으로 한 실제 매칭 알고리즘으로 교체해야 합니다.

  const videosWithMatchScore = videos.slice(0, 6).map(video => ({
    ...video,
    matchScore: Math.floor(Math.random() * 30) + 70, // 70-100% 범위
    investmentPotential: Math.floor(Math.random() * 3) + 3 // 3-5 점
  }))

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target size={24} className="text-primary-600" />
          <h2 className="text-xl font-bold text-secondary-900">
            추천 투자 기회
          </h2>
        </div>
        <Link href="/explore?filter=recommended">
          <Button variant="outline" size="sm">
            더 보기
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videosWithMatchScore.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Eye size={32} />
                </div>
              )}

              {/* 매칭 점수 배지 */}
              <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm font-medium">
                {video.matchScore}% 매칭
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                {video.title}
              </h3>

              <div className="flex items-center justify-between text-sm text-secondary-600 mb-3">
                <span>@{video.creator?.username}</span>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-warning-500 fill-current" />
                  <span>{video.investmentPotential}/5</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-500">
                  조회수 {video.stats?.view_count?.toLocaleString() || '0'}
                </span>
                <Link href={`/video/${video.id}`}>
                  <Button variant="outline" size="sm">
                    제안하기
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}

/**
 * 대시보드 메인 컨텐츠 컴포넌트
 */
async function FunderDashboardContent() {
  // 현재 사용자 확인
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'FUNDER') {
    redirect('/')
  }

  // 투자자 통계 및 추천 영상 조회
  const [proposalStats, trendingVideos] = await Promise.all([
    getProposalStatsByUser(user.id),
    getTrendingVideos(12)
  ])

  // Mock 투자 통계 데이터 (향후 실제 구현 예정)
  const mockInvestmentStats = {
    totalInvested: 50000000, // 5천만원
    activeInvestments: 12,
    portfolioValue: 75000000, // 7천5백만원
    avgROI: 24.5 // 24.5%
  }

  const formattedStats = {
    totalInvested: new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(mockInvestmentStats.totalInvested),
    activeInvestments: mockInvestmentStats.activeInvestments.toLocaleString(),
    portfolioValue: new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(mockInvestmentStats.portfolioValue),
    avgROI: mockInvestmentStats.avgROI.toFixed(1)
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <FunderDashboardHeader
        username={user.profile?.username || '투자자'}
        companyName={user.profile?.company}
      />

      {/* 투자 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InvestmentMetricCard
          title="총 투자금액"
          value={formattedStats.totalInvested}
          subtitle="누적 투자 현황"
          icon={DollarSign}
          color="primary"
          trend={{ value: 15.2, isPositive: true }}
        />

        <InvestmentMetricCard
          title="활성 투자"
          value={formattedStats.activeInvestments}
          subtitle="진행 중인 프로젝트"
          icon={TrendingUp}
          color="success"
          actionLabel="관리하기"
          actionHref="/dashboard/investments"
        />

        <InvestmentMetricCard
          title="포트폴리오 가치"
          value={formattedStats.portfolioValue}
          subtitle="현재 평가액"
          icon={BarChart3}
          color="info"
          trend={{ value: 8.7, isPositive: true }}
        />

        <InvestmentMetricCard
          title="평균 수익률"
          value={`${formattedStats.avgROI}%`}
          subtitle="연간 수익률"
          icon={Target}
          color="warning"
          trend={{ value: 3.2, isPositive: true }}
        />
      </div>

      {/* 제안 현황 요약 */}
      {proposalStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
            <div className="flex items-center space-x-3">
              <FileText size={20} className="text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  보낸 제안: {proposalStats.total_sent}개
                </h4>
                <p className="text-sm text-blue-700">
                  대기 중: {proposalStats.pending_sent}개
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-l-4 border-l-green-500">
            <div className="flex items-center space-x-3">
              <Users size={20} className="text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">
                  수락된 제안: {proposalStats.accepted}개
                </h4>
                <p className="text-sm text-green-700">
                  활성 협업 진행 중
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 border-l-4 border-l-yellow-500">
            <div className="flex items-center space-x-3">
              <BarChart3 size={20} className="text-yellow-600" />
              <div>
                <h4 className="font-semibold text-yellow-900">
                  응답률: {proposalStats.response_rate.toFixed(1)}%
                </h4>
                <p className="text-sm text-yellow-700">
                  평균 응답 시간 3일
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 추천 투자 기회 */}
      <RecommendedOpportunities videos={trendingVideos.videos} />

      {/* 트렌딩 영상 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">
            트렌딩 영상 ({trendingVideos.total_count.toLocaleString()}개)
          </h2>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-1" />
              필터
            </Button>
            <Button variant="outline" size="sm">
              정렬
            </Button>
          </div>
        </div>

        <VideoGallery
          videos={trendingVideos.videos}
          loading={false}
          showInvestButton={true}
          currentUserRole="FUNDER"
          onSort={(sort) => console.log('Sort:', sort)}
          onFilter={(filter) => console.log('Filter:', filter)}
        />
      </div>

      {/* 빈 상태 시 탐색 권유 */}
      {trendingVideos.videos.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-primary-600 text-6xl">
              <Search size={64} className="mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              새로운 투자 기회를 찾아보세요!
            </h3>
            <p className="text-secondary-600 max-w-md mx-auto">
              재능 있는 AI 창작자들이 올린 혁신적인 영상들을 탐색하고 투자 기회를 발굴해보세요.
            </p>
            <div className="pt-4">
              <Link href="/explore">
                <Button variant="primary" size="lg">
                  투자처 탐색하기
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * 로딩 컴포넌트
 */
function FunderDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* 헤더 로딩 */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-8 bg-secondary-200 rounded w-64 animate-pulse"></div>
          <div className="h-5 bg-secondary-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-10 bg-secondary-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* 통계 카드 로딩 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 rounded w-16 animate-pulse"></div>
                <div className="h-6 bg-secondary-200 rounded w-20 animate-pulse"></div>
                <div className="h-3 bg-secondary-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="w-12 h-12 bg-secondary-200 rounded-lg animate-pulse"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* 영상 그리드 로딩 */}
      <div className="space-y-6">
        <div className="h-6 bg-secondary-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-video bg-secondary-200 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary-200 rounded animate-pulse"></div>
                <div className="h-3 bg-secondary-200 rounded w-2/3 animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-secondary-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-secondary-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Funder Dashboard 메인 페이지 컴포넌트
 */
export default function FunderDashboardPage() {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container mx-auto px-6">
        <Suspense fallback={<FunderDashboardLoading />}>
          <FunderDashboardContent />
        </Suspense>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0