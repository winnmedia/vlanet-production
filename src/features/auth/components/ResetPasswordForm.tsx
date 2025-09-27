'use client';

/**
 * 비밀번호 재설정 폼 컴포넌트
 * 새로운 비밀번호 설정을 처리합니다
 */

import { useState, useEffect } from 'react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { resetPassword } from '../actions';
import { Lock, Eye, EyeOff, AlertCircle, Check, Shield } from 'lucide-react';

type FormErrors = {
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<{
    show: boolean;
    message?: string;
  }>({ show: false });

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // 세션 상태 확인
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // 컴포넌트 마운트 시 세션 확인
  useEffect(() => {
    // URL 해시나 쿼리 파라미터에서 토큰 확인
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    const hasAccessToken = hash.includes('access_token') || searchParams.has('access_token');
    const hasRefreshToken = hash.includes('refresh_token') || searchParams.has('refresh_token');

    setSessionValid(hasAccessToken && hasRefreshToken);
  }, []);

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

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다';
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 비밀번호 재설정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess({ show: false });

    try {
      // FormData 생성
      const form = new FormData();
      form.append('password', formData.password);
      form.append('confirmPassword', formData.confirmPassword);

      // Server Action 호출
      const result = await resetPassword(form);

      if (result.success) {
        setSuccess({
          show: true,
          message: result.message,
        });

        // 폼 초기화
        setFormData({
          password: '',
          confirmPassword: '',
        });

        // 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        // 세션 만료 처리
        if (result.sessionExpired) {
          setSessionValid(false);
          setErrors({ general: result.error });
        } else if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      setErrors({ general: '비밀번호 재설정 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 상태 확인 중
  if (sessionValid === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-secondary-600">세션 확인 중...</span>
      </div>
    );
  }

  // 세션이 유효하지 않은 경우
  if (sessionValid === false) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                링크가 만료되었습니다
              </h3>
              <p className="text-sm text-red-700 mt-1">
                비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => window.location.href = '/forgot-password'}
          variant="primary"
          size="lg"
          className="w-full"
        >
          새로운 재설정 링크 요청하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 성공 메시지 */}
      {success.show && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <Check size={20} className="text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                비밀번호 변경 완료!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {success.message}
              </p>
              <p className="text-xs text-green-600 mt-2">
                3초 후 로그인 페이지로 이동합니다...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 재설정 폼 (성공 시 숨김) */}
      {!success.show && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 새 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
              새 비밀번호
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="8자 이상, 대소문자, 숫자 포함"
                className={`pl-10 pr-10 ${errors.password ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
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

          {/* 비밀번호 확인 입력 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-1">
              비밀번호 확인
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.confirmPassword}
              </p>
            )}
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

          {/* 제출 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '비밀번호 변경하기'}
          </Button>
        </form>
      )}

      {/* 보안 안내 */}
      {!success.show && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <Shield size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">보안 안내</p>
              <ul className="text-xs space-y-1">
                <li>• 최소 8자 이상, 대문자, 소문자, 숫자를 포함하세요</li>
                <li>• 다른 사이트와 동일한 비밀번호는 사용하지 마세요</li>
                <li>• 개인정보(이름, 생일 등)는 포함하지 마세요</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}