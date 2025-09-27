/**
 * CommentForm Component Tests
 * 댓글 작성 폼 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from '../CommentForm'
import type { User } from '../../../../entities/user'
import type { CommentWithAuthor } from '../../../../entities/comment'

// Mock server actions
jest.mock('../../actions', () => ({
  addComment: jest.fn(),
  editComment: jest.fn()
}))

const mockUser: User = {
  id: 'user1',
  username: 'testuser',
  avatar_url: null,
  role: 'VIEWER',
  bio: null,
  company: null,
  website: null,
  onboarding_completed: true,
  email_verified: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockEditingComment: CommentWithAuthor = {
  id: 'comment1',
  user_id: 'user1',
  video_id: 'video1',
  parent_id: null,
  content: '수정할 댓글',
  is_edited: false,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  author: {
    id: 'user1',
    username: 'testuser',
    avatar_url: null,
    role: 'VIEWER'
  },
  reply_count: 0
}

describe('CommentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('새 댓글 작성', () => {
    it('should render comment form correctly', () => {
      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      expect(screen.getByPlaceholderText('댓글을 작성하세요...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '댓글 작성' })).toBeInTheDocument()
    })

    it('should show character count', async () => {
      const user = userEvent.setup()

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const textarea = screen.getByPlaceholderText('댓글을 작성하세요...')
      await user.type(textarea, '안녕하세요')

      expect(screen.getByText('5/1000')).toBeInTheDocument()
    })

    it('should disable submit when content is empty', () => {
      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const submitButton = screen.getByRole('button', { name: '댓글 작성' })
      expect(submitButton).toBeDisabled()
    })

    it('should show error for content over limit', async () => {
      const user = userEvent.setup()

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const textarea = screen.getByPlaceholderText('댓글을 작성하세요...')
      const longContent = 'a'.repeat(1001)

      await user.type(textarea, longContent)

      expect(screen.getByText('1001/1000')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '댓글 작성' })).toBeDisabled()
    })
  })

  describe('답글 작성', () => {
    it('should show reply context', () => {
      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
          parentId="parent1"
          parentAuthor="parentuser"
        />
      )

      expect(screen.getByText('@parentuser님에게 답글')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('@parentuser님에게 답글을 작성하세요...')).toBeInTheDocument()
    })

    it('should show cancel button for reply', () => {
      const mockOnCancel = jest.fn()

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
          parentId="parent1"
          parentAuthor="parentuser"
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: '취소' })
      expect(cancelButton).toBeInTheDocument()

      fireEvent.click(cancelButton)
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('댓글 수정', () => {
    it('should show edit form with existing content', () => {
      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
          editingComment={mockEditingComment}
        />
      )

      const textarea = screen.getByDisplayValue('수정할 댓글')
      expect(textarea).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    })

    it('should show cancel button for editing', () => {
      const mockOnCancel = jest.fn()

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
          editingComment={mockEditingComment}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: '취소' })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('키보드 단축키', () => {
    it('should submit with Ctrl+Enter', async () => {
      const user = userEvent.setup()
      const mockAddComment = jest.requireMock('../../actions').addComment
      mockAddComment.mockResolvedValue({ success: true, comment: mockEditingComment })

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const textarea = screen.getByPlaceholderText('댓글을 작성하세요...')
      await user.type(textarea, '테스트 댓글')

      // Ctrl+Enter로 제출 테스트
      await user.keyboard('{Control>}{Enter}{/Control}')

      await waitFor(() => {
        expect(mockAddComment).toHaveBeenCalledWith('video1', '테스트 댓글', undefined)
      })
    })
  })

  describe('폼 제출', () => {
    it('should handle successful comment creation', async () => {
      const mockAddComment = jest.requireMock('../../actions').addComment
      const mockOnSuccess = jest.fn()

      mockAddComment.mockResolvedValue({ success: true, comment: mockEditingComment })

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
          onSuccess={mockOnSuccess}
        />
      )

      const textarea = screen.getByPlaceholderText('댓글을 작성하세요...')
      const submitButton = screen.getByRole('button', { name: '댓글 작성' })

      fireEvent.change(textarea, { target: { value: '새 댓글' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddComment).toHaveBeenCalledWith('video1', '새 댓글', undefined)
        expect(mockOnSuccess).toHaveBeenCalledWith(mockEditingComment)
      })
    })

    it('should handle comment creation error', async () => {
      const mockAddComment = jest.requireMock('../../actions').addComment
      mockAddComment.mockResolvedValue({ success: false, error: '댓글 작성에 실패했습니다.' })

      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const textarea = screen.getByPlaceholderText('댓글을 작성하세요...')
      const submitButton = screen.getByRole('button', { name: '댓글 작성' })

      fireEvent.change(textarea, { target: { value: '새 댓글' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('댓글 작성에 실패했습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('유효성 검사', () => {
    it('should show error for empty content submission', async () => {
      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const submitButton = screen.getByRole('button', { name: /댓글 작성/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('댓글 내용을 입력해주세요.')).toBeInTheDocument()
      })
    })

    it('should show error for whitespace-only content', async () => {
      render(
        <CommentForm
          videoId="video1"
          user={mockUser}
        />
      )

      const textarea = screen.getByPlaceholderText('댓글을 작성하세요...')
      fireEvent.change(textarea, { target: { value: '   ' } })

      const submitButton = screen.getByRole('button', { name: /댓글 작성/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('댓글 내용을 입력해주세요.')).toBeInTheDocument()
      })
    })
  })
})