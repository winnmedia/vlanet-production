/**
 * Supabase 서버 사이드 클라이언트
 * Server Components, Server Actions, Route Handlers에서 사용
 */

import { createServerClient as createSupabaseClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../../config/env';

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Next.js 미들웨어에서는 쿠키를 설정할 수 없음
            // 이 경우는 미들웨어 클라이언트를 사용해야 함
          }
        },
      },
    }
  );
}

/**
 * 서비스 역할 키를 사용한 관리자 클라이언트
 * RLS 우회가 필요한 관리 작업에만 사용
 */
export async function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다');
  }

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // 서비스 클라이언트는 쿠키를 사용하지 않음
        },
      },
    }
  );
}