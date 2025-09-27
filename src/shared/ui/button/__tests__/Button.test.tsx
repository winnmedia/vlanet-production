/**
 * Button Component Tests
 * 기본 버튼 컴포넌트 테스트 스위트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../index';
import { testAccessibility, ariaAttrs, keyboardNav } from '../../../lib/accessibility/test-helpers';

// Mock icons for testing
const MockIcon = () => <span data-testid="mock-icon">Icon</span>;

describe('Button', () => {
  describe('기본 렌더링', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('should render button without text', () => {
      render(<Button aria-label="Icon button" />);

      const button = screen.getByRole('button', { name: 'Icon button' });
      expect(button).toBeInTheDocument();
    });

    it('should apply default variant and size classes', () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-6', 'text-base'); // md size
    });
  });

  describe('Variant 테스트', () => {
    it('should apply primary variant classes', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-brand', 'text-white');
    });

    it('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-primary-600', 'border-2');
    });

    it('should apply outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'text-secondary-700', 'border');
    });

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'text-secondary-700');
    });

    it('should apply danger variant classes', () => {
      render(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-danger-500', 'text-white');
    });

    it('should apply success variant classes', () => {
      render(<Button variant="success">Success</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-success-500', 'text-white');
    });
  });

  describe('Size 테스트', () => {
    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3', 'text-sm');
    });

    it('should apply medium size classes (default)', () => {
      render(<Button size="md">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-6', 'text-base');
    });

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-8', 'text-lg');
    });

    it('should apply extra large size classes', () => {
      render(<Button size="xl">Extra Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14', 'px-10', 'text-xl');
    });
  });

  describe('FullWidth 테스트', () => {
    it('should apply full width classes', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not apply full width classes by default', () => {
      render(<Button>Regular Width</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('로딩 상태 테스트', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading Button</Button>);

      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should disable button when loading', () => {
      render(<Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should hide icons when loading', () => {
      render(
        <Button loading leftIcon={<MockIcon />} rightIcon={<MockIcon />}>
          Loading
        </Button>
      );

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });
  });

  describe('아이콘 테스트', () => {
    it('should render left icon', () => {
      render(<Button leftIcon={<MockIcon />}>With Left Icon</Button>);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      render(<Button rightIcon={<MockIcon />}>With Right Icon</Button>);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">Left</span>}
          rightIcon={<span data-testid="right-icon">Right</span>}
        >
          With Both Icons
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Disabled 상태 테스트', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should not be clickable when disabled', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <Button disabled onClick={mockClick}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('이벤트 핸들링', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(<Button onClick={mockClick}>Clickable Button</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(<Button onClick={mockClick}>Keyboard Button</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility 테스트', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Custom aria label">Button</Button>);

      const button = screen.getByRole('button', { name: 'Custom aria label' });
      expect(button).toBeInTheDocument();
    });

    it('should support custom aria attributes', () => {
      render(
        <Button aria-describedby="description" aria-expanded={false}>
          Button with ARIA
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should be focusable with keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<Button>Focusable Button</Button>);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });
  });

  describe('커스텀 클래스 및 Props', () => {
    it('should merge custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should pass through HTML button attributes', () => {
      render(
        <Button type="submit" id="submit-btn" data-testid="submit-button">
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('id', 'submit-btn');
      expect(button).toHaveAttribute('data-testid', 'submit-button');
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();

      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('조합 테스트', () => {
    it('should handle complex button configuration', () => {
      render(
        <Button
          variant="danger"
          size="lg"
          fullWidth
          leftIcon={<MockIcon />}
          rightIcon={<MockIcon />}
          className="custom-danger"
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-danger-500', 'h-12', 'w-full', 'custom-danger');
      expect(screen.getAllByTestId('mock-icon')).toHaveLength(2);
    });

    it('should prioritize loading state over icons', () => {
      render(
        <Button
          loading
          leftIcon={<MockIcon />}
          rightIcon={<MockIcon />}
        >
          Loading Complex
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('should pass accessibility audit', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      await testAccessibility(container);
    });

    it('should have proper ARIA attributes for loading state', () => {
      render(<Button loading loadingText="처리 중입니다">로딩 버튼</Button>);

      const button = screen.getByRole('button');
      ariaAttrs.expectAriaAttributes(button, {
        'aria-busy': true,
      });
    });

    it('should have accessible name for icon-only buttons', () => {
      render(
        <Button iconOnly leftIcon={<MockIcon />} aria-label="설정" />
      );

      const button = screen.getByRole('button');
      ariaAttrs.expectAccessibleName(button, '설정');
    });

    it('should provide screen reader text for loading state', () => {
      render(<Button loading loadingText="데이터 저장 중">저장</Button>);

      expect(screen.getByText('데이터 저장 중')).toBeInTheDocument();
    });

    it('should hide decorative icons from screen readers', () => {
      render(
        <Button leftIcon={<MockIcon />} rightIcon={<MockIcon />}>
          Button with Icons
        </Button>
      );

      const icons = screen.getAllByTestId('mock-icon');
      icons.forEach(icon => {
        expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should maintain focus when disabled by loading', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Button>Submit</Button>);

      const button = screen.getByRole('button');
      await user.click(button);
      button.focus();

      expect(button).toHaveFocus();

      rerender(<Button loading>Submit</Button>);

      // Button should still maintain its identity but be disabled
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should support keyboard activation when not disabled', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(<Button onClick={mockClick}>키보드 버튼</Button>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalledTimes(2);
    });
  });
});