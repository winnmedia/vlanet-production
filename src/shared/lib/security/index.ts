/**
 * 보안 유틸리티 Public API
 * XSS 방어, 입력 검증, 레이트 리미팅, 보안 헤더 관리
 */

// 환경변수 및 보안 설정
export {
  env,
  getSecurityHeaders,
  isProduction,
  isDevelopment,
  isTest,
  isFeatureEnabled,
  type Env,
} from '../../config/env';

// 입력 검증 및 새니타이제이션
export {
  sanitizeHtml,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeUserInput,
  validateForSqlInjection,
  validateFileUpload,
  logCspViolation,

  // Zod 스키마
  userNameSchema,
  emailSchema,
  videoTitleSchema,
  videoDescriptionSchema,
  commentContentSchema,
  urlSchema,
} from './sanitize';

// 레이트 리미팅
export {
  createRateLimitMiddleware,
  createUserBasedKeyGenerator,
  checkRateLimit,
  getRateLimitInfo,
  resetRateLimit,
  getRateLimitStats,
  rateLimitConfigs,
  rateLimitMiddlewares,
} from './rate-limit';

// 보안 상수
export const SECURITY_CONSTANTS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_VIDEO_DURATION: 600, // 10분
  MAX_USERNAME_LENGTH: 50,
  MAX_COMMENT_LENGTH: 1000,
  MAX_VIDEO_TITLE_LENGTH: 200,
  MAX_VIDEO_DESCRIPTION_LENGTH: 5000,

  // 허용된 파일 타입
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/ogg',
  ],

  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],

  // 보안 헤더
  SECURITY_HEADERS: {
    XSS_PROTECTION: '1; mode=block',
    CONTENT_TYPE_OPTIONS: 'nosniff',
    FRAME_OPTIONS: 'DENY',
    REFERRER_POLICY: 'origin-when-cross-origin',
  },
} as const;

// 타입 정의
export type SecurityConfig = typeof SECURITY_CONSTANTS;
export type AllowedVideoType = typeof SECURITY_CONSTANTS.ALLOWED_VIDEO_TYPES[number];
export type AllowedImageType = typeof SECURITY_CONSTANTS.ALLOWED_IMAGE_TYPES[number];