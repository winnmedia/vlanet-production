/**
 * Comment Item Component
 * 개별 댓글 표시 컴포넌트
 */

'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, MessageSquare, Edit3, Trash2, Flag } from 'lucide-react'
import { Button } from '../../../shared/ui/button'
import type { ProfileRow } from '../../../entities/user'
import type { CommentWithAuthor } from '../../../entities/comment'
import { formatTimeAgo, canEditComment, canDeleteComment } from '../../../entities/comment'
import { removeComment } from '../actions'
import { CommentForm } from './CommentForm'

interface CommentItemProps {
  comment: CommentWithAuthor
  currentUser?: ProfileRow | null
  videoId: string
  onReply?: (comment: CommentWithAuthor) => void
  onUpdate?: (comment: CommentWithAuthor) => void
  onDelete?: (commentId: string) => void
  depth?: number
  className?: string
}

export function CommentItem({
  comment,
  currentUser,
  videoId,
  onReply,
  onUpdate,
  onDelete,
  depth = 0,
  className
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isPending, startTransition] = useTransition()

  const canEdit = currentUser && canEditComment(comment, currentUser.id)
  const canDelete = currentUser && canDeleteComment(comment, currentUser.id)
  const isAuthor = currentUser?.id === comment.user_id

  const handleDelete = () => {
    if (!confirm('댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await removeComment(comment.id, videoId)
        if (result.success) {
          onDelete?.(comment.id)
        } else {
          alert(result.error)
        }
      } catch (error) {
        console.error('댓글 삭제 중 오류:', error)
        alert('댓글 삭제 중 오류가 발생했습니다.')
      }
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowActions(false)
  }

  const handleReply = () => {
    setIsReplying(true)
    setShowActions(false)
    onReply?.(comment)
  }

  const handleEditSuccess = (updatedComment: CommentWithAuthor) => {
    setIsEditing(false)
    onUpdate?.(updatedComment)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleReplySuccess = () => {
    setIsReplying(false)
  }

  const handleReplyCancel = () => {
    setIsReplying(false)
  }

  // 깊이에 따른 들여쓰기 (최대 3단계)
  const maxDepth = 2
  const actualDepth = Math.min(depth, maxDepth)
  const indentClass = `ml-${actualDepth * 6}`

  return (
    <div className={`${indentClass} ${className}`}>
      {/* 메인 댓글 */}
      <div className="flex items-start gap-3 group">
        {/* 아바타 */}
        <div className="flex-shrink-0 mt-1">
          {comment.author.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-500 text-white text-sm rounded-full flex items-center justify-center">
              {comment.author.username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.username}</span>

            {/* 역할 배지 */}
            {comment.author.role === 'CREATOR' && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                크리에이터
              </span>
            )}
            {comment.author.role === 'FUNDER' && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                투자자
              </span>
            )}

            {/* 시간 */}
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.created_at)}
            </span>

            {/* 수정됨 표시 */}
            {comment.is_edited && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}

            {/* 액션 버튼 */}
            {currentUser && (
              <div className="relative ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="h-6 w-6 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 top-6 z-10 w-32 bg-white border border-gray-200 rounded-md shadow-md py-1">
                    {canEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full px-3 py-1 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="h-3 w-3" />
                        수정
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="w-full px-3 py-1 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                        삭제
                      </button>
                    )}

                    {!isAuthor && (
                      <button
                        onClick={() => {/* TODO: 신고 기능 */}}
                        className="w-full px-3 py-1 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Flag className="h-3 w-3" />
                        신고
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 댓글 텍스트 또는 수정 폼 */}
          {isEditing ? (
            <CommentForm
              videoId={videoId}
              user={currentUser!}
              editingComment={comment}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
              className="mt-2"
            />
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
              {comment.content}
            </div>
          )}

          {/* 액션 버튼들 */}
          {!isEditing && currentUser && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* 답글 버튼 (최대 깊이 제한) */}
              {depth < maxDepth && (
                <button
                  onClick={handleReply}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <MessageSquare className="h-3 w-3" />
                  답글
                  {comment.reply_count && comment.reply_count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                      {comment.reply_count}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* 답글 작성 폼 */}
          {isReplying && currentUser && (
            <div className="mt-3">
              <CommentForm
                videoId={videoId}
                user={currentUser}
                parentId={comment.id}
                parentAuthor={comment.author.username}
                onSuccess={handleReplySuccess}
                onCancel={handleReplyCancel}
              />
            </div>
          )}
        </div>
      </div>

      {/* 액션 드롭다운 외부 클릭 시 닫기 */}
      {showActions && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  )
}