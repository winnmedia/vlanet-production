/**
 * OAuth 콜백 처리 라우트 핸들러
 * Google OAuth 인증 완료 후 Supabase로 세션을 생성합니다
 */

import { createServerClient } from '../../../shared/api/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerClient();

    try {
      // OAuth 코드를 세션으로 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // 성공적으로 로그인된 경우
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 새 사용자인지 확인
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', user.id)
            .single();

          // 프로필이 없거나 미완성인 경우 온보딩으로 리디렉션
          if (!profile || !profile.username || !profile.role) {
            return NextResponse.redirect(`${origin}/onboarding?new=true`);
          }

          // 기존 사용자는 next 파라미터나 홈으로 리디렉션
          const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/`;
          return NextResponse.redirect(redirectUrl);
        }
      } else {
        console.error('OAuth 세션 교환 실패:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_error&message=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다.')}`);
      }
    } catch (error) {
      console.error('OAuth 콜백 처리 중 예외:', error);
      return NextResponse.redirect(`${origin}/login?error=server_error&message=${encodeURIComponent('서버 오류가 발생했습니다.')}`);
    }
  }

  // 코드가 없거나 처리 실패 시 로그인 페이지로 리디렉션
  return NextResponse.redirect(`${origin}/login?error=no_code&message=${encodeURIComponent('인증 코드를 받지 못했습니다.')}`);
}