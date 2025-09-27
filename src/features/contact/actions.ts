/**
 * Contact Feature Server Actions
 * 제안 시스템 서버 액션들
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  createProposal,
  updateProposal,
  deleteProposal,
  createMessage,
  markNotificationAsRead,
} from '../../entities/proposal/api';
import {
  validateProposal,
  validateMessage,
  sanitizeProposalContent
} from '../../entities/proposal'
import { getCurrentUser } from '../auth'

// 제안 생성 스키마
const CreateProposalSchema = z.object({
  creator_id: z.string().uuid('유효한 Creator ID를 입력해주세요.'),
  video_id: z.string().uuid().optional().nullable(),
  subject: z
    .string()
    .min(5, '제목은 최소 5자 이상 입력해주세요.')
    .max(200, '제목은 최대 200자까지 입력 가능합니다.')
    .trim(),
  message: z
    .string()
    .min(10, '메시지는 최소 10자 이상 입력해주세요.')
    .max(5000, '메시지는 최대 5000자까지 입력 가능합니다.')
    .trim(),
  budget_range: z
    .string()
    .max(100, '예산 범위는 최대 100자까지 입력 가능합니다.')
    .optional()
    .nullable(),
  timeline: z
    .string()
    .max(500, '일정은 최대 500자까지 입력 가능합니다.')
    .optional()
    .nullable()
})

// 제안 수정 스키마
const UpdateProposalSchema = z.object({
  subject: z
    .string()
    .min(5, '제목은 최소 5자 이상 입력해주세요.')
    .max(200, '제목은 최대 200자까지 입력 가능합니다.')
    .trim()
    .optional(),
  message: z
    .string()
    .min(10, '메시지는 최소 10자 이상 입력해주세요.')
    .max(5000, '메시지는 최대 5000자까지 입력 가능합니다.')
    .trim()
    .optional(),
  budget_range: z
    .string()
    .max(100, '예산 범위는 최대 100자까지 입력 가능합니다.')
    .optional()
    .nullable(),
  timeline: z
    .string()
    .max(500, '일정은 최대 500자까지 입력 가능합니다.')
    .optional()
    .nullable(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'ARCHIVED']).optional(),
  response_message: z
    .string()
    .max(2000, '응답 메시지는 최대 2000자까지 입력 가능합니다.')
    .optional()
    .nullable()
})

// 메시지 생성 스키마
const CreateMessageSchema = z.object({
  proposal_id: z.string().uuid('유효한 제안 ID를 입력해주세요.'),
  content: z
    .string()
    .min(1, '메시지를 입력해주세요.')
    .max(2000, '메시지는 최대 2000자까지 입력 가능합니다.')
    .trim()
})

/**
 * 제안 생성 액션
 */
export async function createProposalAction(formData: FormData) {
  try {
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    if (user.profile?.role !== 'FUNDER') {
      return {
        success: false,
        error: 'Funder만 제안을 생성할 수 있습니다.'
      }
    }

    // 폼 데이터 추출 및 검증
    const rawData = {
      creator_id: formData.get('creator_id') as string,
      video_id: formData.get('video_id') as string || null,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      budget_range: formData.get('budget_range') as string || null,
      timeline: formData.get('timeline') as string || null
    }

    // Zod 스키마 검증
    const validationResult = CreateProposalSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || '입력 데이터가 올바르지 않습니다.'
      }
    }

    const data = validationResult.data

    // 추가 비즈니스 로직 검증
    const proposalValidation = validateProposal({
      subject: data.subject,
      message: data.message,
      budget_range: data.budget_range,
      timeline: data.timeline
    })

    if (!proposalValidation.isValid) {
      const firstError = Object.values(proposalValidation.errors)[0]
      return {
        success: false,
        error: firstError || '입력 데이터가 올바르지 않습니다.'
      }
    }

    // 내용 정리
    const cleanData = {
      ...data,
      subject: sanitizeProposalContent(data.subject),
      message: sanitizeProposalContent(data.message),
      budget_range: data.budget_range ? sanitizeProposalContent(data.budget_range) : null,
      timeline: data.timeline ? sanitizeProposalContent(data.timeline) : null
    }

    // 제안 생성
    const result = await createProposal(cleanData)

    if (result.success && result.proposal) {
      // 관련 페이지 재검증
      revalidatePath('/dashboard/proposals')
      revalidatePath('/proposals')
      revalidateTag('proposals')

      // 제안 상세 페이지로 리디렉션
      redirect('/dashboard/proposals' as any)
    }

    return result
  } catch (error) {
    console.error('Create proposal action error:', error)
    return {
      success: false,
      error: '제안 생성 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 제안 수정 액션
 */
export async function updateProposalAction(proposalId: string, formData: FormData) {
  try {
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    // 폼 데이터 추출
    const rawData: any = {}

    // 선택적 필드들 처리
    const fields = ['subject', 'message', 'budget_range', 'timeline', 'status', 'response_message']
    for (const field of fields) {
      const value = formData.get(field)
      if (value !== null && value !== undefined) {
        rawData[field] = value === '' ? null : value
      }
    }

    // Zod 스키마 검증
    const validationResult = UpdateProposalSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || '입력 데이터가 올바르지 않습니다.'
      }
    }

    const data = validationResult.data

    // 내용이 있는 필드만 정리
    const cleanData: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (typeof value === 'string' && value.trim()) {
          cleanData[key] = sanitizeProposalContent(value)
        } else {
          cleanData[key] = value
        }
      }
    }

    // 제안 수정
    const result = await updateProposal(proposalId, cleanData)

    if (result.success) {
      // 관련 페이지 재검증
      revalidatePath('/dashboard/proposals')
      revalidatePath(`/proposals/${proposalId}`)
      revalidateTag('proposals')
    }

    return result
  } catch (error) {
    console.error('Update proposal action error:', error)
    return {
      success: false,
      error: '제안 수정 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 제안 응답 액션 (수락/거절)
 */
export async function respondToProposalAction(
  proposalId: string,
  status: 'ACCEPTED' | 'REJECTED',
  responseMessage?: string
) {
  try {
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    if (user.profile?.role !== 'CREATOR') {
      return {
        success: false,
        error: 'Creator만 제안에 응답할 수 있습니다.'
      }
    }

    // 응답 데이터 준비
    const updateData: any = { status }
    if (responseMessage && responseMessage.trim()) {
      updateData.response_message = sanitizeProposalContent(responseMessage.trim())
    }

    // 제안 수정
    const result = await updateProposal(proposalId, updateData)

    if (result.success) {
      // 관련 페이지 재검증
      revalidatePath('/dashboard/proposals')
      revalidatePath(`/proposals/${proposalId}`)
      revalidateTag('proposals')
    }

    return result
  } catch (error) {
    console.error('Respond to proposal action error:', error)
    return {
      success: false,
      error: '제안 응답 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 제안 삭제 액션
 */
export async function deleteProposalAction(proposalId: string) {
  try {
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    // 제안 삭제
    const result = await deleteProposal(proposalId)

    if (result.success) {
      // 관련 페이지 재검증
      revalidatePath('/dashboard/proposals')
      revalidateTag('proposals')

      // 제안 목록으로 리디렉션
      redirect('/dashboard/proposals' as any)
    }

    return result
  } catch (error) {
    console.error('Delete proposal action error:', error)
    return {
      success: false,
      error: '제안 삭제 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 메시지 생성 액션
 */
export async function createMessageAction(formData: FormData) {
  try {
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    // 폼 데이터 추출 및 검증
    const rawData = {
      proposal_id: formData.get('proposal_id') as string,
      content: formData.get('content') as string
    }

    // Zod 스키마 검증
    const validationResult = CreateMessageSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || '입력 데이터가 올바르지 않습니다.'
      }
    }

    const data = validationResult.data

    // 추가 비즈니스 로직 검증
    const messageValidation = validateMessage(data.content)
    if (!messageValidation.isValid) {
      return {
        success: false,
        error: messageValidation.errors.content || '메시지가 올바르지 않습니다.'
      }
    }

    // 내용 정리
    const cleanData = {
      ...data,
      content: sanitizeProposalContent(data.content)
    }

    // 메시지 생성
    const result = await createMessage(cleanData)

    if (result.success) {
      // 제안 상세 페이지 재검증
      revalidatePath(`/proposals/${data.proposal_id}`)
      revalidateTag('messages')
    }

    return result
  } catch (error) {
    console.error('Create message action error:', error)
    return {
      success: false,
      error: '메시지 작성 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 알림 읽음 처리 액션
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    // 현재 사용자 확인
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      }
    }

    // 알림 읽음 처리
    const result = await markNotificationAsRead(notificationId)

    if (result.success) {
      // 알림 관련 페이지 재검증
      revalidateTag('notifications')
    }

    return result
  } catch (error) {
    console.error('Mark notification as read action error:', error)
    return {
      success: false,
      error: '알림 읽음 처리 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 빠른 제안 생성 액션 (비디오 페이지에서 사용)
 */
export async function quickCreateProposalAction(
  creatorId: string,
  videoId: string,
  subject: string,
  message: string
) {
  try {
    // FormData 생성
    const formData = new FormData()
    formData.append('creator_id', creatorId)
    formData.append('video_id', videoId)
    formData.append('subject', subject)
    formData.append('message', message)

    // 기존 제안 생성 액션 재사용
    return await createProposalAction(formData)
  } catch (error) {
    console.error('Quick create proposal action error:', error)
    return {
      success: false,
      error: '빠른 제안 생성 중 오류가 발생했습니다.'
    }
  }
}