/**
 * 로그인 페이지
 * Google OAuth를 통한 사용자 인증을 제공합니다
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { signInWithGoogle } from '@/features/auth';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Target } from 'lucide-react';

export const metadata: Metadata = {
  title: '로그인',
  description: 'VLANET에 로그인하여 AI 창작물을 투자 기회로 연결하세요',
};

/**
 * 로그인 폼 컴포넌트
 */
function LoginForm() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm border-primary-200/20 shadow-lg">
        {/* 로고 섹션 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo variant="full" theme="color" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            VLANET에 오신 것을 환영합니다
          </h1>
          <p className="text-secondary-600 text-sm">
            AI 창작물이 비즈니스로 진화하는 곳
          </p>
        </div>

        {/* 로그인 기능 설명 */}
        <div className="mb-6 p-4 bg-primary-50/50 rounded-lg border border-primary-100">
          <div className="flex items-center mb-2">
            <Target size={16} className="text-primary-600 mr-2" />
            <h2 className="text-sm font-semibold text-primary-900">
              시작하기
            </h2>
          </div>
          <ul className="text-sm text-secondary-700 space-y-1">
            <li>• AI 영상 작품을 업로드하고 관리하세요</li>
            <li>• 투자자와 연결되어 수익을 창출하세요</li>
            <li>• 안전하고 빠른 Google 로그인</li>
          </ul>
        </div>

        {/* Google 로그인 버튼 */}
        <form action={signInWithGoogle} className="space-y-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </Button>
        </form>

        {/* 추가 정보 */}
        <div className="mt-6 pt-6 border-t border-secondary-200">
          <p className="text-xs text-secondary-500 text-center">
            로그인하면 VLANET의{' '}
            <a href="#" className="text-primary-600 hover:underline">이용약관</a>
            {' '}및{' '}
            <a href="#" className="text-primary-600 hover:underline">개인정보처리방침</a>
            에 동의하게 됩니다.
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * 로그인 페이지 메인 컴포넌트
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}