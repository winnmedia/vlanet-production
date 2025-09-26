/**
 * Supabase 미들웨어 클라이언트
 * Next.js 미들웨어에서 사용
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/shared/config/env';

export function createMiddlewareClient(request: NextRequest) {
  // 응답 객체 생성
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 요청 쿠키 업데이트
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value });
          });

          // 응답 객체 다시 생성 (쿠키 포함)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // 응답 쿠키 설정
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  return { supabase, response };
}