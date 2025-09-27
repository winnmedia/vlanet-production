/**
 * VideoCard Component Tests
 * 영상 카드 컴포넌트 테스트 스위트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoCard } from '../VideoCard';
import type { VideoWithDetails } from '../../../entities/video';
import { testAccessibility, ariaAttrs, keyboardNav } from '../../../shared/lib/accessibility/test-helpers';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock video utility functions
jest.mock('@/entities/video', () => ({
  formatDuration: jest.fn((duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }),
  formatFileSize: jest.fn((size) => `${Math.round(size / 1024 / 1024)}MB`),
  VIDEO_STATUS_LABELS: {
    uploaded: '업로드됨',
    processing: '처리중',
    published: '공개됨',
    failed: '실패',
    deleted: '삭제됨',
  },
  getVideoStatusColor: jest.fn((status) => {
    const colors = {
      uploaded: '#6B7280',
      processing: '#F59E0B',
      published: '#10B981',
      failed: '#EF4444',
      deleted: '#9CA3AF',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  }),
}));

// Mock video data
const mockVideo: VideoWithDetails = {
  id: 'video-1',
  title: '테스트 비디오 제목',
  description: '테스트 비디오 설명',
  status: 'published',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  duration: 120, // 2:00
  file_size: 50 * 1024 * 1024, // 50MB
  width: 1920,
  height: 1080,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1',
  creator: {
    id: 'user-1',
    username: 'testcreator',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'CREATOR',
  },
  stats: {
    view_count: 1500,
    like_count: 25,
    comment_count: 5,
    share_count: 3,
  },
  categories: [
    {
      id: 'cat-1',
      name: '엔터테인먼트',
      color: '#FF6B6B',
    },
    {
      id: 'cat-2',
      name: '교육',
      color: '#4ECDC4',
    },
    {
      id: 'cat-3',
      name: '기술',
      color: '#45B7D1',
    },
  ],
};

const mockUnpublishedVideo: VideoWithDetails = {
  ...mockVideo,
  id: 'video-2',
  status: 'processing',
  title: '처리중인 비디오',
};

const mockFailedVideo: VideoWithDetails = {
  ...mockVideo,
  id: 'video-3',
  status: 'failed',
  title: '실패한 비디오',
};

describe('VideoCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('should render published video card correctly', () => {
      render(<VideoCard video={mockVideo} />);

      expect(screen.getByText('테스트 비디오 제목')).toBeInTheDocument();
      expect(screen.getByText('testcreator')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument(); // view count
      expect(screen.getByText('25')).toBeInTheDocument(); // like count
      expect(screen.getByText('2:00')).toBeInTheDocument(); // duration
    });

    it('should render video thumbnail', () => {
      render(<VideoCard video={mockVideo} />);

      const thumbnail = screen.getByAltText('테스트 비디오 제목');
      expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
    });

    it('should show fallback thumbnail on image error', () => {
      render(<VideoCard video={mockVideo} />);

      const thumbnail = screen.getByAltText('테스트 비디오 제목');
      fireEvent.error(thumbnail);

      expect(screen.getByText('🎬')).toBeInTheDocument();
    });

    it('should use default thumbnail when none provided', () => {
      const videoWithoutThumbnail = { ...mockVideo, thumbnail_url: null };
      render(<VideoCard video={videoWithoutThumbnail} />);

      const thumbnail = screen.getByAltText('테스트 비디오 제목');
      expect(thumbnail).toHaveAttribute('src', '/default-video-thumbnail.png');
    });
  });

  describe('상태별 렌더링', () => {
    it('should render published video as clickable link', () => {
      render(<VideoCard video={mockVideo} />);

      const titleLink = screen.getByRole('link', { name: '테스트 비디오 제목' });
      expect(titleLink).toHaveAttribute('href', '/video/video-1');

      const thumbnailLink = screen.getByRole('link');
      expect(thumbnailLink).toHaveAttribute('href', '/video/video-1');
    });

    it('should render unpublished video without links', () => {
      render(<VideoCard video={mockUnpublishedVideo} />);

      expect(screen.getByText('처리중인 비디오')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();

      // Should show as heading instead of link
      const title = screen.getByRole('heading', { name: '처리중인 비디오' });
      expect(title).toBeInTheDocument();
    });

    it('should show status badge for unpublished videos when showStatus is true', () => {
      render(<VideoCard video={mockUnpublishedVideo} showStatus />);

      const statusBadge = screen.getByText('처리중');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveStyle({ backgroundColor: '#F59E0B' });
    });

    it('should not show status badge for published videos', () => {
      render(<VideoCard video={mockVideo} showStatus />);

      expect(screen.queryByText('공개됨')).not.toBeInTheDocument();
    });
  });

  describe('옵션별 표시 제어', () => {
    it('should hide creator when showCreator is false', () => {
      render(<VideoCard video={mockVideo} showCreator={false} />);

      expect(screen.queryByText('testcreator')).not.toBeInTheDocument();
    });

    it('should hide stats when showStats is false', () => {
      render(<VideoCard video={mockVideo} showStats={false} />);

      expect(screen.queryByText('1,500')).not.toBeInTheDocument();
      expect(screen.queryByText('25')).not.toBeInTheDocument();
    });

    it('should show file information when showStatus is true', () => {
      render(<VideoCard video={mockVideo} showStatus />);

      expect(screen.getByText('크기: 50MB')).toBeInTheDocument();
      expect(screen.getByText('해상도: 1920 × 1080')).toBeInTheDocument();
    });
  });

  describe('Creator 정보 표시', () => {
    it('should display creator avatar when available', () => {
      render(<VideoCard video={mockVideo} />);

      const avatar = screen.getByAltText('testcreator');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should show creator initial when avatar is not available', () => {
      const videoWithoutAvatar = {
        ...mockVideo,
        creator: { ...mockVideo.creator!, avatar_url: null },
      };

      render(<VideoCard video={videoWithoutAvatar} />);

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of 'testcreator'
    });

    it('should handle missing creator gracefully', () => {
      const videoWithoutCreator = { ...mockVideo, creator: null };
      render(<VideoCard video={videoWithoutCreator} />);

      expect(screen.queryByText('testcreator')).not.toBeInTheDocument();
    });
  });

  describe('카테고리 표시', () => {
    it('should show first two categories with colors', () => {
      render(<VideoCard video={mockVideo} />);

      const category1 = screen.getByText('엔터테인먼트');
      const category2 = screen.getByText('교육');

      expect(category1).toBeInTheDocument();
      expect(category2).toBeInTheDocument();
      expect(category1).toHaveStyle({ color: '#FF6B6B' });
      expect(category2).toHaveStyle({ color: '#4ECDC4' });
    });

    it('should show additional category count when more than 2 categories', () => {
      render(<VideoCard video={mockVideo} />);

      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should handle videos without categories', () => {
      const videoWithoutCategories = { ...mockVideo, categories: [] };
      render(<VideoCard video={videoWithoutCategories} />);

      expect(screen.queryByText('엔터테인먼트')).not.toBeInTheDocument();
    });
  });

  describe('통계 정보 표시', () => {
    it('should format numbers with locale string', () => {
      const videoWithLargeStats = {
        ...mockVideo,
        stats: {
          ...mockVideo.stats!,
          view_count: 1234567,
          like_count: 12345,
        },
      };

      render(<VideoCard video={videoWithLargeStats} />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('12,345')).toBeInTheDocument();
    });

    it('should display creation date in Korean format', () => {
      render(<VideoCard video={mockVideo} />);

      expect(screen.getByText('2024. 1. 1.')).toBeInTheDocument();
    });

    it('should handle missing stats gracefully', () => {
      const videoWithoutStats = { ...mockVideo, stats: null };
      render(<VideoCard video={videoWithoutStats} />);

      expect(screen.queryByText('👁️')).not.toBeInTheDocument();
      expect(screen.queryByText('❤️')).not.toBeInTheDocument();
    });
  });

  describe('액션 메뉴', () => {
    it('should show menu button when edit or delete handlers are provided', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');

      // Hover to show menu button
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button', { name: /⋯/ });
      await user.click(menuButton);

      expect(screen.getByText('편집')).toBeInTheDocument();
      expect(screen.getByText('삭제')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button', { name: /⋯/ });
      await user.click(menuButton);

      const editButton = screen.getByText('편집');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('video-1');
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button', { name: /⋯/ });
      await user.click(menuButton);

      const deleteButton = screen.getByText('삭제');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('video-1');
    });

    it('should show edit option only for failed and published videos', () => {
      const { rerender } = render(
        <VideoCard
          video={mockFailedVideo}
          onEdit={mockOnEdit}
        />
      );

      // Failed video should show edit
      expect(screen.getByRole('button', { name: /⋯/ })).toBeInTheDocument();

      // Processing video should not show edit
      rerender(
        <VideoCard
          video={mockUnpublishedVideo}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByRole('button', { name: /⋯/ })).not.toBeInTheDocument();
    });

    it('should close menu when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button', { name: /⋯/ });
      await user.click(menuButton);

      expect(screen.getByText('편집')).toBeInTheDocument();

      // Click outside overlay
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        await user.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByText('편집')).not.toBeInTheDocument();
      });
    });
  });

  describe('호버 효과', () => {
    it('should show play button overlay on hover for published videos', () => {
      render(<VideoCard video={mockVideo} />);

      const card = screen.getByText('테스트 비디오 제목').closest('.group');

      if (card) {
        fireEvent.mouseEnter(card);
      }

      expect(screen.getByText('▶️')).toBeInTheDocument();
    });

    it('should not show play button for unpublished videos', () => {
      render(<VideoCard video={mockUnpublishedVideo} />);

      const card = screen.getByText('처리중인 비디오').closest('.group');

      if (card) {
        fireEvent.mouseEnter(card);
      }

      expect(screen.queryByText('▶️')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<VideoCard video={mockUnpublishedVideo} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('처리중인 비디오');
    });

    it('should have descriptive alt text for images', () => {
      render(<VideoCard video={mockVideo} />);

      const thumbnail = screen.getByAltText('테스트 비디오 제목');
      expect(thumbnail).toBeInTheDocument();

      const avatar = screen.getByAltText('testcreator');
      expect(avatar).toBeInTheDocument();
    });

    it('should provide semantic time element', () => {
      render(<VideoCard video={mockVideo} />);

      const timeElement = screen.getByText('2024. 1. 1.').closest('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should pass accessibility audit for published video', async () => {
      const { container } = render(<VideoCard video={mockVideo} />);
      await testAccessibility(container);
    });

    it('should pass accessibility audit for unpublished video', async () => {
      const { container } = render(<VideoCard video={mockUnpublishedVideo} showStatus />);
      await testAccessibility(container);
    });

    it('should pass accessibility audit for video with actions', async () => {
      const { container } = render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      await testAccessibility(container);
    });

    it('should have proper ARIA attributes for video links', () => {
      render(<VideoCard video={mockVideo} />);

      const titleLink = screen.getByRole('link', { name: '테스트 비디오 제목' });
      const thumbnailLink = screen.getAllByRole('link')[0]; // First link is thumbnail

      ariaAttrs.expectAccessibleName(titleLink, '테스트 비디오 제목');
      expect(thumbnailLink).toHaveAttribute('href', '/video/video-1');
    });

    it('should have proper ARIA attributes for status badge', () => {
      render(<VideoCard video={mockUnpublishedVideo} showStatus />);

      const statusBadge = screen.getByText('처리중');
      expect(statusBadge).toHaveAttribute('aria-label');

      const ariaLabel = statusBadge.getAttribute('aria-label');
      expect(ariaLabel).toContain('상태');
    });

    it('should provide accessible action menu', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button', { name: /메뉴/ });
      ariaAttrs.expectAriaAttributes(menuButton, {
        'aria-expanded': 'false',
        'aria-haspopup': 'true',
      });

      await user.click(menuButton);

      const editOption = screen.getByRole('menuitem', { name: '편집' });
      const deleteOption = screen.getByRole('menuitem', { name: '삭제' });

      expect(editOption).toBeInTheDocument();
      expect(deleteOption).toBeInTheDocument();
    });

    it('should support keyboard navigation for video links', async () => {
      const user = userEvent.setup();

      render(<VideoCard video={mockVideo} />);

      const titleLink = screen.getByRole('link', { name: '테스트 비디오 제목' });

      await user.tab();
      expect(titleLink).toHaveFocus();

      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      // Link activation would navigate (mocked in test environment)
    });

    it('should support keyboard navigation for action menu', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button');
      menuButton.focus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Navigate menu with arrow keys
      await user.keyboard('{ArrowDown}');
      const editOption = screen.getByRole('menuitem', { name: '편집' });
      expect(editOption).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      const deleteOption = screen.getByRole('menuitem', { name: '삭제' });
      expect(deleteOption).toHaveFocus();
    });

    it('should announce video metadata to screen readers', () => {
      render(<VideoCard video={mockVideo} showStats />);

      // Check that metadata is properly structured for screen readers
      const stats = screen.getByText('1,500').parentElement;
      expect(stats).toHaveAttribute('aria-label');

      const duration = screen.getByText('2:00');
      expect(duration).toHaveAttribute('aria-label', '재생 시간 2분');
    });

    it('should hide decorative elements from screen readers', () => {
      render(<VideoCard video={mockVideo} />);

      // Icons should be decorative and hidden from screen readers
      const playIcon = screen.queryByText('▶️');
      const viewIcon = screen.queryByText('👁️');

      if (playIcon) {
        expect(playIcon).toHaveAttribute('aria-hidden', 'true');
      }

      if (viewIcon) {
        expect(viewIcon.parentElement).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('should provide context for categories', () => {
      render(<VideoCard video={mockVideo} />);

      const categoryContainer = screen.getByText('엔터테인먼트').closest('div');
      expect(categoryContainer).toHaveAttribute('aria-label', '카테고리');

      // Additional category count should be descriptive
      const additionalCount = screen.getByText('+1');
      expect(additionalCount).toHaveAttribute('aria-label', '추가 카테고리 1개');
    });

    it('should provide proper labels for creator information', () => {
      render(<VideoCard video={mockVideo} />);

      const creatorSection = screen.getByText('testcreator').closest('div');
      expect(creatorSection).toHaveAttribute('aria-label');

      const ariaLabel = creatorSection!.getAttribute('aria-label');
      expect(ariaLabel).toContain('제작자');
    });

    it('should handle focus management in dropdown menu', async () => {
      const user = userEvent.setup();

      render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByText('테스트 비디오 제목').closest('.group');
      if (card) {
        fireEvent.mouseEnter(card);
      }

      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      // Focus should be on first menu item
      const firstItem = screen.getByRole('menuitem', { name: '편집' });
      expect(firstItem).toHaveFocus();

      // Escape should close menu and return focus to trigger
      await user.keyboard('{Escape}');
      expect(menuButton).toHaveFocus();
    });

    it('should provide meaningful error states for failed videos', () => {
      render(<VideoCard video={mockFailedVideo} showStatus />);

      const statusBadge = screen.getByText('실패');
      expect(statusBadge).toHaveAttribute('aria-describedby');

      // Should have additional context for failed state
      const failureContext = document.getElementById(statusBadge.getAttribute('aria-describedby')!);
      expect(failureContext).toHaveTextContent(/처리.*실패/);
    });

    it('should maintain semantic structure with proper landmarks', async () => {
      const { container } = render(
        <VideoCard
          video={mockVideo}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Should have proper article structure
      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();

      // Header should contain title and metadata
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();

      await testAccessibility(container);
    });

    it('should provide clear loading states', () => {
      const loadingVideo = { ...mockUnpublishedVideo, status: 'processing' as const };
      render(<VideoCard video={loadingVideo} showStatus />);

      const statusElement = screen.getByText('처리중');
      expect(statusElement).toHaveAttribute('role', 'status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('커스텀 스타일링', () => {
    it('should apply custom className', () => {
      render(<VideoCard video={mockVideo} className="custom-video-card" />);

      const card = screen.getByText('테스트 비디오 제목').closest('[class*="custom-video-card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing duration', () => {
      const videoWithoutDuration = { ...mockVideo, duration: null };
      render(<VideoCard video={videoWithoutDuration} />);

      expect(screen.queryByText('2:00')).not.toBeInTheDocument();
    });

    it('should handle missing file size', () => {
      render(<VideoCard video={mockVideo} showStatus />);

      const videoWithoutFileSize = { ...mockVideo, file_size: null };
      const { rerender } = render(<VideoCard video={videoWithoutFileSize} showStatus />);

      rerender(<VideoCard video={videoWithoutFileSize} showStatus />);
      expect(screen.queryByText(/크기:/)).not.toBeInTheDocument();
    });

    it('should handle missing dimensions', () => {
      const videoWithoutDimensions = { ...mockVideo, width: null, height: null };
      render(<VideoCard video={videoWithoutDimensions} showStatus />);

      expect(screen.queryByText(/해상도:/)).not.toBeInTheDocument();
    });
  });
});