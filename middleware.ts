/**
 * Next.js 미들웨어
 * 인증 상태 확인, 라우트 보호, 온보딩 체크 등을 처리합니다
 */

import { createMiddlewareClient } from '@/shared/api/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요한 경로들
const PROTECTED_ROUTES = [
  '/dashboard',
  '/upload',
  '/profile',
  '/settings',
];

// 인증된 사용자가 접근하면 안 되는 경로들 (로그인 페이지 등)
const AUTH_ROUTES = [
  '/login',
  '/register',
];

// 온보딩이 완료되지 않은 사용자만 접근 가능한 경로들
const ONBOARDING_ROUTES = [
  '/onboarding',
];

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareClient(request);

    // 현재 경로 확인
    const { pathname } = request.nextUrl;

    // Static files, API routes, auth callback은 건너뛰기
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth/callback') ||
      pathname.includes('.')
    ) {
      return response;
    }

    // 사용자 인증 상태 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 인증 오류가 있는 경우 처리
    if (authError) {
      console.error('미들웨어 인증 확인 오류:', authError);

      // 보호된 경로에 접근하려는 경우 로그인 페이지로 리디렉션
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return response;
    }

    // 인증되지 않은 사용자
    if (!user) {
      // 보호된 경로에 접근하려는 경우 로그인 페이지로 리디렉션
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 온보딩 페이지 접근 시 로그인 페이지로 리디렉션
      if (ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return response;
    }

    // 인증된 사용자
    if (user) {
      // 프로필 정보 확인
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, role, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116: 결과 없음 (새 사용자) 외의 오류
        console.error('프로필 조회 오류:', profileError);
      }

      // 온보딩이 필요한 사용자
      const needsOnboarding = !profile || !profile.onboarding_completed || !profile.username || !profile.role;

      if (needsOnboarding) {
        // 온보딩 페이지가 아닌 경우 온보딩으로 리디렉션
        if (!ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      } else {
        // 온보딩이 완료된 사용자가 온보딩 페이지에 접근하는 경우 홈으로 리디렉션
        if (ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
          return NextResponse.redirect(new URL('/', request.url));
        }

        // 로그인 페이지에 접근하는 경우 홈으로 리디렉션
        if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }

    return response;
  } catch (error) {
    console.error('미들웨어 처리 중 예외:', error);

    // 오류 발생 시 기본 응답 반환
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 경로에서 실행:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 파일 확장자가 있는 경로들 (.png, .jpg 등)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};