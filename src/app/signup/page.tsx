/**
 * 회원가입 페이지
 * 이메일/비밀번호 및 Google OAuth를 통한 사용자 가입을 제공합니다
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { SignUpForm } from '../../features/auth/components/SignUpForm';
import { Logo } from '../../shared/ui/logo';
import { Card } from '../../shared/ui/card';

export const metadata: Metadata = {
  title: '회원가입',
  description: 'VLANET에 가입하여 AI 창작물로 수익을 창출하고 투자 기회를 만나보세요',
};

/**
 * 회원가입 페이지 메인 컴포넌트
 */
export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm border-primary-200/20 shadow-lg">
          {/* 로고 섹션 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo variant="full" theme="color" size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              VLANET에 가입하세요
            </h1>
            <p className="text-secondary-600 text-sm">
              AI 창작물이 비즈니스로 진화하는 곳
            </p>
          </div>

          {/* 회원가입 폼 */}
          <SignUpForm />

          {/* 로그인 링크 */}
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <p className="text-sm text-secondary-600 text-center">
              이미 계정이 있으신가요?{' '}
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                로그인하기
              </a>
            </p>
          </div>

          {/* 이용약관 */}
          <div className="mt-4">
            <p className="text-xs text-secondary-500 text-center">
              가입하면 VLANET의{' '}
              <a href="#" className="text-primary-600 hover:underline">이용약관</a>
              {' '}및{' '}
              <a href="#" className="text-primary-600 hover:underline">개인정보처리방침</a>
              에 동의하게 됩니다.
            </p>
          </div>
        </Card>
      </div>
    </Suspense>
  );
}