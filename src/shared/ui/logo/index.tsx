import React from 'react';
import { cn } from '@/shared/lib/utils';

interface LogoProps {
  /**
   * 로고 변형 스타일
   * - symbol: 심볼만 (V 로고)
   * - wordmark: 워드마크만 (VLANET 텍스트)
   * - full: 심볼 + 워드마크 조합
   */
  variant?: 'symbol' | 'wordmark' | 'full';

  /**
   * 로고 크기
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * 색상 테마
   * - color: 컬러 로고 (기본)
   * - white: 흰색 로고 (어두운 배경용)
   * - mono: 단색 로고
   */
  theme?: 'color' | 'white' | 'mono';

  /**
   * 추가 CSS 클래스
   */
  className?: string;

  /**
   * 클릭 이벤트 핸들러
   */
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-6', // 24px
  md: 'h-8', // 32px
  lg: 'h-12', // 48px
  xl: 'h-16', // 64px
};

export function Logo({
  variant = 'full',
  size = 'md',
  theme = 'color',
  className,
  onClick
}: LogoProps) {
  const baseClasses = cn(
    'inline-flex items-center',
    onClick && 'cursor-pointer transition-opacity hover:opacity-80',
    className
  );

  // 심볼만 표시
  if (variant === 'symbol') {
    return (
      <div className={baseClasses} onClick={onClick}>
        {theme === 'white' ? (
          <svg
            viewBox="0 0 100.43 78.95"
            className={cn(sizeClasses[size], 'w-auto')}
            fill="currentColor"
          >
            <g>
              <path
                d="m27.7,78.95c-3.99,0-7.51-2.62-8.64-6.45L.3,9.16C-1.06,4.59,2.37,0,7.14,0h32.42c4.67,0,8.08,4.42,6.9,8.94l-10.85,41.42c-.74,2.82,1.39,5.58,4.31,5.58h1.23s0,23.01,0,23.01h-13.44Z"
                className="fill-current"
              />
              <path
                d="m54.65,5.29l-5.7,21.36c-.56,2.09.46,4.27,2.42,5.18l9.12,4.25c3.23,1.5,3.47,5.99.43,7.84l-19.78,12.01-6.14,23.01h37.72c3.99,0,7.51-2.62,8.64-6.45l18.77-63.34c1.35-4.57-2.07-9.16-6.84-9.16h-31.75c-3.23,0-6.06,2.17-6.89,5.29Z"
                className="fill-current"
              />
            </g>
          </svg>
        ) : (
          <svg
            viewBox="0 0 100.43 78.95"
            className={cn(sizeClasses[size], 'w-auto')}
          >
            <g>
              <path
                d="m27.7,78.95c-3.99,0-7.51-2.62-8.64-6.45L.3,9.16C-1.06,4.59,2.37,0,7.14,0h32.42c4.67,0,8.08,4.42,6.9,8.94l-10.85,41.42c-.74,2.82,1.39,5.58,4.31,5.58h1.23s0,23.01,0,23.01h-13.44Z"
                fill={theme === 'mono' ? 'currentColor' : '#004ac1'}
              />
              <path
                d="m54.65,5.29l-5.7,21.36c-.56,2.09.46,4.27,2.42,5.18l9.12,4.25c3.23,1.5,3.47,5.99.43,7.84l-19.78,12.01-6.14,23.01h37.72c3.99,0,7.51-2.62,8.64-6.45l18.77-63.34c1.35-4.57-2.07-9.16-6.84-9.16h-31.75c-3.23,0-6.06,2.17-6.89,5.29Z"
                fill={theme === 'mono' ? 'currentColor' : '#0059db'}
              />
            </g>
          </svg>
        )}
      </div>
    );
  }

  // 워드마크만 표시
  if (variant === 'wordmark') {
    return (
      <div className={baseClasses} onClick={onClick}>
        <span className={cn(
          'font-bold tracking-tight',
          size === 'sm' && 'text-lg',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-3xl',
          size === 'xl' && 'text-4xl',
          theme === 'color' && 'bg-gradient-brand bg-clip-text text-transparent',
          theme === 'white' && 'text-white',
          theme === 'mono' && 'text-current'
        )}>
          VLANET
        </span>
      </div>
    );
  }

  // 심볼 + 워드마크 조합 (full)
  return (
    <div className={cn(baseClasses, 'gap-3')} onClick={onClick}>
      {/* 심볼 */}
      <div className="flex-shrink-0">
        {theme === 'white' ? (
          <svg
            viewBox="0 0 100.43 78.95"
            className={cn(sizeClasses[size], 'w-auto')}
            fill="currentColor"
          >
            <g>
              <path
                d="m27.7,78.95c-3.99,0-7.51-2.62-8.64-6.45L.3,9.16C-1.06,4.59,2.37,0,7.14,0h32.42c4.67,0,8.08,4.42,6.9,8.94l-10.85,41.42c-.74,2.82,1.39,5.58,4.31,5.58h1.23s0,23.01,0,23.01h-13.44Z"
                className="fill-current"
              />
              <path
                d="m54.65,5.29l-5.7,21.36c-.56,2.09.46,4.27,2.42,5.18l9.12,4.25c3.23,1.5,3.47,5.99.43,7.84l-19.78,12.01-6.14,23.01h37.72c3.99,0,7.51-2.62,8.64-6.45l18.77-63.34c1.35-4.57-2.07-9.16-6.84-9.16h-31.75c-3.23,0-6.06,2.17-6.89,5.29Z"
                className="fill-current"
              />
            </g>
          </svg>
        ) : (
          <svg
            viewBox="0 0 100.43 78.95"
            className={cn(sizeClasses[size], 'w-auto')}
          >
            <g>
              <path
                d="m27.7,78.95c-3.99,0-7.51-2.62-8.64-6.45L.3,9.16C-1.06,4.59,2.37,0,7.14,0h32.42c4.67,0,8.08,4.42,6.9,8.94l-10.85,41.42c-.74,2.82,1.39,5.58,4.31,5.58h1.23s0,23.01,0,23.01h-13.44Z"
                fill={theme === 'mono' ? 'currentColor' : '#004ac1'}
              />
              <path
                d="m54.65,5.29l-5.7,21.36c-.56,2.09.46,4.27,2.42,5.18l9.12,4.25c3.23,1.5,3.47,5.99.43,7.84l-19.78,12.01-6.14,23.01h37.72c3.99,0,7.51-2.62,8.64-6.45l18.77-63.34c1.35-4.57-2.07-9.16-6.84-9.16h-31.75c-3.23,0-6.06,2.17-6.89,5.29Z"
                fill={theme === 'mono' ? 'currentColor' : '#0059db'}
              />
            </g>
          </svg>
        )}
      </div>

      {/* 워드마크 */}
      <span className={cn(
        'font-bold tracking-tight',
        size === 'sm' && 'text-lg',
        size === 'md' && 'text-2xl',
        size === 'lg' && 'text-3xl',
        size === 'xl' && 'text-4xl',
        theme === 'color' && 'bg-gradient-brand bg-clip-text text-transparent',
        theme === 'white' && 'text-white',
        theme === 'mono' && 'text-current'
      )}>
        VLANET
      </span>
    </div>
  );
}

// 기본 내보내기 및 명명된 내보내기 모두 제공
export default Logo;