/**
 * Video Entity Public API
 * FSD 아키텍처에 따른 영상 엔티티의 공개 API
 */

// Types export
export type {
  Video,
  VideoWithDetails,
  VideoWithStats,
  VideoWithCreator,
  VideoStats,
  VideoCategory,
  VideoStatus,
  VideoUploadInput,
  VideoUpdateInput,
  VideoFile,
  UploadProgress,
  CreateVideoResult,
  UpdateVideoResult,
  DeleteVideoResult,
  GetVideosResult,
  GetVideoResult,
  VideoFilters,
  VideoSortOptions,
  PaginationOptions,
  GetVideosOptions,
  CreatorDashboardStats,
  TrendingVideo,
  VideoValidationError,
  VideoRow,
  VideoInsert,
  VideoUpdate,
  VideoStatsRow,
  VideoStatsInsert,
  VideoStatsUpdate,
  VideoCategoryRow,
} from './types';

// API Functions are available from './api' for server-side usage
// Import directly: import { getVideoById } from './api'

// Constants export
export {
  VIDEO_CONSTRAINTS,
  VIDEO_STATUS_LABELS,
  DEFAULT_CATEGORY_COLORS,
} from './types';

// Utility Functions export
export {
  formatVideoDuration,
  formatViewCount,
  calculateEngagementRate,
  isValidVideo,
  getCategoryColor,
  getAiModelIcon,
  validateVideoCodec,
} from './utils';

// Import types for internal use in this file
import type {
  VideoStatus,
  VideoUploadInput,
  VideoFilters,
  CreatorDashboardStats,
} from './types';
import { VIDEO_CONSTRAINTS } from './types';

// Utility functions
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getVideoAspectRatio = (width: number, height: number): string => {
  if (!width || !height) return 'Unknown';

  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);

  const aspectWidth = width / divisor;
  const aspectHeight = height / divisor;

  // 일반적인 비율 매핑
  if (aspectWidth === 16 && aspectHeight === 9) return '16:9';
  if (aspectWidth === 4 && aspectHeight === 3) return '4:3';
  if (aspectWidth === 1 && aspectHeight === 1) return '1:1';
  if (aspectWidth === 9 && aspectHeight === 16) return '9:16';

  return `${aspectWidth}:${aspectHeight}`;
};

export const isVideoProcessingComplete = (status: VideoStatus): boolean => {
  return status === 'published' || status === 'failed';
};

export const getVideoStatusColor = (status: VideoStatus): string => {
  const colors: Record<VideoStatus, string> = {
    uploading: '#FFA500',
    processing: '#00BFFF',
    published: '#00C851',
    failed: '#FF4444',
    deleted: '#757575',
  };

  return colors[status] || '#757575';
};

export const validateVideoFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 파일 크기 검사
  if (file.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
    errors.push(`파일 크기는 ${formatFileSize(VIDEO_CONSTRAINTS.MAX_FILE_SIZE)} 이하여야 합니다.`);
  }

  // 파일 형식 검사
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !VIDEO_CONSTRAINTS.ALLOWED_FORMATS.includes(fileExtension as 'mp4')) {
    errors.push(`지원되는 형식: ${VIDEO_CONSTRAINTS.ALLOWED_FORMATS.join(', ')}`);
  }

  // MIME 타입 검사
  if (!file.type.startsWith('video/')) {
    errors.push('올바른 비디오 파일을 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateVideoInput = (input: VideoUploadInput): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // 제목 검증
  if (!input.title?.trim()) {
    errors.title = '제목은 필수입니다.';
  } else if (input.title.length > VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH) {
    errors.title = `제목은 ${VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH}자 이하여야 합니다.`;
  }

  // 설명 검증
  if (input.description && input.description.length > VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH) {
    errors.description = `설명은 ${VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}자 이하여야 합니다.`;
  }

  // 프롬프트 검증
  if (input.prompt && input.prompt.length > VIDEO_CONSTRAINTS.MAX_PROMPT_LENGTH) {
    errors.prompt = `프롬프트는 ${VIDEO_CONSTRAINTS.MAX_PROMPT_LENGTH}자 이하여야 합니다.`;
  }

  // 태그 검증
  if (input.tags) {
    if (input.tags.length > VIDEO_CONSTRAINTS.MAX_TAGS) {
      errors.tags = `태그는 최대 ${VIDEO_CONSTRAINTS.MAX_TAGS}개까지 가능합니다.`;
    } else {
      const longTags = input.tags.filter(tag => tag.length > VIDEO_CONSTRAINTS.MAX_TAG_LENGTH);
      if (longTags.length > 0) {
        errors.tags = `각 태그는 ${VIDEO_CONSTRAINTS.MAX_TAG_LENGTH}자 이하여야 합니다.`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// 검색 쿼리 생성 헬퍼
export const buildVideoSearchQuery = (filters: VideoFilters) => {
  const searchParams = new URLSearchParams();

  if (filters.search_query) {
    searchParams.set('q', filters.search_query);
  }

  if (filters.categories?.length) {
    searchParams.set('categories', filters.categories.join(','));
  }

  if (filters.creator_id) {
    searchParams.set('creator', filters.creator_id);
  }

  if (filters.tags?.length) {
    searchParams.set('tags', filters.tags.join(','));
  }

  if (filters.is_featured) {
    searchParams.set('featured', 'true');
  }

  if (filters.date_from) {
    searchParams.set('from', filters.date_from);
  }

  if (filters.date_to) {
    searchParams.set('to', filters.date_to);
  }

  return searchParams.toString();
};

// 대시보드 통계 포맷팅
export const formatDashboardStats = (stats: CreatorDashboardStats) => {
  return {
    ...stats,
    total_revenue_formatted: new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(stats.total_revenue),
    total_views_formatted: new Intl.NumberFormat('ko-KR').format(stats.total_views),
    total_likes_formatted: new Intl.NumberFormat('ko-KR').format(stats.total_likes),
  };
};