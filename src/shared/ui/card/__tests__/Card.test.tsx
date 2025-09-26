/**
 * Card Component Tests
 * 카드 컴포넌트 및 하위 컴포넌트 테스트 스위트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../index';
import { testAccessibility, ariaAttrs, keyboardNav } from '@/shared/lib/accessibility/test-helpers';

describe('Card', () => {
  describe('기본 렌더링', () => {
    it('should render card with content', () => {
      render(<Card>Card Content</Card>);

      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply default variant and padding classes', () => {
      render(<Card data-testid="card">Default Card</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'rounded-xl',
        'bg-white',
        'border',
        'border-secondary-200',
        'shadow-card',
        'p-6'
      );
    });

    it('should render without header and footer by default', () => {
      render(<Card>Just content</Card>);

      const card = screen.getByText('Just content').parentElement?.parentElement;
      expect(card?.children).toHaveLength(1); // Only the content div
    });
  });

  describe('Variant 테스트', () => {
    it('should apply default variant classes', () => {
      render(<Card variant="default" data-testid="card">Default</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border', 'border-secondary-200', 'shadow-card');
    });

    it('should apply elevated variant classes', () => {
      render(<Card variant="elevated" data-testid="card">Elevated</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-card-hover', 'border-0');
      expect(card).not.toHaveClass('border-secondary-200');
    });

    it('should apply outlined variant classes', () => {
      render(<Card variant="outlined" data-testid="card">Outlined</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2', 'border-secondary-200', 'shadow-none');
    });

    it('should apply featured variant classes', () => {
      render(<Card variant="featured" data-testid="card">Featured</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'border-2',
        'border-primary-200',
        'shadow-brand',
        'bg-gradient-to-br'
      );
    });
  });

  describe('패딩 테스트', () => {
    it('should apply none padding', () => {
      render(<Card padding="none" data-testid="card">No padding</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-0');
    });

    it('should apply small padding', () => {
      render(<Card padding="sm" data-testid="card">Small padding</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4');
    });

    it('should apply medium padding (default)', () => {
      render(<Card padding="md" data-testid="card">Medium padding</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-6');
    });

    it('should apply large padding', () => {
      render(<Card padding="lg" data-testid="card">Large padding</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-8');
    });

    it('should override padding when header or footer is present', () => {
      render(
        <Card padding="lg" header="Header" data-testid="card">
          Content with header
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-0'); // Padding becomes none when header/footer present
    });
  });

  describe('호버 효과 테스트', () => {
    it('should apply no hover effect by default', () => {
      render(<Card data-testid="card">No hover</Card>);

      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('hover:-translate-y-1', 'hover:scale-[1.02]');
    });

    it('should apply lift hover effect', () => {
      render(<Card hover="lift" data-testid="card">Lift hover</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:-translate-y-1', 'hover:shadow-card-hover');
    });

    it('should apply scale hover effect', () => {
      render(<Card hover="scale" data-testid="card">Scale hover</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:scale-[1.02]');
    });

    it('should apply glow hover effect', () => {
      render(<Card hover="glow" data-testid="card">Glow hover</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-brand-lg', 'hover:border-primary-300');
    });
  });

  describe('Clickable 기능 테스트', () => {
    it('should not be clickable by default', () => {
      render(<Card data-testid="card">Not clickable</Card>);

      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabIndex');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('should be clickable when clickable prop is true', () => {
      render(<Card clickable data-testid="card">Clickable card</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should handle mouse click when clickable', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <Card clickable onClick={mockClick} data-testid="card">
          Clickable card
        </Card>
      );

      const card = screen.getByTestId('card');
      await user.click(card);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Enter key when clickable', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <Card clickable onClick={mockClick} data-testid="card">
          Clickable card
        </Card>
      );

      const card = screen.getByTestId('card');
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key when clickable', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <Card clickable onClick={mockClick} data-testid="card">
          Clickable card
        </Card>
      );

      const card = screen.getByTestId('card');
      card.focus();
      await user.keyboard(' ');

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle other keys when clickable', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <Card clickable onClick={mockClick} data-testid="card">
          Clickable card
        </Card>
      );

      const card = screen.getByTestId('card');
      card.focus();
      await user.keyboard('{Escape}');

      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('Header/Footer 테스트', () => {
    it('should render header when provided', () => {
      render(<Card header="Card Header">Content</Card>);

      const header = screen.getByText('Card Header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('border-b', 'border-secondary-100', 'px-6', 'py-4');
    });

    it('should render footer when provided', () => {
      render(<Card footer="Card Footer">Content</Card>);

      const footer = screen.getByText('Card Footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('border-t', 'border-secondary-100', 'px-6', 'py-4');
    });

    it('should render both header and footer', () => {
      render(
        <Card header="Header" footer="Footer">
          Content
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should apply correct padding to content when header/footer present', () => {
      render(
        <Card header="Header" footer="Footer" padding="lg">
          <span data-testid="content">Content</span>
        </Card>
      );

      const content = screen.getByTestId('content').parentElement;
      expect(content).toHaveClass('p-8'); // Should respect the padding prop
    });
  });

  describe('하위 컴포넌트 테스트', () => {
    describe('CardHeader', () => {
      it('should render with default classes', () => {
        render(<CardHeader data-testid="header">Header Content</CardHeader>);

        const header = screen.getByTestId('header');
        expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
      });

      it('should merge custom className', () => {
        render(
          <CardHeader className="custom-header" data-testid="header">
            Header
          </CardHeader>
        );

        const header = screen.getByTestId('header');
        expect(header).toHaveClass('custom-header');
      });
    });

    describe('CardTitle', () => {
      it('should render as h3 with proper classes', () => {
        render(<CardTitle>Card Title</CardTitle>);

        const title = screen.getByRole('heading', { level: 3 });
        expect(title).toHaveTextContent('Card Title');
        expect(title).toHaveClass(
          'text-2xl',
          'font-semibold',
          'leading-none',
          'tracking-tight'
        );
      });

      it('should merge custom className', () => {
        render(<CardTitle className="custom-title">Title</CardTitle>);

        const title = screen.getByRole('heading');
        expect(title).toHaveClass('custom-title');
      });
    });

    describe('CardDescription', () => {
      it('should render as paragraph with proper classes', () => {
        render(<CardDescription>Card description text</CardDescription>);

        const description = screen.getByText('Card description text');
        expect(description.tagName).toBe('P');
        expect(description).toHaveClass('text-sm', 'text-secondary-600');
      });

      it('should merge custom className', () => {
        render(
          <CardDescription className="custom-desc">Description</CardDescription>
        );

        const description = screen.getByText('Description');
        expect(description).toHaveClass('custom-desc');
      });
    });

    describe('CardContent', () => {
      it('should render with default classes', () => {
        render(
          <CardContent data-testid="content">Content area</CardContent>
        );

        const content = screen.getByTestId('content');
        expect(content).toHaveClass('p-6', 'pt-0');
      });

      it('should merge custom className', () => {
        render(
          <CardContent className="custom-content" data-testid="content">
            Content
          </CardContent>
        );

        const content = screen.getByTestId('content');
        expect(content).toHaveClass('custom-content');
      });
    });

    describe('CardFooter', () => {
      it('should render with default classes', () => {
        render(
          <CardFooter data-testid="footer">Footer content</CardFooter>
        );

        const footer = screen.getByTestId('footer');
        expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
      });

      it('should merge custom className', () => {
        render(
          <CardFooter className="custom-footer" data-testid="footer">
            Footer
          </CardFooter>
        );

        const footer = screen.getByTestId('footer');
        expect(footer).toHaveClass('custom-footer');
      });
    });
  });

  describe('조합 컴포넌트 테스트', () => {
    it('should render complete card with all subcomponents', () => {
      render(
        <Card variant="featured" hover="lift" data-testid="complete-card">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      // Check card wrapper
      const card = screen.getByTestId('complete-card');
      expect(card).toHaveClass('border-2', 'border-primary-200', 'hover:-translate-y-1');

      // Check all subcomponents
      expect(screen.getByRole('heading', { name: 'Complete Card' })).toBeInTheDocument();
      expect(screen.getByText('This is a complete card example')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });
  });

  describe('Accessibility 테스트', () => {
    it('should have button role when clickable', () => {
      render(<Card clickable>Clickable card</Card>);

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('should be focusable when clickable', async () => {
      const user = userEvent.setup();

      render(<Card clickable data-testid="card">Focusable card</Card>);

      const card = screen.getByTestId('card');
      await user.tab();

      expect(card).toHaveFocus();
    });

    it('should support custom aria attributes', () => {
      render(
        <Card
          clickable
          aria-label="Custom card"
          aria-describedby="description"
          data-testid="card"
        >
          Card content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'Custom card');
      expect(card).toHaveAttribute('aria-describedby', 'description');
    });

    it('should pass accessibility audit for regular card', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>접근성 카드</CardTitle>
            <CardDescription>접근성 테스트용 카드입니다</CardDescription>
          </CardHeader>
          <CardContent>카드 본문 내용</CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should pass accessibility audit for clickable card', async () => {
      const { container } = render(
        <Card clickable aria-label="클릭 가능한 카드">
          <CardContent>클릭할 수 있는 카드 내용</CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should have proper ARIA attributes for clickable card', () => {
      render(
        <Card clickable aria-label="프로젝트 카드" data-testid="project-card">
          프로젝트 정보
        </Card>
      );

      const card = screen.getByTestId('project-card');
      ariaAttrs.expectAriaAttributes(card, {
        'role': 'button',
        'tabindex': '0',
      });

      ariaAttrs.expectAccessibleName(card, '프로젝트 카드');
    });

    it('should have proper heading structure with CardTitle', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>메인 제목</CardTitle>
            <CardDescription>부제목 설명</CardDescription>
          </CardHeader>
        </Card>
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('메인 제목');

      // 제목과 설명이 적절히 연결되어 있는지 확인
      const description = screen.getByText('부제목 설명');
      expect(description.tagName).toBe('P');
    });

    it('should support keyboard navigation when clickable', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <Card clickable onClick={mockClick} aria-label="키보드 테스트 카드">
          키보드로 조작 가능한 카드
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();

      // Enter 키 테스트
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalledTimes(1);

      // Space 키 테스트
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalledTimes(2);
    });

    it('should not interfere with inner interactive elements', async () => {
      const user = userEvent.setup();
      const cardClick = jest.fn();
      const buttonClick = jest.fn();

      render(
        <Card clickable onClick={cardClick} data-testid="card">
          <CardContent>
            <button onClick={buttonClick}>내부 버튼</button>
          </CardContent>
        </Card>
      );

      // 내부 버튼 클릭 시 카드 클릭 이벤트가 발생하지 않아야 함
      const innerButton = screen.getByRole('button', { name: '내부 버튼' });
      await user.click(innerButton);

      expect(buttonClick).toHaveBeenCalledTimes(1);
      expect(cardClick).not.toHaveBeenCalled();
    });

    it('should provide focus indicators when clickable', () => {
      render(
        <Card clickable data-testid="focusable-card">
          포커스 표시가 있는 카드
        </Card>
      );

      const card = screen.getByTestId('focusable-card');
      expect(card).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should maintain semantic structure with subcomponents', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>섹션 제목</CardTitle>
            <CardDescription>섹션 설명</CardDescription>
          </CardHeader>
          <CardContent>
            <p>본문 내용이 포함된 단락입니다.</p>
          </CardContent>
          <CardFooter>
            <button type="button">액션 버튼</button>
          </CardFooter>
        </Card>
      );

      // 전체 구조가 접근성 규칙을 준수하는지 확인
      await testAccessibility(container);

      // 의미적 구조가 올바른지 확인
      const heading = screen.getByRole('heading');
      const button = screen.getByRole('button');
      const content = screen.getByText('본문 내용이 포함된 단락입니다.');

      expect(heading).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(content.tagName).toBe('P');
    });

    it('should support screen reader announcements for state changes', () => {
      const { rerender } = render(
        <Card clickable aria-label="상태 변경 카드" data-testid="state-card">
          기본 상태
        </Card>
      );

      const card = screen.getByTestId('state-card');
      expect(card).toHaveAttribute('aria-label', '상태 변경 카드');

      // 상태가 변경되어도 접근성 속성이 유지되어야 함
      rerender(
        <Card clickable aria-label="업데이트된 카드" data-testid="state-card">
          업데이트된 상태
        </Card>
      );

      const updatedCard = screen.getByTestId('state-card');
      expect(updatedCard).toHaveAttribute('aria-label', '업데이트된 카드');
    });
  });

  describe('Ref 전달', () => {
    it('should forward ref to card element', () => {
      const ref = jest.fn();

      render(<Card ref={ref}>Card with ref</Card>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it('should forward refs to all subcomponents', () => {
      const headerRef = jest.fn();
      const titleRef = jest.fn();
      const descRef = jest.fn();
      const contentRef = jest.fn();
      const footerRef = jest.fn();

      render(
        <Card>
          <CardHeader ref={headerRef}>Header</CardHeader>
          <CardTitle ref={titleRef}>Title</CardTitle>
          <CardDescription ref={descRef}>Description</CardDescription>
          <CardContent ref={contentRef}>Content</CardContent>
          <CardFooter ref={footerRef}>Footer</CardFooter>
        </Card>
      );

      expect(headerRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
      expect(titleRef).toHaveBeenCalledWith(expect.any(HTMLHeadingElement));
      expect(descRef).toHaveBeenCalledWith(expect.any(HTMLParagraphElement));
      expect(contentRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
      expect(footerRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  describe('커스텀 스타일링', () => {
    it('should merge custom className', () => {
      render(
        <Card className="custom-card-class" data-testid="card">
          Custom card
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card-class');
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card
          id="custom-id"
          data-custom="custom-value"
          data-testid="card"
        >
          Custom attributes
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'custom-id');
      expect(card).toHaveAttribute('data-custom', 'custom-value');
    });
  });
});