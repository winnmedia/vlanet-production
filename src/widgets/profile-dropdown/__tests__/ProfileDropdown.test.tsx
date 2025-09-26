/**
 * ProfileDropdown 컴포넌트 테스트
 * 메뉴 렌더링, 외부 클릭 감지, 역할별 메뉴 항목 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileDropdown } from '../ProfileDropdown';

// signOut 액션 모킹
jest.mock('@/features/auth', () => ({
  signOut: jest.fn(),
}));

// Button 컴포넌트 모킹
jest.mock('@/shared/ui/button', () => ({
  Button: ({ children, onClick, type, ...props }: any) => (
    <button onClick={onClick} type={type} {...props}>
      {children}
    </button>
  ),
}));

// Card 컴포넌트 모킹
jest.mock('@/shared/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="dropdown-card">
      {children}
    </div>
  ),
}));

// 사용자 역할 상수 모킹
jest.mock('@/entities/user', () => ({
  ROLE_LABELS: {
    CREATOR: '창작자',
    FUNDER: '투자자',
  },
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  profile: {
    id: '1',
    username: 'testuser',
    role: 'CREATOR' as const,
    avatar_url: null,
  },
};

describe('ProfileDropdown', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders profile button with user info', () => {
      render(<ProfileDropdown user={mockUser} />);

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('창작자')).toBeInTheDocument();
    });

    it('displays user initial when no avatar', () => {
      render(<ProfileDropdown user={mockUser} />);

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of testuser
    });

    it('shows avatar image when avatar_url is provided', () => {
      const userWithAvatar = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          avatar_url: 'https://example.com/avatar.jpg',
        },
      };

      render(<ProfileDropdown user={userWithAvatar} />);

      const avatarImage = screen.getByAltText('Profile');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Dropdown Behavior', () => {
    it('opens dropdown when profile button is clicked', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByTestId('dropdown-card')).toBeInTheDocument();
    });

    it('closes dropdown when profile button is clicked again', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');

      // Open dropdown
      await user.click(profileButton);
      expect(screen.getByTestId('dropdown-card')).toBeInTheDocument();

      // Close dropdown
      await user.click(profileButton);
      expect(screen.queryByTestId('dropdown-card')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <ProfileDropdown user={mockUser} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByTestId('dropdown-card')).toBeInTheDocument();

      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      fireEvent.mouseDown(outsideElement);

      await waitFor(() => {
        expect(screen.queryByTestId('dropdown-card')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when ESC key is pressed', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByTestId('dropdown-card')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('dropdown-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('Creator Role Menu Items', () => {
    beforeEach(() => {
      render(<ProfileDropdown user={mockUser} />);
    });

    it('shows creator-specific menu items', async () => {
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByText('대시보드')).toBeInTheDocument();
      expect(screen.getByText('영상 업로드')).toBeInTheDocument();
    });

    it('shows common menu items', async () => {
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByText('내 프로필')).toBeInTheDocument();
      expect(screen.getByText('설정')).toBeInTheDocument();
      expect(screen.getByText('도움말')).toBeInTheDocument();
      expect(screen.getByText('개인정보 보호')).toBeInTheDocument();
    });
  });

  describe('Funder Role Menu Items', () => {
    const funderUser = {
      ...mockUser,
      profile: {
        ...mockUser.profile,
        role: 'FUNDER' as const,
      },
    };

    it('shows funder-specific menu items', async () => {
      render(<ProfileDropdown user={funderUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByText('투자 포트폴리오')).toBeInTheDocument();
      expect(screen.getByText('투자 분석')).toBeInTheDocument();
    });

    it('displays correct role label for funder', () => {
      render(<ProfileDropdown user={funderUser} />);

      expect(screen.getByText('투자자')).toBeInTheDocument();
    });
  });

  describe('Menu Navigation', () => {
    it('navigates to correct URL when menu item is clicked', async () => {
      // Mock window.location.href
      const mockLocationHref = jest.fn();
      Object.defineProperty(window, 'location', {
        value: {
          href: mockLocationHref,
        },
        writable: true,
      });

      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      const profileMenuItem = screen.getByText('내 프로필');
      await user.click(profileMenuItem);

      expect(window.location.href).toBe('/profile');
    });
  });

  describe('Logout Functionality', () => {
    it('renders logout button', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByText('로그아웃')).toBeInTheDocument();
    });

    it('has correct form action for logout', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      const logoutButton = screen.getByText('로그아웃');
      const form = logoutButton.closest('form');

      expect(form).toBeInTheDocument();
      expect(logoutButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('User Info Display', () => {
    it('shows email in dropdown header', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows role badge in dropdown header', async () => {
      render(<ProfileDropdown user={mockUser} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      // Role appears in both button and dropdown
      const roleBadges = screen.getAllByText('창작자');
      expect(roleBadges.length).toBeGreaterThan(0);
    });

    it('handles user without username gracefully', async () => {
      const userWithoutUsername = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          username: null,
        },
      };

      render(<ProfileDropdown user={userWithoutUsername} />);

      const profileButton = screen.getByRole('button');
      await user.click(profileButton);

      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
  });
});