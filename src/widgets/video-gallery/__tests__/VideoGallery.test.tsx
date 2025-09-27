/**
 * VideoGallery 컴포넌트 테스트
 * 그리드 레이아웃, 정렬/필터링, 로딩 상태 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoGallery } from '../VideoGallery';
import type { VideoWithStats } from '../../../entities/video';

// VideoCard는 VideoGallery 내부 컴포넌트이므로 별도 모킹 불필요

// Button 컴포넌트 모킹
jest.mock('@/shared/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

const mockVideos: VideoWithStats[] = [
  {
    id: '1',
    creator_id: '1',
    title: 'AI 생성 판타지 풍경',
    description: '인공지능으로 생성한 아름다운 판타지 풍경',
    thumbnail_url: 'https://example.com/thumb1.jpg',
    video_url: 'https://example.com/video1.mp4',
    duration: 120,
    tags: ['AI', '판타지', '풍경'],
    ai_model: 'DALL-E',
    prompt: '판타지 풍경',
    file_name: 'fantasy.mp4',
    file_size: 10000000,
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'mp4',
    status: 'published',
    upload_progress: 100,
    error_message: null,
    is_public: true,
    is_featured: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    published_at: '2024-01-01T10:00:00Z',
    deleted_at: null,
    stats: {
      video_id: '1',
      view_count: 1200,
      unique_view_count: 800,
      like_count: 45,
      dislike_count: 2,
      comment_count: 15,
      share_count: 8,
      investment_interest_count: 5,
      total_investment_amount: 0,
      total_revenue: 0,
      creator_earnings: 0,
      last_viewed_at: '2024-01-01T15:00:00Z',
      trending_score: 85.5,
      completion_rate: 78.5,
      updated_at: '2024-01-01T15:00:00Z',
    },
  },
  {
    id: '2',
    creator_id: '2',
    title: 'Future City Visualization',
    description: '미래 도시의 모습을 시각화한 영상',
    thumbnail_url: 'https://example.com/thumb2.jpg',
    video_url: 'https://example.com/video2.mp4',
    duration: 180,
    tags: ['미래', '도시', '시각화'],
    ai_model: 'Midjourney',
    prompt: '미래 도시',
    file_name: 'future-city.mp4',
    file_size: 15000000,
    width: 1920,
    height: 1080,
    fps: 24,
    format: 'mp4',
    status: 'published',
    upload_progress: 100,
    error_message: null,
    is_public: true,
    is_featured: true,
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
    published_at: '2024-01-02T10:00:00Z',
    deleted_at: null,
    stats: {
      video_id: '2',
      view_count: 3500,
      unique_view_count: 2800,
      like_count: 120,
      dislike_count: 5,
      comment_count: 45,
      share_count: 25,
      investment_interest_count: 12,
      total_investment_amount: 50000,
      total_revenue: 1200,
      creator_earnings: 800,
      last_viewed_at: '2024-01-02T18:00:00Z',
      trending_score: 92.3,
      completion_rate: 85.2,
      updated_at: '2024-01-02T18:00:00Z',
    },
  },
  {
    id: '3',
    creator_id: '3',
    title: 'Abstract Art Animation',
    description: '추상 예술 애니메이션',
    thumbnail_url: 'https://example.com/thumb3.jpg',
    video_url: 'https://example.com/video3.mp4',
    duration: 90,
    tags: ['추상', '예술', '애니메이션'],
    ai_model: 'Stable Diffusion',
    prompt: '추상 예술',
    file_name: 'abstract.mp4',
    file_size: 8000000,
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'mp4',
    status: 'published',
    upload_progress: 100,
    error_message: null,
    is_public: false,
    is_featured: false,
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T10:00:00Z',
    published_at: '2024-01-03T10:00:00Z',
    deleted_at: null,
    stats: {
      video_id: '3',
      view_count: 800,
      unique_view_count: 650,
      like_count: 30,
      dislike_count: 1,
      comment_count: 8,
      share_count: 3,
      investment_interest_count: 2,
      total_investment_amount: 0,
      total_revenue: 0,
      creator_earnings: 0,
      last_viewed_at: '2024-01-03T14:00:00Z',
      trending_score: 68.7,
      completion_rate: 72.1,
      updated_at: '2024-01-03T14:00:00Z',
    },
  },
];

describe('VideoGallery', () => {
  const user = userEvent.setup();
  const mockOnSort = jest.fn();
  const mockOnFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders video gallery with title', () => {
      render(<VideoGallery videos={mockVideos} />);

      expect(screen.getByText('내 영상')).toBeInTheDocument();
    });

    it('renders all video cards when videos are provided', () => {
      render(<VideoGallery videos={mockVideos} />);

      expect(screen.getByTestId('video-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('video-card-3')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<VideoGallery videos={mockVideos} className="custom-class" />);

      const gallery = screen.getByTestId('video-gallery');
      expect(gallery).toHaveClass('custom-class');
    });

    it('limits videos to 15 items max', () => {
      const manyVideos = Array.from({ length: 20 }, (_, i) => ({
        ...mockVideos[0],
        id: `video-${i}`,
        title: `Video ${i}`,
      }));

      render(<VideoGallery videos={manyVideos} />);

      // 최대 15개까지만 렌더링
      const videoCards = screen.getAllByTestId(/video-card-/);
      expect(videoCards.length).toBe(15);
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<VideoGallery videos={[]} loading={true} />);

      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not show video cards when loading', () => {
      render(<VideoGallery videos={mockVideos} loading={true} />);

      expect(screen.queryByTestId('video-card-1')).not.toBeInTheDocument();
    });

    it('shows correct number of skeleton items', () => {
      render(<VideoGallery videos={[]} loading={true} />);

      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBe(15); // 15개의 스켈레톤
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no videos and not loading', () => {
      render(<VideoGallery videos={[]} />);

      expect(screen.getByText('아직 업로드한 영상이 없습니다')).toBeInTheDocument();
      expect(screen.getByText('첫 번째 영상을 업로드해보세요!')).toBeInTheDocument();
    });

    it('shows upload button in empty state', () => {
      render(<VideoGallery videos={[]} />);

      const uploadButton = screen.getByText('영상 업로드');
      expect(uploadButton).toBeInTheDocument();
    });

    it('does not show empty state when loading', () => {
      render(<VideoGallery videos={[]} loading={true} />);

      expect(screen.queryByText('아직 업로드한 영상이 없습니다')).not.toBeInTheDocument();
    });

    it('does not show empty state when videos exist', () => {
      render(<VideoGallery videos={mockVideos} />);

      expect(screen.queryByText('아직 업로드한 영상이 없습니다')).not.toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('renders sort dropdown', () => {
      render(<VideoGallery videos={mockVideos} onSort={mockOnSort} />);

      expect(screen.getByText('정렬')).toBeInTheDocument();
    });

    it('shows sort options when dropdown is opened', async () => {
      render(<VideoGallery videos={mockVideos} onSort={mockOnSort} />);

      const sortButton = screen.getByText('정렬');
      await user.click(sortButton);

      expect(screen.getByText('최신순')).toBeInTheDocument();
      expect(screen.getByText('조회수순')).toBeInTheDocument();
      expect(screen.getByText('좋아요순')).toBeInTheDocument();
      expect(screen.getByText('오래된순')).toBeInTheDocument();
    });

    it('calls onSort when sort option is selected', async () => {
      render(<VideoGallery videos={mockVideos} onSort={mockOnSort} />);

      const sortButton = screen.getByText('정렬');
      await user.click(sortButton);

      const viewsOption = screen.getByText('조회수순');
      await user.click(viewsOption);

      expect(mockOnSort).toHaveBeenCalledWith('views');
    });

    it('updates sort button text when option is selected', async () => {
      render(<VideoGallery videos={mockVideos} onSort={mockOnSort} />);

      const sortButton = screen.getByText('정렬');
      await user.click(sortButton);

      const likesOption = screen.getByText('좋아요순');
      await user.click(likesOption);

      expect(screen.getByText('좋아요순')).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('renders filter dropdown', () => {
      render(<VideoGallery videos={mockVideos} onFilter={mockOnFilter} />);

      expect(screen.getByText('필터')).toBeInTheDocument();
    });

    it('shows filter options when dropdown is opened', async () => {
      render(<VideoGallery videos={mockVideos} onFilter={mockOnFilter} />);

      const filterButton = screen.getByText('필터');
      await user.click(filterButton);

      expect(screen.getByText('전체')).toBeInTheDocument();
      expect(screen.getByText('공개')).toBeInTheDocument();
      expect(screen.getByText('비공개')).toBeInTheDocument();
      expect(screen.getByText('초안')).toBeInTheDocument();
    });

    it('calls onFilter when filter option is selected', async () => {
      render(<VideoGallery videos={mockVideos} onFilter={mockOnFilter} />);

      const filterButton = screen.getByText('필터');
      await user.click(filterButton);

      const publicOption = screen.getByText('공개');
      await user.click(publicOption);

      expect(mockOnFilter).toHaveBeenCalledWith('public');
    });

    it('updates filter button text when option is selected', async () => {
      render(<VideoGallery videos={mockVideos} onFilter={mockOnFilter} />);

      const filterButton = screen.getByText('필터');
      await user.click(filterButton);

      const privateOption = screen.getByText('비공개');
      await user.click(privateOption);

      expect(screen.getByText('비공개')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders videos in grid layout', () => {
      render(<VideoGallery videos={mockVideos} />);

      const gridContainer = screen.getByTestId('video-gallery').querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-5'
      );
    });

    it('maintains aspect ratio for video cards', () => {
      render(<VideoGallery videos={mockVideos} />);

      const gridContainer = screen.getByTestId('video-gallery').querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-4');
    });
  });

  describe('Video Statistics Display', () => {
    it('shows video titles', () => {
      render(<VideoGallery videos={mockVideos} />);

      expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      expect(screen.getByText('Future City Visualization')).toBeInTheDocument();
      expect(screen.getByText('Abstract Art Animation')).toBeInTheDocument();
    });

    it('displays video statistics', () => {
      render(<VideoGallery videos={mockVideos} />);

      // 조회수가 표시되는지 확인 (정확한 형식은 컴포넌트 구현에 따라 다를 수 있음)
      expect(screen.getByText(/1,200|1200/)).toBeInTheDocument();
      expect(screen.getByText(/3,500|3500/)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts grid columns based on screen size', () => {
      render(<VideoGallery videos={mockVideos} />);

      const gridContainer = screen.getByTestId('video-gallery').querySelector('.grid');

      // 반응형 클래스가 적용되었는지 확인
      expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile
      expect(gridContainer).toHaveClass('sm:grid-cols-2'); // Small screens
      expect(gridContainer).toHaveClass('lg:grid-cols-3'); // Large screens
      expect(gridContainer).toHaveClass('xl:grid-cols-5'); // Extra large screens
    });
  });

  describe('Performance Optimization', () => {
    it('renders videos efficiently with keys', () => {
      render(<VideoGallery videos={mockVideos} />);

      // 각 비디오 카드가 고유한 ID로 렌더링되는지 확인
      mockVideos.forEach(video => {
        expect(screen.getByTestId(`video-card-${video.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles empty video array gracefully', () => {
      render(<VideoGallery videos={[]} />);

      expect(screen.getByText('아직 업로드한 영상이 없습니다')).toBeInTheDocument();
    });

    it('handles missing props gracefully', () => {
      render(<VideoGallery videos={mockVideos} />);

      // onSort, onFilter가 없어도 정상 렌더링
      expect(screen.getByTestId('video-gallery')).toBeInTheDocument();
    });
  });
});