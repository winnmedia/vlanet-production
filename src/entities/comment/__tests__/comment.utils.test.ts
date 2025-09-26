/**
 * Comment Utilities Unit Tests
 * entities 레이어 단위 테스트 - 댓글 도메인 로직 검증
 */

import {
  formatTimeAgo,
  isValidComment,
  sanitizeCommentContent,
  canEditComment,
  canDeleteComment,
  buildCommentTree,
  truncateComment,
  extractMentions,
  extractHashtags,
  calculateCommentStats
} from '../utils'
import type { CommentWithAuthor } from '../types'

describe('Comment Utilities', () => {
  describe('formatTimeAgo', () => {
    it('should format recent times correctly', () => {
      const now = new Date()

      // 방금 전
      const justNow = new Date(now.getTime() - 30 * 1000).toISOString()
      expect(formatTimeAgo(justNow)).toBe('방금 전')

      // 5분 전
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
      expect(formatTimeAgo(fiveMinutesAgo)).toBe('5분 전')

      // 2시간 전
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      expect(formatTimeAgo(twoHoursAgo)).toBe('2시간 전')

      // 3일 전
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      expect(formatTimeAgo(threeDaysAgo)).toBe('3일 전')
    })

    it('should handle edge cases', () => {
      const now = new Date()

      // 정확히 1분
      const oneMinute = new Date(now.getTime() - 60 * 1000).toISOString()
      expect(formatTimeAgo(oneMinute)).toBe('1분 전')

      // 정확히 1시간
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      expect(formatTimeAgo(oneHour)).toBe('1시간 전')
    })
  })

  describe('isValidComment', () => {
    it('should validate comment content correctly', () => {
      expect(isValidComment('안녕하세요')).toBe(true)
      expect(isValidComment('a')).toBe(true)
      expect(isValidComment('a'.repeat(1000))).toBe(true)

      expect(isValidComment('')).toBe(false)
      expect(isValidComment('   ')).toBe(false)
      expect(isValidComment('a'.repeat(1001))).toBe(false)
    })
  })

  describe('sanitizeCommentContent', () => {
    it('should clean up comment content', () => {
      expect(sanitizeCommentContent('  안녕하세요  ')).toBe('안녕하세요')
      expect(sanitizeCommentContent('안녕    하세요')).toBe('안녕 하세요')
      expect(sanitizeCommentContent('  \n  안녕\n하세요  \n  ')).toBe('안녕 하세요')
    })
  })

  describe('canEditComment', () => {
    const mockComment: CommentWithAuthor = {
      id: '1',
      user_id: 'user1',
      video_id: 'video1',
      parent_id: null,
      content: '테스트 댓글',
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: 'user1',
        username: 'testuser',
        avatar_url: null,
        role: 'VIEWER'
      },
      reply_count: 0
    }

    it('should allow editing own comment within 24 hours', () => {
      const recentComment = {
        ...mockComment,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1시간 전
      }

      expect(canEditComment(recentComment, 'user1')).toBe(true)
      expect(canEditComment(recentComment, 'user2')).toBe(false)
    })

    it('should not allow editing old comment after 24 hours', () => {
      const oldComment = {
        ...mockComment,
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25시간 전
      }

      expect(canEditComment(oldComment, 'user1')).toBe(false)
    })

    it('should not allow editing without user', () => {
      expect(canEditComment(mockComment, undefined)).toBe(false)
    })
  })

  describe('canDeleteComment', () => {
    const mockComment: CommentWithAuthor = {
      id: '1',
      user_id: 'user1',
      video_id: 'video1',
      parent_id: null,
      content: '테스트 댓글',
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: 'user1',
        username: 'testuser',
        avatar_url: null,
        role: 'VIEWER'
      },
      reply_count: 0
    }

    it('should allow deleting own comment', () => {
      expect(canDeleteComment(mockComment, 'user1')).toBe(true)
      expect(canDeleteComment(mockComment, 'user2')).toBe(false)
    })

    it('should not allow deleting without user', () => {
      expect(canDeleteComment(mockComment, undefined)).toBe(false)
    })
  })

  describe('buildCommentTree', () => {
    it('should build correct comment tree structure', () => {
      const comments: CommentWithAuthor[] = [
        {
          id: '1',
          user_id: 'user1',
          video_id: 'video1',
          parent_id: null,
          content: '최상위 댓글 1',
          is_edited: false,
          is_deleted: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          author: { id: 'user1', username: 'user1', avatar_url: null, role: 'VIEWER' },
          reply_count: 2
        },
        {
          id: '2',
          user_id: 'user2',
          video_id: 'video1',
          parent_id: '1',
          content: '답글 1',
          is_edited: false,
          is_deleted: false,
          created_at: '2024-01-01T00:01:00Z',
          updated_at: '2024-01-01T00:01:00Z',
          author: { id: 'user2', username: 'user2', avatar_url: null, role: 'VIEWER' },
          reply_count: 0
        },
        {
          id: '3',
          user_id: 'user3',
          video_id: 'video1',
          parent_id: '1',
          content: '답글 2',
          is_edited: false,
          is_deleted: false,
          created_at: '2024-01-01T00:02:00Z',
          updated_at: '2024-01-01T00:02:00Z',
          author: { id: 'user3', username: 'user3', avatar_url: null, role: 'VIEWER' },
          reply_count: 0
        }
      ]

      const tree = buildCommentTree(comments)

      expect(tree).toHaveLength(1)
      expect(tree[0].id).toBe('1')
      expect(tree[0].replies).toHaveLength(2)
      expect(tree[0].replies?.[0].id).toBe('2')
      expect(tree[0].replies?.[1].id).toBe('3')
    })
  })

  describe('truncateComment', () => {
    it('should truncate long comments correctly', () => {
      const longComment = 'a'.repeat(200)
      expect(truncateComment(longComment, 50)).toBe('a'.repeat(50) + '...')

      const shortComment = '짧은 댓글'
      expect(truncateComment(shortComment, 50)).toBe('짧은 댓글')
    })
  })

  describe('extractMentions', () => {
    it('should extract mentions from comment content', () => {
      const content = '안녕하세요 @john_doe님과 @jane_smith님!'
      expect(extractMentions(content)).toEqual(['john_doe', 'jane_smith'])

      expect(extractMentions('멘션 없음')).toEqual([])
      expect(extractMentions('@user1 @user1 중복')).toEqual(['user1'])
    })
  })

  describe('extractHashtags', () => {
    it('should extract hashtags from comment content', () => {
      const content = '좋은 영상이네요 #AI #기술 #혁신'
      expect(extractHashtags(content)).toEqual(['AI', '기술', '혁신'])

      expect(extractHashtags('해시태그 없음')).toEqual([])
      expect(extractHashtags('#태그1 #태그1 중복')).toEqual(['태그1'])
    })
  })

  describe('calculateCommentStats', () => {
    it('should calculate comment statistics correctly', () => {
      const comments: CommentWithAuthor[] = [
        {
          id: '1',
          parent_id: null,
          // ... 기타 필수 필드
        } as CommentWithAuthor,
        {
          id: '2',
          parent_id: '1',
          // ... 기타 필수 필드
        } as CommentWithAuthor,
        {
          id: '3',
          parent_id: '1',
          // ... 기타 필수 필드
        } as CommentWithAuthor
      ]

      const stats = calculateCommentStats(comments)

      expect(stats.total).toBe(3)
      expect(stats.topLevel).toBe(1)
      expect(stats.replies).toBe(2)
      expect(stats.averageRepliesPerComment).toBe(2)
    })
  })
})