/**
 * 새로운 Creator Dashboard Page
 * 영상 갤러리와 실시간 피드백이 포함된 대시보드
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getCurrentUser } from '../../../features/auth';
import { getCreatorVideos, getCreatorDashboardStats } from '../../../entities/video/api';
import { VideoGallery } from '../../../widgets/video-gallery';
import { Button } from '../../../shared/ui/button';
import { Card } from '../../../shared/ui/card';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// 피드백 피드 컴포넌트 (클라이언트 컴포넌트로 동적 로딩)
const FeedbackFeed = dynamic(
  () => import('../../../widgets/feedback-feed').then((mod) => ({ default: mod.FeedbackFeed })),
  {
    loading: () => (
      <Card className="p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }
);
import {
  Upload,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Creator 대시보드',
  description: '내 영상 관리 및 통계 확인',
};

/**
 * 핵심 지표 카드 컴포넌트
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: 'primary' | 'success' | 'warning' | 'info';
  trend?: { value: number; isPositive: boolean };
}) {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100',
    success: 'text-success-600 bg-success-100',
    warning: 'text-warning-600 bg-warning-100',
    info: 'text-blue-600 bg-blue-100',
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
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
    </Card>
  );
}

/**
 * 대시보드 헤더 컴포넌트
 */
function DashboardHeader({ username, totalVideos }: { username: string; totalVideos: number }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            안녕하세요, {username}님!
          </h1>
          <p className="text-secondary-600 mt-2">
            현재 {totalVideos}개의 영상을 관리하고 있습니다
          </p>
        </div>

        <div className="flex space-x-3">
          <Link href="/upload">
            <Button variant="primary" size="lg" className="shadow-sm">
              <Upload size={18} className="mr-2" />
              새 영상 업로드
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="lg">
              <BarChart3 size={18} className="mr-2" />
              통계 보기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 대시보드 메인 컨텐츠 컴포넌트
 */
async function DashboardContent() {
  // 현재 사용자 확인
  const user = await getCurrentUser();

  if (!user || user.profile?.role !== 'CREATOR') {
    redirect('/');
  }

  // Creator 통계 및 영상 목록 조회
  const [stats, videosResult] = await Promise.all([
    getCreatorDashboardStats(user.id),
    getCreatorVideos(user.id, {
      sort: { field: 'created_at', direction: 'desc' },
      pagination: { page: 1, limit: 15 }
    })
  ]);

  // 피드백 및 펀딩 제안 모킹 데이터 생성
  const mockComments = Array.from({ length: 10 }, (_, i) => ({
    id: `comment-${i + 1}`,
    user: {
      name: `사용자${i + 1}`,
      avatar: Math.random() > 0.5 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` : undefined
    },
    content: [
      '정말 멋진 영상이네요! 아이디어가 참신합니다.',
      'AI 기술 활용이 인상적이에요. 계속 응원하겠습니다!',
      '다음 작품도 기대됩니다. 투자 가치가 있어 보여요.',
      '창의적인 컨셉이 좋네요. 상업적 잠재력도 높아 보입니다.',
      '기술적 완성도가 높습니다. 펀딩 검토해보겠습니다.',
      '스토리텔링이 인상적입니다. 시장성이 좋을 것 같아요.',
      '비주얼이 정말 멋져요! 투자자로서 관심이 많습니다.',
      '독창적인 아이디어네요. 성공 가능성이 높아 보입니다.',
      'AI 영상의 새로운 가능성을 보여주셨네요.',
      '작품의 퀄리티가 놀랍습니다. 펀딩 참여 고려중입니다.'
    ][i],
    videoTitle: `내 영상 ${Math.floor(Math.random() * 20) + 1}`,
    videoId: `video-${Math.floor(Math.random() * 100)}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const mockProposals = Array.from({ length: 3 }, (_, i) => ({
    id: `proposal-${i + 1}`,
    funder: {
      name: `김투자${i + 1}`,
      company: ['테크벤처스', 'AI인베스트', '크리에이터펀드'][i],
      avatar: Math.random() > 0.3 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=funder${i}` : undefined
    },
    amount: [5000000, 10000000, 15000000][i],
    videoTitle: `내 영상 ${Math.floor(Math.random() * 20) + 1}`,
    videoId: `video-${Math.floor(Math.random() * 100)}`,
    message: [
      '영상의 창의적인 컨셉과 기술적 완성도가 인상적입니다. 상업화 가능성을 보고 투자를 제안드립니다.',
      'AI 기술 활용이 뛰어나고 시장 잠재력이 높다고 판단됩니다. 시리즈 제작을 위한 펀딩을 검토하고 있습니다.',
      '독창적인 스토리텔링과 비주얼이 매우 인상적입니다. 플랫폼 확장을 위한 투자 파트너십을 제안합니다.'
    ][i],
    status: 'pending' as const,
    createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
  }));

  // 통계 데이터 포맷팅
  const formattedStats = stats ? {
    total_videos: stats.total_videos.toLocaleString(),
    published_videos: stats.published_videos.toLocaleString(),
    total_views: stats.total_views.toLocaleString(),
    total_likes: stats.total_likes.toLocaleString(),
    total_revenue: new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(stats.total_revenue),
    pending_uploads: stats.pending_uploads.toLocaleString(),
    failed_uploads: stats.failed_uploads.toLocaleString(),
  } : null;

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <DashboardHeader username={user.profile?.username || '창작자'} totalVideos={videosResult.total_count} />

      {/* 통계 카드 */}
      {formattedStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="전체 영상"
            value={formattedStats.total_videos}
            subtitle={`공개: ${formattedStats.published_videos}개`}
            icon={BarChart3}
            color="primary"
          />

          <MetricCard
            title="총 조회수"
            value={formattedStats.total_views}
            subtitle="모든 영상 누적"
            icon={Eye}
            color="success"
          />

          <MetricCard
            title="총 좋아요"
            value={formattedStats.total_likes}
            subtitle="사용자 반응"
            icon={Heart}
            color="success"
          />

          <MetricCard
            title="총 수익"
            value={formattedStats.total_revenue}
            subtitle="투자 및 수익 분배"
            icon={DollarSign}
            color="warning"
          />
        </div>
      )}

      {/* 처리 상태별 알림 */}
      {formattedStats && (parseInt(formattedStats.pending_uploads) > 0 || parseInt(formattedStats.failed_uploads) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {parseInt(formattedStats.pending_uploads) > 0 && (
            <Card className="p-4 border-l-4 border-l-warning-500 bg-warning-50">
              <div className="flex items-center space-x-3">
                <div className="text-warning-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-warning-900">
                    처리 중인 영상: {formattedStats.pending_uploads}개
                  </h4>
                  <p className="text-sm text-warning-700">
                    업로드 및 처리가 진행 중입니다.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {parseInt(formattedStats.failed_uploads) > 0 && (
            <Card className="p-4 border-l-4 border-l-danger-500 bg-danger-50">
              <div className="flex items-center space-x-3">
                <div className="text-danger-600">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-danger-900">
                    실패한 영상: {formattedStats.failed_uploads}개
                  </h4>
                  <p className="text-sm text-danger-700">
                    아래에서 실패한 영상을 확인하고 다시 업로드해보세요.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 영상 목록 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">
            내 영상 ({videosResult.total_count.toLocaleString()}개)
          </h2>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              필터
            </Button>
            <Button variant="outline" size="sm">
              정렬
            </Button>
          </div>
        </div>

        <VideoGallery
          videos={videosResult.videos}
          loading={false}
          onSort={(sort) => console.log('Sort:', sort)}
          onFilter={(filter) => console.log('Filter:', filter)}
        />
      </div>

      {/* 실시간 피드백 피드 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="xl:col-span-2">
          <FeedbackFeed
            comments={mockComments}
            proposals={mockProposals}
            loading={false}
          />
        </div>
      </div>

      {/* 빈 상태 시 업로드 권유 */}
      {videosResult.videos.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-primary-600 text-6xl">
              <Upload size={64} className="mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900">
              첫 번째 영상을 업로드해보세요!
            </h3>
            <p className="text-secondary-600 max-w-md mx-auto">
              AI로 생성한 멋진 영상을 업로드하고 투자자들과 연결되어 수익을 창출해보세요.
            </p>
            <div className="pt-4">
              <Link href="/upload">
                <Button variant="primary" size="lg">
                  첫 영상 업로드하기
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * 로딩 컴포넌트
 */
function DashboardLoading() {
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
  );
}

/**
 * Dashboard 메인 페이지 컴포넌트
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container mx-auto px-6">
        <Suspense fallback={<DashboardLoading />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}