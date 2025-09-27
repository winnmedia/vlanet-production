/**
 * Video Comments Widget
 * 영상 댓글 섹션 전체 컨테이너
 */

import { getCommentsByVideoId } from '../../entities/comment/api'
import type { ProfileRow } from '../../entities/user'
import { CommentForm } from '../../features/comments'
import { CommentsList } from './CommentsList'

interface VideoCommentsProps {
  videoId: string
  currentUser?: ProfileRow | null
  className?: string
}

export async function VideoComments({
  videoId,
  currentUser,
  className
}: VideoCommentsProps) {
  // 초기 댓글 데이터 로드
  const commentsResponse = await getCommentsByVideoId({
    video_id: videoId,
    parent_id: null, // 최상위 댓글만
    limit: 10,
    offset: 0,
    sort: 'newest'
  })

  return (
    <section className={`space-y-6 ${className}`}>
      {/* 댓글 작성 폼 */}
      {currentUser && (
        <div>
          <h3 className="text-lg font-semibold mb-4">댓글 작성</h3>
          <CommentForm
            videoId={videoId}
            user={currentUser}
          />
        </div>
      )}

      {/* 로그인하지 않은 사용자를 위한 안내 */}
      {!currentUser && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-3">댓글을 작성하려면 로그인이 필요합니다.</p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            로그인하기
          </a>
        </div>
      )}

      {/* 댓글 목록 */}
      <CommentsList
        videoId={videoId}
        currentUser={currentUser}
        initialComments={commentsResponse.comments}
        initialTotalCount={commentsResponse.total_count}
      />
    </section>
  )
}