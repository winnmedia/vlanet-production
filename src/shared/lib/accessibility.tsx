import React from 'react';
import { useId as useReactId } from 'react';

/**
 * 안정적인 ID 생성을 위한 훅
 */
export function useId(prefix?: string): string {
  const id = useReactId();
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * 스크린 리더 전용 컴포넌트
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * 메인 콘텐츠로 건너뛰기 링크
 */
export function SkipLink({ href = "#main", children = "메인 콘텐츠로 건너뛰기" }: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md font-medium z-50"
    >
      {children}
    </a>
  );
}

/**
 * ARIA 속성 생성 유틸리티
 */
export const aria = {
  /**
   * 로딩 상태를 위한 ARIA 속성
   */
  loading: (isLoading: boolean, loadingText?: string) => ({
    'aria-busy': isLoading,
    'aria-live': isLoading ? 'polite' : undefined,
    'aria-label': isLoading && loadingText ? loadingText : undefined,
  }),

  /**
   * 필수 필드를 위한 ARIA 속성
   */
  required: (isRequired: boolean) => ({
    'aria-required': isRequired,
    required: isRequired,
  }),

  /**
   * 유효하지 않은 상태를 위한 ARIA 속성
   */
  invalid: (isInvalid: boolean, describedBy?: string) => ({
    'aria-invalid': isInvalid,
    'aria-describedby': describedBy,
  }),

  /**
   * 확장 가능한 요소를 위한 ARIA 속성
   */
  expanded: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded,
  }),

  /**
   * 선택된 상태를 위한 ARIA 속성
   */
  selected: (isSelected: boolean) => ({
    'aria-selected': isSelected,
  }),

  /**
   * 비활성화된 상태를 위한 ARIA 속성
   */
  disabled: (isDisabled: boolean) => ({
    'aria-disabled': isDisabled,
    disabled: isDisabled,
  }),
};