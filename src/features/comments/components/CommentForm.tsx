/**
 * Comment Form Component
 * 댓글 작성 및 수정 폼
 */

'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { Button } from '../../../shared/ui/button'
import { Card } from '../../../shared/ui/card'
import { addComment, editComment } from '../actions'
import type { ProfileRow } from '../../../entities/user'
import type { CommentWithAuthor } from '../../../entities/comment'

interface CommentFormProps {
  videoId: string
  user: ProfileRow
  parentId?: string
  parentAuthor?: string
  onSuccess?: (comment: CommentWithAuthor) => void
  onCancel?: () => void
  editingComment?: CommentWithAuthor
  className?: string
}

export function CommentForm({
  videoId,
  user,
  parentId,
  parentAuthor,
  onSuccess,
  onCancel,
  editingComment,
  className
}: CommentFormProps) {
  const [content, setContent] = useState(editingComment?.content || '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 최적화된 상태 관리 (Optimistic UI)
  const [optimisticComment, setOptimisticComment] = useOptimistic(
    null as CommentWithAuthor | null,
    (state: CommentWithAuthor | null, newComment: CommentWithAuthor) => newComment
  )

  const isEditing = !!editingComment
  const isReply = !!parentId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('댓글 내용을 입력해주세요.')
      return
    }

    if (content.trim().length > 1000) {
      setError('댓글은 1000자를 초과할 수 없습니다.')
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        let result

        if (isEditing) {
          // 댓글 수정
          result = await editComment(editingComment.id, content, videoId)
        } else {
          // 새 댓글 작성
          result = await addComment(videoId, content, parentId)
        }

        if (result.success) {
          // Optimistic UI 업데이트
          if (!isEditing) {
            const optimisticCommentData: CommentWithAuthor = {
              id: `temp-${Date.now()}`, // 임시 ID
              user_id: user.id,
              video_id: videoId,
              parent_id: parentId || null,
              content: content.trim(),
              is_edited: false,
              is_deleted: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              author: {
                id: user.id,
                username: user.username,
                avatar_url: user.avatar_url,
                role: user.role
              },
              reply_count: 0
            }

            setOptimisticComment(optimisticCommentData)
          }

          // 성공 처리
          setContent('')
          onSuccess?.(result.comment)
        } else {
          setError(result.error)
        }
      } catch (err) {
        console.error('댓글 처리 중 오류:', err)
        setError('댓글 처리 중 오류가 발생했습니다.')
      }
    })
  }

  const handleCancel = () => {
    setContent(editingComment?.content || '')
    setError(null)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter로 빠른 제출
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  const characterCount = content.length
  const isOverLimit = characterCount > 1000

  return (
    <Card className={`p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 답글 표시 */}
        {isReply && parentAuthor && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">@{parentAuthor}</span>님에게 답글
          </div>
        )}

        {/* 텍스트 영역 */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReply
                ? `@${parentAuthor}님에게 답글을 작성하세요...`
                : '댓글을 작성하세요...'
            }
            disabled={isPending}
            className={`
              w-full min-h-[80px] max-h-[200px] p-3 border border-gray-300 rounded-lg
              resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}
            `}
            maxLength={1200} // 약간의 여유분 제공
          />

          {/* 글자 수 카운터 */}
          <div className={`
            absolute bottom-2 right-2 text-xs
            ${isOverLimit ? 'text-red-500' : 'text-gray-400'}
          `}>
            {characterCount}/1000
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Ctrl+Enter로 빠른 제출
          </div>

          <div className="flex items-center gap-2">
            {(isEditing || isReply) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                취소
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={isPending || !content.trim() || isOverLimit}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  처리중...
                </div>
              ) : (
                isEditing ? '수정' : '댓글 작성'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Optimistic UI: 작성 중인 댓글 미리보기 */}
      {optimisticComment && !isEditing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">작성 중...</div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-sm text-gray-700 mt-1">{optimisticComment.content}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}