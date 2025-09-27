/**
 * 인증 관련 Server Actions
 * 로그인, 로그아웃, 프로필 생성/업데이트 등을 처리합니다
 */

'use server';

import { createServerClient } from '../../shared/api/supabase/server';
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
 * 이메일 회원가입 데이터 스키마
 */
const signUpSchema = z.object({
  email: z
    .string()
    .email('올바른 이메일 주소를 입력해주세요')
    .min(1, '이메일을 입력해주세요'),

  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'),

  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

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

    // 성공 시 대시보드로 리디렉션
    redirect('/dashboard');
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

/**
 * 이메일 중복 체크
 */
export async function checkEmailExists(email: string) {
  const supabase = await createServerClient();

  try {
    // Supabase Auth에서 이메일 존재 여부 확인
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);

    if (error && error.message !== 'User not found') {
      console.error('이메일 체크 오류:', error);
      return { exists: false, error: '이메일 확인 중 오류가 발생했습니다.' };
    }

    return { exists: !!data.user, error: null };
  } catch (error) {
    console.error('이메일 체크 예외:', error);
    return { exists: false, error: '이메일 확인 중 오류가 발생했습니다.' };
  }
}

/**
 * 이메일 회원가입 Server Action
 */
export async function signUpWithEmail(formData: FormData) {
  const supabase = await createServerClient();

  // 폼 데이터 파싱
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  // 데이터 검증
  const validationResult = signUpSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const { email, password } = validationResult.data;

  try {
    // 이메일 중복 체크
    const emailCheck = await checkEmailExists(email);
    if (emailCheck.error) {
      return {
        success: false,
        error: emailCheck.error,
      };
    }

    if (emailCheck.exists) {
      return {
        success: false,
        error: '이미 가입된 이메일 주소입니다.',
        field: 'email',
      };
    }

    // Supabase Auth로 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      console.error('회원가입 오류:', error);

      // 특정 오류 메시지 처리
      if (error.message.includes('User already registered')) {
        return {
          success: false,
          error: '이미 가입된 이메일 주소입니다.',
          field: 'email',
        };
      } else if (error.message.includes('Password should be')) {
        return {
          success: false,
          error: '비밀번호가 보안 요구사항을 만족하지 않습니다.',
          field: 'password',
        };
      } else {
        return {
          success: false,
          error: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        };
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: '회원가입 처리 중 오류가 발생했습니다.',
      };
    }

    // 이메일 인증이 필요한 경우
    if (!data.session) {
      return {
        success: true,
        requiresEmailVerification: true,
        message: '가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.',
        email,
      };
    }

    // 즉시 로그인된 경우 (이메일 인증이 비활성화된 경우)
    return {
      success: true,
      requiresEmailVerification: false,
      message: '가입이 완료되었습니다! 프로필 설정을 진행해주세요.',
    };

  } catch (error) {
    console.error('회원가입 처리 중 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * 이메일 로그인 Server Action
 */
export async function signInWithEmail(formData: FormData) {
  const supabase = await createServerClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 기본 유효성 검증
  if (!email || !password) {
    return {
      success: false,
      error: '이메일과 비밀번호를 모두 입력해주세요.',
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error: '올바른 이메일 형식을 입력해주세요.',
      field: 'email',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('로그인 오류:', error);

      // 특정 오류 메시지 처리
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        };
      } else if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
        };
      } else {
        return {
          success: false,
          error: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        };
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
      };
    }

    // 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role, onboarding_completed')
      .eq('id', data.user.id)
      .single();

    // 온보딩이 완료되지 않은 경우
    if (!profile || !profile.onboarding_completed) {
      redirect('/onboarding');
    }

    // 로그인 성공
    redirect('/');

  } catch (error) {
    console.error('로그인 처리 중 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * 비밀번호 재설정 요청 Server Action
 */
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createServerClient();

  const email = formData.get('email') as string;

  // 기본 유효성 검증
  if (!email) {
    return {
      success: false,
      error: '이메일을 입력해주세요.',
      field: 'email',
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error: '올바른 이메일 형식을 입력해주세요.',
      field: 'email',
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      console.error('비밀번호 재설정 요청 오류:', error);

      // 이메일이 존재하지 않는 경우에도 보안상 성공 메시지 표시
      if (error.message.includes('User not found')) {
        return {
          success: true,
          message: '비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해주세요.',
          email,
        };
      }

      return {
        success: false,
        error: '비밀번호 재설정 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    return {
      success: true,
      message: '비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해주세요.',
      email,
    };

  } catch (error) {
    console.error('비밀번호 재설정 요청 중 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * 비밀번호 재설정 Server Action
 */
export async function resetPassword(formData: FormData) {
  const supabase = await createServerClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // 기본 유효성 검증
  if (!password || !confirmPassword) {
    return {
      success: false,
      error: '비밀번호를 모두 입력해주세요.',
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: '비밀번호는 최소 8자 이상이어야 합니다.',
      field: 'password',
    };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return {
      success: false,
      error: '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.',
      field: 'password',
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: '비밀번호가 일치하지 않습니다.',
      field: 'confirmPassword',
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('비밀번호 재설정 오류:', error);

      if (error.message.includes('Auth session missing')) {
        return {
          success: false,
          error: '세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.',
          sessionExpired: true,
        };
      }

      return {
        success: false,
        error: '비밀번호 재설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    };

  } catch (error) {
    console.error('비밀번호 재설정 중 예외:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}