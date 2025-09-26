/**
 * Contact Features Public API
 * FSD 아키텍처에 따른 연락 기능의 공개 인터페이스
 */

// Server Actions
export {
  createProposalAction,
  updateProposalAction,
  respondToProposalAction,
  deleteProposalAction,
  createMessageAction,
  markNotificationAsReadAction,
  quickCreateProposalAction
} from './actions'

// Components
export { ProposalForm } from './components/ProposalForm'
export { ProposalList } from './components/ProposalList'
export { MessageThread } from './components/MessageThread'