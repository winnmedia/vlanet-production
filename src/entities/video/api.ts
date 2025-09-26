/**
 * Video Entity API Functions
 * 영상 관련 Supabase 데이터베이스 접근 함수들
 */

import { createServerClient } from '@/shared/api/supabase/server';
import type {
  Video,
  VideoWithDetails,
  VideoWithStats,
  VideoWithCreator,
  VideoStats,
  VideoCategory,
  VideoUploadInput,
  VideoUpdateInput,
  CreateVideoResult,
  UpdateVideoResult,
  DeleteVideoResult,
  GetVideosResult,
  GetVideoResult,
  GetVideosOptions,
  CreatorDashboardStats,
  TrendingVideo,
} from './types';

/**
 * 영상 생성 (메타데이터만)
 */
export async function createVideo(
  creatorId: string,
  input: VideoUploadInput,
): Promise<CreateVideoResult> {
  try {
    const supabase = await createServerClient();

    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        creator_id: creatorId,
        title: input.title,
        description: input.description || null,
        tags: input.tags || [],
        ai_model: input.ai_model || null,
        prompt: input.prompt || null,
        is_public: input.is_public ?? true,
        status: 'uploading',
        upload_progress: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('영상 생성 오류:', error);
      return {
        success: false,
        error: '영상 생성 중 오류가 발생했습니다.',
      };
    }

    // 카테고리 연결 (선택사항)
    if (input.categories && input.categories.length > 0) {
      const categoryRelations = input.categories.map(categoryId => ({
        video_id: video.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('video_category_relations')
        .insert(categoryRelations);

      if (categoryError) {
        console.error('카테고리 연결 오류:', categoryError);
        // 카테고리 오류는 영상 생성을 실패시키지 않음
      }
    }

    return {
      success: true,
      video: video as Video,
    };
  } catch (error) {
    console.error('영상 생성 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 업데이트
 */
export async function updateVideo(
  videoId: string,
  creatorId: string,
  input: VideoUpdateInput,
): Promise<UpdateVideoResult> {
  try {
    const supabase = await createServerClient();

    const { data: video, error } = await supabase
      .from('videos')
      .update({
        title: input.title,
        description: input.description,
        tags: input.tags,
        ai_model: input.ai_model,
        prompt: input.prompt,
        is_public: input.is_public,
        is_featured: input.is_featured,
      })
      .eq('id', videoId)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('영상 업데이트 오류:', error);
      return {
        success: false,
        error: '영상 업데이트 중 오류가 발생했습니다.',
      };
    }

    // 카테고리 업데이트 (선택사항)
    if (input.categories) {
      // 기존 카테고리 관계 삭제
      await supabase
        .from('video_category_relations')
        .delete()
        .eq('video_id', videoId);

      // 새 카테고리 관계 생성
      if (input.categories.length > 0) {
        const categoryRelations = input.categories.map(categoryId => ({
          video_id: videoId,
          category_id: categoryId,
        }));

        await supabase
          .from('video_category_relations')
          .insert(categoryRelations);
      }
    }

    return {
      success: true,
      video: video as Video,
    };
  } catch (error) {
    console.error('영상 업데이트 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 상태 업데이트 (업로드 진행률 등)
 */
export async function updateVideoStatus(
  videoId: string,
  creatorId: string,
  status: Video['status'],
  progress?: number,
  errorMessage?: string,
  fileInfo?: {
    video_url?: string;
    thumbnail_url?: string;
    file_name?: string;
    file_size?: number;
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
  },
): Promise<UpdateVideoResult> {
  try {
    const supabase = await createServerClient();

    const updateData: any = {
      status,
      ...(progress !== undefined && { upload_progress: progress }),
      ...(errorMessage !== undefined && { error_message: errorMessage }),
      ...fileInfo,
    };

    const { data: video, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('영상 상태 업데이트 오류:', error);
      return {
        success: false,
        error: '영상 상태 업데이트 중 오류가 발생했습니다.',
      };
    }

    return {
      success: true,
      video: video as Video,
    };
  } catch (error) {
    console.error('영상 상태 업데이트 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 삭제 (소프트 삭제)
 */
export async function deleteVideo(
  videoId: string,
  creatorId: string,
): Promise<DeleteVideoResult> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('videos')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .eq('creator_id', creatorId);

    if (error) {
      console.error('영상 삭제 오류:', error);
      return {
        success: false,
        error: '영상 삭제 중 오류가 발생했습니다.',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('영상 삭제 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 단일 영상 조회 (상세 정보 포함)
 */
export async function getVideoById(
  videoId: string,
  includePrivate = false,
): Promise<GetVideoResult> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('videos')
      .select(`
        *,
        stats:video_stats(*),
        creator:profiles!videos_creator_id_fkey(
          username,
          avatar_url
        ),
        categories:video_category_relations(
          category:video_categories(*)
        )
      `)
      .eq('id', videoId)
      .is('deleted_at', null);

    // 비공개 영상 접근 권한 체크
    if (!includePrivate) {
      query = query.eq('is_public', true).eq('status', 'published');
    }

    const { data: video, error } = await query.single();

    if (error) {
      console.error('영상 조회 오류:', error);
      return {
        success: false,
        error: '영상을 찾을 수 없습니다.',
      };
    }

    // 데이터 구조 변환
    const videoWithDetails: VideoWithDetails = {
      ...video,
      stats: video.stats || {
        video_id: video.id,
        view_count: 0,
        unique_view_count: 0,
        like_count: 0,
        dislike_count: 0,
        comment_count: 0,
        share_count: 0,
        investment_interest_count: 0,
        total_investment_amount: 0,
        total_revenue: 0,
        creator_earnings: 0,
        last_viewed_at: null,
        trending_score: 0,
        updated_at: video.updated_at,
      },
      creator: video.creator || { username: 'Unknown', avatar_url: null },
      categories: video.categories?.map((rel: any) => rel.category) || [],
    };

    return {
      success: true,
      video: videoWithDetails,
    };
  } catch (error) {
    console.error('영상 조회 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * Creator의 영상 목록 조회
 */
export async function getCreatorVideos(
  creatorId: string,
  options?: GetVideosOptions,
): Promise<GetVideosResult> {
  try {
    const supabase = await createServerClient();
    const { filters, sort, pagination } = options || {};

    let query = supabase
      .from('videos')
      .select(`
        *,
        stats:video_stats(*),
        creator:profiles!videos_creator_id_fkey(
          username,
          avatar_url
        ),
        categories:video_category_relations(
          category:video_categories(*)
        )
      `, { count: 'exact' })
      .eq('creator_id', creatorId)
      .is('deleted_at', null);

    // 필터 적용
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    if (filters?.search_query) {
      query = query.ilike('title', `%${filters.search_query}%`);
    }

    // 정렬
    const sortField = sort?.field || 'created_at';
    const sortDirection = sort?.direction || 'desc';
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // 페이지네이션
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: videos, error, count } = await query;

    if (error) {
      console.error('Creator 영상 조회 오류:', error);
      return {
        videos: [],
        total_count: 0,
        has_more: false,
      };
    }

    // 데이터 구조 변환
    const videosWithDetails: VideoWithDetails[] = videos?.map(video => ({
      ...video,
      stats: video.stats || {
        video_id: video.id,
        view_count: 0,
        unique_view_count: 0,
        like_count: 0,
        dislike_count: 0,
        comment_count: 0,
        share_count: 0,
        investment_interest_count: 0,
        total_investment_amount: 0,
        total_revenue: 0,
        creator_earnings: 0,
        last_viewed_at: null,
        trending_score: 0,
        updated_at: video.updated_at,
      },
      creator: video.creator || { username: 'Unknown', avatar_url: null },
      categories: video.categories?.map((rel: any) => rel.category) || [],
    })) || [];

    const totalCount = count || 0;
    const hasMore = offset + videos.length < totalCount;

    return {
      videos: videosWithDetails,
      total_count: totalCount,
      has_more: hasMore,
    };
  } catch (error) {
    console.error('Creator 영상 조회 예외:', error);
    return {
      videos: [],
      total_count: 0,
      has_more: false,
    };
  }
}

/**
 * 공개 영상 목록 조회
 */
export async function getPublicVideos(
  options?: GetVideosOptions,
): Promise<GetVideosResult> {
  try {
    const supabase = await createServerClient();
    const { filters, sort, pagination } = options || {};

    let query = supabase
      .from('videos')
      .select(`
        *,
        stats:video_stats(*),
        creator:profiles!videos_creator_id_fkey(
          username,
          avatar_url
        ),
        categories:video_category_relations(
          category:video_categories(*)
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .eq('status', 'published')
      .is('deleted_at', null);

    // 필터 적용
    if (filters?.creator_id) {
      query = query.eq('creator_id', filters.creator_id);
    }
    if (filters?.categories && filters.categories.length > 0) {
      query = query.in('video_category_relations.category_id', filters.categories);
    }
    if (filters?.search_query) {
      query = query.textSearch('title', filters.search_query);
    }
    if (filters?.is_featured) {
      query = query.eq('is_featured', filters.is_featured);
    }

    // 정렬
    const sortField = sort?.field || 'created_at';
    const sortDirection = sort?.direction || 'desc';

    if (sortField === 'trending_score') {
      query = query.order('video_stats.trending_score', {
        ascending: sortDirection === 'asc',
        referencedTable: 'video_stats'
      });
    } else if (sortField === 'view_count') {
      query = query.order('video_stats.view_count', {
        ascending: sortDirection === 'asc',
        referencedTable: 'video_stats'
      });
    } else if (sortField === 'like_count') {
      query = query.order('video_stats.like_count', {
        ascending: sortDirection === 'asc',
        referencedTable: 'video_stats'
      });
    } else {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    // 페이지네이션
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: videos, error, count } = await query;

    if (error) {
      console.error('공개 영상 조회 오류:', error);
      return {
        videos: [],
        total_count: 0,
        has_more: false,
      };
    }

    // 데이터 구조 변환
    const videosWithDetails: VideoWithDetails[] = videos?.map(video => ({
      ...video,
      stats: video.stats || {
        video_id: video.id,
        view_count: 0,
        unique_view_count: 0,
        like_count: 0,
        dislike_count: 0,
        comment_count: 0,
        share_count: 0,
        investment_interest_count: 0,
        total_investment_amount: 0,
        total_revenue: 0,
        creator_earnings: 0,
        last_viewed_at: null,
        trending_score: 0,
        updated_at: video.updated_at,
      },
      creator: video.creator || { username: 'Unknown', avatar_url: null },
      categories: video.categories?.map((rel: any) => rel.category) || [],
    })) || [];

    const totalCount = count || 0;
    const hasMore = offset + videos.length < totalCount;

    return {
      videos: videosWithDetails,
      total_count: totalCount,
      has_more: hasMore,
    };
  } catch (error) {
    console.error('공개 영상 조회 예외:', error);
    return {
      videos: [],
      total_count: 0,
      has_more: false,
    };
  }
}

/**
 * Creator 대시보드 통계 조회
 */
export async function getCreatorDashboardStats(
  creatorId: string,
): Promise<CreatorDashboardStats | null> {
  try {
    const supabase = await createServerClient();

    // 전체 통계 조회
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        status,
        stats:video_stats(
          view_count,
          like_count,
          total_revenue,
          creator_earnings
        )
      `)
      .eq('creator_id', creatorId)
      .is('deleted_at', null);

    if (videosError) {
      console.error('대시보드 통계 조회 오류:', videosError);
      return null;
    }

    const stats = videos?.reduce(
      (acc, video) => {
        acc.total_videos++;

        if (video.status === 'published') {
          acc.published_videos++;
        } else if (video.status === 'uploading' || video.status === 'processing') {
          acc.pending_uploads++;
        } else if (video.status === 'failed') {
          acc.failed_uploads++;
        }

        if (video.stats && Array.isArray(video.stats) && video.stats[0]) {
          const stats = video.stats[0];
          acc.total_views += stats.view_count || 0;
          acc.total_likes += stats.like_count || 0;
          acc.total_revenue += stats.creator_earnings || 0;
        }

        return acc;
      },
      {
        total_videos: 0,
        published_videos: 0,
        total_views: 0,
        total_likes: 0,
        total_revenue: 0,
        pending_uploads: 0,
        failed_uploads: 0,
      },
    );

    return stats;
  } catch (error) {
    console.error('대시보드 통계 조회 예외:', error);
    return null;
  }
}

/**
 * 모든 카테고리 조회
 */
export async function getVideoCategories(): Promise<VideoCategory[]> {
  try {
    const supabase = await createServerClient();

    const { data: categories, error } = await supabase
      .from('video_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('카테고리 조회 오류:', error);
      return [];
    }

    return categories as VideoCategory[];
  } catch (error) {
    console.error('카테고리 조회 예외:', error);
    return [];
  }
}

/**
 * 트렌딩 영상 조회
 */
export async function getTrendingVideos(limit = 10): Promise<TrendingVideo[]> {
  try {
    const supabase = await createServerClient();

    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        stats:video_stats(
          view_count,
          trending_score
        )
      `)
      .eq('is_public', true)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('stats.trending_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('트렌딩 영상 조회 오류:', error);
      return [];
    }

    return videos?.map(video => ({
      id: video.id,
      title: video.title,
      thumbnail_url: video.thumbnail_url,
      view_count: (Array.isArray(video.stats) && video.stats[0]) ? video.stats[0].view_count || 0 : 0,
      trending_score: (Array.isArray(video.stats) && video.stats[0]) ? video.stats[0].trending_score || 0 : 0,
      created_at: video.created_at,
    })) || [];
  } catch (error) {
    console.error('트렌딩 영상 조회 예외:', error);
    return [];
  }
}

/**
 * 관련 영상 조회 (추천 시스템)
 */
export async function getRelatedVideos(
  videoId: string,
  options: {
    limit?: number;
    excludeVideoId?: string;
    preferSameCreator?: boolean;
  } = {}
): Promise<VideoWithDetails[]> {
  try {
    const supabase = await createServerClient();
    const { limit = 12, excludeVideoId, preferSameCreator = false } = options;

    // 현재 영상 정보 조회
    const { data: currentVideo } = await supabase
      .from('videos')
      .select('creator_id, tags')
      .eq('id', videoId)
      .single();

    let query = supabase
      .from('videos')
      .select(`
        *,
        stats:video_stats(*),
        creator:profiles!creator_id(username, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'published')
      .is('deleted_at', null);

    // 현재 영상 제외
    if (excludeVideoId) {
      query = query.neq('id', excludeVideoId);
    }

    // 같은 창작자 우선
    if (preferSameCreator && currentVideo?.creator_id) {
      query = query.eq('creator_id', currentVideo.creator_id);
    }

    // 태그 기반 관련성 (PostgreSQL의 배열 연산자 사용)
    if (currentVideo?.tags && currentVideo.tags.length > 0) {
      query = query.overlaps('tags', currentVideo.tags);
    }

    const { data: videos, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('관련 영상 조회 오류:', error);
      return [];
    }

    return videos?.map(video => ({
      ...video,
      stats: Array.isArray(video.stats) && video.stats.length > 0 ? video.stats[0] : null,
    })) || [];
  } catch (error) {
    console.error('getRelatedVideos 예외:', error);
    return [];
  }
}