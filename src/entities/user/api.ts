/**
 * User Entity API Functions
 * 사용자 관련 Supabase 데이터 접근 함수들
 */

import { createServerClient } from '@/shared/api/supabase/server';
import { createServiceClient } from '@/shared/api/supabase/server';
import type {
  ProfileRow,
  ProfileInput,
  ProfileUpdateInput,
  CreateProfileResult,
  UpdateProfileResult,
  GetProfileResult,
  ProfileStatus,
  UserFilters,
  UserSortOptions,
  PaginationOptions,
  PaginatedUsers,
  UserStats
} from './types';

/**
 * 현재 인증된 사용자의 프로필 가져오기
 */
export async function getCurrentProfile(): Promise<GetProfileResult> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { profile: null, error: 'Authentication required' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('프로필 조회 오류:', error);
      return { profile: null, error: error.message };
    }

    return { profile: profile || null };
  } catch (error) {
    console.error('getCurrentProfile 오류:', error);
    return { profile: null, error: 'Failed to fetch profile' };
  }
}

/**
 * ID로 프로필 가져오기 (공개 정보만)
 */
export async function getProfileById(userId: string): Promise<GetProfileResult> {
  try {
    const supabase = await createServerClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('프로필 조회 오류:', error);
      return { profile: null, error: error.message };
    }

    return { profile: profile || null };
  } catch (error) {
    console.error('getProfileById 오류:', error);
    return { profile: null, error: 'Failed to fetch profile' };
  }
}

/**
 * 사용자명으로 프로필 검색
 */
export async function getProfileByUsername(username: string): Promise<GetProfileResult> {
  try {
    const supabase = await createServerClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('프로필 조회 오류:', error);
      return { profile: null, error: error.message };
    }

    return { profile: profile || null };
  } catch (error) {
    console.error('getProfileByUsername 오류:', error);
    return { profile: null, error: 'Failed to fetch profile' };
  }
}

/**
 * 프로필 생성
 */
export async function createProfile(profileData: ProfileInput): Promise<CreateProfileResult> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // 사용자명 중복 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', profileData.username)
      .single();

    if (existingProfile) {
      return { success: false, error: 'Username already exists' };
    }

    // 프로필 생성
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: profileData.username,
        role: profileData.role,
        bio: profileData.bio || null,
        company: profileData.company || null,
        website: profileData.website || null,
        onboarding_completed: true,
      })
      .select()
      .single();

    if (error) {
      console.error('프로필 생성 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('createProfile 오류:', error);
    return { success: false, error: 'Failed to create profile' };
  }
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(updateData: ProfileUpdateInput): Promise<UpdateProfileResult> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // 사용자명 중복 확인 (변경하는 경우)
    if (updateData.username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updateData.username)
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        return { success: false, error: 'Username already exists' };
      }
    }

    // 프로필 업데이트
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('프로필 업데이트 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('updateProfile 오류:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * 온보딩 완료 처리
 */
export async function completeOnboarding(): Promise<UpdateProfileResult> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('온보딩 완료 처리 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('completeOnboarding 오류:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

/**
 * 사용자의 프로필 상태 확인
 */
export async function getProfileStatus(): Promise<ProfileStatus> {
  try {
    const { profile } = await getCurrentProfile();

    return {
      hasProfile: !!profile,
      isOnboardingCompleted: profile?.onboarding_completed || false,
      needsOnboarding: !profile || !profile.onboarding_completed,
      role: profile?.role,
    };
  } catch (error) {
    console.error('getProfileStatus 오류:', error);
    return {
      hasProfile: false,
      isOnboardingCompleted: false,
      needsOnboarding: true,
    };
  }
}

/**
 * 프로필 목록 조회 (관리자용 또는 공개 목록용)
 */
export async function getProfiles(
  filters?: UserFilters,
  sort?: UserSortOptions,
  pagination?: PaginationOptions
): Promise<PaginatedUsers> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        avatar_url,
        bio,
        role,
        company,
        website,
        onboarding_completed,
        email_verified,
        created_at,
        updated_at
      `, { count: 'exact' });

    // 필터 적용
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.onboardingCompleted !== undefined) {
      query = query.eq('onboarding_completed', filters.onboardingCompleted);
    }
    if (filters?.search) {
      query = query.or(`username.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
    }
    if (filters?.createdAfter) {
      query = query.gte('created_at', filters.createdAfter.toISOString());
    }
    if (filters?.createdBefore) {
      query = query.lte('created_at', filters.createdBefore.toISOString());
    }

    // 정렬 적용
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 페이지네이션 적용
    if (pagination) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('프로필 목록 조회 오류:', error);
      throw error;
    }

    const totalCount = count || 0;
    const limit = pagination?.limit || totalCount;
    const currentPage = pagination?.page || 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      users: users || [],
      totalCount,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  } catch (error) {
    console.error('getProfiles 오류:', error);
    return {
      users: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
}

/**
 * 사용자 통계 조회 (관리자용)
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const supabase = await createServiceClient();

    const [
      { count: totalCreators },
      { count: totalFunders },
      { count: totalUsers },
      { count: recentSignups }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CREATOR'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'FUNDER'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      totalCreators: totalCreators || 0,
      totalFunders: totalFunders || 0,
      totalUsers: totalUsers || 0,
      recentSignups: recentSignups || 0,
    };
  } catch (error) {
    console.error('getUserStats 오류:', error);
    return {
      totalCreators: 0,
      totalFunders: 0,
      totalUsers: 0,
      recentSignups: 0,
    };
  }
}