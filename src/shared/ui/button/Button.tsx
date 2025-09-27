import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { ScreenReaderOnly, aria } from '@/shared/lib/accessibility';

const buttonVariants = cva(
  // 기본 스타일
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        // Primary - VLANET 브랜드 그라데이션
        primary: [
          'bg-gradient-brand text-white shadow-brand',
          'hover:bg-gradient-brand-hover hover:shadow-brand-lg hover:-translate-y-0.5',
          'focus:ring-primary-500/20',
        ],

        // Secondary - 아웃라인 스타일
        secondary: [
          'bg-white text-primary-600 border-2 border-primary-500',
          'hover:bg-primary-50 hover:border-primary-600',
          'focus:ring-primary-500/20',
        ],

        // Outline - 기본 아웃라인
        outline: [
          'bg-transparent text-secondary-700 border border-secondary-300',
          'hover:bg-secondary-50 hover:border-secondary-400',
          'focus:ring-secondary-500/20',
        ],

        // Ghost - 텍스트 버튼
        ghost: [
          'bg-transparent text-secondary-700',
          'hover:bg-secondary-100',
          'focus:ring-secondary-500/20',
        ],

        // Danger - 위험한 동작용
        danger: [
          'bg-danger-500 text-white',
          'hover:bg-danger-600 hover:-translate-y-0.5',
          'focus:ring-danger-500/20',
        ],

        // Success - 성공/완료용
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600 hover:-translate-y-0.5',
          'focus:ring-success-500/20',
        ],
      },

      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 로딩 상태 표시
   */
  loading?: boolean;

  /**
   * 버튼 왼쪽에 표시할 아이콘
   */
  leftIcon?: React.ReactNode;

  /**
   * 버튼 오른쪽에 표시할 아이콘
   */
  rightIcon?: React.ReactNode;

  /**
   * 로딩 상태일 때 스크린 리더용 텍스트
   */
  loadingText?: string;

  /**
   * 아이콘만 있는 버튼인지 여부 (접근성 레이블 필요)
   */
  iconOnly?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      loadingText = '로딩 중',
      iconOnly = false,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // 접근성 속성 계산
    const accessibilityProps = {
      ...aria.loading(loading, loadingText),
      'aria-label': ariaLabel || (iconOnly && !children ? '버튼' : undefined),
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...accessibilityProps}
        {...props}
      >
        {/* 로딩 스피너 */}
        {loading && (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
          </>
        )}

        {/* 왼쪽 아이콘 */}
        {!loading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* 버튼 텍스트 */}
        {children && <span>{children}</span>}

        {/* 오른쪽 아이콘 */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {/* 아이콘 전용 버튼이면서 레이블이 없는 경우 경고 */}
        {iconOnly && !ariaLabel && !children && (
          <ScreenReaderOnly>버튼</ScreenReaderOnly>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;