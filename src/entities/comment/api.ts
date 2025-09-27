/**
 * Comment Entity API
 * 댓글 데이터베이스 접근 함수들
 */

import { createServerClient } from '../../shared/api/supabase/server'
import type {
  Comment,
  CommentWithAuthor,
  CreateCommentData,
  UpdateCommentData,
  CommentListOptions,
  CommentsResponse,
  CommentActionResult,
  DeleteCommentResult
} from './types'

/**
 * 영상별 댓글 목록 조회
 */
export async function getCommentsByVideoId(
  options: CommentListOptions
): Promise<CommentsResponse> {
  const supabase = await createServerClient()
  const {
    video_id,
    parent_id = null,
    limit = 10,
    offset = 0,
    sort = 'newest'
  } = options

  try {
    // 댓글과 작성자 정보를 함께 조회
    let query = supabase
      .from('comments')
      .select(`
        id,
        user_id,
        video_id,
        parent_id,
        content,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        author:profiles!user_id!inner (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .eq('video_id', video_id)
      .eq('is_deleted', false)

    // 최상위 댓글 or 특정 댓글의 대댓글 필터링
    if (parent_id === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', parent_id)
    }

    // 정렬 적용
    query = query.order('created_at', { ascending: sort === 'oldest' })

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1)

    const { data: comments, error, count } = await query

    if (error) {
      console.error('Error fetching comments:', error)
      throw error
    }

    // 각 댓글의 대댓글 수 계산 (최상위 댓글인 경우에만)
    let commentsWithReplyCounts: CommentWithAuthor[] = []

    if (parent_id === null && comments) {
      commentsWithReplyCounts = await Promise.all(
        comments.map(async (comment: any) => {
          const { count: replyCount } = await supabase
            .from('comments')
            .select('id', { count: 'exact' })
            .eq('parent_id', comment.id)
            .eq('is_deleted', false)

          return {
            ...comment,
            reply_count: replyCount || 0
          } as unknown as CommentWithAuthor
        })
      )
    } else {
      commentsWithReplyCounts = (comments || []) as unknown as CommentWithAuthor[]
    }

    // 전체 개수 조회 (페이지네이션 정보용)
    let totalCount = count || 0
    if (count === null) {
      const { count: exactCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('video_id', video_id)
        .eq('is_deleted', false)
        .is('parent_id', parent_id)

      totalCount = exactCount || 0
    }

    return {
      comments: commentsWithReplyCounts,
      total_count: totalCount,
      has_more: offset + limit < totalCount
    }
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return {
      comments: [],
      total_count: 0,
      has_more: false
    }
  }
}

/**
 * 댓글 ID로 단일 댓글 조회
 */
export async function getCommentById(commentId: string): Promise<CommentWithAuthor | null> {
  const supabase = await createServerClient()

  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        video_id,
        parent_id,
        content,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        author:profiles!user_id!inner (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    if (error) {
      console.error('Error fetching comment:', error)
      return null
    }

    // 대댓글 수 계산
    const { count: replyCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('parent_id', commentId)
      .eq('is_deleted', false)

    return {
      ...comment,
      reply_count: replyCount || 0
    } as unknown as CommentWithAuthor
  } catch (error) {
    console.error('Failed to fetch comment:', error)
    return null
  }
}

/**
 * 댓글 생성
 */
export async function createComment(data: CreateCommentData): Promise<CommentActionResult> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 댓글 생성
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        video_id: data.video_id,
        parent_id: data.parent_id || null,
        content: data.content.trim(),
      })
      .select(`
        id,
        user_id,
        video_id,
        parent_id,
        content,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        author:profiles!user_id!inner (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return { success: false, error: '댓글 작성에 실패했습니다.' }
    }

    return {
      success: true,
      comment: {
        ...comment,
        reply_count: 0
      } as unknown as CommentWithAuthor
    }
  } catch (error) {
    console.error('Failed to create comment:', error)
    return { success: false, error: '댓글 작성 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 수정
 */
export async function updateComment(
  commentId: string,
  data: UpdateCommentData
): Promise<CommentActionResult> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 댓글 수정 (RLS 정책에 의해 자동으로 권한 체크됨)
    const { data: comment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: data.content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        id,
        user_id,
        video_id,
        parent_id,
        content,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        author:profiles!user_id!inner (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating comment:', updateError)
      if (updateError.code === 'PGRST116') {
        return { success: false, error: '댓글을 찾을 수 없거나 수정 권한이 없습니다.' }
      }
      return { success: false, error: '댓글 수정에 실패했습니다.' }
    }

    // 대댓글 수 조회
    const { count: replyCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('parent_id', commentId)
      .eq('is_deleted', false)

    return {
      success: true,
      comment: {
        ...comment,
        reply_count: replyCount || 0
      } as unknown as CommentWithAuthor
    }
  } catch (error) {
    console.error('Failed to update comment:', error)
    return { success: false, error: '댓글 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 삭제 (소프트 삭제)
 */
export async function deleteComment(commentId: string): Promise<DeleteCommentResult> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 댓글 소프트 삭제 (RLS 정책에 의해 자동으로 권한 체크됨)
    const { error: deleteError } = await supabase
      .from('comments')
      .update({
        is_deleted: true,
        content: '', // 내용 삭제
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      if (deleteError.code === 'PGRST116') {
        return { success: false, error: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' }
      }
      return { success: false, error: '댓글 삭제에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자가 특정 영상에 작성한 댓글 수 조회
 */
export async function getUserCommentCountForVideo(
  userId: string,
  videoId: string
): Promise<number> {
  const supabase = await createServerClient()

  try {
    const { count, error } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .eq('is_deleted', false)

    if (error) {
      console.error('Error counting user comments:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Failed to count user comments:', error)
    return 0
  }
}