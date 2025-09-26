/**
 * useComments Hook
 * 댓글 상태 관리 및 실시간 구독 훅
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/shared/api/supabase/client'
import type {
  CommentWithAuthor,
  CommentListOptions,
  CommentsResponse
} from '@/entities/comment'

export interface UseCommentsOptions {
  videoId: string
  parentId?: string | null
  initialComments?: CommentWithAuthor[]
  initialTotalCount?: number
  initialHasMore?: boolean
  limit?: number
  sort?: 'newest' | 'oldest'
  enableRealtime?: boolean
}

export interface UseCommentsReturn {
  comments: CommentWithAuthor[]
  totalCount: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  addOptimisticComment: (comment: CommentWithAuthor) => void
  updateOptimisticComment: (commentId: string, updates: Partial<CommentWithAuthor>) => void
  removeOptimisticComment: (commentId: string) => void
}

export function useComments(options: UseCommentsOptions): UseCommentsReturn {
  const {
    videoId,
    parentId = null,
    initialComments = [],
    initialTotalCount = 0,
    initialHasMore = false,
    limit = 10,
    sort = 'newest',
    enableRealtime = true
  } = options

  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // 댓글 목록 로드
  const loadComments = useCallback(async (offset = 0, append = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const options: CommentListOptions = {
        video_id: videoId,
        parent_id: parentId,
        limit,
        offset,
        sort
      }

      // API 호출 (실제로는 Server Component에서 처리됨)
      // 클라이언트에서는 Supabase 직접 호출
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
        .eq('video_id', videoId)
        .eq('is_deleted', false)

      if (parentId === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parentId)
      }

      query = query.order('created_at', { ascending: sort === 'oldest' })
      query = query.range(offset, offset + limit - 1)

      const { data: newComments, error: fetchError, count } = await query

      if (fetchError) {
        throw fetchError
      }

      // 대댓글 수 계산 (최상위 댓글인 경우에만)
      let commentsWithReplyCounts: CommentWithAuthor[] = []

      if (parentId === null && newComments) {
        commentsWithReplyCounts = await Promise.all(
          newComments.map(async (comment: any) => {
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
        commentsWithReplyCounts = (newComments || []) as unknown as CommentWithAuthor[]
      }

      if (append) {
        setComments(prev => [...prev, ...commentsWithReplyCounts])
      } else {
        setComments(commentsWithReplyCounts)
      }

      setTotalCount(count || 0)
      setHasMore(offset + limit < (count || 0))

    } catch (err) {
      console.error('댓글 로드 중 오류:', err)
      setError('댓글을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [videoId, parentId, limit, sort, supabase])

  // 더 많은 댓글 로드
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    await loadComments(comments.length, true)
  }, [isLoadingMore, hasMore, comments.length, loadComments])

  // 새로고침
  const refresh = useCallback(async () => {
    await loadComments(0, false)
  }, [loadComments])

  // Optimistic 댓글 추가
  const addOptimisticComment = useCallback((comment: CommentWithAuthor) => {
    setComments(prev => {
      if (sort === 'newest') {
        return [comment, ...prev]
      } else {
        return [...prev, comment]
      }
    })
    setTotalCount(prev => prev + 1)
  }, [sort])

  // Optimistic 댓글 업데이트
  const updateOptimisticComment = useCallback((commentId: string, updates: Partial<CommentWithAuthor>) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, ...updates }
          : comment
      )
    )
  }, [])

  // Optimistic 댓글 삭제
  const removeOptimisticComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
    setTotalCount(prev => Math.max(0, prev - 1))
  }, [])

  // 실시간 구독 설정
  useEffect(() => {
    if (!enableRealtime) return

    const channel = supabase
      .channel(`comments:${videoId}:${parentId || 'root'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `video_id=eq.${videoId}${parentId ? ` AND parent_id=eq.${parentId}` : ' AND parent_id=is.null'}`
      }, (payload: any) => {
        // 새 댓글 알림 (실제 데이터는 새로고침으로 가져옴)
        refresh()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'comments',
        filter: `video_id=eq.${videoId}${parentId ? ` AND parent_id=eq.${parentId}` : ' AND parent_id=is.null'}`
      }, (payload: any) => {
        // 댓글 수정/삭제 알림
        refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [videoId, parentId, enableRealtime, supabase, refresh])

  return {
    comments,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    addOptimisticComment,
    updateOptimisticComment,
    removeOptimisticComment
  }
}