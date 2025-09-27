/**
 * Proposal Entity Public API
 * FSD 아키텍처에 따른 제안 엔티티의 공개 인터페이스
 */

// Types
export type {
  // 기본 타입
  ProposalStatus,
  NotificationType,
  Proposal,
  ProposalWithAuthor,
  ProposalMessage,
  ProposalMessageWithAuthor,
  Notification,

  // 입력 데이터 타입
  CreateProposalData,
  UpdateProposalData,
  CreateMessageData,

  // 옵션 타입
  ProposalListOptions,
  MessageListOptions,
  NotificationListOptions,

  // 응답 타입
  ProposalsResponse,
  MessagesResponse,
  NotificationsResponse,

  // 액션 결과 타입
  ProposalActionResult,
  MessageActionResult,
  NotificationActionResult,

  // 통계 및 유틸 타입
  ProposalStats,
  ProposalValidation,
  MessageValidation
} from './types'

// API Functions are available from './api' for server-side usage
// Import directly: import { getProposalsByUser } from './api'

// Utility Functions
export {
  // 상태 관련
  getProposalStatusText,
  getProposalStatusColor,
  getProposalStatusOptions,

  // 알림 관련
  getNotificationTypeText,
  getNotificationIcon,

  // 포맷팅
  formatProposalTime,
  formatBudgetRange,
  formatResponseRate,

  // 유효성 검사
  validateProposal,
  validateMessage,

  // 권한 검사
  canEditProposal,
  canRespondToProposal,
  canDeleteProposal,
  canSendMessage,

  // 유틸리티
  sanitizeProposalContent,
  getProposalSummary,
  getProposalPriority,
  getProposalSearchText,
  getProposalUrl,
  getVideoProposalUrl
} from './utils'