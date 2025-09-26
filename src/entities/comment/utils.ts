/**
 * Comment Entity Utilities
 * 댓글 관련 유틸리티 함수들
 */

import type { CommentWithAuthor } from './types'

/**
 * 상대적 시간 포맷팅 (예: "방금 전", "5분 전", "2시간 전")
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}일 전`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}년 전`
}

/**
 * 댓글 내용 유효성 검사
 */
export function isValidComment(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.length >= 1 && trimmed.length <= 1000
}

/**
 * 댓글 내용 정제 (XSS 방지, 공백 정리)
 */
export function sanitizeCommentContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // 여러 공백을 하나로 통합
    .replace(/^\s+|\s+$/g, '') // 앞뒤 공백 제거
}

/**
 * 댓글 작성자 권한 체크
 */
export function canDeleteComment(comment: CommentWithAuthor, currentUserId?: string): boolean {
  if (!currentUserId) return false
  return comment.user_id === currentUserId
}

export function canEditComment(comment: CommentWithAuthor, currentUserId?: string): boolean {
  if (!currentUserId) return false
  if (comment.user_id !== currentUserId) return false

  // 24시간 이내만 수정 가능
  const now = new Date()
  const created = new Date(comment.created_at)
  const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

  return diffInHours <= 24
}

/**
 * 댓글 트리 구조 생성 (대댓글 처리)
 */
export function buildCommentTree(comments: CommentWithAuthor[]): CommentWithAuthor[] {
  const commentMap = new Map<string, CommentWithAuthor>()
  const rootComments: CommentWithAuthor[] = []

  // 1단계: 모든 댓글을 맵에 저장
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // 2단계: 트리 구조 생성
  comments.forEach(comment => {
    if (comment.parent_id) {
      // 대댓글인 경우 부모에 추가
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(commentMap.get(comment.id)!)
      }
    } else {
      // 최상위 댓글인 경우 루트에 추가
      rootComments.push(commentMap.get(comment.id)!)
    }
  })

  return rootComments
}

/**
 * 댓글 내용 요약 (긴 댓글의 미리보기용)
 */
export function truncateComment(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content
  }

  return content.substring(0, maxLength).trim() + '...'
}

/**
 * 댓글 내용에서 멘션 추출 (@username 형태)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)] // 중복 제거
}

/**
 * 댓글 내용에서 해시태그 추출 (#hashtag 형태)
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_가-힣]+)/g
  const hashtags: string[] = []
  let match

  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1])
  }

  return [...new Set(hashtags)] // 중복 제거
}

/**
 * 댓글 통계 계산
 */
export function calculateCommentStats(comments: CommentWithAuthor[]) {
  const totalComments = comments.length
  const topLevelComments = comments.filter(c => !c.parent_id).length
  const replies = totalComments - topLevelComments

  return {
    total: totalComments,
    topLevel: topLevelComments,
    replies: replies,
    averageRepliesPerComment: topLevelComments > 0 ? Math.round(replies / topLevelComments * 10) / 10 : 0
  }
}

/**
 * 댓글 정렬 함수들
 */
export const commentSorters = {
  // 최신순
  newest: (a: CommentWithAuthor, b: CommentWithAuthor) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),

  // 오래된순
  oldest: (a: CommentWithAuthor, b: CommentWithAuthor) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),

  // 대댓글 많은순
  mostReplies: (a: CommentWithAuthor, b: CommentWithAuthor) =>
    (b.reply_count || 0) - (a.reply_count || 0)
}

/**
 * 댓글 필터링 함수들
 */
export const commentFilters = {
  // 최상위 댓글만
  topLevel: (comment: CommentWithAuthor) => !comment.parent_id,

  // 대댓글만
  replies: (comment: CommentWithAuthor) => !!comment.parent_id,

  // 특정 작성자
  byAuthor: (authorId: string) => (comment: CommentWithAuthor) =>
    comment.user_id === authorId,

  // 특정 시간 이후
  afterDate: (date: Date) => (comment: CommentWithAuthor) =>
    new Date(comment.created_at) > date,

  // 수정된 댓글만
  edited: (comment: CommentWithAuthor) => comment.is_edited
}

// 확장된 CommentWithAuthor 타입 (replies 추가)
declare module './types' {
  interface CommentWithAuthor {
    replies?: CommentWithAuthor[]
  }
}