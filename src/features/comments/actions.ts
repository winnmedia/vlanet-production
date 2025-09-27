/**
 * Comment Feature Server Actions
 * 댓글 관련 서버 액션들
 */

'use server'

import { revalidatePath } from 'next/cache'
import {
  createComment as createCommentEntity,
  updateComment as updateCommentEntity,
  deleteComment as deleteCommentEntity,
} from '@/entities/comment/api';
import {
  type CreateCommentData,
  type UpdateCommentData,
  type CommentActionResult,
  type DeleteCommentResult,
  sanitizeCommentContent,
  isValidComment
} from '@/entities/comment'

/**
 * 댓글 작성 Server Action
 */
export async function addComment(
  videoId: string,
  content: string,
  parentId?: string
): Promise<CommentActionResult> {
  try {
    // 입력값 검증
    if (!content || !content.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' }
    }

    const sanitizedContent = sanitizeCommentContent(content)

    if (!isValidComment(sanitizedContent)) {
      return { success: false, error: '댓글은 1자 이상 1000자 이하로 작성해주세요.' }
    }

    // 댓글 생성 데이터
    const commentData: CreateCommentData = {
      video_id: videoId,
      content: sanitizedContent,
      parent_id: parentId || null
    }

    // 엔티티 레이어를 통해 댓글 생성
    const result = await createCommentEntity(commentData)

    // 성공 시 페이지 재검증
    if (result.success) {
      revalidatePath(`/video/${videoId}`)
      // 댓글 목록 페이지도 재검증 (필요한 경우)
      revalidatePath('/')
    }

    return result
  } catch (error) {
    console.error('댓글 작성 중 오류:', error)
    return { success: false, error: '댓글 작성 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 수정 Server Action
 */
export async function editComment(
  commentId: string,
  content: string,
  videoId: string
): Promise<CommentActionResult> {
  try {
    // 입력값 검증
    if (!content || !content.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' }
    }

    const sanitizedContent = sanitizeCommentContent(content)

    if (!isValidComment(sanitizedContent)) {
      return { success: false, error: '댓글은 1자 이상 1000자 이하로 작성해주세요.' }
    }

    // 댓글 수정 데이터
    const updateData: UpdateCommentData = {
      content: sanitizedContent
    }

    // 엔티티 레이어를 통해 댓글 수정
    const result = await updateCommentEntity(commentId, updateData)

    // 성공 시 페이지 재검증
    if (result.success) {
      revalidatePath(`/video/${videoId}`)
    }

    return result
  } catch (error) {
    console.error('댓글 수정 중 오류:', error)
    return { success: false, error: '댓글 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 삭제 Server Action
 */
export async function removeComment(
  commentId: string,
  videoId: string
): Promise<DeleteCommentResult> {
  try {
    // 엔티티 레이어를 통해 댓글 삭제
    const result = await deleteCommentEntity(commentId)

    // 성공 시 페이지 재검증
    if (result.success) {
      revalidatePath(`/video/${videoId}`)
    }

    return result
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error)
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 신고 Server Action (향후 확장용)
 */
export async function reportComment(
  commentId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: 실제 신고 로직 구현
    // 현재는 로그만 남김
    console.log(`Comment ${commentId} reported for: ${reason}`)

    return { success: true }
  } catch (error) {
    console.error('댓글 신고 중 오류:', error)
    return { success: false, error: '신고 처리 중 오류가 발생했습니다.' }
  }
}