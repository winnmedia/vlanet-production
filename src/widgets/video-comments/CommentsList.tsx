/**
 * Comments List Widget
 * 댓글 목록을 표시하는 위젯
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { CommentItem, useComments } from '@/features/comments'
import type { ProfileRow } from '@/entities/user'
import type { CommentWithAuthor } from '@/entities/comment'

interface CommentsListProps {
  videoId: string
  currentUser?: ProfileRow | null
  initialComments?: CommentWithAuthor[]
  initialTotalCount?: number
  parentId?: string | null
  showTitle?: boolean
  className?: string
}

export function CommentsList({
  videoId,
  currentUser,
  initialComments = [],
  initialTotalCount = 0,
  parentId = null,
  showTitle = true,
  className
}: CommentsListProps) {
  const [replies, setReplies] = useState<Record<string, CommentWithAuthor[]>>({})
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  const {
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
  } = useComments({
    videoId,
    parentId,
    initialComments,
    initialTotalCount,
    limit: 10,
    sort: 'newest',
    enableRealtime: true
  })

  // 대댓글 토글
  const toggleReplies = async (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      // 접기
      setExpandedReplies(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    } else {
      // 펼치기 - 대댓글이 없으면 로드
      if (!replies[commentId]) {
        // TODO: 대댓글 로드 로직
        // 현재는 임시로 빈 배열 설정
        setReplies(prev => ({
          ...prev,
          [commentId]: []
        }))
      }

      setExpandedReplies(prev => {
        const newSet = new Set(prev)
        newSet.add(commentId)
        return newSet
      })
    }
  }

  // 댓글 업데이트 핸들러
  const handleCommentUpdate = (updatedComment: CommentWithAuthor) => {
    updateOptimisticComment(updatedComment.id, updatedComment)
  }

  // 댓글 삭제 핸들러
  const handleCommentDelete = (commentId: string) => {
    removeOptimisticComment(commentId)
    // 확장된 대댓글도 정리
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      newSet.delete(commentId)
      return newSet
    })
  }

  // 대댓글 작성 후 핸들러
  const handleReplyAdded = (parentComment: CommentWithAuthor, newReply: CommentWithAuthor) => {
    // 대댓글 목록에 추가
    setReplies(prev => ({
      ...prev,
      [parentComment.id]: [newReply, ...(prev[parentComment.id] || [])]
    }))

    // 대댓글 섹션 자동 확장
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      newSet.add(parentComment.id)
      return newSet
    })

    // 부모 댓글의 reply_count 업데이트
    updateOptimisticComment(parentComment.id, {
      reply_count: (parentComment.reply_count || 0) + 1
    })
  }

  if (isLoading && comments.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span>댓글을 불러오는 중...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* 댓글 섹션 헤더 */}
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            댓글 {totalCount > 0 && `(${totalCount.toLocaleString()})`}
          </h3>

          {comments.length > 0 && (
            <Button
              onClick={refresh}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          )}
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg mb-2">아직 댓글이 없습니다</p>
            <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              {/* 메인 댓글 */}
              <CommentItem
                comment={comment}
                currentUser={currentUser}
                videoId={videoId}
                onUpdate={handleCommentUpdate}
                onDelete={handleCommentDelete}
                onReply={(parentComment) => {
                  // 대댓글 작성 준비
                  if (!expandedReplies.has(parentComment.id)) {
                    toggleReplies(parentComment.id)
                  }
                }}
                depth={0}
              />

              {/* 대댓글 섹션 */}
              {comment.reply_count && comment.reply_count > 0 && (
                <div className="ml-8 mt-3">
                  {!expandedReplies.has(comment.id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReplies(comment.id)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ChevronDown className="w-4 h-4 mr-1" />
                      {comment.reply_count}개의 답글 보기
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* 답글 접기 버튼 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReplies(comment.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ChevronDown className="w-4 h-4 mr-1 rotate-180" />
                        답글 접기
                      </Button>

                      {/* 대댓글 목록 */}
                      {replies[comment.id]?.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          currentUser={currentUser}
                          videoId={videoId}
                          onUpdate={handleCommentUpdate}
                          onDelete={handleCommentDelete}
                          depth={1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 더보기 버튼 */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="w-full"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    댓글 불러오는 중...
                  </>
                ) : (
                  '댓글 더보기'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}