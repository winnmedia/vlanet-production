/**
 * 비밀번호 재설정 페이지
 * 이메일 링크를 통해 접근하여 새 비밀번호를 설정합니다
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { ResetPasswordForm } from '../../features/auth/components/ResetPasswordForm';
import { Logo } from '../../shared/ui/logo';
import { Card } from '../../shared/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '비밀번호 재설정',
  description: '새로운 비밀번호를 설정하세요',
};

/**
 * 비밀번호 재설정 페이지 메인 컴포넌트
 */
export default function ResetPasswordPage() {
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
              <Shield size={32} className="text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-secondary-900">
                비밀번호 재설정
              </h1>
            </div>
            <p className="text-secondary-600 text-sm">
              새로운 비밀번호를 설정해주세요<br />
              보안을 위해 강력한 비밀번호를 사용하세요
            </p>
          </div>

          {/* 비밀번호 재설정 폼 */}
          <ResetPasswordForm />

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

          {/* 추가 안내 */}
          <div className="mt-4">
            <p className="text-xs text-secondary-500 text-center">
              비밀번호 변경 후 모든 기기에서 다시 로그인이 필요할 수 있습니다
            </p>
          </div>
        </Card>
      </div>
    </Suspense>
  );
}