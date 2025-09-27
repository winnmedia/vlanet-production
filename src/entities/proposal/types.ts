/**
 * Proposal Entity Types
 * 제안(투자/협업) 시스템 타입 정의
 */

import type { ProfileRow } from '../user'

// 제안 상태
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED'

// 알림 타입
export type NotificationType =
  | 'NEW_PROPOSAL'
  | 'PROPOSAL_RESPONSE'
  | 'NEW_MESSAGE'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'

// 데이터베이스 테이블 인터페이스
export interface Proposal {
  id: string
  funder_id: string
  creator_id: string
  video_id?: string | null

  // 제안 내용
  subject: string
  message: string
  budget_range?: string | null
  timeline?: string | null

  // 상태 관리
  status: ProposalStatus
  responded_at?: string | null
  response_message?: string | null

  // 메타데이터
  created_at: string
  updated_at: string
}

// 작성자 정보가 포함된 제안
export interface ProposalWithAuthor extends Proposal {
  funder: ProfileRow
  creator: ProfileRow
  video?: {
    id: string
    title: string
    thumbnail_url?: string | null
  } | null
  unread_messages_count?: number
}

// 제안 메시지
export interface ProposalMessage {
  id: string
  proposal_id: string
  sender_id: string

  // 메시지 내용
  content: string
  attachment_url?: string | null
  attachment_name?: string | null

  // 상태
  is_read: boolean

  // 메타데이터
  created_at: string
  updated_at: string
}

// 작성자 정보가 포함된 메시지
export interface ProposalMessageWithAuthor extends ProposalMessage {
  sender: ProfileRow
}

// 알림
export interface Notification {
  id: string
  user_id: string

  // 알림 내용
  type: NotificationType
  title: string
  content: string

  // 연관 데이터
  proposal_id?: string | null
  video_id?: string | null

  // 상태
  is_read: boolean
  read_at?: string | null

  // 메타데이터
  created_at: string
}

// 제안 생성 데이터
export interface CreateProposalData {
  creator_id: string
  video_id?: string | null
  subject: string
  message: string
  budget_range?: string | null
  timeline?: string | null
}

// 제안 수정 데이터
export interface UpdateProposalData {
  subject?: string
  message?: string
  budget_range?: string | null
  timeline?: string | null
  status?: ProposalStatus
  response_message?: string | null
}

// 메시지 생성 데이터
export interface CreateMessageData {
  proposal_id: string
  content: string
  attachment_url?: string | null
  attachment_name?: string | null
}

// 제안 목록 옵션
export interface ProposalListOptions {
  user_id: string
  role: 'FUNDER' | 'CREATOR' // 수신/발신 구분
  status?: ProposalStatus
  limit?: number
  offset?: number
  sort?: 'newest' | 'oldest' | 'updated'
  search?: string // 제목/내용 검색
}

// 메시지 목록 옵션
export interface MessageListOptions {
  proposal_id: string
  limit?: number
  offset?: number
  mark_as_read?: boolean
}

// 알림 목록 옵션
export interface NotificationListOptions {
  user_id: string
  type?: NotificationType
  is_read?: boolean
  limit?: number
  offset?: number
}

// API 응답 타입들
export interface ProposalsResponse {
  proposals: ProposalWithAuthor[]
  total_count: number
  has_more: boolean
}

export interface MessagesResponse {
  messages: ProposalMessageWithAuthor[]
  total_count: number
  has_more: boolean
}

export interface NotificationsResponse {
  notifications: Notification[]
  total_count: number
  unread_count: number
  has_more: boolean
}

// 액션 결과 타입
export interface ProposalActionResult {
  success: boolean
  error?: string
  proposal?: ProposalWithAuthor
}

export interface MessageActionResult {
  success: boolean
  error?: string
  message?: ProposalMessageWithAuthor
}

export interface NotificationActionResult {
  success: boolean
  error?: string
  notification?: Notification
}

// 통계 타입
export interface ProposalStats {
  total_sent: number
  total_received: number
  pending_sent: number
  pending_received: number
  accepted: number
  rejected: number
  response_rate: number // 응답률 (%)
}

// 제안 유효성 검사 결과
export interface ProposalValidation {
  isValid: boolean
  errors: {
    subject?: string
    message?: string
    budget_range?: string
    timeline?: string
  }
}

// 메시지 유효성 검사 결과
export interface MessageValidation {
  isValid: boolean
  errors: {
    content?: string
  }
}