/**
 * Video Interactions Feature Public API
 */

// Reactions
export {
  toggleVideoReaction,
  getUserVideoReaction,
  getVideoReactionStats,
} from './reactions';
export type { ReactionParams, ReactionResult } from './reactions';

// Investment Interest
export {
  addInvestmentInterest,
  cancelInvestmentInterest,
  getUserInvestmentInterest,
  getVideoInvestmentInterests,
  getPublicInvestmentInterests,
} from './investment';
export type { InvestmentInterestParams, InvestmentInterestResult } from './investment';

// Share
export {
  shareVideo,
  generateSocialShareUrls,
  generateEmbedCode,
  shareViaWebAPI,
  copyVideoLinkToClipboard,
} from './share';
export type { ShareVideoParams } from './share';