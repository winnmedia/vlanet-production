/**
 * Investment Interest
 * 영상 투자 관심 표시 기능
 */

'use server';

import { createServerClient } from '../../shared/api/supabase/server';

export interface InvestmentInterestParams {
  videoId: string;
  amountMin?: number;
  amountMax?: number;
  message?: string;
  contactEmail?: string;
  isPublic?: boolean;
}

export interface InvestmentInterestResult {
  success: boolean;
  error?: string;
  interestId?: string;
}

/**
 * 투자 관심 추가
 */
export async function addInvestmentInterest(params: InvestmentInterestParams): Promise<InvestmentInterestResult> {
  try {
    const supabase = await createServerClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // 사용자 프로필 확인 (FUNDER 역할인지)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    if (profile.role !== 'FUNDER') {
      return { success: false, error: 'Only funders can express investment interest' };
    }

    // 영상 정보 확인
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, creator_id, is_public, status')
      .eq('id', params.videoId)
      .single();

    if (videoError || !video) {
      return { success: false, error: 'Video not found' };
    }

    if (!video.is_public || video.status !== 'published') {
      return { success: false, error: 'Video is not accessible' };
    }

    if (video.creator_id === user.id) {
      return { success: false, error: 'Cannot invest in your own video' };
    }

    // 이미 관심을 표시했는지 확인
    const { data: existingInterest } = await supabase
      .from('investment_interests')
      .select('id, status')
      .eq('investor_id', user.id)
      .eq('video_id', params.videoId)
      .single();

    if (existingInterest) {
      if (existingInterest.status === 'cancelled') {
        // 취소된 관심을 다시 활성화
        const { data: updatedInterest, error: updateError } = await supabase
          .from('investment_interests')
          .update({
            status: 'interested',
            amount_range_min: params.amountMin,
            amount_range_max: params.amountMax,
            message: params.message,
            contact_email: params.contactEmail,
            is_public: params.isPublic || false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingInterest.id)
          .select()
          .single();

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        return { success: true, interestId: updatedInterest.id };
      } else {
        return { success: false, error: 'Investment interest already exists' };
      }
    }

    // 새 투자 관심 생성
    const { data: newInterest, error: insertError } = await supabase
      .from('investment_interests')
      .insert({
        investor_id: user.id,
        video_id: params.videoId,
        creator_id: video.creator_id,
        amount_range_min: params.amountMin,
        amount_range_max: params.amountMax,
        message: params.message,
        contact_email: params.contactEmail,
        is_public: params.isPublic || false,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, interestId: newInterest.id };
  } catch (error) {
    console.error('addInvestmentInterest 예외:', error);
    return { success: false, error: 'Failed to add investment interest' };
  }
}

/**
 * 투자 관심 취소
 */
export async function cancelInvestmentInterest(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await supabase
      .from('investment_interests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('investor_id', user.id)
      .eq('video_id', videoId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('cancelInvestmentInterest 예외:', error);
    return { success: false, error: 'Failed to cancel investment interest' };
  }
}

/**
 * 사용자의 영상별 투자 관심 상태 조회
 */
export async function getUserInvestmentInterest(videoId: string) {
  try {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: interest } = await supabase
      .from('investment_interests')
      .select('*')
      .eq('investor_id', user.id)
      .eq('video_id', videoId)
      .neq('status', 'cancelled')
      .single();

    return interest;
  } catch (error) {
    console.error('getUserInvestmentInterest 예외:', error);
    return null;
  }
}

/**
 * 영상의 투자 관심 목록 조회 (창작자용)
 */
export async function getVideoInvestmentInterests(videoId: string) {
  try {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 영상 소유자인지 확인
    const { data: video } = await supabase
      .from('videos')
      .select('creator_id')
      .eq('id', videoId)
      .single();

    if (!video || video.creator_id !== user.id) {
      return [];
    }

    const { data: interests } = await supabase
      .from('investment_interests')
      .select(`
        *,
        investor:profiles!investor_id(
          username,
          company
        )
      `)
      .eq('video_id', videoId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    return interests || [];
  } catch (error) {
    console.error('getVideoInvestmentInterests 예외:', error);
    return [];
  }
}

/**
 * 공개된 투자 관심 목록 조회
 */
export async function getPublicInvestmentInterests(videoId: string) {
  try {
    const supabase = await createServerClient();

    const { data: interests } = await supabase
      .from('investment_interests')
      .select(`
        amount_range_min,
        amount_range_max,
        message,
        created_at,
        investor:profiles!investor_id(
          username,
          company
        )
      `)
      .eq('video_id', videoId)
      .eq('is_public', true)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    return interests || [];
  } catch (error) {
    console.error('getPublicInvestmentInterests 예외:', error);
    return [];
  }
}