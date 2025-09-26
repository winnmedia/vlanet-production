/**
 * 홈페이지 - 랜딩 페이지
 * 인증된 사용자와 미인증 사용자에게 각각 적절한 콘텐츠를 표시합니다
 */

import { Metadata } from 'next';
import { getCurrentUser } from '@/features/auth';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { TrendingVideos } from '@/widgets/trending-videos';
import { Film, Briefcase, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'VLANET - AI 창작물이 비즈니스로 진화하는 곳',
  description: '당신의 AI 작품을 투자 기회로 연결하는 국내 최초 플랫폼',
};

/**
 * 인증되지 않은 사용자를 위한 랜딩 섹션
 */
function LandingSection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* 헤더 */}
      <header className="border-b border-primary-100/50 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="full" theme="color" size="md" />
            <div className="flex items-center gap-3">
              <a href="/login">
                <Button variant="outline" size="sm">로그인</Button>
              </a>
              <a href="/login">
                <Button variant="primary" size="sm">시작하기</Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-16">
        {/* 히어로 섹션 */}
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-secondary-900 mb-6">
            AI 창작물이{' '}
            <span className="text-gradient">비즈니스</span>로{' '}
            <span className="text-gradient">진화</span>하는 곳
          </h1>
          <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            당신의 AI 영상 작품을 투자자와 연결하여{' '}
            <strong>새로운 수익 창출 기회</strong>를 만들어보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login">
              <Button variant="primary" size="lg" className="btn-hover-lift">지금 시작하기</Button>
            </a>
            <Button variant="outline" size="lg" className="btn-hover-lift">
              더 알아보기
            </Button>
          </div>
        </section>

        {/* 주요 기능 섹션 */}
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="p-6 text-center card-hover bg-white/70 backdrop-blur-sm">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Film size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              AI 영상 업로드
            </h3>
            <p className="text-secondary-600">
              AI로 생성한 영상 작품을 간편하게 업로드하고 관리하세요
            </p>
          </Card>

          <Card className="p-6 text-center card-hover bg-white/70 backdrop-blur-sm">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              투자자 매칭
            </h3>
            <p className="text-secondary-600">
              당신의 작품에 관심있는 투자자들과 자동으로 연결됩니다
            </p>
          </Card>

          <Card className="p-6 text-center card-hover bg-white/70 backdrop-blur-sm">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <DollarSign size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              수익 창출
            </h3>
            <p className="text-secondary-600">
              창작물의 상업적 가치를 실현하고 지속적인 수익을 창출하세요
            </p>
          </Card>
        </section>

        {/* CTA 섹션 */}
        <section className="text-center bg-gradient-brand rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            지금 시작하여 첫 번째 투자 기회를 잡으세요
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            무료로 가입하고 AI 창작물을 업로드하여 투자자들과 만나보세요
          </p>
          <a href="/login">
            <Button variant="secondary" size="lg" className="btn-hover-lift">무료로 시작하기</Button>
          </a>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-primary-100/50 bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-6 text-center text-sm text-secondary-500">
          <p>&copy; 2024 VLANET. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * 인증된 사용자를 위한 대시보드 섹션
 */
function DashboardSection({ user }: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="full" theme="color" size="md" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-secondary-600">
                안녕하세요, {user.profile?.username || user.email}님
              </span>
              <Button variant="outline" size="sm">
                설정
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            대시보드
          </h1>
          <p className="text-secondary-600">
            AI 창작물을 관리하고 투자 기회를 확인하세요
          </p>
        </div>

        {/* 빠른 액션 카드들 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 card-hover">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">
              새 영상 업로드
            </h3>
            <p className="text-secondary-600 mb-4">
              AI로 생성한 새로운 영상을 업로드하세요
            </p>
            <Button variant="primary" size="sm">
              업로드
            </Button>
          </Card>

          <Card className="p-6 card-hover">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">
              내 작품 보기
            </h3>
            <p className="text-secondary-600 mb-4">
              업로드된 작품들을 관리하고 분석하세요
            </p>
            <Button variant="outline" size="sm">
              보러가기
            </Button>
          </Card>

          <Card className="p-6 card-hover">
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">
              투자 현황
            </h3>
            <p className="text-secondary-600 mb-4">
              현재 투자 제안과 수익 현황을 확인하세요
            </p>
            <Button variant="outline" size="sm">
              확인
            </Button>
          </Card>
        </div>

        {/* 트렌딩 영상 */}
        <TrendingVideos limit={6} className="mb-8" />

        {/* 최근 활동 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            최근 활동
          </h2>
          <div className="text-center py-8">
            <p className="text-secondary-500">
              아직 활동 내역이 없습니다. 첫 번째 영상을 업로드해보세요!
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}

/**
 * 홈페이지 메인 컴포넌트
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    return <DashboardSection user={user} />;
  }

  return <LandingSection />;
}