/**
 * 로그인 페이지
 * 이메일/비밀번호 및 Google OAuth를 통한 사용자 인증을 제공합니다
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { SignInForm } from '../../features/auth';
import { Logo } from '../../shared/ui/logo';
import { Card } from '../../shared/ui/card';
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
            다시 오신 것을 환영합니다
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
              계속하기
            </h2>
          </div>
          <ul className="text-sm text-secondary-700 space-y-1">
            <li>• AI 영상 작품을 업로드하고 관리하세요</li>
            <li>• 투자자와 연결되어 수익을 창출하세요</li>
            <li>• 안전하고 편리한 로그인</li>
          </ul>
        </div>

        {/* 로그인 폼 */}
        <SignInForm />

        {/* 회원가입 링크 */}
        <div className="mt-6 pt-6 border-t border-secondary-200">
          <p className="text-sm text-secondary-600 text-center">
            아직 계정이 없으신가요?{' '}
            <a
              href="/signup"
              className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
            >
              회원가입하기
            </a>
          </p>
        </div>

        {/* 이용약관 */}
        <div className="mt-4">
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