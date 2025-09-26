/**
 * Proposal Utils Test Suite
 * 제안 시스템 유틸리티 함수들의 단위 테스트
 */

import {
  getProposalStatusText,
  getProposalStatusColor,
  getNotificationTypeText,
  getNotificationIcon,
  formatProposalTime,
  formatBudgetRange,
  validateProposal,
  validateMessage,
  sanitizeProposalContent,
  canEditProposal,
  canRespondToProposal,
  canDeleteProposal,
  canSendMessage,
  getProposalSummary,
  getProposalPriority,
  getProposalSearchText,
  formatResponseRate,
  getProposalUrl,
  getVideoProposalUrl
} from '../utils'
import type { ProposalWithAuthor } from '../types'

// 테스트용 모의 데이터
const mockProposal: ProposalWithAuthor = {
  id: 'proposal-1',
  funder_id: 'funder-1',
  creator_id: 'creator-1',
  video_id: 'video-1',
  subject: '협업 제안입니다',
  message: '안녕하세요, 귀하의 영상을 보고 협업을 제안드립니다. 더 자세한 내용을 논의하고 싶습니다.',
  budget_range: '100만원~500만원',
  timeline: '2개월 내',
  status: 'PENDING',
  responded_at: null,
  response_message: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  funder: {
    id: 'funder-1',
    username: 'investor123',
    avatar_url: null,
    role: 'FUNDER'
  },
  creator: {
    id: 'creator-1',
    username: 'creator456',
    avatar_url: null,
    role: 'CREATOR'
  },
  video: {
    id: 'video-1',
    title: '멋진 AI 영상',
    thumbnail_url: null
  },
  unread_messages_count: 2
}

describe('Proposal Status Utils', () => {
  test('getProposalStatusText should return correct Korean text', () => {
    expect(getProposalStatusText('PENDING')).toBe('대기중')
    expect(getProposalStatusText('ACCEPTED')).toBe('수락됨')
    expect(getProposalStatusText('REJECTED')).toBe('거절됨')
    expect(getProposalStatusText('ARCHIVED')).toBe('보관됨')
  })

  test('getProposalStatusColor should return correct Tailwind classes', () => {
    expect(getProposalStatusColor('PENDING')).toBe('bg-yellow-100 text-yellow-800')
    expect(getProposalStatusColor('ACCEPTED')).toBe('bg-green-100 text-green-800')
    expect(getProposalStatusColor('REJECTED')).toBe('bg-red-100 text-red-800')
    expect(getProposalStatusColor('ARCHIVED')).toBe('bg-gray-100 text-gray-800')
  })
})

describe('Notification Utils', () => {
  test('getNotificationTypeText should return correct Korean text', () => {
    expect(getNotificationTypeText('NEW_PROPOSAL')).toBe('새 제안')
    expect(getNotificationTypeText('PROPOSAL_RESPONSE')).toBe('제안 응답')
    expect(getNotificationTypeText('NEW_MESSAGE')).toBe('새 메시지')
    expect(getNotificationTypeText('PROPOSAL_ACCEPTED')).toBe('제안 수락')
    expect(getNotificationTypeText('PROPOSAL_REJECTED')).toBe('제안 거절')
  })

  test('getNotificationIcon should return correct emojis', () => {
    expect(getNotificationIcon('NEW_PROPOSAL')).toBe('📝')
    expect(getNotificationIcon('PROPOSAL_RESPONSE')).toBe('💬')
    expect(getNotificationIcon('NEW_MESSAGE')).toBe('💌')
    expect(getNotificationIcon('PROPOSAL_ACCEPTED')).toBe('✅')
    expect(getNotificationIcon('PROPOSAL_REJECTED')).toBe('❌')
  })
})

describe('Time Formatting', () => {
  beforeEach(() => {
    // 고정된 현재 시간 설정 (2024-01-01T01:00:00Z)
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T01:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('formatProposalTime should format relative time correctly', () => {
    // 방금 전
    expect(formatProposalTime('2024-01-01T01:00:00Z')).toBe('방금 전')

    // 30분 전
    expect(formatProposalTime('2024-01-01T00:30:00Z')).toBe('30분 전')

    // 1시간 전 (수정: 정확한 1시간 차이)
    expect(formatProposalTime('2024-01-01T00:00:00Z')).toBe('1시간 전')

    // 1일 전 (수정: 정확한 24시간 차이)
    expect(formatProposalTime('2023-12-31T01:00:00Z')).toBe('1일 전')
  })
})

describe('Budget Formatting', () => {
  test('formatBudgetRange should handle various inputs', () => {
    expect(formatBudgetRange('100만원~500만원')).toBe('100만원~500만원')
    expect(formatBudgetRange('')).toBe('협의 가능')
    expect(formatBudgetRange(null)).toBe('협의 가능')
    expect(formatBudgetRange(undefined)).toBe('협의 가능')
    expect(formatBudgetRange('  ')).toBe('협의 가능')
  })
})

describe('Validation Functions', () => {
  test('validateProposal should validate proposal data correctly', () => {
    // 유효한 데이터
    const validData = {
      subject: '유효한 제목입니다',
      message: '유효한 메시지입니다. 충분히 긴 내용을 포함하고 있습니다.',
      budget_range: '100만원',
      timeline: '1개월'
    }
    const validResult = validateProposal(validData)
    expect(validResult.isValid).toBe(true)
    expect(validResult.errors).toEqual({})

    // 제목이 너무 짧음
    const shortSubjectData = { ...validData, subject: '짧음' }
    const shortSubjectResult = validateProposal(shortSubjectData)
    expect(shortSubjectResult.isValid).toBe(false)
    expect(shortSubjectResult.errors.subject).toBeTruthy()

    // 메시지가 너무 짧음
    const shortMessageData = { ...validData, message: '짧음' }
    const shortMessageResult = validateProposal(shortMessageData)
    expect(shortMessageResult.isValid).toBe(false)
    expect(shortMessageResult.errors.message).toBeTruthy()
  })

  test('validateMessage should validate message content correctly', () => {
    // 유효한 메시지
    const validResult = validateMessage('유효한 메시지입니다')
    expect(validResult.isValid).toBe(true)
    expect(validResult.errors.content).toBeFalsy()

    // 빈 메시지
    const emptyResult = validateMessage('')
    expect(emptyResult.isValid).toBe(false)
    expect(emptyResult.errors.content).toBeTruthy()

    // 너무 긴 메시지
    const longMessage = 'a'.repeat(2001)
    const longResult = validateMessage(longMessage)
    expect(longResult.isValid).toBe(false)
    expect(longResult.errors.content).toBeTruthy()
  })
})

describe('Content Sanitization', () => {
  test('sanitizeProposalContent should clean HTML and spaces', () => {
    expect(sanitizeProposalContent('<p>Hello World</p>')).toBe('Hello World')
    expect(sanitizeProposalContent('Multiple   spaces')).toBe('Multiple spaces')
    expect(sanitizeProposalContent('  Trimmed  ')).toBe('Trimmed')
    expect(sanitizeProposalContent('<script>alert("xss")</script>Clean text')).toBe('Clean text')
  })
})

describe('Permission Functions', () => {
  test('canEditProposal should check edit permissions correctly', () => {
    // Funder가 PENDING 제안 수정 가능
    const pendingProposal = { ...mockProposal, status: 'PENDING' as const }
    expect(canEditProposal(pendingProposal, 'funder-1')).toBe(true)

    // Funder가 ACCEPTED 제안 수정 불가
    const acceptedProposal = { ...mockProposal, status: 'ACCEPTED' as const }
    expect(canEditProposal(acceptedProposal, 'funder-1')).toBe(false)

    // Creator는 제안 수정 불가
    expect(canEditProposal(pendingProposal, 'creator-1')).toBe(false)

    // 로그인하지 않은 경우 수정 불가
    expect(canEditProposal(pendingProposal)).toBe(false)
  })

  test('canRespondToProposal should check respond permissions correctly', () => {
    const pendingProposal = { ...mockProposal, status: 'PENDING' as const }

    // Creator가 PENDING 제안에 응답 가능
    expect(canRespondToProposal(pendingProposal, 'creator-1')).toBe(true)

    // Funder는 제안에 응답 불가
    expect(canRespondToProposal(pendingProposal, 'funder-1')).toBe(false)

    // ACCEPTED 제안에는 응답 불가
    const acceptedProposal = { ...mockProposal, status: 'ACCEPTED' as const }
    expect(canRespondToProposal(acceptedProposal, 'creator-1')).toBe(false)
  })

  test('canDeleteProposal should check delete permissions correctly', () => {
    // Funder만 자신의 제안 삭제 가능
    expect(canDeleteProposal(mockProposal, 'funder-1')).toBe(true)
    expect(canDeleteProposal(mockProposal, 'creator-1')).toBe(false)
    expect(canDeleteProposal(mockProposal)).toBe(false)
  })

  test('canSendMessage should check message permissions correctly', () => {
    // 제안 당사자만 메시지 작성 가능
    expect(canSendMessage(mockProposal, 'funder-1')).toBe(true)
    expect(canSendMessage(mockProposal, 'creator-1')).toBe(true)
    expect(canSendMessage(mockProposal, 'other-user')).toBe(false)
    expect(canSendMessage(mockProposal)).toBe(false)
  })
})

describe('Utility Functions', () => {
  test('getProposalSummary should truncate long content', () => {
    const shortContent = { ...mockProposal, message: '짧은 메시지' }
    expect(getProposalSummary(shortContent)).toBe('짧은 메시지')

    const longContent = { ...mockProposal, message: 'a'.repeat(150) }
    const summary = getProposalSummary(longContent, 100)
    expect(summary.length).toBeLessThanOrEqual(103) // 100 + "..."
    expect(summary.endsWith('...')).toBe(true)
  })

  test('getProposalPriority should calculate priority correctly', () => {
    const pendingProposal = { ...mockProposal, status: 'PENDING' as const, unread_messages_count: 0 }
    const acceptedProposal = { ...mockProposal, status: 'ACCEPTED' as const, unread_messages_count: 0 }

    expect(getProposalPriority(pendingProposal)).toBeGreaterThan(
      getProposalPriority(acceptedProposal)
    )

    const proposalWithUnread = { ...pendingProposal, unread_messages_count: 5 }
    expect(getProposalPriority(proposalWithUnread)).toBeGreaterThan(
      getProposalPriority(pendingProposal)
    )
  })

  test('getProposalSearchText should create searchable text', () => {
    const searchText = getProposalSearchText(mockProposal)
    expect(searchText).toContain('협업 제안입니다')
    expect(searchText).toContain('investor123')
    expect(searchText).toContain('creator456')
    expect(searchText).toContain('멋진 ai 영상')
    expect(searchText).toContain('100만원~500만원')
  })
})

describe('Formatting Functions', () => {
  test('formatResponseRate should format rate correctly', () => {
    expect(formatResponseRate(0)).toBe('응답률 정보 없음')
    expect(formatResponseRate(75)).toBe('응답률 75%')
    expect(formatResponseRate(100)).toBe('응답률 100%')
  })
})

describe('URL Generation', () => {
  test('getProposalUrl should generate correct URL', () => {
    expect(getProposalUrl('proposal-123')).toBe('/proposals/proposal-123')
  })

  test('getVideoProposalUrl should generate correct URL with params', () => {
    const url = getVideoProposalUrl('video-123', 'creator-456')
    expect(url).toBe('/video/video-123?contact=creator-456')
  })
})