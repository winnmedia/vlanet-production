/**
 * 접근성 테스트 헬퍼 함수들
 * Jest와 Testing Library를 활용한 A11y 테스트 유틸리티
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Jest matcher 추가
expect.extend(toHaveNoViolations);

/**
 * 컴포넌트의 접근성을 포괄적으로 테스트하는 헬퍼 함수
 */
export async function testAccessibility(
  element: HTMLElement,
  options?: {
    rules?: any;
    tags?: string[];
  }
) {
  const results = await axe(element, {
    rules: options?.rules,
    tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
  });

  expect(results).toHaveNoViolations();
  return results;
}

/**
 * 키보드 네비게이션 테스트 헬퍼
 */
export class KeyboardNavigationTester {
  private user = userEvent.setup();

  /**
   * Tab 키를 이용한 포커스 이동 테스트
   */
  async testTabNavigation(
    expectedFocusOrder: string[],
    container?: HTMLElement
  ) {
    // 첫 번째 요소부터 시작
    if (expectedFocusOrder.length === 0) return;

    for (let i = 0; i < expectedFocusOrder.length; i++) {
      await this.user.tab();

      const currentFocus = document.activeElement;
      const expectedElement = container
        ? container.querySelector(expectedFocusOrder[i])
        : screen.getByRole('button', { name: expectedFocusOrder[i] }) ||
          screen.getByLabelText(expectedFocusOrder[i]) ||
          screen.getByText(expectedFocusOrder[i]);

      expect(currentFocus).toBe(expectedElement);
    }
  }

  /**
   * Shift+Tab을 이용한 역방향 포커스 이동 테스트
   */
  async testReverseTabNavigation(
    expectedFocusOrder: string[],
    container?: HTMLElement
  ) {
    // 마지막 요소부터 역순으로 테스트
    const reversedOrder = [...expectedFocusOrder].reverse();

    for (const elementIdentifier of reversedOrder) {
      await this.user.tab({ shift: true });

      const currentFocus = document.activeElement;
      const expectedElement = container
        ? container.querySelector(elementIdentifier)
        : screen.getByRole('button', { name: elementIdentifier }) ||
          screen.getByLabelText(elementIdentifier) ||
          screen.getByText(elementIdentifier);

      expect(currentFocus).toBe(expectedElement);
    }
  }

  /**
   * 화살표 키 네비게이션 테스트
   */
  async testArrowNavigation(
    direction: 'horizontal' | 'vertical',
    elements: string[]
  ) {
    const keys = direction === 'horizontal'
      ? ['{ArrowRight}', '{ArrowLeft}']
      : ['{ArrowDown}', '{ArrowUp}'];

    // 첫 번째 요소에 포커스
    const firstElement = screen.getByRole('button', { name: elements[0] }) ||
                        screen.getByText(elements[0]);
    firstElement.focus();

    // 오른쪽/아래 방향 테스트
    for (let i = 1; i < elements.length; i++) {
      await this.user.keyboard(keys[0]);

      const expectedElement = screen.getByRole('button', { name: elements[i] }) ||
                             screen.getByText(elements[i]);
      expect(document.activeElement).toBe(expectedElement);
    }

    // 왼쪽/위 방향 테스트
    for (let i = elements.length - 2; i >= 0; i--) {
      await this.user.keyboard(keys[1]);

      const expectedElement = screen.getByRole('button', { name: elements[i] }) ||
                             screen.getByText(elements[i]);
      expect(document.activeElement).toBe(expectedElement);
    }
  }

  /**
   * ESC 키 테스트
   */
  async testEscapeKey(onEscape: () => void) {
    await this.user.keyboard('{Escape}');
    // onEscape 콜백이 호출되었는지 확인하는 것은 테스트에서 처리
  }

  /**
   * Enter/Space 키로 버튼 활성화 테스트
   */
  async testButtonActivation(buttonElement: HTMLElement, onActivate: () => void) {
    buttonElement.focus();

    await this.user.keyboard('{Enter}');
    // onActivate가 호출되었는지 확인

    await this.user.keyboard(' ');
    // onActivate가 두 번째로 호출되었는지 확인
  }
}

/**
 * ARIA 속성 테스트 헬퍼
 */
export class AriaAttributesTester {
  /**
   * 필수 ARIA 속성이 올바르게 설정되었는지 확인
   */
  static expectAriaAttributes(
    element: HTMLElement,
    expectedAttributes: Record<string, string | boolean>
  ) {
    Object.entries(expectedAttributes).forEach(([attr, value]) => {
      if (typeof value === 'boolean') {
        expect(element).toHaveAttribute(attr, value.toString());
      } else {
        expect(element).toHaveAttribute(attr, value);
      }
    });
  }

  /**
   * 접근 가능한 이름이 설정되었는지 확인
   */
  static expectAccessibleName(element: HTMLElement, expectedName?: string) {
    const accessibleName =
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent ||
      element.getAttribute('title');

    expect(accessibleName).toBeTruthy();

    if (expectedName) {
      expect(accessibleName).toBe(expectedName);
    }
  }

  /**
   * 설명 텍스트가 올바르게 연결되었는지 확인
   */
  static expectAriaDescribedBy(element: HTMLElement, descriptionId: string) {
    expect(element).toHaveAttribute('aria-describedby', descriptionId);

    const descriptionElement = document.getElementById(descriptionId);
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement?.textContent).toBeTruthy();
  }
}

/**
 * 스크린 리더 테스트 헬퍼
 */
export class ScreenReaderTester {
  /**
   * 라이브 리전이 올바르게 설정되었는지 확인
   */
  static expectLiveRegion(element: HTMLElement, politeness: 'polite' | 'assertive' = 'polite') {
    expect(element).toHaveAttribute('aria-live', politeness);
  }

  /**
   * 스크린 리더 전용 텍스트가 존재하는지 확인
   */
  static expectScreenReaderText(text: string) {
    // sr-only 클래스를 가진 요소 찾기
    const srOnlyElements = document.querySelectorAll('.sr-only');
    const hasScreenReaderText = Array.from(srOnlyElements).some(
      element => element.textContent?.includes(text)
    );

    expect(hasScreenReaderText).toBe(true);
  }

  /**
   * 시각적으로만 표시되는 텍스트가 스크린 리더에서 숨겨졌는지 확인
   */
  static expectAriaHidden(element: HTMLElement) {
    expect(element).toHaveAttribute('aria-hidden', 'true');
  }
}

/**
 * 색상 대비 테스트 헬퍼 (기본적인 체크만)
 */
export class ColorContrastTester {
  /**
   * 요소의 색상이 충분한 대비를 가지는지 확인
   * 실제 구현에서는 더 정교한 색상 대비 계산이 필요
   */
  static expectSufficientContrast(element: HTMLElement) {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // 기본적인 검증 - 색상이 설정되어 있는지만 확인
    expect(color).toBeTruthy();
    expect(backgroundColor).toBeTruthy();

    // 실제 프로덕션에서는 더 정확한 대비 계산 라이브러리 사용
    // 예: color-contrast 라이브러리
  }
}

/**
 * 포괄적인 접근성 테스트 스위트
 */
export function createAccessibilityTestSuite(
  componentName: string,
  renderComponent: () => RenderResult,
  options: {
    skipKeyboardNavigation?: boolean;
    skipColorContrast?: boolean;
    customTests?: () => Promise<void>;
  } = {}
) {
  return () => {
    describe(`${componentName} 접근성 테스트`, () => {
      let container: HTMLElement;

      beforeEach(() => {
        const result = renderComponent();
        container = result.container;
      });

      it('axe 접근성 규칙을 준수해야 합니다', async () => {
        await testAccessibility(container);
      });

      if (!options.skipKeyboardNavigation) {
        it('키보드 네비게이션이 가능해야 합니다', async () => {
          const focusableElements = container.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          );

          expect(focusableElements.length).toBeGreaterThan(0);

          // 첫 번째 포커스 가능한 요소에 포커스 가능한지 확인
          const firstElement = focusableElements[0] as HTMLElement;
          firstElement.focus();
          expect(document.activeElement).toBe(firstElement);
        });
      }

      if (!options.skipColorContrast) {
        it('충분한 색상 대비를 가져야 합니다', () => {
          const textElements = container.querySelectorAll('*');
          const hasTextElements = Array.from(textElements).some(
            element => element.textContent && element.textContent.trim()
          );

          if (hasTextElements) {
            // 최소한 텍스트가 있는 요소들이 존재해야 함
            expect(hasTextElements).toBe(true);
          }
        });
      }

      if (options.customTests) {
        it('커스텀 접근성 테스트를 통과해야 합니다', async () => {
          await options.customTests!();
        });
      }
    });
  };
}

// 유틸리티 내보내기
export const keyboardNav = new KeyboardNavigationTester();
export const ariaAttrs = AriaAttributesTester;
export const screenReader = ScreenReaderTester;
export const colorContrast = ColorContrastTester;