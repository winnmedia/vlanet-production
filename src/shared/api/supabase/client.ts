/**
 * Supabase 클라이언트 사이드 클라이언트
 * 클라이언트 컴포넌트 및 브라우저에서 사용
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '../../config/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// 싱글톤 인스턴스 (클라이언트에서만 사용)
let supabaseSingleton: ReturnType<typeof createClient> | undefined;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 새 인스턴스 생성
    return createClient();
  }

  // 클라이언트 사이드에서는 싱글톤 사용
  if (!supabaseSingleton) {
    supabaseSingleton = createClient();
  }

  return supabaseSingleton;
}