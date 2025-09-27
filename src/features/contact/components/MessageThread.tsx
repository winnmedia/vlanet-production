/**
 * MessageThread Component
 * 제안별 메시지 스레드
 */

'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Button } from '../../../shared/ui/button'
import { Card } from '../../../shared/ui/card'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { createMessageAction } from '../actions'
import { formatProposalTime, validateMessage } from '../../../entities/proposal'
import type { ProposalMessageWithAuthor } from '../../../entities/proposal'
import type { ProfileRow } from '../../../entities/user'

interface MessageThreadProps {
  proposalId: string
  messages: ProposalMessageWithAuthor[]
  currentUser: ProfileRow
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onRefresh?: () => void
  className?: string
}

export function MessageThread({
  proposalId,
  messages,
  currentUser,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
  className
}: MessageThreadProps) {
  const [isPending, startTransition] = useTransition()
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 새 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // 실시간 유효성 검사
  const validateMessageText = (text: string) => {
    const validation = validateMessage(text)
    setError(validation.errors.content || null)
    return validation.isValid
  }

  // 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setMessageText(text)
    validateMessageText(text)

    // 높이 자동 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  // 키보드 단축키 (Ctrl+Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter' && !isPending) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 메시지 전송
  const handleSubmit = async () => {
    if (!messageText.trim() || !validateMessageText(messageText) || isPending) {
      return
    }

    setSubmitError(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('proposal_id', proposalId)
        formData.append('content', messageText.trim())

        const result = await createMessageAction(formData)

        if (result.success) {
          setMessageText('')
          setError(null)
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
          onRefresh?.()
        } else {
          setSubmitError(result.error || '메시지 전송에 실패했습니다.')
        }
      } catch (error) {
        console.error('Message send error:', error)
        setSubmitError('메시지 전송 중 오류가 발생했습니다.')
      }
    })
  }

  // 글자 수 계산
  const getCharacterCount = (text: string, max: number = 2000) => {
    const count = text.length
    const isOverLimit = count > max
    return {
      count,
      max,
      isOverLimit,
      className: isOverLimit ? 'text-red-600' : 'text-gray-500'
    }
  }

  const charCount = getCharacterCount(messageText)

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* 더보기 버튼 (위쪽) */}
        {hasMore && onLoadMore && (
          <div className="text-center">
            <Button
              onClick={onLoadMore}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  로딩 중...
                </>
              ) : (
                '이전 메시지 보기'
              )}
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">
              아직 메시지가 없습니다. 첫 번째 메시지를 보내보세요!
            </p>
          </Card>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-200'
                    } rounded-lg p-4 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          isOwnMessage ? 'text-primary-100' : 'text-gray-900'
                        }`}
                      >
                        {message.sender.username}
                        {isOwnMessage && ' (나)'}
                      </span>
                      <span
                        className={`text-xs ${
                          isOwnMessage ? 'text-primary-200' : 'text-gray-500'
                        }`}
                      >
                        {formatProposalTime(message.created_at)}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        isOwnMessage ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {message.content}
                    </p>
                    {!message.is_read && !isOwnMessage && (
                      <div className="mt-2 text-xs text-primary-600 font-medium">
                        새 메시지
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 메시지 입력 폼 */}
      <div className="border-t bg-white p-4">
        {submitError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <div className="flex">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요... (Ctrl+Enter로 전송)"
              disabled={isPending}
              rows={1}
              className={`flex-1 min-h-[40px] max-h-32 px-3 py-2 border rounded-l-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ minHeight: '40px' }}
            />
            <Button
              onClick={handleSubmit}
              disabled={isPending || !messageText.trim() || !!error}
              className="rounded-l-none"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex justify-between items-center text-xs">
            {error && <span className="text-red-600">{error}</span>}
            <span className={`ml-auto ${charCount.className}`}>
              {charCount.count}/{charCount.max}
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Ctrl+Enter로 빠르게 전송할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  )
}