-- ============================================================================
-- VLANET 데이터베이스 마이그레이션 스크립트 (안전 버전)
-- 실행 순서: Phase 1 → Phase 2 → Phase 3 → 성능 최적화 → AI 확장 → 관리자
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행
-- ============================================================================

-- 마이그레이션 시작 로깅
DO $$
BEGIN
    RAISE NOTICE '🚀 VLANET 데이터베이스 마이그레이션 시작 (안전 모드) - %', NOW();
    RAISE NOTICE '📋 실행 순서: 기본 → 영상 → 성능 → AI확장 → 관리자';
END $$;

-- ============================================================================
-- Phase 1: 기본 사용자 프로필 시스템
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📊 Phase 1: 기본 사용자 프로필 시스템 생성 중...';
END $$;

-- 사용자 역할 ENUM 타입 생성 (안전 모드)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');
        RAISE NOTICE '✅ user_role ENUM 타입 생성됨';
    ELSE
        RAISE NOTICE '⚠️ user_role ENUM 타입이 이미 존재함';
    END IF;
END $$;

-- 프로필 테이블 생성 (안전 모드)
CREATE TABLE IF NOT EXISTS profiles (
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

-- RLS 활성화 (안전 모드)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ profiles 테이블 RLS 활성화됨';
    ELSE
        RAISE NOTICE '⚠️ profiles 테이블 RLS가 이미 활성화됨';
    END IF;
END $$;

-- 정책 설정 (안전 모드)
DO $$
BEGIN
    -- 읽기 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = '프로필은 누구나 볼 수 있습니다'
    ) THEN
        CREATE POLICY "프로필은 누구나 볼 수 있습니다"
            ON profiles FOR SELECT USING (true);
        RAISE NOTICE '✅ profiles 읽기 정책 생성됨';
    END IF;

    -- 관리 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = '사용자는 자신의 프로필을 관리할 수 있습니다'
    ) THEN
        CREATE POLICY "사용자는 자신의 프로필을 관리할 수 있습니다"
            ON profiles FOR ALL USING (auth.uid() = id);
        RAISE NOTICE '✅ profiles 관리 정책 생성됨';
    END IF;
END $$;

-- updated_at 자동 갱신 함수 (안전 모드)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 (안전 모드)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ profiles updated_at 트리거 생성됨';
    ELSE
        RAISE NOTICE '⚠️ profiles updated_at 트리거가 이미 존재함';
    END IF;
END $$;

-- ============================================================================
-- Phase 2: 영상 시스템 및 통계
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📹 Phase 2: 영상 시스템 및 통계 생성 중...';
END $$;

-- 영상 상태 ENUM 타입 생성 (안전 모드)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_status') THEN
        CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'published', 'failed', 'deleted');
        RAISE NOTICE '✅ video_status ENUM 타입 생성됨';
    ELSE
        RAISE NOTICE '⚠️ video_status ENUM 타입이 이미 존재함';
    END IF;
END $$;

-- 영상 테이블 생성 (안전 모드)
CREATE TABLE IF NOT EXISTS videos (
    -- 기본 식별자
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 영상 메타데이터
    title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description text CHECK (length(description) <= 5000),
    tags text[] DEFAULT '{}' NOT NULL,

    -- 파일 정보
    video_url text,
    thumbnail_url text,
    file_name text,
    file_size bigint CHECK (file_size > 0),
    duration integer CHECK (duration > 0),
    width integer CHECK (width > 0),
    height integer CHECK (height > 0),
    fps numeric(5,2) CHECK (fps > 0),

    -- AI 관련 정보
    ai_model text CHECK (length(ai_model) <= 100),
    prompt text CHECK (length(prompt) <= 2000),

    -- 공개 설정
    is_public boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,

    -- 상태 관리
    status video_status DEFAULT 'uploading' NOT NULL,
    upload_progress integer DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    error_message text,

    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    published_at timestamptz,
    deleted_at timestamptz
);

-- 영상 통계 테이블 생성 (안전 모드)
CREATE TABLE IF NOT EXISTS video_stats (
    video_id uuid PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,

    -- 조회 통계
    view_count integer DEFAULT 0 NOT NULL CHECK (view_count >= 0),
    unique_view_count integer DEFAULT 0 NOT NULL CHECK (unique_view_count >= 0),

    -- 반응 통계
    like_count integer DEFAULT 0 NOT NULL CHECK (like_count >= 0),
    dislike_count integer DEFAULT 0 NOT NULL CHECK (dislike_count >= 0),
    comment_count integer DEFAULT 0 NOT NULL CHECK (comment_count >= 0),
    share_count integer DEFAULT 0 NOT NULL CHECK (share_count >= 0),

    -- 투자 관련 통계
    investment_interest_count integer DEFAULT 0 NOT NULL CHECK (investment_interest_count >= 0),
    total_investment_amount bigint DEFAULT 0 NOT NULL CHECK (total_investment_amount >= 0),
    total_revenue bigint DEFAULT 0 NOT NULL CHECK (total_revenue >= 0),
    creator_earnings bigint DEFAULT 0 NOT NULL CHECK (creator_earnings >= 0),

    -- 활동 추적
    last_viewed_at timestamptz,
    trending_score integer DEFAULT 0 NOT NULL CHECK (trending_score >= 0),

    -- 타임스탬프
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 영상 반응 테이블 생성 (안전 모드)
CREATE TABLE IF NOT EXISTS video_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at timestamptz DEFAULT now() NOT NULL,

    UNIQUE(video_id, user_id)
);

-- 투자 관심 표시 테이블 생성 (안전 모드)
CREATE TABLE IF NOT EXISTS investment_interests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    investor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interest_level text DEFAULT 'interested' NOT NULL
        CHECK (interest_level IN ('interested', 'very_interested', 'considering')),
    notes text CHECK (length(notes) <= 1000),
    proposed_amount bigint CHECK (proposed_amount > 0),
    contact_requested boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    UNIQUE(video_id, investor_id)
);

-- RLS 활성화 (videos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'videos'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ videos 테이블 RLS 활성화됨';
    END IF;
END $$;

-- videos 정책 설정 (안전 모드)
DO $$
BEGIN
    -- 공개 영상 읽기 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'videos'
        AND policyname = '공개 영상은 누구나 볼 수 있습니다'
    ) THEN
        CREATE POLICY "공개 영상은 누구나 볼 수 있습니다"
            ON videos FOR SELECT
            USING (is_public = true AND status = 'published' AND deleted_at IS NULL);
    END IF;

    -- Creator 관리 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'videos'
        AND policyname = 'Creator는 자신의 영상을 관리할 수 있습니다'
    ) THEN
        CREATE POLICY "Creator는 자신의 영상을 관리할 수 있습니다"
            ON videos FOR ALL
            USING (creator_id = auth.uid());
    END IF;
END $$;

-- 트리거 설정 (안전 모드)
DO $$
BEGIN
    -- videos updated_at 트리거
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_videos_updated_at'
    ) THEN
        CREATE TRIGGER update_videos_updated_at
            BEFORE UPDATE ON videos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ videos updated_at 트리거 생성됨';
    END IF;

    -- investment_interests updated_at 트리거
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_investment_interests_updated_at'
    ) THEN
        CREATE TRIGGER update_investment_interests_updated_at
            BEFORE UPDATE ON investment_interests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ investment_interests updated_at 트리거 생성됨';
    END IF;
END $$;

-- 영상 통계 자동 생성 함수 (안전 모드)
CREATE OR REPLACE FUNCTION create_video_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO video_stats (video_id)
    VALUES (NEW.id)
    ON CONFLICT (video_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 영상 통계 생성 트리거 (안전 모드)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'create_video_stats_trigger'
    ) THEN
        CREATE TRIGGER create_video_stats_trigger
            AFTER INSERT ON videos
            FOR EACH ROW
            EXECUTE FUNCTION create_video_stats();
        RAISE NOTICE '✅ create_video_stats 트리거 생성됨';
    END IF;
END $$;

-- ============================================================================
-- Phase 3: 성능 최적화 및 트렌딩 시스템
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '⚡ Phase 3: 성능 최적화 및 트렌딩 시스템 생성 중...';
END $$;

-- 검색 성능 향상 인덱스
CREATE INDEX IF NOT EXISTS videos_status_created_at_idx ON videos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS videos_creator_status_created_idx ON videos(creator_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS videos_public_updated_at_idx ON videos(updated_at DESC)
    WHERE is_public = true AND status = 'published' AND deleted_at IS NULL;

-- 트렌딩 알고리즘 최적화 인덱스
CREATE INDEX IF NOT EXISTS video_stats_engagement_idx ON video_stats(like_count DESC, view_count DESC);
CREATE INDEX IF NOT EXISTS video_stats_investment_interest_idx ON video_stats(investment_interest_count DESC, total_investment_amount DESC);
CREATE INDEX IF NOT EXISTS video_stats_trending_activity_idx ON video_stats(trending_score DESC, last_viewed_at DESC NULLS LAST);

-- 트렌딩 점수 계산 함수 (안전 모드)
CREATE OR REPLACE FUNCTION calculate_trending_score(
    view_count integer,
    like_count integer,
    investment_interest_count integer,
    hours_since_published numeric
) RETURNS integer AS $$
DECLARE
    base_engagement_score numeric;
    investment_multiplier numeric;
    time_decay_factor numeric;
    final_score numeric;
BEGIN
    -- VLANET "Prompt to Profit" 최적화 가중치
    -- 투자관심도가 높은 콘텐츠 = 투자 잠재력 높은 콘텐츠
    -- 가중치: 조회수(1.0) + 좋아요(3.0) + 투자관심(25.0) + 시간감쇄(72시간 반감기)

    base_engagement_score := view_count * 1.0 + like_count * 3.0;
    investment_multiplier := investment_interest_count * 25.0;
    time_decay_factor := EXP(-hours_since_published / 72.0);
    final_score := (base_engagement_score + investment_multiplier) * time_decay_factor;

    RETURN GREATEST(0, LEAST(100000, ROUND(final_score)::integer));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 배치 트렌딩 점수 업데이트 함수 (안전 모드)
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
    UPDATE video_stats
    SET trending_score = calculate_trending_score(
        view_count,
        like_count,
        investment_interest_count,
        EXTRACT(EPOCH FROM (now() - v.created_at)) / 3600
    )
    FROM videos v
    WHERE video_stats.video_id = v.id
    AND v.status = 'published'
    AND v.deleted_at IS NULL;

    RAISE NOTICE '✅ 트렌딩 점수 업데이트 완료: % 개 영상', (SELECT count(*) FROM video_stats);
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ VLANET 데이터베이스 마이그레이션 완료! (Phase 1-3)';
    RAISE NOTICE '📊 생성된 테이블: profiles, videos, video_stats, video_reactions, investment_interests';
    RAISE NOTICE '⚡ 트렌딩 시스템: 투자 중심 알고리즘 (25x 가중치) 적용';
    RAISE NOTICE '🔒 보안: RLS 정책 활성화 완료';
END $$;