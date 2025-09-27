/**
 * Video Reactions (Like/Dislike)
 * 영상 좋아요/싫어요 기능
 */

'use server';

import { createServerClient } from '../../shared/api/supabase/server';

export interface ReactionParams {
  videoId: string;
  reactionType: 'like' | 'dislike';
}

export interface ReactionResult {
  success: boolean;
  error?: string;
  stats?: {
    likeCount: number;
    dislikeCount: number;
  };
}

/**
 * 영상 반응 토글 (좋아요/싫어요)
 */
export async function toggleVideoReaction(params: ReactionParams): Promise<ReactionResult> {
  try {
    const supabase = await createServerClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // 영상 존재 확인 및 권한 체크
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, is_public, status')
      .eq('id', params.videoId)
      .single();

    if (videoError || !video) {
      return { success: false, error: 'Video not found' };
    }

    if (!video.is_public || video.status !== 'published') {
      return { success: false, error: 'Video is not accessible' };
    }

    // 기존 반응 확인
    const { data: existingReaction } = await supabase
      .from('video_reactions')
      .select('id, reaction_type')
      .eq('user_id', user.id)
      .eq('video_id', params.videoId)
      .single();

    if (existingReaction) {
      if (existingReaction.reaction_type === params.reactionType) {
        // 같은 반응 -> 삭제
        const { error: deleteError } = await supabase
          .from('video_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
      } else {
        // 다른 반응 -> 업데이트
        const { error: updateError } = await supabase
          .from('video_reactions')
          .update({
            reaction_type: params.reactionType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReaction.id);

        if (updateError) {
          return { success: false, error: updateError.message };
        }
      }
    } else {
      // 새 반응 생성
      const { error: insertError } = await supabase
        .from('video_reactions')
        .insert({
          user_id: user.id,
          video_id: params.videoId,
          reaction_type: params.reactionType,
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    // 업데이트된 통계 조회
    const { data: stats } = await supabase
      .from('video_stats')
      .select('like_count, dislike_count')
      .eq('video_id', params.videoId)
      .single();

    return {
      success: true,
      stats: {
        likeCount: stats?.like_count || 0,
        dislikeCount: stats?.dislike_count || 0,
      },
    };
  } catch (error) {
    console.error('toggleVideoReaction 예외:', error);
    return { success: false, error: 'Failed to process reaction' };
  }
}

/**
 * 사용자의 영상 반응 상태 조회
 */
export async function getUserVideoReaction(videoId: string): Promise<'like' | 'dislike' | null> {
  try {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: reaction } = await supabase
      .from('video_reactions')
      .select('reaction_type')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    return reaction?.reaction_type || null;
  } catch (error) {
    console.error('getUserVideoReaction 예외:', error);
    return null;
  }
}

/**
 * 영상의 반응 통계 조회
 */
export async function getVideoReactionStats(videoId: string): Promise<{ likeCount: number; dislikeCount: number }> {
  try {
    const supabase = await createServerClient();

    const { data: stats } = await supabase
      .from('video_stats')
      .select('like_count, dislike_count')
      .eq('video_id', videoId)
      .single();

    return {
      likeCount: stats?.like_count || 0,
      dislikeCount: stats?.dislike_count || 0,
    };
  } catch (error) {
    console.error('getVideoReactionStats 예외:', error);
    return { likeCount: 0, dislikeCount: 0 };
  }
}