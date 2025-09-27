/**
 * Input Component Tests
 * 기본 입력 컴포넌트 테스트 스위트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../index';
import { testAccessibility, ariaAttrs, keyboardNav } from '../../../lib/accessibility/test-helpers';

// Mock icons for testing
const MockIcon = ({ testId = 'mock-icon' }: { testId?: string }) => (
  <span data-testid={testId}>Icon</span>
);

describe('Input', () => {
  describe('기본 렌더링', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter text');
    });

    it('should apply default variant and size classes', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'border-secondary-200',
        'bg-white',
        'h-11',
        'px-4',
        'text-base'
      );
    });

    it('should generate unique ID when not provided', () => {
      render(<Input label="Test Label" />);

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');

      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('should use provided ID', () => {
      render(<Input id="custom-id" label="Test Label" />);

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');

      expect(input).toHaveAttribute('id', 'custom-id');
      expect(label).toHaveAttribute('for', 'custom-id');
    });
  });

  describe('라벨 및 필수 표시', () => {
    it('should render label when provided', () => {
      render(<Input label="Username" />);

      const label = screen.getByText('Username');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('should not render label when not provided', () => {
      render(<Input placeholder="No label" />);

      expect(screen.queryByLabelText('No label')).not.toBeInTheDocument();
    });

    it('should show required asterisk when required', () => {
      render(<Input label="Required Field" required />);

      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-danger-500');
    });

    it('should associate label with input correctly', () => {
      render(<Input label="Associated Label" id="test-input" />);

      const input = screen.getByRole('textbox');
      const label = screen.getByLabelText('Associated Label');

      expect(input).toBe(label);
    });
  });

  describe('Variant 테스트', () => {
    it('should apply default variant classes', () => {
      render(<Input variant="default" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-secondary-200', 'focus:border-primary-500');
    });

    it('should apply error variant classes when error is provided', () => {
      render(<Input error="Error message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-300', 'focus:border-danger-500');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should apply success variant classes when success is provided', () => {
      render(<Input success="Success message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-success-300', 'focus:border-success-500');
    });

    it('should prioritize error over success variant', () => {
      render(<Input error="Error" success="Success" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-300');
      expect(input).not.toHaveClass('border-success-300');
    });
  });

  describe('크기 테스트', () => {
    it('should apply small size classes', () => {
      render(<Input inputSize="sm" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-9', 'px-3', 'text-sm');
    });

    it('should apply medium size classes (default)', () => {
      render(<Input inputSize="md" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-11', 'px-4', 'text-base');
    });

    it('should apply large size classes', () => {
      render(<Input inputSize="lg" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12', 'px-4', 'text-lg');
    });
  });

  describe('메시지 테스트', () => {
    it('should display error message with icon', () => {
      render(<Input error="This is an error" id="error-input" />);

      const errorMessage = screen.getByText('This is an error');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-danger-600');
      expect(errorMessage.querySelector('svg')).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-input-error');
    });

    it('should display success message with icon', () => {
      render(<Input success="This is success" id="success-input" />);

      const successMessage = screen.getByText('This is success');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveClass('text-success-600');
      expect(successMessage.querySelector('svg')).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'success-input-success');
    });

    it('should display helper text', () => {
      render(<Input helperText="This is helper text" id="helper-input" />);

      const helperText = screen.getByText('This is helper text');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('text-secondary-500');

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'helper-input-helper');
    });

    it('should prioritize error over success and helper messages', () => {
      render(
        <Input
          error="Error message"
          success="Success message"
          helperText="Helper text"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('should show success when no error', () => {
      render(
        <Input
          success="Success message"
          helperText="Helper text"
        />
      );

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('아이콘 테스트', () => {
    it('should render left icon', () => {
      render(<Input leftIcon={<MockIcon testId="left-icon" />} />);

      const leftIcon = screen.getByTestId('left-icon');
      expect(leftIcon).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('should render right icon', () => {
      render(<Input rightIcon={<MockIcon testId="right-icon" />} />);

      const rightIcon = screen.getByTestId('right-icon');
      expect(rightIcon).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-10');
    });

    it('should render both left and right icons', () => {
      render(
        <Input
          leftIcon={<MockIcon testId="left-icon" />}
          rightIcon={<MockIcon testId="right-icon" />}
        />
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10', 'pr-10');
    });
  });

  describe('Input 타입 테스트', () => {
    it('should handle password type', () => {
      render(<Input type="password" />);

      const input = screen.getByRole('textbox', { hidden: true }); // password inputs are hidden
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should handle email type', () => {
      render(<Input type="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should handle number type', () => {
      render(<Input type="number" />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should default to text type', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('상태 테스트', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should not be editable when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled value="" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('');
    });
  });

  describe('이벤트 핸들링', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();

      render(<Input onChange={mockChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(mockChange).toHaveBeenCalled();
      expect(input).toHaveValue('test');
    });

    it('should call onFocus when input is focused', async () => {
      const user = userEvent.setup();
      const mockFocus = jest.fn();

      render(<Input onFocus={mockFocus} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(mockFocus).toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const mockBlur = jest.fn();

      render(<Input onBlur={mockBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Move focus away

      expect(mockBlur).toHaveBeenCalled();
    });
  });

  describe('Accessibility 테스트', () => {
    it('should have proper textbox role', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should connect label and input with proper IDs', () => {
      render(<Input label="Accessible Input" id="accessible-input" />);

      const input = screen.getByLabelText('Accessible Input');
      expect(input).toHaveAttribute('id', 'accessible-input');
    });

    it('should set aria-invalid when error exists', () => {
      render(<Input error="Error message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not set aria-invalid when no error', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate input with error message via aria-describedby', () => {
      render(<Input error="Error message" id="error-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-input-error');

      const errorMessage = document.getElementById('error-input-error');
      expect(errorMessage).toHaveTextContent('Error message');
    });

    it('should pass accessibility audit', async () => {
      const { container } = render(<Input label="Accessible Input" />);
      await testAccessibility(container);
    });

    it('should have proper ARIA attributes for error state', () => {
      render(<Input label="Error Input" error="필수 입력 항목입니다" />);

      const input = screen.getByRole('textbox');
      ariaAttrs.expectAriaAttributes(input, {
        'aria-invalid': true,
        'aria-describedby': expect.stringContaining('error'),
      });
    });

    it('should have proper ARIA attributes for success state', () => {
      render(<Input label="Success Input" success="입력이 완료되었습니다" id="success-input" />);

      const input = screen.getByRole('textbox');
      ariaAttrs.expectAriaAttributes(input, {
        'aria-invalid': false,
        'aria-describedby': 'success-input-success',
      });
    });

    it('should have accessible name from label', () => {
      render(<Input label="사용자 이름" />);

      const input = screen.getByRole('textbox');
      ariaAttrs.expectAccessibleName(input, '사용자 이름');
    });

    it('should have accessible name from aria-label when no visible label', () => {
      render(<Input aria-label="검색어 입력" />);

      const input = screen.getByRole('textbox');
      ariaAttrs.expectAccessibleName(input, '검색어 입력');
    });

    it('should be focusable with keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<Input label="Keyboard Input" />);

      const input = screen.getByRole('textbox');
      await user.tab();

      expect(input).toHaveFocus();
    });

    it('should support keyboard interaction when not disabled', async () => {
      const user = userEvent.setup();
      const mockChange = jest.fn();

      render(<Input onChange={mockChange} label="Keyboard Input" />);

      const input = screen.getByRole('textbox');
      input.focus();

      await user.keyboard('테스트 입력');
      expect(mockChange).toHaveBeenCalled();
      expect(input).toHaveValue('테스트 입력');
    });

    it('should hide decorative icons from screen readers', () => {
      render(
        <Input
          leftIcon={<MockIcon testId="left-icon" />}
          rightIcon={<MockIcon testId="right-icon" />}
          label="아이콘이 있는 입력"
        />
      );

      const leftIcon = screen.getByTestId('left-icon');
      const rightIcon = screen.getByTestId('right-icon');

      expect(leftIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
      expect(rightIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('should provide screen reader text for required fields', () => {
      render(<Input label="필수 입력" required />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');

      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    });

    it('should maintain focus when transitioning between states', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Input label="State Input" />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(input).toHaveFocus();

      rerender(<Input label="State Input" error="오류가 발생했습니다" />);

      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('should announce state changes to screen readers', () => {
      render(<Input label="Live Input" error="실시간 검증 오류" id="live-input" />);

      const errorMessage = document.getElementById('live-input-error');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('커스텀 스타일링', () => {
    it('should merge custom className', () => {
      render(<Input className="custom-input-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input-class');
    });

    it('should apply custom wrapper className', () => {
      render(<Input wrapperClassName="custom-wrapper" label="Test" />);

      const wrapper = screen.getByText('Test').parentElement;
      expect(wrapper).toHaveClass('custom-wrapper');
    });
  });

  describe('Ref 전달', () => {
    it('should forward ref correctly', () => {
      const ref = jest.fn();

      render(<Input ref={ref} />);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    it('should allow programmatic focus via ref', () => {
      let inputRef: HTMLInputElement | null = null;

      render(<Input ref={(ref) => { inputRef = ref; }} />);

      expect(inputRef).not.toBe(null);

      if (inputRef) {
        inputRef.focus();
        expect(inputRef).toHaveFocus();
      }
    });
  });

  describe('조합 테스트', () => {
    it('should handle complex input configuration', () => {
      render(
        <Input
          label="Complex Input"
          placeholder="Enter complex data"
          error="Complex error"
          required
          inputSize="lg"
          leftIcon={<MockIcon testId="left" />}
          rightIcon={<MockIcon testId="right" />}
          className="custom-complex"
          wrapperClassName="wrapper-complex"
        />
      );

      // Check label with required asterisk
      expect(screen.getByText('Complex Input')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();

      // Check input with proper classes and attributes
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12', 'pl-10', 'pr-10', 'custom-complex');
      expect(input).toHaveAttribute('aria-invalid', 'true');

      // Check icons
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByTestId('right')).toBeInTheDocument();

      // Check error message
      expect(screen.getByText('Complex error')).toBeInTheDocument();

      // Check wrapper class
      const wrapper = screen.getByText('Complex Input').parentElement;
      expect(wrapper).toHaveClass('wrapper-complex');
    });
  });
});