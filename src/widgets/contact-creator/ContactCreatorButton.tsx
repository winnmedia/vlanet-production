/**
 * ContactCreatorButton Widget
 * 창작자에게 연락하기 버튼 위젯
 */

'use client'

import { useState } from 'react'
import { MessageSquare, X, User, Play } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ProposalForm } from '@/features/contact'
import type { ProfileRow } from '@/entities/user'
import type { Video } from '@/entities/video'

interface ContactCreatorButtonProps {
  video: Video & { creator?: ProfileRow }
  currentUser?: { profile: ProfileRow } | null
  className?: string
}

export function ContactCreatorButton({
  video,
  currentUser,
  className
}: ContactCreatorButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  // 로그인하지 않은 사용자
  if (!currentUser?.profile) {
    return (
      <Card className={`p-6 bg-blue-50 border-blue-200 ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              창작자에게 제안하기
            </h3>
            <p className="text-blue-700 text-sm mb-3">
              이 영상이 마음에 드시나요? 창작자에게 협업이나 투자를 제안해보세요.
            </p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인하여 제안하기
            </a>
          </div>
        </div>
      </Card>
    )
  }

  // 자신의 영상인 경우
  if (currentUser.profile.id === video.creator_id) {
    return null // 자신에게는 제안 버튼을 표시하지 않음
  }

  // Funder가 아닌 경우
  if (currentUser.profile.role !== 'FUNDER') {
    return (
      <Card className={`p-6 bg-amber-50 border-amber-200 ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-1">
              투자자만 제안 가능
            </h3>
            <p className="text-amber-700 text-sm">
              창작자에게 제안하려면 Funder 계정이 필요합니다.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // 창작자 정보가 없는 경우
  if (!video.creator) {
    return null
  }

  return (
    <div className={className}>
      {!isFormOpen ? (
        // 제안 버튼
        <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {video.creator.username}님과 협업하기
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                이 창작자에게 투자나 협업을 제안해보세요. 새로운 기회가 기다리고 있습니다.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  제안 보내기
                </Button>
                <div className="flex items-center text-sm text-gray-500">
                  <Play className="w-4 h-4 mr-1" />
                  영상: "{video.title}"
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        // 제안 폼
        <div className="space-y-4">
          {/* 폼 헤더 */}
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {video.creator.username}님에게 제안하기
                  </h3>
                  <p className="text-sm text-gray-600">
                    영상: "{video.title}"
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsFormOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* 제안 폼 */}
          <ProposalForm
            creator={video.creator}
            videoId={video.id}
            videoTitle={video.title}
            onSuccess={(proposalId) => {
              setIsFormOpen(false)
              // 성공 알림 표시 (옵션)
              alert('제안이 성공적으로 전송되었습니다!')
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}
    </div>
  )
}