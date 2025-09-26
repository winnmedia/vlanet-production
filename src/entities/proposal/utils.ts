/**
 * Proposal Entity Utils
 * 제안 시스템 유틸리티 함수들
 */

import type {
  ProposalStatus,
  NotificationType,
  ProposalWithAuthor,
  ProposalValidation,
  MessageValidation
} from './types'

/**
 * 제안 상태를 한국어로 변환
 */
export function getProposalStatusText(status: ProposalStatus): string {
  switch (status) {
    case 'PENDING':
      return '대기중'
    case 'ACCEPTED':
      return '수락됨'
    case 'REJECTED':
      return '거절됨'
    case 'ARCHIVED':
      return '보관됨'
    default:
      return '알 수 없음'
  }
}

/**
 * 제안 상태 색상 반환 (Tailwind 클래스)
 */
export function getProposalStatusColor(status: ProposalStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * 알림 타입을 한국어로 변환
 */
export function getNotificationTypeText(type: NotificationType): string {
  switch (type) {
    case 'NEW_PROPOSAL':
      return '새 제안'
    case 'PROPOSAL_RESPONSE':
      return '제안 응답'
    case 'NEW_MESSAGE':
      return '새 메시지'
    case 'PROPOSAL_ACCEPTED':
      return '제안 수락'
    case 'PROPOSAL_REJECTED':
      return '제안 거절'
    default:
      return '알림'
  }
}

/**
 * 알림 아이콘 반환
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'NEW_PROPOSAL':
      return '📝'
    case 'PROPOSAL_RESPONSE':
      return '💬'
    case 'NEW_MESSAGE':
      return '💌'
    case 'PROPOSAL_ACCEPTED':
      return '✅'
    case 'PROPOSAL_REJECTED':
      return '❌'
    default:
      return '🔔'
  }
}

/**
 * 제안 생성 시간을 상대 시간으로 포맷팅
 */
export function formatProposalTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}일 전`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`
  }

  // 4주 이상은 날짜로 표시
  return time.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * 예산 범위 텍스트 포맷팅
 */
export function formatBudgetRange(budgetRange: string | null | undefined): string {
  if (!budgetRange || budgetRange.trim() === '') {
    return '협의 가능'
  }
  return budgetRange
}

/**
 * 제안 내용 유효성 검사
 */
export function validateProposal(data: {
  subject: string
  message: string
  budget_range?: string | null
  timeline?: string | null
}): ProposalValidation {
  const errors: ProposalValidation['errors'] = {}
  let isValid = true

  // 제목 검사
  if (!data.subject || data.subject.trim().length < 5) {
    errors.subject = '제목은 최소 5자 이상 입력해주세요.'
    isValid = false
  } else if (data.subject.trim().length > 200) {
    errors.subject = '제목은 최대 200자까지 입력 가능합니다.'
    isValid = false
  }

  // 메시지 검사
  if (!data.message || data.message.trim().length < 10) {
    errors.message = '메시지는 최소 10자 이상 입력해주세요.'
    isValid = false
  } else if (data.message.trim().length > 5000) {
    errors.message = '메시지는 최대 5000자까지 입력 가능합니다.'
    isValid = false
  }

  // 예산 범위 검사 (선택사항)
  if (data.budget_range && data.budget_range.trim().length > 100) {
    errors.budget_range = '예산 범위는 최대 100자까지 입력 가능합니다.'
    isValid = false
  }

  // 일정 검사 (선택사항)
  if (data.timeline && data.timeline.trim().length > 500) {
    errors.timeline = '일정은 최대 500자까지 입력 가능합니다.'
    isValid = false
  }

  return { isValid, errors }
}

/**
 * 메시지 내용 유효성 검사
 */
export function validateMessage(content: string): MessageValidation {
  const errors: MessageValidation['errors'] = {}
  let isValid = true

  if (!content || content.trim().length === 0) {
    errors.content = '메시지를 입력해주세요.'
    isValid = false
  } else if (content.trim().length > 2000) {
    errors.content = '메시지는 최대 2000자까지 입력 가능합니다.'
    isValid = false
  }

  return { isValid, errors }
}

/**
 * 제안 내용 정리 (HTML 태그 제거, 공백 정리)
 */
export function sanitizeProposalContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script 태그와 내용 완전 제거
    .replace(/<[^>]*>/g, '') // 나머지 HTML 태그 제거
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .trim()
}

/**
 * 제안 권한 검사
 */
export function canEditProposal(
  proposal: ProposalWithAuthor,
  currentUserId?: string
): boolean {
  if (!currentUserId) return false

  // Funder는 PENDING 상태일 때만 수정 가능
  if (proposal.funder_id === currentUserId) {
    return proposal.status === 'PENDING'
  }

  return false
}

/**
 * 제안 응답 권한 검사
 */
export function canRespondToProposal(
  proposal: ProposalWithAuthor,
  currentUserId?: string
): boolean {
  if (!currentUserId) return false

  // Creator만 PENDING 상태의 제안에 응답 가능
  return proposal.creator_id === currentUserId && proposal.status === 'PENDING'
}

/**
 * 제안 삭제 권한 검사
 */
export function canDeleteProposal(
  proposal: ProposalWithAuthor,
  currentUserId?: string
): boolean {
  if (!currentUserId) return false

  // Funder만 자신의 제안 삭제 가능
  return proposal.funder_id === currentUserId
}

/**
 * 메시지 작성 권한 검사
 */
export function canSendMessage(
  proposal: ProposalWithAuthor,
  currentUserId?: string
): boolean {
  if (!currentUserId) return false

  // 제안 당사자만 메시지 작성 가능
  return (
    proposal.funder_id === currentUserId ||
    proposal.creator_id === currentUserId
  )
}

/**
 * 제안 요약 텍스트 생성 (미리보기용)
 */
export function getProposalSummary(
  proposal: ProposalWithAuthor,
  maxLength: number = 100
): string {
  const content = sanitizeProposalContent(proposal.message)

  if (content.length <= maxLength) {
    return content
  }

  return content.substring(0, maxLength) + '...'
}

/**
 * 제안 우선순위 계산 (정렬용)
 */
export function getProposalPriority(proposal: ProposalWithAuthor): number {
  let priority = 0

  // 상태별 우선순위
  switch (proposal.status) {
    case 'PENDING':
      priority += 100
      break
    case 'ACCEPTED':
      priority += 50
      break
    case 'REJECTED':
      priority += 10
      break
    case 'ARCHIVED':
      priority += 1
      break
  }

  // 읽지 않은 메시지가 있으면 우선순위 증가
  if (proposal.unread_messages_count && proposal.unread_messages_count > 0) {
    priority += 200
  }

  // 최근 업데이트된 제안 우선순위 증가
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(proposal.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceUpdate <= 1) {
    priority += 50
  } else if (daysSinceUpdate <= 7) {
    priority += 20
  }

  return priority
}

/**
 * 제안 검색 텍스트 생성 (검색 인덱싱용)
 */
export function getProposalSearchText(proposal: ProposalWithAuthor): string {
  return [
    proposal.subject,
    proposal.message,
    proposal.funder.username,
    proposal.creator.username,
    proposal.video?.title || '',
    proposal.budget_range || '',
    proposal.timeline || ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * 응답률 텍스트 포맷팅
 */
export function formatResponseRate(rate: number): string {
  if (rate === 0) return '응답률 정보 없음'
  return `응답률 ${rate}%`
}

/**
 * 제안 상태별 필터링 옵션 생성
 */
export function getProposalStatusOptions(): Array<{
  value: ProposalStatus | 'ALL'
  label: string
  count?: number
}> {
  return [
    { value: 'ALL', label: '전체' },
    { value: 'PENDING', label: '대기중' },
    { value: 'ACCEPTED', label: '수락됨' },
    { value: 'REJECTED', label: '거절됨' },
    { value: 'ARCHIVED', label: '보관됨' }
  ]
}

/**
 * 제안 링크 생성
 */
export function getProposalUrl(proposalId: string): string {
  return `/proposals/${proposalId}`
}

/**
 * 비디오 제안 링크 생성
 */
export function getVideoProposalUrl(videoId: string, creatorId: string): string {
  return `/video/${videoId}?contact=${creatorId}`
}