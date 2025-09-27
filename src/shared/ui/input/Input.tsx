import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useId, aria } from '../../lib/accessibility';

const inputVariants = cva(
  [
    'w-full rounded-lg border px-3 py-2 text-sm',
    'transition-colors duration-200',
    'placeholder:text-secondary-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-secondary-200 bg-white text-secondary-900',
          'hover:border-secondary-300',
          'focus:border-primary-500 focus:ring-primary-500/20',
        ],
        error: [
          'border-danger-300 bg-white text-secondary-900',
          'hover:border-danger-400',
          'focus:border-danger-500 focus:ring-danger-500/20',
        ],
        success: [
          'border-success-300 bg-white text-secondary-900',
          'hover:border-success-400',
          'focus:border-success-500 focus:ring-success-500/20',
        ],
      },
      inputSize: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-12 px-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * 입력 라벨
   */
  label?: string;

  /**
   * 에러 메시지
   */
  error?: string;

  /**
   * 성공 메시지
   */
  success?: string;

  /**
   * 도움말 텍스트
   */
  helperText?: string;

  /**
   * 필수 필드 표시
   */
  required?: boolean;

  /**
   * 왼쪽 아이콘
   */
  leftIcon?: React.ReactNode;

  /**
   * 오른쪽 아이콘
   */
  rightIcon?: React.ReactNode;

  /**
   * 래퍼 div의 className
   */
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      type = 'text',
      label,
      error,
      success,
      helperText,
      required,
      leftIcon,
      rightIcon,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    // 에러가 있으면 variant를 error로 변경
    const finalVariant = error ? 'error' : success ? 'success' : variant;

    // 안정적인 ID 생성 (접근성을 위해)
    const fallbackId = useId('input');
    const inputId = id || fallbackId;

    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700"
          >
            {label}
            {required && <span className="ml-1 text-danger-500">*</span>}
          </label>
        )}

        {/* 입력 필드 컨테이너 */}
        <div className="relative">
          {/* 왼쪽 아이콘 */}
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* 입력 필드 */}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, inputSize }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            id={inputId}
            {...aria.invalid(!!error,
              error
                ? `${inputId}-error`
                : success
                ? `${inputId}-success`
                : helperText
                ? `${inputId}-helper`
                : undefined
            )}
            {...aria.required(!!required)}
            {...props}
          />

          {/* 오른쪽 아이콘 */}
          {rightIcon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* 메시지 영역 */}
        {(error || success || helperText) && (
          <div className="text-sm">
            {error && (
              <p
                id={`${inputId}-error`}
                className="text-danger-600 flex items-center gap-1"
                role="alert"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </p>
            )}

            {success && !error && (
              <p
                id={`${inputId}-success`}
                className="text-success-600 flex items-center gap-1"
                role="status"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{success}</span>
              </p>
            )}

            {helperText && !error && !success && (
              <p id={`${inputId}-helper`} className="text-secondary-500">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
export default Input;