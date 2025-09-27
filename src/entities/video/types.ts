/**
 * Video Entity Types
 * 영상 관련 모든 TypeScript 타입 정의
 */

import { Database } from '../../shared/api/supabase/types';

// Supabase 테이블 타입 추출
export type VideoRow = Database['public']['Tables']['videos']['Row'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export type VideoStatsRow = Database['public']['Tables']['video_stats']['Row'];
export type VideoStatsInsert = Database['public']['Tables']['video_stats']['Insert'];
export type VideoStatsUpdate = Database['public']['Tables']['video_stats']['Update'];

export type VideoCategoryRow = Database['public']['Tables']['video_categories']['Row'];

// 영상 상태 타입
export type VideoStatus = 'uploading' | 'processing' | 'published' | 'failed' | 'deleted';

// AI 메타데이터 확장 타입 (Phase 2)
export type AiModelType =
  | 'sora'
  | 'runway_gen3'
  | 'kling'
  | 'luma_dream'
  | 'haiper'
  | 'pika'
  | 'minimax'
  | 'other';

export type VideoGenre =
  | 'narrative'     // 내러티브/스토리
  | 'abstract'      // 추상적
  | 'documentary'   // 다큐멘터리
  | 'commercial'    // 광고/상업적
  | 'educational'   // 교육용
  | 'entertainment' // 엔터테인먼트
  | 'artistic'      // 예술적
  | 'experimental'; // 실험적

export type VisualStyle =
  | 'realistic'     // 사실적
  | 'stylized'      // 양식화된
  | 'cartoon'       // 만화/애니메이션
  | 'cinematic'     // 영화적
  | 'minimalist'    // 미니멀
  | 'vintage'       // 빈티지
  | 'futuristic'    // 미래적
  | 'artistic';     // 예술적

// 기본 비디오 타입 (AI 메타데이터 확장 포함)
export interface Video {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  tags: string[];

  // 기본 AI 정보
  ai_model: AiModelType | null;
  prompt: string | null;

  // 확장된 AI 메타데이터 (Phase 2)
  genre: VideoGenre | null;
  visual_style: VisualStyle | null;
  ai_tools: string[] | null;
  technical_specs: Record<string, any> | null;
  style_tags: string[];
  mood_tags: string[];
  target_audience: string[] | null;
  production_complexity: number; // 1-5
  estimated_budget_range: string | null;
  commercial_potential: number; // 1-5

  // 파일 정보
  video_url: string | null;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size: number | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  format: string;

  // 상태 관리
  status: VideoStatus;
  upload_progress: number;
  error_message: string | null;

  // 공개 설정
  is_public: boolean;
  is_featured: boolean;

  // 타임스탬프
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
}

// 통계 정보를 포함한 비디오 타입
export interface VideoWithStats extends Video {
  stats: VideoStats;
}

// Creator 정보를 포함한 비디오 타입
export interface VideoWithCreator extends Video {
  creator: {
    username: string;
    avatar_url: string | null;
  };
}

// 완전한 비디오 정보 (통계 + Creator)
export interface VideoWithDetails extends Video {
  stats: VideoStats | null;
  creator: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio?: string | null;
    stats?: {
      total_videos: number;
      followers?: number;
    };
  } | null;
  categories?: VideoCategory[];
  userReaction?: 'like' | 'dislike' | null; // 현재 사용자의 반응
}

// 영상 통계
export interface VideoStats {
  video_id: string;
  view_count: number;
  unique_view_count: number;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  share_count: number;
  investment_interest_count: number;
  total_investment_amount: number;
  total_revenue: number;
  creator_earnings: number;
  last_viewed_at: string | null;
  trending_score: number;
  completion_rate: number;
  updated_at: string;
}

// AI 기술 스택 정보 (Phase 2)
export interface AiTechStack {
  id: string;
  video_id: string;
  primary_ai_model: AiModelType;
  model_version: string | null;
  training_data_source: string | null;
  generation_params: Record<string, any>;
  post_processing_tools: string[] | null;
  generation_time_seconds: number | null;
  iterations_count: number;
  success_rate: number | null;
  generation_cost: number | null;
  compute_units_used: number | null;
  created_at: string;
}

// 투자자 선호도 (Phase 2)
export interface InvestorPreferences {
  id: string;
  investor_id: string;
  preferred_genres: VideoGenre[] | null;
  preferred_styles: VisualStyle[] | null;
  preferred_ai_models: AiModelType[] | null;
  min_investment_amount: number;
  max_investment_amount: number | null;
  preferred_complexity_range: number[];
  min_commercial_potential: number;
  target_audience_match: string[] | null;
  exclude_tags: string[];
  preferred_regions: string[] | null;
  preferred_languages: string[];
  created_at: string;
  updated_at: string;
}

// 투자자-비디오 매칭 결과
export interface InvestorVideoMatch {
  investor_id: string;
  video_id: string;
  video_title: string;
  creator_id: string;
  creator_username: string;
  genre: VideoGenre | null;
  visual_style: VisualStyle | null;
  ai_model: AiModelType | null;
  commercial_potential: number;
  investment_interest_count: number;
  total_investment_amount: number;
  match_score: number;
  created_at: string;
  trending_score: number;
}

// 창작자 잠재 투자자 매칭
export interface CreatorPotentialInvestor {
  creator_id: string;
  video_id: string;
  investor_id: string;
  investor_username: string;
  match_score: number;
  max_investment_amount: number | null;
  min_investment_amount: number;
  commercial_potential: number;
  investment_interest_count: number;
}

// 영상 카테고리
export interface VideoCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// 영상 업로드 관련 타입 (AI 메타데이터 확장 포함)
export interface VideoUploadInput {
  title: string;
  description?: string;
  tags?: string[];

  // 기본 AI 정보
  ai_model?: AiModelType;
  prompt?: string;

  // 확장된 AI 메타데이터 (Phase 2)
  genre?: VideoGenre;
  visual_style?: VisualStyle;
  ai_tools?: string[];
  technical_specs?: Record<string, any>;
  style_tags?: string[];
  mood_tags?: string[];
  target_audience?: string[];
  production_complexity?: number; // 1-5
  estimated_budget_range?: string;
  commercial_potential?: number; // 1-5

  // 공개 설정
  is_public?: boolean;
  categories?: string[];
}

export interface VideoUpdateInput {
  title?: string;
  description?: string;
  tags?: string[];

  // 기본 AI 정보
  ai_model?: AiModelType;
  prompt?: string;

  // 확장된 AI 메타데이터 (Phase 2)
  genre?: VideoGenre;
  visual_style?: VisualStyle;
  ai_tools?: string[];
  technical_specs?: Record<string, any>;
  style_tags?: string[];
  mood_tags?: string[];
  target_audience?: string[];
  production_complexity?: number; // 1-5
  estimated_budget_range?: string;
  commercial_potential?: number; // 1-5

  // 공개 설정
  is_public?: boolean;
  is_featured?: boolean;
  categories?: string[];
}

// 파일 업로드 관련 타입
export interface VideoFile {
  file: File;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export interface UploadProgress {
  video_id: string;
  progress: number;
  status: VideoStatus;
  error_message?: string;
}

// API 응답 타입들
export interface CreateVideoResult {
  success: boolean;
  video?: Video;
  upload_url?: string;
  error?: string;
  field?: string;
}

export interface UpdateVideoResult {
  success: boolean;
  video?: Video;
  error?: string;
  field?: string;
}

export interface DeleteVideoResult {
  success: boolean;
  error?: string;
}

export interface GetVideosResult {
  videos: VideoWithDetails[];
  total_count: number;
  has_more: boolean;
}

export interface GetVideoResult {
  success: boolean;
  video?: VideoWithDetails;
  error?: string;
}

// 검색 및 필터링 타입 (AI 메타데이터 확장 포함)
export interface VideoFilters {
  creator_id?: string;
  categories?: string[];
  status?: VideoStatus[];
  is_public?: boolean;
  is_featured?: boolean;
  search_query?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;

  // AI 메타데이터 필터 (Phase 2)
  ai_models?: AiModelType[];
  genres?: VideoGenre[];
  visual_styles?: VisualStyle[];
  ai_tools?: string[];
  style_tags?: string[];
  mood_tags?: string[];
  target_audience?: string[];
  min_production_complexity?: number;
  max_production_complexity?: number;
  min_commercial_potential?: number;
  max_commercial_potential?: number;
  budget_ranges?: string[];
}

export interface VideoSortOptions {
  field: 'created_at' | 'published_at' | 'view_count' | 'like_count' | 'trending_score' | 'title'
        | 'commercial_potential' | 'production_complexity' | 'match_score';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface GetVideosOptions {
  filters?: VideoFilters;
  sort?: VideoSortOptions;
  pagination?: PaginationOptions;
}

// 대시보드 관련 타입
export interface CreatorDashboardStats {
  total_videos: number;
  published_videos: number;
  total_views: number;
  total_likes: number;
  total_revenue: number;
  pending_uploads: number;
  failed_uploads: number;
}

export interface TrendingVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  trending_score: number;
  created_at: string;
}

// 에러 타입
export interface VideoValidationError {
  field: string;
  message: string;
}

// 업로드 제한 상수
export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 209715200, // 200MB
  MAX_DURATION: 120, // 2분
  ALLOWED_FORMATS: ['mp4'],
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_PROMPT_LENGTH: 1000,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 30,
} as const;

// 상태 레이블 매핑
export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  uploading: '업로드 중',
  processing: '처리 중',
  published: '게시됨',
  failed: '실패',
  deleted: '삭제됨',
} as const;

// 카테고리 색상 기본값
export const DEFAULT_CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
  '#10AC84', '#EE5A24', '#0984E3', '#A29BFE',
] as const;

// AI 메타데이터 관련 상수 및 레이블 (Phase 2)
export const AI_MODEL_LABELS: Record<AiModelType, string> = {
  sora: 'OpenAI Sora',
  runway_gen3: 'Runway Gen-3',
  kling: 'Kling AI',
  luma_dream: 'Luma Dream Machine',
  haiper: 'Haiper AI',
  pika: 'Pika Labs',
  minimax: 'MiniMax',
  other: '기타',
} as const;

export const VIDEO_GENRE_LABELS: Record<VideoGenre, string> = {
  narrative: '내러티브/스토리',
  abstract: '추상적',
  documentary: '다큐멘터리',
  commercial: '광고/상업적',
  educational: '교육용',
  entertainment: '엔터테인먼트',
  artistic: '예술적',
  experimental: '실험적',
} as const;

export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  realistic: '사실적',
  stylized: '양식화된',
  cartoon: '만화/애니메이션',
  cinematic: '영화적',
  minimalist: '미니멀',
  vintage: '빈티지',
  futuristic: '미래적',
  artistic: '예술적',
} as const;

export const PRODUCTION_COMPLEXITY_LABELS: Record<number, string> = {
  1: '매우 단순',
  2: '단순',
  3: '보통',
  4: '복잡',
  5: '매우 복잡',
} as const;

export const COMMERCIAL_POTENTIAL_LABELS: Record<number, string> = {
  1: '낮음',
  2: '보통-',
  3: '보통',
  4: '높음',
  5: '매우 높음',
} as const;

export const BUDGET_RANGE_OPTIONS = [
  'under_1k',    // 100만원 미만
  '1k_5k',       // 100-500만원
  '5k_10k',      // 500-1000만원
  '10k_50k',     // 1000-5000만원
  '50k_100k',    // 5000만원-1억원
  'over_100k',   // 1억원 이상
] as const;

export const BUDGET_RANGE_LABELS: Record<string, string> = {
  under_1k: '100만원 미만',
  '1k_5k': '100-500만원',
  '5k_10k': '500-1000만원',
  '10k_50k': '1000-5000만원',
  '50k_100k': '5000만원-1억원',
  over_100k: '1억원 이상',
} as const;

// 매칭 시스템 상수
export const MATCH_SCORE_THRESHOLDS = {
  EXCELLENT: 90,    // 매우 우수한 매칭
  GOOD: 70,         // 좋은 매칭
  FAIR: 50,         // 보통 매칭
  POOR: 30,         // 낮은 매칭
} as const;

export const MATCH_SCORE_LABELS: Record<string, string> = {
  EXCELLENT: '매우 우수',
  GOOD: '좋음',
  FAIR: '보통',
  POOR: '낮음',
} as const;