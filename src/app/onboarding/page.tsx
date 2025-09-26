/**
 * 온보딩 페이지
 * 신규 사용자의 역할 선택 및 프로필 설정
 */

'use client';

import { useState } from 'react';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card } from '@/shared/ui/card';
import { createOnboardingProfile } from '@/features/auth';
import { USER_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/entities/user';
import type { UserRole } from '@/entities/user';
import { Sparkles, Palette, Briefcase } from 'lucide-react';

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (formData: FormData) => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 선택된 역할을 formData에 추가
      formData.append('role', selectedRole);
      await createOnboardingProfile(formData);
    } catch (error) {
      console.error('온보딩 오류:', error);
      setError(error instanceof Error ? error.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <Logo variant="full" theme="color" size="lg" />
          <div className="flex items-center justify-center mt-8 mb-4">
            <h1 className="text-4xl font-bold text-secondary-900 mr-3">
              VLANET에 오신 것을 환영합니다!
            </h1>
            <Sparkles size={32} className="text-primary-500" />
          </div>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            AI 창작물이 비즈니스로 진화하는 여정을 시작하세요
          </p>
        </div>

        {/* 진행 표시기 */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-secondary-200 text-secondary-500'} font-semibold`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-3 ${step >= 2 ? 'bg-primary-500' : 'bg-secondary-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-secondary-200 text-secondary-500'} font-semibold`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-secondary-600">
            <span>역할 선택</span>
            <span>프로필 설정</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 1 ? (
            /* Step 1: 역할 선택 */
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6 text-center">
                어떤 역할로 시작하시겠어요?
              </h2>

              <div className="space-y-4">
                {/* Creator 역할 */}
                <button
                  onClick={() => handleRoleSelect(USER_ROLES.CREATOR)}
                  className={`w-full p-6 rounded-lg border-2 text-left transition-all hover:border-primary-300 hover:bg-primary-50 ${
                    selectedRole === USER_ROLES.CREATOR ? 'border-primary-500 bg-primary-50' : 'border-secondary-200'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Palette size={24} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {ROLE_LABELS.CREATOR}
                      </h3>
                      <p className="text-secondary-600">
                        {ROLE_DESCRIPTIONS.CREATOR}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          영상 업로드
                        </span>
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          수익 창출
                        </span>
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          팬 관리
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Funder 역할 */}
                <button
                  onClick={() => handleRoleSelect(USER_ROLES.FUNDER)}
                  className={`w-full p-6 rounded-lg border-2 text-left transition-all hover:border-primary-300 hover:bg-primary-50 ${
                    selectedRole === USER_ROLES.FUNDER ? 'border-primary-500 bg-primary-50' : 'border-secondary-200'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                      <Briefcase size={24} className="text-success-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {ROLE_LABELS.FUNDER}
                      </h3>
                      <p className="text-secondary-600">
                        {ROLE_DESCRIPTIONS.FUNDER}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-success-100 text-success-800 text-xs rounded-full">
                          투자 기회
                        </span>
                        <span className="px-2 py-1 bg-success-100 text-success-800 text-xs rounded-full">
                          수익 분배
                        </span>
                        <span className="px-2 py-1 bg-success-100 text-success-800 text-xs rounded-full">
                          포트폴리오
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-secondary-500">
                  나중에 언제든지 역할을 변경하실 수 있습니다
                </p>
              </div>
            </Card>
          ) : (
            /* Step 2: 프로필 설정 */
            <Card className="p-8">
              <div className="mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center text-secondary-600 hover:text-secondary-900 mb-4"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  역할 변경
                </button>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                  프로필을 설정해주세요
                </h2>
                <p className="text-secondary-600">
                  선택한 역할: <span className="font-semibold text-primary-600">
                    {selectedRole && ROLE_LABELS[selectedRole]}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
                  {error}
                </div>
              )}

              <form action={handleSubmit} className="space-y-6">
                {/* 사용자명 */}
                <div>
                  <Input
                    label="사용자명"
                    name="username"
                    placeholder="예: john_creator"
                    required
                    helperText="2-30자, 영문/숫자/언더스코어/하이픈만 사용 가능"
                  />
                </div>

                {/* 소개 */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    소개 (선택사항)
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="자신을 간단히 소개해주세요"
                  />
                </div>

                {/* Funder 추가 필드들 */}
                {selectedRole === USER_ROLES.FUNDER && (
                  <>
                    <div>
                      <Input
                        label="회사명 (선택사항)"
                        name="company"
                        placeholder="예: ABC 투자그룹"
                      />
                    </div>
                    <div>
                      <Input
                        label="웹사이트 (선택사항)"
                        name="website"
                        type="url"
                        placeholder="https://example.com"
                      />
                    </div>
                  </>
                )}

                {/* 제출 버튼 */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={isSubmitting}
                  >
                    {isSubmitting ? '설정 중...' : 'VLANET 시작하기'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center mt-12 text-sm text-secondary-500">
          <p>계속 진행하면 VLANET의 이용약관 및 개인정보처리방침에 동의하게 됩니다</p>
        </div>
      </div>
    </div>
  );
}