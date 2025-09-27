/**
 * Comment Entity Types
 * 댓글 도메인 모델 타입 정의
 */

import type { User } from '../user'

/**
 * 기본 댓글 타입 (데이터베이스 스키마)
 */
export interface Comment {
  id: string
  user_id: string
  video_id: string
  parent_id: string | null
  content: string
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

/**
 * 작성자 정보가 포함된 댓글 타입
 */
export interface CommentWithAuthor extends Comment {
  author: {
    id: string
    username: string
    avatar_url: string | null
    role: 'CREATOR' | 'FUNDER' | 'VIEWER'
  }
  reply_count?: number
}

/**
 * 댓글 생성 요청 타입
 */
export interface CreateCommentData {
  video_id: string
  parent_id?: string | null
  content: string
}

/**
 * 댓글 수정 요청 타입
 */
export interface UpdateCommentData {
  content: string
}

/**
 * 댓글 목록 조회 옵션
 */
export interface CommentListOptions {
  video_id: string
  parent_id?: string | null
  limit?: number
  offset?: number
  sort?: 'newest' | 'oldest'
}

/**
 * 댓글 통계 타입
 */
export interface CommentStats {
  total_count: number
  reply_count: number
  recent_comments: CommentWithAuthor[]
}

/**
 * 댓글 목록 응답 타입
 */
export interface CommentsResponse {
  comments: CommentWithAuthor[]
  total_count: number
  has_more: boolean
}

/**
 * 댓글 액션 결과 타입
 */
export type CommentActionResult =
  | { success: true; comment: CommentWithAuthor }
  | { success: false; error: string }

/**
 * 댓글 삭제 결과 타입
 */
export type DeleteCommentResult =
  | { success: true }
  | { success: false; error: string }