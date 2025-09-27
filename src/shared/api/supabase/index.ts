/**
 * Supabase API Public API
 * 환경에 따라 적절한 클라이언트를 사용하도록 안내
 */

// 클라이언트 사이드에서 사용
export { createClient as createBrowserClient, getSupabaseClient } from './client';

// 미들웨어에서 사용
export { createMiddlewareClient } from './middleware';

// 서버 사이드 함수들은 직접 import해야 함
// import { createServerClient, createServiceClient } from './server';

// 타입 정의
import type { SupabaseClient } from '@supabase/supabase-js';

export type Database = any; // 실제 DB 타입으로 교체 필요
export type SupabaseClientType = SupabaseClient<Database>;