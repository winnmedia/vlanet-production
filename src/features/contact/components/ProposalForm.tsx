/**
 * ProposalForm Component
 * 새로운 제안 작성 폼
 */

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Send, Loader2 } from 'lucide-react'
import { createProposalAction } from '../actions'
import { validateProposal } from '@/entities/proposal'
import type { ProfileRow } from '@/entities/user'

interface ProposalFormProps {
  creator: ProfileRow
  videoId?: string | null
  videoTitle?: string | null
  onSuccess?: (proposalId: string) => void
  onCancel?: () => void
  className?: string
}

export function ProposalForm({
  creator,
  videoId = null,
  videoTitle = null,
  onSuccess,
  onCancel,
  className
}: ProposalFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    subject: videoTitle ? `"${videoTitle}" 영상 관련 제안` : '',
    message: '',
    budget_range: '',
    timeline: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 실시간 유효성 검사
  const validateField = (field: string, value: string) => {
    const validation = validateProposal({
      subject: field === 'subject' ? value : formData.subject,
      message: field === 'message' ? value : formData.message,
      budget_range: field === 'budget_range' ? value : formData.budget_range,
      timeline: field === 'timeline' ? value : formData.timeline
    })

    setErrors(prev => ({
      ...prev,
      [field]: validation.errors[field as keyof typeof validation.errors] || ''
    }))
  }

  // 입력 핸들러
  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  // 글자 수 계산
  const getCharacterCount = (text: string, max: number) => {
    const count = text.length
    const isOverLimit = count > max
    return {
      count,
      max,
      isOverLimit,
      className: isOverLimit ? 'text-red-600' : 'text-gray-500'
    }
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 최종 유효성 검사
    const validation = validateProposal(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setSubmitError(null)

    startTransition(async () => {
      try {
        const formDataObj = new FormData()
        formDataObj.append('creator_id', creator.id)
        if (videoId) formDataObj.append('video_id', videoId)
        formDataObj.append('subject', formData.subject)
        formDataObj.append('message', formData.message)
        if (formData.budget_range) formDataObj.append('budget_range', formData.budget_range)
        if (formData.timeline) formDataObj.append('timeline', formData.timeline)

        const result = await createProposalAction(formDataObj)

        if (result.success && result.proposal) {
          onSuccess?.(result.proposal.id)
        } else {
          setSubmitError(result.error || '제안 생성에 실패했습니다.')
        }
      } catch (error) {
        console.error('Proposal submission error:', error)
        setSubmitError('제안 전송 중 오류가 발생했습니다.')
      }
    })
  }

  const subjectCount = getCharacterCount(formData.subject, 200)
  const messageCount = getCharacterCount(formData.message, 5000)
  const budgetCount = getCharacterCount(formData.budget_range, 100)
  const timelineCount = getCharacterCount(formData.timeline, 500)

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {creator.username}님에게 제안 보내기
        </h3>
        {videoTitle && (
          <p className="text-sm text-gray-600 mt-1">
            영상: "{videoTitle}"
          </p>
        )}
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            제목 *
          </label>
          <Input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={handleInputChange('subject')}
            placeholder="제안 제목을 입력해주세요 (최소 5자)"
            required
            disabled={isPending}
            className={errors.subject ? 'border-red-300' : ''}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.subject && (
              <p className="text-xs text-red-600">{errors.subject}</p>
            )}
            <p className={`text-xs ml-auto ${subjectCount.className}`}>
              {subjectCount.count}/{subjectCount.max}
            </p>
          </div>
        </div>

        {/* 메시지 */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            메시지 *
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={handleInputChange('message')}
            placeholder="구체적인 제안 내용을 작성해주세요. 협업 내용, 기대하는 바, 연락 방법 등을 포함하면 좋습니다. (최소 10자)"
            required
            disabled={isPending}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.message ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.message && (
              <p className="text-xs text-red-600">{errors.message}</p>
            )}
            <p className={`text-xs ml-auto ${messageCount.className}`}>
              {messageCount.count}/{messageCount.max}
            </p>
          </div>
        </div>

        {/* 예산 범위 */}
        <div>
          <label
            htmlFor="budget_range"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            예산 범위 (선택사항)
          </label>
          <Input
            id="budget_range"
            type="text"
            value={formData.budget_range}
            onChange={handleInputChange('budget_range')}
            placeholder="예: 100만원~500만원, 협의 가능 등"
            disabled={isPending}
            className={errors.budget_range ? 'border-red-300' : ''}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.budget_range && (
              <p className="text-xs text-red-600">{errors.budget_range}</p>
            )}
            <p className={`text-xs ml-auto ${budgetCount.className}`}>
              {budgetCount.count}/{budgetCount.max}
            </p>
          </div>
        </div>

        {/* 일정 */}
        <div>
          <label
            htmlFor="timeline"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            희망 일정 (선택사항)
          </label>
          <textarea
            id="timeline"
            value={formData.timeline}
            onChange={handleInputChange('timeline')}
            placeholder="예: 2개월 내, 연말까지, 협의 가능 등"
            disabled={isPending}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.timeline ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.timeline && (
              <p className="text-xs text-red-600">{errors.timeline}</p>
            )}
            <p className={`text-xs ml-auto ${timelineCount.className}`}>
              {timelineCount.count}/{timelineCount.max}
            </p>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending || Object.values(errors).some(Boolean)}
            className="min-w-[120px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                전송 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                제안 보내기
              </>
            )}
          </Button>
        </div>
      </form>

      {/* 안내사항 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 제안 작성 팁</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 구체적이고 명확한 제안 내용을 작성해주세요</li>
          <li>• 기대하는 협업 방식과 결과물을 명시해주세요</li>
          <li>• 연락 가능한 방법(이메일, 전화번호 등)을 포함해주세요</li>
          <li>• 정중하고 전문적인 톤으로 작성해주세요</li>
        </ul>
      </div>
    </Card>
  )
}