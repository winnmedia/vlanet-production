/**
 * SearchModal 컴포넌트 테스트
 * Cmd+K 단축키, 실시간 검색, 키보드 네비게이션 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchModal } from '../SearchModal';

// Card 컴포넌트 모킹
jest.mock('@/shared/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="search-modal">
      {children}
    </div>
  ),
}));

// Button 컴포넌트 모킹
jest.mock('@/shared/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Input 컴포넌트 모킹
jest.mock('@/shared/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

describe('SearchModal', () => {
  const user = userEvent.setup();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(<SearchModal isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/영상, 창작자, 태그 검색/)).toBeInTheDocument();
    });

    it('focuses input when modal opens', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      expect(input).toHaveFocus();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('dispatches openSearchModal event on Cmd+K', () => {
      const mockDispatchEvent = jest.fn();
      window.dispatchEvent = mockDispatchEvent;

      render(<SearchModal isOpen={false} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'k', metaKey: true });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'openSearchModal',
        })
      );
    });

    it('dispatches openSearchModal event on Ctrl+K', () => {
      const mockDispatchEvent = jest.fn();
      window.dispatchEvent = mockDispatchEvent;

      render(<SearchModal isOpen={false} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'openSearchModal',
        })
      );
    });

    it('closes modal on Escape key', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close modal on Escape when modal is closed', () => {
      render(<SearchModal isOpen={false} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('shows empty state when no query is entered', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('무엇을 찾고 계세요?')).toBeInTheDocument();
      expect(screen.getByText('영상 제목, 창작자명, 태그를 입력해보세요')).toBeInTheDocument();
    });

    it('updates input value when typing', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'test query');

      expect(input).toHaveValue('test query');
    });

    it('shows loading indicator while searching', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'AI');

      // 디바운스 시간 전에 로딩 확인
      expect(screen.getByTestId(/loader/i)).toBeInTheDocument();
    });

    it('shows no results message when search returns empty', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'nonexistent query');

      // 디바운스 시간 대기
      await waitFor(() => {
        expect(screen.getByText(/에 대한 결과가 없습니다/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('displays search results when query matches', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'AI');

      // 디바운스 시간 대기 후 결과 확인
      await waitFor(() => {
        expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Search Results', () => {
    beforeEach(async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'AI');

      // 결과가 로드될 때까지 대기
      await waitFor(() => {
        expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('shows different result types with correct icons', () => {
      expect(screen.getByText('영상')).toBeInTheDocument();
      expect(screen.getByText('창작자')).toBeInTheDocument();
      expect(screen.getByText('태그')).toBeInTheDocument();
    });

    it('displays result count', () => {
      expect(screen.getByText(/개 결과/)).toBeInTheDocument();
    });

    it('shows keyboard navigation hints', () => {
      expect(screen.getByText('↑↓ 이동')).toBeInTheDocument();
      expect(screen.getByText('Enter 선택')).toBeInTheDocument();
      expect(screen.getByText('Esc 닫기')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'AI');

      // 결과가 로드될 때까지 대기
      await waitFor(() => {
        expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('highlights first result by default', () => {
      const firstResult = screen.getByText('AI 생성 판타지 풍경').closest('button');
      expect(firstResult).toHaveClass('bg-primary-50', 'border-r-2', 'border-primary-500');
    });

    it('moves selection down with ArrowDown', () => {
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      const secondResult = screen.getByText('Future City Visualization').closest('button');
      expect(secondResult).toHaveClass('bg-primary-50', 'border-r-2', 'border-primary-500');
    });

    it('moves selection up with ArrowUp', () => {
      // Move down first
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      // Then move up
      fireEvent.keyDown(document, { key: 'ArrowUp' });

      const firstResult = screen.getByText('AI 생성 판타지 풍경').closest('button');
      expect(firstResult).toHaveClass('bg-primary-50', 'border-r-2', 'border-primary-500');
    });

    it('does not move selection beyond first item when pressing ArrowUp', () => {
      // Try to move up from first item
      fireEvent.keyDown(document, { key: 'ArrowUp' });

      const firstResult = screen.getByText('AI 생성 판타지 풍경').closest('button');
      expect(firstResult).toHaveClass('bg-primary-50', 'border-r-2', 'border-primary-500');
    });

    it('does not move selection beyond last item when pressing ArrowDown', () => {
      // Move to last item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      // Try to move down from last item
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      const lastResult = screen.getByText('#판타지').closest('button');
      expect(lastResult).toHaveClass('bg-primary-50', 'border-r-2', 'border-primary-500');
    });
  });

  describe('Result Selection', () => {
    beforeEach(async () => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: {
          href: '',
        },
        writable: true,
      });

      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/영상, 창작자, 태그 검색/);
      await user.type(input, 'AI');

      await waitFor(() => {
        expect(screen.getByText('AI 생성 판타지 풍경')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('navigates to result URL when clicked', async () => {
      const firstResult = screen.getByText('AI 생성 판타지 풍경');
      await user.click(firstResult);

      expect(window.location.href).toBe('/video/1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('navigates to selected result on Enter key', () => {
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(window.location.href).toBe('/video/1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('navigates to correct result after keyboard navigation', () => {
      // Move to second result
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      // Select it
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(window.location.href).toBe('/video/2');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Close Functionality', () => {
    it('closes modal when close button is clicked', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});