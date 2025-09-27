/**
 * Jest 테스트 환경변수 설정
 */

const { loadEnvConfig } = require('@next/env');
const path = require('path');

// .env.test 파일 로드
const projectDir = process.cwd();
loadEnvConfig(projectDir, true);

// 테스트용 환경변수가 없는 경우 기본값 설정
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-id.supabase.co';
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key-for-testing-purposes-only';
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key-for-testing-only';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-session-secret-for-testing';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// 기타 필수 환경변수 설정
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE = '209715200';
process.env.NEXT_PUBLIC_MAX_VIDEO_DURATION = '120';
process.env.NEXT_PUBLIC_MAX_VIDEO_RESOLUTION = '1080';
process.env.NEXT_PUBLIC_CSP_ENABLED = 'false';
process.env.SECURITY_HEADERS_ENABLED = 'false';
process.env.RATE_LIMIT_REQUESTS = '100';
process.env.RATE_LIMIT_WINDOW = '900';
process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'false';