/**
 * User Entity Public API
 * FSD 아키텍처에 따른 사용자 엔티티의 공개 API
 */

// Types export
export type {
  UserRole,
  ProfileRow,
  ProfileInput,
  ProfileUpdateInput,
  OnboardingStep1,
  OnboardingStep2,
  OnboardingData,
  User,
  CreatorProfile,
  FunderProfile,
  ProfileStatus,
  CreateProfileResult,
  UpdateProfileResult,
  GetProfileResult,
  ProfileValidationError,
  UserStats,
  UserFilters,
  UserSortOptions,
  PaginationOptions,
  PaginatedUsers,
} from './types';

// API Functions (server-side only)
// Note: API functions are not exported here to avoid server-side imports in client components
// Import directly from './api' when needed in server components

// Constants
export const USER_ROLES = {
  CREATOR: 'CREATOR' as const,
  FUNDER: 'FUNDER' as const,
  VIEWER: 'VIEWER' as const,
};

export const ROLE_LABELS = {
  CREATOR: '창작자',
  FUNDER: '투자자',
  VIEWER: '시청자',
};

export const ROLE_DESCRIPTIONS = {
  CREATOR: 'AI 영상을 제작하고 수익을 창출하는 창작자',
  FUNDER: 'AI 콘텐츠에 투자하여 함께 성장하는 투자자',
  VIEWER: '좋은 콘텐츠를 시청하고 즐기는 시청자',
};

// Validation constants
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
  COMPANY: {
    MAX_LENGTH: 100,
  },
  WEBSITE: {
    PATTERN: /^https?:\/\/.*/,
  },
} as const;