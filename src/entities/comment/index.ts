/**
 * Comment Entity Public API
 * 댓글 엔티티 공개 인터페이스
 */

// Types
export type {
  Comment,
  CommentWithAuthor,
  CreateCommentData,
  UpdateCommentData,
  CommentListOptions,
  CommentsResponse,
  CommentActionResult,
  DeleteCommentResult,
  CommentStats
} from './types'

// API Functions (server-side only)
// Note: API functions are not exported here to avoid server-side imports in client components
// Import directly from './api' when needed in server components

// Utilities
export {
  formatTimeAgo,
  isValidComment,
  sanitizeCommentContent,
  canEditComment,
  canDeleteComment,
  buildCommentTree,
  truncateComment,
  extractMentions,
  extractHashtags,
  calculateCommentStats,
  commentSorters,
  commentFilters
} from './utils'