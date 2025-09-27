'use client';

/**
 * 비밀번호 찾기 폼 컴포넌트
 * 이메일을 통한 비밀번호 재설정 링크 요청을 처리합니다
 */

import { useState } from 'react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { requestPasswordReset } from '../actions';
import { Mail, AlertCircle, Check, RefreshCw } from 'lucide-react';

type FormErrors = {
  email?: string;
  general?: string;
};

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<{
    show: boolean;
    message?: string;
    email?: string;
  }>({ show: false });

  // 폼 데이터 상태
  const [email, setEmail] = useState('');

  // 입력값 변경 핸들러
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // 입력 시 이메일 에러 제거
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  // 폼 유효성 검증
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 이메일 검증
    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 비밀번호 재설정 요청 처리
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
      form.append('email', email);

      // Server Action 호출
      const result = await requestPasswordReset(form);

      if (result.success) {
        setSuccess({
          show: true,
          message: result.message,
          email: result.email,
        });

        // 폼 초기화
        setEmail('');
      } else {
        // 필드별 에러 처리
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('비밀번호 재설정 요청 오류:', error);
      setErrors({ general: '요청 처리 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 다시 시도 핸들러
  const handleTryAgain = () => {
    setSuccess({ show: false });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* 성공 메시지 */}
      {success.show && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <Check size={20} className="text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 mb-1">
                이메일 발송 완료
              </h3>
              <p className="text-sm text-green-700 mb-3">
                {success.message}
              </p>
              {success.email && (
                <p className="text-xs text-green-600 mb-3">
                  <strong>{success.email}</strong>로 재설정 링크를 보냈습니다.
                </p>
              )}
              <div className="text-xs text-green-600">
                <p className="mb-1">• 이메일이 도착하지 않는다면 스팸 폴더를 확인해주세요</p>
                <p>• 링크는 24시간 동안 유효합니다</p>
              </div>
            </div>
          </div>

          {/* 다시 시도 버튼 */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <Button
              type="button"
              onClick={handleTryAgain}
              variant="outline"
              size="sm"
              className="w-full text-green-700 border-green-300 hover:bg-green-50"
            >
              <RefreshCw size={16} className="mr-2" />
              다른 이메일로 다시 시도
            </Button>
          </div>
        </div>
      )}

      {/* 비밀번호 재설정 폼 (성공 시 숨김) */}
      {!success.show && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="가입하신 이메일을 입력하세요"
                className={`pl-10 ${errors.email ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.email}
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
            {isLoading ? '처리 중...' : '비밀번호 재설정 링크 보내기'}
          </Button>
        </form>
      )}

      {/* 안내 문구 */}
      {!success.show && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <Mail size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">이메일 재설정 안내</p>
              <ul className="text-xs space-y-1">
                <li>• 가입하신 이메일 주소를 정확히 입력해주세요</li>
                <li>• 재설정 링크는 24시간 동안만 유효합니다</li>
                <li>• 이메일이 도착하지 않으면 스팸 폴더를 확인해주세요</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}