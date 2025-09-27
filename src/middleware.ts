/**
 * Next.js 미들웨어
 * 인증 상태 확인 및 라우트 보호
 */

import { type NextRequest } from 'next/server';
import { createMiddlewareClient } from './shared/api/supabase/middleware';

// 보호된 라우트 정의
const PROTECTED_ROUTES = [
  '/dashboard',
  '/upload',
  '/proposals',
  '/profile',
  '/settings'
];

// 인증 없이 접근 가능한 라우트
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/explore',
  '/video'
];

// 온보딩 전용 라우트 (인증은 필요하지만 프로필은 불완전)
const ONBOARDING_ROUTES = ['/onboarding'];

// 인증된 사용자가 접근하면 안 되는 라우트
const AUTH_REDIRECT_ROUTES = ['/login', '/signup', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일과 API 라우트는 스킵
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return;
  }

  const { supabase, response } = createMiddlewareClient(request);

  try {
    // 현재 사용자 세션 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const isAuthenticated = !authError && !!user;
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isOnboardingRoute = ONBOARDING_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRedirectRoute = AUTH_REDIRECT_ROUTES.some(route => pathname.startsWith(route));

    console.log('미들웨어 실행:', {
      pathname,
      isAuthenticated,
      userId: user?.id,
      isProtectedRoute,
      isOnboardingRoute,
      isAuthRedirectRoute
    });

    // 1. 인증된 사용자가 로그인 관련 페이지에 접근하는 경우
    if (isAuthenticated && isAuthRedirectRoute) {
      const redirectUrl = new URL('/dashboard', request.url);
      return Response.redirect(redirectUrl);
    }

    // 2. 보호된 라우트에 비인증 사용자가 접근하는 경우
    if (isProtectedRoute && !isAuthenticated) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return Response.redirect(redirectUrl);
    }

    // 3. 인증된 사용자의 프로필 상태 확인
    if (isAuthenticated) {
      // 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, role, onboarding_completed')
        .eq('id', user.id)
        .single();

      const hasProfile = !profileError && !!profile;
      const isOnboardingCompleted = hasProfile && profile.onboarding_completed;

      console.log('프로필 상태:', {
        hasProfile,
        isOnboardingCompleted,
        profile: profile ? {
          id: profile.id,
          username: profile.username,
          role: profile.role
        } : null
      });

      // 3-1. 온보딩이 필요한 사용자
      if (!hasProfile || !isOnboardingCompleted) {
        // 온보딩 페이지가 아닌 경우 리다이렉트
        if (!isOnboardingRoute) {
          const redirectUrl = new URL('/onboarding', request.url);
          return Response.redirect(redirectUrl);
        }
      }
      // 3-2. 온보딩이 완료된 사용자가 온보딩 페이지에 접근
      else if (isOnboardingRoute) {
        const redirectUrl = new URL('/dashboard', request.url);
        return Response.redirect(redirectUrl);
      }

      // 4. 역할별 접근 제한 (미래 확장용)
      if (hasProfile && isOnboardingCompleted) {
        // 예: Funder 전용 라우트, Creator 전용 라우트 등
        // 현재는 구현하지 않음
      }
    }

    // 5. 온보딩 라우트에 비인증 사용자가 접근하는 경우
    if (isOnboardingRoute && !isAuthenticated) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return Response.redirect(redirectUrl);
    }

    return response;

  } catch (error) {
    console.error('미들웨어 오류:', error);

    // 오류 발생 시 보호된 라우트는 로그인으로 리다이렉트
    if (isProtectedRoute || isOnboardingRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'middleware_error');
      return Response.redirect(redirectUrl);
    }

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 경로에서 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};