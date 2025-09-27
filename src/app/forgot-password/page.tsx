/**
 * 비밀번호 찾기 페이지
 * 이메일을 통한 비밀번호 재설정 링크 발송을 제공합니다
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { ForgotPasswordForm } from '../../features/auth/components/ForgotPasswordForm';
import { Logo } from '../../shared/ui/logo';
import { Card } from '../../shared/ui/card';
import { KeyRound, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '비밀번호 찾기',
  description: '이메일을 통해 비밀번호를 재설정하세요',
};

/**
 * 비밀번호 찾기 페이지 메인 컴포넌트
 */
export default function ForgotPasswordPage() {
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
            <div className="flex items-center justify-center mb-4">
              <KeyRound size={32} className="text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-secondary-900">
                비밀번호 찾기
              </h1>
            </div>
            <p className="text-secondary-600 text-sm">
              가입하신 이메일 주소를 입력하시면<br />
              비밀번호 재설정 링크를 보내드립니다
            </p>
          </div>

          {/* 비밀번호 찾기 폼 */}
          <ForgotPasswordForm />

          {/* 로그인으로 돌아가기 */}
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <a
              href="/login"
              className="flex items-center justify-center text-sm text-secondary-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              로그인으로 돌아가기
            </a>
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-4">
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
        </Card>
      </div>
    </Suspense>
  );
}