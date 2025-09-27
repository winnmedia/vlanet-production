/**
 * Explore Page
 * 영상 탐색 및 발견 페이지
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { getCurrentUser } from '../../features/auth';
import { TrendingVideos } from '../../widgets/trending-videos';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Search, Palette, Film, Camera, TreePine, Building2, Rocket, Sparkles, Bot } from 'lucide-react';

export const metadata: Metadata = {
  title: '탐색 - VLANET',
  description: '다양한 AI 생성 영상들을 발견하고 탐색하세요',
};

/**
 * 탐색 페이지 메인 컨텐츠
 */
async function ExplorePageContent() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl">
            <div className="flex items-center mb-4">
              <Search size={36} className="text-primary-500 mr-3" />
              <h1 className="text-4xl font-bold text-secondary-900">
                탐색
              </h1>
            </div>
            <p className="text-lg text-secondary-600">
              창작자들의 놀라운 AI 영상 작품들을 발견하고, 새로운 영감을 얻어보세요
            </p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-12">
          {/* 트렌딩 영상 섹션 */}
          <section>
            <TrendingVideos limit={12} showViewAll={false} />
          </section>

          {/* 카테고리별 영상 섹션 */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Palette size={24} className="text-primary-500 mr-2" />
                <h2 className="text-2xl font-bold text-secondary-900">카테고리별 탐색</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <CategoryCard
                title="애니메이션"
                icon={<Film size={20} />}
                count={45}
                description="AI 애니메이션 영상"
              />
              <CategoryCard
                title="실사"
                icon={<Camera size={20} />}
                count={32}
                description="실사 스타일 AI 영상"
              />
              <CategoryCard
                title="추상"
                icon={<Palette size={20} />}
                count={28}
                description="추상적 예술 영상"
              />
              <CategoryCard
                title="자연"
                icon={<TreePine size={20} />}
                count={51}
                description="자연 테마 영상"
              />
              <CategoryCard
                title="도시"
                icon={<Building2 size={20} />}
                count={39}
                description="도시 풍경 영상"
              />
              <CategoryCard
                title="우주"
                icon={<Rocket size={20} />}
                count={23}
                description="우주 공간 영상"
              />
              <CategoryCard
                title="판타지"
                icon={<Sparkles size={20} />}
                count={67}
                description="판타지 세계 영상"
              />
              <CategoryCard
                title="미래"
                icon={<Bot size={20} />}
                count={34}
                description="미래적 컨셉 영상"
              />
            </div>
          </section>

          {/* AI 모델별 섹션 */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Bot size={24} className="text-primary-500 mr-2" />
                <h2 className="text-2xl font-bold text-secondary-900">AI 모델별</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModelCard
                name="Runway Gen-2"
                videoCount={143}
                popularPrompt="cinematic drone shot of futuristic city"
                description="고품질 영상 생성에 특화된 모델"
              />
              <ModelCard
                name="Pika Labs"
                videoCount={87}
                popularPrompt="time-lapse of blooming flowers"
                description="자연스러운 움직임과 전환 효과"
              />
              <ModelCard
                name="Stable Video Diffusion"
                videoCount={95}
                popularPrompt="abstract colorful particle animation"
                description="창의적이고 실험적인 영상 생성"
              />
            </div>
          </section>

          {/* 최신 업로드 섹션 */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Sparkles size={24} className="text-primary-500 mr-2" />
                <h2 className="text-2xl font-bold text-secondary-900">최신 업로드</h2>
              </div>
              <Button variant="outline" size="sm">
                더 보기
              </Button>
            </div>

            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Film size={48} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                곧 더 많은 영상이 업로드될 예정입니다
              </h3>
              <p className="text-secondary-600 mb-4">
                창작자들이 올린 최신 AI 영상들을 가장 먼저 만나보세요
              </p>
              {!user && (
                <Button variant="primary">
                  가입하고 알림 받기
                </Button>
              )}
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

/**
 * 카테고리 카드 컴포넌트
 */
function CategoryCard({
  title,
  icon,
  count,
  description
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  description: string;
}) {
  return (
    <Card className="p-4 text-center card-hover cursor-pointer group">
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
        <div className="text-primary-600">{icon}</div>
      </div>
      <h3 className="font-semibold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-secondary-600 mb-2">{description}</p>
      <span className="text-xs text-primary-600 font-medium">
        {count}개 영상
      </span>
    </Card>
  );
}

/**
 * AI 모델 카드 컴포넌트
 */
function ModelCard({
  name,
  videoCount,
  popularPrompt,
  description
}: {
  name: string;
  videoCount: number;
  popularPrompt: string;
  description: string;
}) {
  return (
    <Card className="p-6 card-hover cursor-pointer group">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
          <Bot size={16} className="text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          <span className="text-xs text-secondary-500">{videoCount}개 영상</span>
        </div>
      </div>

      <p className="text-sm text-secondary-600 mb-3">{description}</p>

      <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
        <span className="text-xs text-secondary-500 block mb-1">인기 프롬프트:</span>
        <code className="text-xs text-secondary-800 font-mono">"{popularPrompt}"</code>
      </div>
    </Card>
  );
}

/**
 * 탐색 페이지 로딩 컴포넌트
 */
function ExplorePageLoading() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-6 py-8">
          <div className="h-10 bg-secondary-200 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-6 bg-secondary-200 rounded w-96 animate-pulse"></div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-12">
          <div className="h-6 bg-secondary-200 rounded w-32 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-secondary-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-secondary-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * 탐색 페이지 메인 컴포넌트
 */
export default function ExplorePage() {
  return (
    <Suspense fallback={<ExplorePageLoading />}>
      <ExplorePageContent />
    </Suspense>
  );
}