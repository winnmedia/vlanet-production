/**
 * FeedbackFeed 컴포넌트 테스트
 * 댓글/제안 표시, 로딩 상태, 빈 상태 테스트
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackFeed } from '../FeedbackFeed';
import type { Comment, Proposal } from '@/entities/comment';

// Card 컴포넌트 모킹
jest.mock('@/shared/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="feedback-card">
      {children}
    </div>
  ),
}));

// Button 컴포넌트 모킹
jest.mock('@/shared/ui/button', () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

const mockComments: Comment[] = [
  {
    id: '1',
    content: '정말 인상적인 영상이네요!',
    author: {
      id: '1',
      username: 'user1',
      avatar_url: null,
    },
    video: {
      id: '1',
      title: 'AI 생성 판타지 풍경',
      thumbnail_url: null,
    },
    created_at: '2024-01-01T10:00:00Z',
    rating: 5,
  },
  {
    id: '2',
    content: '기술적으로 놀라운 작품입니다.',
    author: {
      id: '2',
      username: 'user2',
      avatar_url: 'https://example.com/avatar2.jpg',
    },
    video: {
      id: '2',
      title: 'Future City Visualization',
      thumbnail_url: 'https://example.com/thumb2.jpg',
    },
    created_at: '2024-01-01T09:00:00Z',
    rating: 4,
  },
];

const mockProposals: Proposal[] = [
  {
    id: '1',
    message: '이 프로젝트에 투자하고 싶습니다.',
    amount: 50000,
    funder: {
      id: '1',
      username: 'investor1',
      avatar_url: null,
    },
    video: {
      id: '1',
      title: 'AI 생성 판타지 풍경',
      thumbnail_url: null,
    },
    created_at: '2024-01-01T11:00:00Z',
    status: 'pending',
  },
  {
    id: '2',
    message: '콜라보레이션 제안드립니다.',
    amount: 100000,
    funder: {
      id: '2',
      username: 'investor2',
      avatar_url: 'https://example.com/investor2.jpg',
    },
    video: {
      id: '2',
      title: 'Future City Visualization',
      thumbnail_url: 'https://example.com/thumb2.jpg',
    },
    created_at: '2024-01-01T10:30:00Z',
    status: 'pending',
  },
];

describe('FeedbackFeed', () => {
  const user = userEvent.setup();

  describe('Basic Rendering', () => {
    it('renders feedback feed with title', () => {
      render(<FeedbackFeed comments={[]} proposals={[]} />);

      expect(screen.getByText('피드백 피드')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<FeedbackFeed comments={[]} proposals={[]} className="custom-class" />);

      const feedbackCard = screen.getByTestId('feedback-card');
      expect(feedbackCard).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<FeedbackFeed comments={[]} proposals={[]} loading={true} />);

      // 스켈레톤 요소들 확인
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not show actual content when loading', () => {
      render(
        <FeedbackFeed
          comments={mockComments}
          proposals={mockProposals}
          loading={true}
        />
      );

      expect(screen.queryByText('정말 인상적인 영상이네요!')).not.toBeInTheDocument();
      expect(screen.queryByText('이 프로젝트에 투자하고 싶습니다.')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no comments and proposals', () => {
      render(<FeedbackFeed comments={[]} proposals={[]} />);

      expect(screen.getByText('아직 피드백이 없습니다')).toBeInTheDocument();
      expect(screen.getByText('첫 번째 댓글이나 제안을 받아보세요!')).toBeInTheDocument();
    });

    it('does not show empty state when there are comments', () => {
      render(<FeedbackFeed comments={mockComments} proposals={[]} />);

      expect(screen.queryByText('아직 피드백이 없습니다')).not.toBeInTheDocument();
    });

    it('does not show empty state when there are proposals', () => {
      render(<FeedbackFeed comments={[]} proposals={mockProposals} />);

      expect(screen.queryByText('아직 피드백이 없습니다')).not.toBeInTheDocument();
    });
  });

  describe('Comments Section', () => {
    it('renders recent comments section when comments exist', () => {
      render(<FeedbackFeed comments={mockComments} proposals={[]} />);

      expect(screen.getByText('최근 댓글')).toBeInTheDocument();
    });

    it('displays comment content and author', () => {
      render(<FeedbackFeed comments={mockComments} proposals={[]} />);

      expect(screen.getByText('정말 인상적인 영상이네요!')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('기술적으로 놀라운 작품입니다.')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });

    it('displays video title for each comment', () => {
      render(<FeedbackFeed comments={mockComments} proposals={[]} />);

      expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      expect(screen.getByText('Future City Visualization')).toBeInTheDocument();
    });

    it('shows star ratings for comments', () => {
      render(<FeedbackFeed comments={mockComments} proposals={[]} />);

      // 5점과 4점 평점이 표시되는지 확인
      const starIcons = screen.getAllByTestId(/star-icon/i);
      expect(starIcons.length).toBeGreaterThan(0);
    });

    it('displays relative time for comments', () => {
      render(<FeedbackFeed comments={mockComments} proposals={[]} />);

      expect(screen.getByText(/전/)).toBeInTheDocument(); // "~시간 전" 형태
    });

    it('limits comments to 10 items', () => {
      const manyComments = Array.from({ length: 15 }, (_, i) => ({
        ...mockComments[0],
        id: `comment-${i}`,
        content: `Comment ${i}`,
      }));

      render(<FeedbackFeed comments={manyComments} proposals={[]} />);

      // 최대 10개까지만 표시
      const commentItems = screen.getAllByTestId(/comment-item/i);
      expect(commentItems.length).toBe(10);
    });
  });

  describe('Proposals Section', () => {
    it('renders funding proposals section when proposals exist', () => {
      render(<FeedbackFeed comments={[]} proposals={mockProposals} />);

      expect(screen.getByText('펀딩 제안')).toBeInTheDocument();
    });

    it('displays proposal message and funder info', () => {
      render(<FeedbackFeed comments={[]} proposals={mockProposals} />);

      expect(screen.getByText('이 프로젝트에 투자하고 싶습니다.')).toBeInTheDocument();
      expect(screen.getByText('investor1')).toBeInTheDocument();
      expect(screen.getByText('콜라보레이션 제안드립니다.')).toBeInTheDocument();
      expect(screen.getByText('investor2')).toBeInTheDocument();
    });

    it('displays proposal amounts in formatted currency', () => {
      render(<FeedbackFeed comments={[]} proposals={mockProposals} />);

      expect(screen.getByText('₩50,000')).toBeInTheDocument();
      expect(screen.getByText('₩100,000')).toBeInTheDocument();
    });

    it('shows video titles for proposals', () => {
      render(<FeedbackFeed comments={[]} proposals={mockProposals} />);

      expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      expect(screen.getByText('Future City Visualization')).toBeInTheDocument();
    });

    it('displays proposal status', () => {
      render(<FeedbackFeed comments={[]} proposals={mockProposals} />);

      const pendingBadges = screen.getAllByText('대기중');
      expect(pendingBadges.length).toBe(2);
    });

    it('limits proposals to 3 items', () => {
      const manyProposals = Array.from({ length: 10 }, (_, i) => ({
        ...mockProposals[0],
        id: `proposal-${i}`,
        message: `Proposal ${i}`,
      }));

      render(<FeedbackFeed comments={[]} proposals={manyProposals} />);

      // 최대 3개까지만 표시
      const proposalItems = screen.getAllByTestId(/proposal-item/i);
      expect(proposalItems.length).toBe(3);
    });
  });

  describe('Avatar Display', () => {
    it('shows avatar image when avatar_url is provided', () => {
      render(<FeedbackFeed comments={mockComments} proposals={mockProposals} />);

      const avatarImages = screen.getAllByAltText(/avatar/i);
      expect(avatarImages.length).toBeGreaterThan(0);
    });

    it('shows initial when no avatar_url', () => {
      render(<FeedbackFeed comments={mockComments} proposals={mockProposals} />);

      expect(screen.getByText('U')).toBeInTheDocument(); // user1의 첫 글자
      expect(screen.getByText('I')).toBeInTheDocument(); // investor1의 첫 글자
    });
  });

  describe('Mixed Content', () => {
    it('shows both comments and proposals when both exist', () => {
      render(<FeedbackFeed comments={mockComments} proposals={mockProposals} />);

      expect(screen.getByText('최근 댓글')).toBeInTheDocument();
      expect(screen.getByText('펀딩 제안')).toBeInTheDocument();
      expect(screen.getByText('정말 인상적인 영상이네요!')).toBeInTheDocument();
      expect(screen.getByText('이 프로젝트에 투자하고 싶습니다.')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows view all button when there are more than 10 comments', () => {
      const manyComments = Array.from({ length: 15 }, (_, i) => ({
        ...mockComments[0],
        id: `comment-${i}`,
        content: `Comment ${i}`,
      }));

      render(<FeedbackFeed comments={manyComments} proposals={[]} />);

      expect(screen.getByText(/더 보기/)).toBeInTheDocument();
    });

    it('shows view all button when there are more than 3 proposals', () => {
      const manyProposals = Array.from({ length: 5 }, (_, i) => ({
        ...mockProposals[0],
        id: `proposal-${i}`,
        message: `Proposal ${i}`,
      }));

      render(<FeedbackFeed comments={[]} proposals={manyProposals} />);

      expect(screen.getByText(/더 보기/)).toBeInTheDocument();
    });
  });
});