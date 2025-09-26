/**
 * Comments Feature Public API
 * 댓글 기능 공개 인터페이스
 */

// Server Actions
export { addComment, editComment, removeComment, reportComment } from './actions'

// Components
export { CommentForm } from './components/CommentForm'
export { CommentItem } from './components/CommentItem'

// Hooks
export { useComments } from './hooks/useComments'
export type { UseCommentsOptions, UseCommentsReturn } from './hooks/useComments'