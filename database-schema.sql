-- VideoPlanet Database Schema
-- Phase 1: User Profiles and Onboarding System
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행

-- ============================================================================
-- 1. 사용자 역할 ENUM 타입 생성
-- ============================================================================
CREATE TYPE user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');

-- ============================================================================
-- 2. 프로필 테이블 생성
-- ============================================================================
CREATE TABLE profiles (
    -- 기본 필드
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

    -- 필수 프로필 정보
    username text UNIQUE NOT NULL
        CHECK (length(username) >= 2 AND length(username) <= 30 AND username ~ '^[a-zA-Z0-9_-]+$'),
    role user_role DEFAULT 'VIEWER' NOT NULL,

    -- 선택적 프로필 정보
    avatar_url text,
    bio text CHECK (length(bio) <= 500),
    company text CHECK (length(company) <= 100),
    website text CHECK (website = '' OR website ~* '^https?://.*'),

    -- 시스템 필드
    onboarding_completed boolean DEFAULT false NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,

    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 3. RLS (Row Level Security) 설정
-- ============================================================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 프로필을 볼 수 있음
CREATE POLICY "프로필은 누구나 볼 수 있습니다"
    ON profiles
    FOR SELECT
    USING (true);

-- 정책 2: 사용자는 자신의 프로필만 생성/수정/삭제 가능
CREATE POLICY "사용자는 자신의 프로필을 관리할 수 있습니다"
    ON profiles
    FOR ALL
    USING (auth.uid() = id);

-- ============================================================================
-- 4. 트리거 함수 및 트리거 생성
-- ============================================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. 인덱스 생성 (성능 최적화)
-- ============================================================================

-- 사용자명 검색용 인덱스 (이미 UNIQUE 제약조건으로 생성됨)
-- CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);

-- 역할별 조회용 인덱스
CREATE INDEX profiles_role_idx ON profiles(role) WHERE role != 'VIEWER';

-- 온보딩 완료 상태 조회용 인덱스
CREATE INDEX profiles_onboarding_idx ON profiles(onboarding_completed) WHERE onboarding_completed = false;

-- 생성일 기준 정렬용 인덱스
CREATE INDEX profiles_created_at_idx ON profiles(created_at DESC);

-- ============================================================================
-- 6. 유용한 뷰 생성 (선택사항)
-- ============================================================================

-- Creator 목록 뷰
CREATE VIEW creators_view AS
SELECT
    id,
    username,
    avatar_url,
    bio,
    created_at
FROM profiles
WHERE role = 'CREATOR' AND onboarding_completed = true;

-- Funder 목록 뷰
CREATE VIEW funders_view AS
SELECT
    id,
    username,
    avatar_url,
    bio,
    company,
    website,
    created_at
FROM profiles
WHERE role = 'FUNDER' AND onboarding_completed = true;

-- ============================================================================
-- 7. 유효성 검사 함수 생성
-- ============================================================================

-- 사용자명 유효성 검사 함수
CREATE OR REPLACE FUNCTION is_valid_username(username_input text)
RETURNS boolean AS $$
BEGIN
    RETURN username_input ~ '^[a-zA-Z0-9_-]{2,30}$';
END;
$$ LANGUAGE plpgsql;

-- 이메일 도메인 검사 함수 (필요시)
CREATE OR REPLACE FUNCTION is_valid_email_domain(email_input text)
RETURNS boolean AS $$
BEGIN
    RETURN email_input ~* '^[^@]+@[^@]+\.[^@]+$';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. 샘플 데이터 (개발/테스트용, 필요시만 실행)
-- ============================================================================

-- 주의: 이 섹션은 개발/테스트 환경에서만 실행하세요
-- 프로덕션 환경에서는 실행하지 마세요

/*
-- 샘플 사용자 (실제로는 auth.users 테이블에 사용자가 있어야 함)
INSERT INTO profiles (id, username, role, bio, onboarding_completed) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john_creator', 'CREATOR', 'AI 영상 제작자입니다. 창의적인 콘텐츠를 만듭니다.', true),
('550e8400-e29b-41d4-a716-446655440002', 'jane_funder', 'FUNDER', 'AI 콘텐츠에 투자하는 것을 좋아합니다.', true),
('550e8400-e29b-41d4-a716-446655440003', 'bob_viewer', 'VIEWER', '좋은 콘텐츠를 시청하는 것을 즐깁니다.', true)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- 9. 권한 설정 (필요시)
-- ============================================================================

-- anon 역할에게 profiles 테이블 SELECT 권한 부여 (이미 RLS로 제어됨)
-- GRANT SELECT ON profiles TO anon;

-- authenticated 역할에게 profiles 테이블 모든 권한 부여 (RLS로 제어됨)
-- GRANT ALL ON profiles TO authenticated;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

-- 스키마 생성 완료를 알리는 알림
DO $$
BEGIN
    RAISE NOTICE '✅ VideoPlanet 데이터베이스 스키마 설정이 완료되었습니다!';
    RAISE NOTICE '📊 생성된 테이블: profiles';
    RAISE NOTICE '🔒 RLS 정책: 2개 정책 활성화';
    RAISE NOTICE '⚡ 인덱스: 성능 최적화 인덱스 생성 완료';
    RAISE NOTICE '📈 뷰: creators_view, funders_view 생성';
    RAISE NOTICE '🚀 Phase 1 데이터베이스 준비 완료!';
END $$;