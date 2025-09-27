'use client';

/**
 * 로그인 폼 컴포넌트
 * 이메일/비밀번호 로그인 및 Google OAuth 옵션을 제공합니다
 */

import { useState } from 'react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { signInWithGoogle, signInWithEmail } from '../actions';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

type FormMode = 'email' | 'oauth';

type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function SignInForm() {
  const [mode, setMode] = useState<FormMode>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // 입력값 변경 핸들러
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 폼 유효성 검증
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 이메일 로그인 처리
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // FormData 생성
      const form = new FormData();
      form.append('email', formData.email);
      form.append('password', formData.password);

      // Server Action 호출
      const result = await signInWithEmail(form);

      if (!result.success) {
        // 필드별 에러 처리
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setErrors({ general: result.error });
        }
      }
      // 성공 시 Server Action에서 자동으로 리디렉션됨
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrors({ general: '로그인 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth 처리
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      await signInWithGoogle(formData);
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      setErrors({ general: 'Google 로그인 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 로그인 방법 선택 탭 */}
      <div className="flex rounded-lg bg-secondary-100 p-1">
        <button
          type="button"
          onClick={() => setMode('email')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            mode === 'email'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          <Mail size={16} className="inline mr-2" />
          이메일로 로그인
        </button>
        <button
          type="button"
          onClick={() => setMode('oauth')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            mode === 'oauth'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          <User size={16} className="inline mr-2" />
          간편 로그인
        </button>
      </div>

      {/* 이메일 로그인 폼 */}
      {mode === 'email' && (
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
              이메일 주소
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
                className={`pl-10 ${errors.email ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className={`pl-10 pr-10 ${errors.password ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          {/* 로그인 옵션 */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-secondary-600">로그인 상태 유지</span>
            </label>
            <a
              href="/forgot-password"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              비밀번호 찾기
            </a>
          </div>

          {/* 일반 에러 메시지 */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-2" />
                {errors.general}
              </p>
            </div>
          )}

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '로그인'}
          </Button>
        </form>
      )}

      {/* Google OAuth 로그인 */}
      {mode === 'oauth' && (
        <div className="space-y-4">
          <div className="text-center text-sm text-secondary-600 mb-4">
            소셜 계정으로 빠르게 로그인하세요
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-3"
            disabled={isLoading}
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
            {isLoading ? '처리 중...' : 'Google로 계속하기'}
          </Button>

          {/* 에러 메시지 */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-2" />
                {errors.general}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}