/**
 * 인증 관련 Server Actions
 * 로그인, 로그아웃, 프로필 생성/업데이트 등을 처리합니다
 */

'use server';

import { createServerClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

/**
 * Google OAuth 로그인 시작 (FormData 버전)
 */
export async function signInWithGoogle(formData: FormData) {
  const redirectTo = formData.get('redirectTo') as string;
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google OAuth 로그인 오류:', error);
    throw new Error('Google 로그인 중 오류가 발생했습니다.');
  }

  if (data.url) {
    redirect(data.url as any);
  }

  throw new Error('로그인 URL을 생성할 수 없습니다.');
}

/**
 * 로그아웃
 */
export async function signOut() {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('로그아웃 오류:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }

  redirect('/login');
}

/**
 * 온보딩 데이터 스키마
 */
const onboardingSchema = z.object({
  username: z
    .string()
    .min(2, '사용자명은 최소 2자 이상이어야 합니다')
    .max(30, '사용자명은 최대 30자까지 가능합니다')
    .regex(/^[a-zA-Z0-9_-]+$/, '사용자명은 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다'),

  role: z.enum(['CREATOR', 'FUNDER'], {
    errorMap: () => ({ message: '역할을 선택해주세요' }),
  }),

  bio: z.string().max(500, '소개는 최대 500자까지 가능합니다').optional(),

  company: z.string().max(100, '회사명은 최대 100자까지 가능합니다').optional(),

  website: z
    .string()
    .url('올바른 웹사이트 URL을 입력해주세요')
    .optional()
    .or(z.literal('')),
});

/**
 * 온보딩 프로필 생성/업데이트
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createServerClient();

  // 현재 사용자 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: '로그인이 필요합니다.',
    };
  }

  // 폼 데이터 파싱
  const rawData = {
    username: formData.get('username') as string,
    role: formData.get('role') as string,
    bio: formData.get('bio') as string || undefined,
    company: formData.get('company') as string || undefined,
    website: formData.get('website') as string || undefined,
  };

  // 데이터 검증
  const validationResult = onboardingSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const validatedData = validationResult.data;

  try {
    // 사용자명 중복 체크
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', validatedData.username)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: '이미 사용 중인 사용자명입니다.',
        field: 'username',
      };
    }

    // 프로필 생성/업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: validatedData.username,
        role: validatedData.role,
        bio: validatedData.bio || null,
        company: validatedData.company || null,
        website: validatedData.website || null,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('프로필 업데이트 오류:', profileError);
      return {
        success: false,
        error: '프로필 저장 중 오류가 발생했습니다.',
      };
    }

    // 성공 시 홈으로 리디렉션
    redirect('/');
  } catch (error) {
    console.error('온보딩 처리 중 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * 온보딩 프로필 생성 Server Action
 */
export async function createOnboardingProfile(formData: FormData) {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 폼 데이터 파싱
  const rawData = {
    username: formData.get('username') as string,
    role: formData.get('role') as string,
    bio: formData.get('bio') as string || null,
    company: formData.get('company') as string || null,
    website: formData.get('website') as string || null,
  };

  // 데이터 검증
  if (!rawData.username || rawData.username.length < 2 || rawData.username.length > 30) {
    throw new Error('사용자명은 2-30자 사이여야 합니다.');
  }

  if (!rawData.role || !['CREATOR', 'FUNDER', 'VIEWER'].includes(rawData.role)) {
    throw new Error('역할을 선택해주세요.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(rawData.username)) {
    throw new Error('사용자명은 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다.');
  }

  try {
    // 사용자명 중복 체크
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', rawData.username)
      .single();

    if (existingUser) {
      throw new Error('이미 사용 중인 사용자명입니다.');
    }

    // 프로필 생성
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: rawData.username,
        role: rawData.role,
        bio: rawData.bio,
        company: rawData.company,
        website: rawData.website,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('프로필 생성 오류:', profileError);
      throw new Error('프로필 저장 중 오류가 발생했습니다.');
    }

    // 성공 시 홈으로 리디렉션
    redirect('/');
  } catch (error) {
    console.error('온보딩 처리 중 예외:', error);
    throw error;
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // 프로필 정보도 함께 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    ...user,
    profile,
  };
}