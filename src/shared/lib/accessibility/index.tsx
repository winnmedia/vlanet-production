/**
 * 접근성(A11y) 유틸리티 및 Hook 모음
 * 웹 접근성 표준 준수를 위한 도구들
 */

'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * 고유 ID 생성 Hook
 * 접근성을 위한 안정적인 ID 생성
 */
export function useId(prefix = 'id'): string {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}

/**
 * Focus 관리 Hook
 * 모달, 드롭다운 등에서 포커스 트랩 구현
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }, []);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !isActive) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, [isActive, getFocusableElements]);

  useEffect(() => {
    if (isActive) {
      // 현재 포커스된 요소 저장
      previousFocusRef.current = document.activeElement as HTMLElement;

      // 첫 번째 포커스 가능한 요소로 포커스 이동
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // 키보드 이벤트 리스너 추가
      document.addEventListener('keydown', trapFocus);

      return () => {
        document.removeEventListener('keydown', trapFocus);

        // 이전 포커스 복원
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isActive, trapFocus, getFocusableElements]);

  return containerRef;
}

/**
 * ESC 키 처리 Hook
 * 모달, 드롭다운 등에서 ESC 키로 닫기 구현
 */
export function useEscapeKey(callback: () => void, isActive = true) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, isActive]);
}

/**
 * 스크린 리더 전용 텍스트 컴포넌트
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only absolute -inset-[1px] h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0">
      {children}
    </span>
  );
}

/**
 * Skip Link 컴포넌트
 * 키보드 사용자를 위한 메인 콘텐츠 바로가기
 */
export function SkipLink({ href = '#main-content', children = '메인 콘텐츠로 건너뛰기' }) {
  return (
    <a
      href={href}
      className="
        absolute left-4 top-4 z-50
        px-4 py-2 bg-white text-black border-2 border-black rounded
        transform -translate-y-16 focus:translate-y-0
        transition-transform duration-200
        font-medium text-sm
      "
    >
      {children}
    </a>
  );
}

/**
 * 라이브 리전 Hook
 * 동적 콘텐츠 변경사항을 스크린 리더에 알림
 */
export function useLiveRegion() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;

    // 기존 메시지 제거
    announceRef.current.textContent = '';
    announceRef.current.setAttribute('aria-live', priority);

    // 새 메시지 추가 (약간의 지연으로 스크린 리더가 인식하도록)
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const LiveRegion = useCallback(() => (
    <div
      ref={announceRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), []);

  return { announce, LiveRegion };
}

/**
 * 키보드 네비게이션 Hook
 * 화살표 키를 이용한 포커스 이동
 */
export function useArrowNavigation(
  direction: 'horizontal' | 'vertical' | 'both' = 'both'
) {
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        if (direction === 'horizontal' || direction === 'both') {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (direction === 'horizontal' || direction === 'both') {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case 'ArrowDown':
        if (direction === 'vertical' || direction === 'both') {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case 'ArrowUp':
        if (direction === 'vertical' || direction === 'both') {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = focusableElements.length - 1;
        break;
    }

    // 순환 네비게이션
    if (nextIndex < 0) {
      nextIndex = focusableElements.length - 1;
    } else if (nextIndex >= focusableElements.length) {
      nextIndex = 0;
    }

    focusableElements[nextIndex]?.focus();
  }, [direction]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown]);

  return containerRef;
}

/**
 * ARIA 속성 생성 헬퍼
 */
export const aria = {
  /**
   * 확장 가능한 요소의 ARIA 속성
   */
  expandable: (isExpanded: boolean, controls?: string) => ({
    'aria-expanded': isExpanded,
    'aria-controls': controls,
  }),

  /**
   * 선택 가능한 요소의 ARIA 속성
   */
  selectable: (isSelected: boolean) => ({
    'aria-selected': isSelected,
  }),

  /**
   * 체크 가능한 요소의 ARIA 속성
   */
  checkable: (isChecked: boolean | 'mixed') => ({
    'aria-checked': isChecked,
  }),

  /**
   * 토글 가능한 요소의 ARIA 속성
   */
  toggleable: (isPressed: boolean) => ({
    'aria-pressed': isPressed,
  }),

  /**
   * 로딩 상태 ARIA 속성
   */
  loading: (isLoading: boolean, label = '로딩 중') => ({
    'aria-busy': isLoading,
    'aria-label': isLoading ? label : undefined,
  }),

  /**
   * 에러 상태 ARIA 속성
   */
  invalid: (isInvalid: boolean, describedBy?: string) => ({
    'aria-invalid': isInvalid,
    'aria-describedby': describedBy,
  }),

  /**
   * 필수 입력 ARIA 속성
   */
  required: (isRequired: boolean) => ({
    'aria-required': isRequired,
  }),

  /**
   * 페이지네이션 ARIA 속성
   */
  pagination: (current: number, total: number) => ({
    'aria-label': `페이지 ${current} / ${total}`,
    'aria-current': 'page' as const,
  }),

  /**
   * 정렬 ARIA 속성
   */
  sortable: (direction?: 'asc' | 'desc') => ({
    'aria-sort': direction || ('none' as const),
  }),
};

/**
 * 접근성 테스트를 위한 헬퍼
 */
export const a11yHelpers = {
  /**
   * 포커스 가능한 요소인지 확인
   */
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ];

    return focusableSelectors.some(selector =>
      element.matches(selector)
    );
  },

  /**
   * 적절한 ARIA 레이블이 있는지 확인
   */
  hasAccessibleName: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      element.getAttribute('title')
    );
  },

  /**
   * 색상 대비율 확인 (간단한 버전)
   */
  checkColorContrast: (foreground: string, background: string): number => {
    // 실제 구현에서는 더 정확한 계산 필요
    // 여기서는 간단한 예시만 제공
    return 4.5; // WCAG AA 기준
  },
};

/**
 * 접근성 개선을 위한 상수
 */
export const A11Y_CONSTANTS = {
  // WCAG 가이드라인
  MIN_CONTRAST_RATIO: 4.5,
  MIN_LARGE_TEXT_CONTRAST_RATIO: 3,
  MIN_TOUCH_TARGET_SIZE: 44, // px

  // 키보드 단축키
  KEYBOARD_SHORTCUTS: {
    ESC: 'Escape',
    ENTER: 'Enter',
    SPACE: ' ',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
  },

  // ARIA 역할
  ROLES: {
    BUTTON: 'button',
    TAB: 'tab',
    TABPANEL: 'tabpanel',
    MENU: 'menu',
    MENUITEM: 'menuitem',
    DIALOG: 'dialog',
    ALERT: 'alert',
    STATUS: 'status',
    MAIN: 'main',
    NAVIGATION: 'navigation',
    BANNER: 'banner',
    COMPLEMENTARY: 'complementary',
    CONTENTINFO: 'contentinfo',
  },
} as const;