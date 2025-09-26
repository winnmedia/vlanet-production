/**
 * User Entity Types
 * 사용자 관련 모든 타입 정의
 */

/**
 * 사용자 역할 (관리자 포함 - Phase 3)
 */
export type UserRole = 'CREATOR' | 'FUNDER' | 'VIEWER' | 'ADMIN';

/**
 * 관리자 권한 레벨 (Phase 3)
 */
export type AdminPermissionLevel =
  | 'SUPER_ADMIN'       // 최고 관리자 (모든 권한)
  | 'CONTENT_MODERATOR' // 콘텐츠 관리자
  | 'CURATOR'           // 큐레이터 (featured 영상 관리)
  | 'ANALYTICS_VIEWER'; // 분석 뷰어 (읽기 전용)

/**
 * 데이터베이스 프로필 스키마 (관리자 필드 포함 - Phase 3)
 */
export interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  company: string | null;
  website: string | null;
  onboarding_completed: boolean;
  email_verified: boolean;

  // 관리자 관련 필드 (Phase 3)
  admin_level: AdminPermissionLevel | null;
  admin_notes: string | null;
  admin_activated_at: string | null;
  admin_activated_by: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * 프로필 생성/업데이트용 입력 타입
 */
export interface ProfileInput {
  username: string;
  role: UserRole;
  bio?: string;
  company?: string;
  website?: string;
}

/**
 * 프로필 업데이트용 부분 입력 타입
 */
export interface ProfileUpdateInput {
  username?: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  website?: string;
}

/**
 * 온보딩 단계별 데이터
 */
export interface OnboardingStep1 {
  role: UserRole;
}

export interface OnboardingStep2 {
  username: string;
  bio?: string;
  company?: string;
  website?: string;
}

export interface OnboardingData extends OnboardingStep1, OnboardingStep2 {}

/**
 * 사용자 정보 (인증 정보 + 프로필)
 */
export interface User {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  profile?: ProfileRow;
}

/**
 * Creator 전용 프로필 타입
 */
export interface CreatorProfile extends ProfileRow {
  role: 'CREATOR';
  bio: string;
}

/**
 * Funder 전용 프로필 타입
 */
export interface FunderProfile extends ProfileRow {
  role: 'FUNDER';
  company: string | null;
  website: string | null;
}

/**
 * Admin 전용 프로필 타입 (Phase 3)
 */
export interface AdminProfile extends ProfileRow {
  role: 'ADMIN';
  admin_level: AdminPermissionLevel;
  admin_notes: string | null;
  admin_activated_at: string;
  admin_activated_by: string;
}

/**
 * 프로필 상태
 */
export interface ProfileStatus {
  hasProfile: boolean;
  isOnboardingCompleted: boolean;
  needsOnboarding: boolean;
  role?: UserRole;
}

/**
 * API 응답 타입들
 */
export interface CreateProfileResult {
  success: boolean;
  profile?: ProfileRow;
  error?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  profile?: ProfileRow;
  error?: string;
}

export interface GetProfileResult {
  profile: ProfileRow | null;
  error?: string;
}

/**
 * 프로필 검증 에러 타입
 */
export interface ProfileValidationError {
  field: keyof ProfileInput;
  message: string;
}

/**
 * 통계 타입 (추후 확장용)
 */
export interface UserStats {
  totalCreators: number;
  totalFunders: number;
  totalUsers: number;
  recentSignups: number;
}

/**
 * 사용자 필터 및 정렬 옵션
 */
export interface UserFilters {
  role?: UserRole;
  onboardingCompleted?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

export interface UserSortOptions {
  field: 'created_at' | 'updated_at' | 'username';
  direction: 'asc' | 'desc';
}

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * 페이지네이션된 결과
 */
export interface PaginatedUsers {
  users: ProfileRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================================
// 관리자 시스템 타입들 (Phase 3)
// ============================================================================

/**
 * 큐레이션 카테고리
 */
export interface CurationCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  max_items: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 큐레이션된 비디오
 */
export interface CuratedVideo {
  id: string;
  category_id: string;
  video_id: string;
  curator_id: string | null;
  display_order: number;
  custom_title: string | null;
  custom_description: string | null;
  curator_notes: string | null;
  click_count: number;
  conversion_rate: number | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 콘텐츠 모더레이션 액션 타입
 */
export type ModerationActionType =
  | 'REPORTED'         // 신고됨
  | 'UNDER_REVIEW'     // 검토 중
  | 'APPROVED'         // 승인됨
  | 'REJECTED'         // 거부됨
  | 'HIDDEN'           // 숨김 처리
  | 'DELETED'          // 삭제됨
  | 'FEATURED'         // 추천됨
  | 'UNFEATURED';      // 추천 해제

/**
 * 신고 사유
 */
export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'  // 부적절한 콘텐츠
  | 'COPYRIGHT_VIOLATION'    // 저작권 위반
  | 'SPAM'                   // 스팸
  | 'MISLEADING_INFO'        // 잘못된 정보
  | 'HARASSMENT'             // 괴롭힘
  | 'OTHER';                 // 기타

/**
 * 콘텐츠 모더레이션 로그
 */
export interface ContentModerationLog {
  id: string;
  video_id: string;
  moderator_id: string | null;
  reporter_id: string | null;
  action_type: ModerationActionType;
  report_reason: ReportReason | null;
  reason_details: string | null;
  moderator_notes: string | null;
  previous_status: string | null;
  new_status: string | null;
  is_automated: boolean;
  ai_confidence_score: number | null;
  created_at: string;
}

/**
 * 일별 플랫폼 통계
 */
export interface DailyPlatformStats {
  stat_date: string;
  total_videos: number;
  new_videos: number;
  published_videos: number;
  total_users: number;
  new_users: number;
  active_creators: number;
  active_investors: number;
  total_views: number;
  total_likes: number;
  total_investments: number;
  reports_submitted: number;
  reports_resolved: number;
  content_moderated: number;
  created_at: string;
  updated_at: string;
}

/**
 * 관리자 대시보드 개요
 */
export interface AdminDashboardOverview {
  // 콘텐츠 현황
  total_videos: number;
  pending_review: number;
  featured_videos: number;
  reported_videos: number;

  // 사용자 현황
  total_users: number;
  new_users_today: number;
  active_creators: number;
  active_investors: number;

  // 성과 지표
  total_views: number;
  total_investments: number;
  avg_engagement_rate: number;

  // 모더레이션 현황
  pending_reports: number;
  resolved_today: number;
  moderation_accuracy: number;
}

/**
 * 큐레이션 성과 데이터
 */
export interface CurationPerformance {
  total_curated_videos: number;
  total_clicks: number;
  avg_click_rate: number;
  total_conversions: number;
  avg_conversion_rate: number;
  top_performing_video_id: string | null;
  performance_score: number;
}

/**
 * 모더레이션 대시보드 항목
 */
export interface ModerationDashboardItem {
  video_id: string;
  title: string;
  creator_id: string;
  creator_username: string;
  status: string;
  created_at: string;
  published_at: string | null;
  view_count: number;
  like_count: number;
  investment_interest_count: number;
  last_moderation_action: ModerationActionType | null;
  last_moderation_at: string | null;
  report_count: number;
  priority_score: number;
}

/**
 * 큐레이션 관리 개요 항목
 */
export interface CurationOverviewItem {
  category_id: string;
  category_name: string;
  display_order: number;
  max_items: number;
  category_active: boolean;
  current_items: number;
  total_clicks: number;
  avg_conversion_rate: number;
  last_updated: string | null;
}

/**
 * 관리자 권한 체크 헬퍼
 */
export interface AdminPermissionCheck {
  hasPermission: boolean;
  userLevel: AdminPermissionLevel | null;
  requiredLevel: AdminPermissionLevel;
}

// 관리자 시스템 상수들
export const ADMIN_PERMISSION_LABELS: Record<AdminPermissionLevel, string> = {
  SUPER_ADMIN: '최고 관리자',
  CONTENT_MODERATOR: '콘텐츠 관리자',
  CURATOR: '큐레이터',
  ANALYTICS_VIEWER: '분석 뷰어',
} as const;

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  REPORTED: '신고됨',
  UNDER_REVIEW: '검토 중',
  APPROVED: '승인됨',
  REJECTED: '거부됨',
  HIDDEN: '숨김 처리',
  DELETED: '삭제됨',
  FEATURED: '추천됨',
  UNFEATURED: '추천 해제',
} as const;

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  INAPPROPRIATE_CONTENT: '부적절한 콘텐츠',
  COPYRIGHT_VIOLATION: '저작권 위반',
  SPAM: '스팸',
  MISLEADING_INFO: '잘못된 정보',
  HARASSMENT: '괴롭힘',
  OTHER: '기타',
} as const;