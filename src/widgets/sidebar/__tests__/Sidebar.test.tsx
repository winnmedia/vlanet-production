/**
 * Sidebar 컴포넌트 테스트
 * 모바일/데스크톱 반응형 동작 및 사용자 역할별 메뉴 렌더링 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { Sidebar, type SidebarProps } from '../Sidebar';

// Next.js 라우터 모킹
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Logo 컴포넌트 모킹
jest.mock('@/shared/ui/logo', () => ({
  Logo: ({ variant }: { variant: string }) => (
    <div data-testid={`logo-${variant}`}>Logo</div>
  ),
}));

// 기본 props 설정
const defaultProps: SidebarProps = {
  userRole: 'CREATOR',
  isMobileOpen: false,
  onMobileToggle: jest.fn(),
};

describe('Sidebar', () => {
  const mockPathname = usePathname as jest.Mock;
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  describe('Basic Rendering', () => {
    it('renders sidebar with correct initial state', () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
    });

    it('shows full logo when expanded on desktop', () => {
      render(<Sidebar {...defaultProps} />);

      const sidebar = screen.getByRole('navigation').parentElement!;
      fireEvent.mouseEnter(sidebar);

      expect(screen.getByTestId('logo-full')).toBeInTheDocument();
    });
  });

  describe('Mobile Behavior', () => {
    it('shows sidebar when isMobileOpen is true', () => {
      render(<Sidebar {...defaultProps} isMobileOpen={true} />);

      const sidebar = screen.getByRole('navigation').parentElement!;
      expect(sidebar).toHaveClass('translate-x-0');
      expect(screen.getByTestId('logo-full')).toBeInTheDocument();
    });

    it('hides sidebar when isMobileOpen is false', () => {
      render(<Sidebar {...defaultProps} isMobileOpen={false} />);

      const sidebar = screen.getByRole('navigation').parentElement!;
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('shows backdrop overlay when mobile sidebar is open', () => {
      render(<Sidebar {...defaultProps} isMobileOpen={true} />);

      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('calls onMobileToggle when backdrop is clicked', async () => {
      const mockToggle = jest.fn();
      render(<Sidebar {...defaultProps} isMobileOpen={true} onMobileToggle={mockToggle} />);

      const backdrop = document.querySelector('.bg-black.bg-opacity-50')!;
      await user.click(backdrop as Element);

      expect(mockToggle).toHaveBeenCalledWith(false);
    });

    it('shows close button in mobile mode', () => {
      render(<Sidebar {...defaultProps} isMobileOpen={true} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('User Role-based Menus', () => {
    it('shows creator-specific menu items for CREATOR role', () => {
      render(<Sidebar {...defaultProps} userRole="CREATOR" />);

      expect(screen.getByText('내 영상')).toBeInTheDocument();
      expect(screen.getByText('통계 분석')).toBeInTheDocument();
      expect(screen.getByText('펀딩 관리')).toBeInTheDocument();
    });

    it('shows funder-specific menu items for FUNDER role', () => {
      render(<Sidebar {...defaultProps} userRole="FUNDER" />);

      expect(screen.getByText('영상 탐색')).toBeInTheDocument();
      expect(screen.getByText('포트폴리오')).toBeInTheDocument();
      expect(screen.getByText('제안 관리')).toBeInTheDocument();
      expect(screen.getByText('투자 분석')).toBeInTheDocument();
    });

    it('shows common menu items for both roles', () => {
      render(<Sidebar {...defaultProps} userRole="CREATOR" />);

      expect(screen.getByText('대시보드')).toBeInTheDocument();
      expect(screen.getByText('메시지함')).toBeInTheDocument();
      expect(screen.getByText('설정')).toBeInTheDocument();
    });
  });

  describe('Keyboard Events', () => {
    it('closes mobile sidebar when ESC key is pressed', async () => {
      const mockToggle = jest.fn();
      render(<Sidebar {...defaultProps} isMobileOpen={true} onMobileToggle={mockToggle} />);

      await user.keyboard('{Escape}');

      expect(mockToggle).toHaveBeenCalledWith(false);
    });

    it('does not close sidebar on ESC when mobile sidebar is closed', async () => {
      const mockToggle = jest.fn();
      render(<Sidebar {...defaultProps} isMobileOpen={false} onMobileToggle={mockToggle} />);

      await user.keyboard('{Escape}');

      expect(mockToggle).not.toHaveBeenCalled();
    });
  });

  describe('Menu Item Interactions', () => {
    it('calls onMobileToggle when menu item is clicked on mobile', async () => {
      const mockToggle = jest.fn();

      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(<Sidebar {...defaultProps} isMobileOpen={true} onMobileToggle={mockToggle} />);

      const menuItem = screen.getByText('대시보드');
      await user.click(menuItem);

      expect(mockToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Active State', () => {
    it('highlights active menu item based on pathname', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<Sidebar {...defaultProps} />);

      const dashboardItem = screen.getByText('대시보드').closest('div');
      expect(dashboardItem).toHaveClass('bg-primary-50', 'text-primary-700');
    });
  });
});