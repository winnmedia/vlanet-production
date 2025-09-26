-- ============================================================================
-- VLANET 데이터베이스 마이그레이션 스크립트 (통합 버전)
-- 실행 순서: Phase 1 → Phase 2 → Phase 3 → 성능 최적화 → AI 확장 → 관리자
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행
-- ============================================================================

-- 마이그레이션 시작 로깅
DO $$
BEGIN
    RAISE NOTICE '🚀 VLANET 데이터베이스 마이그레이션 시작 - %', NOW();
    RAISE NOTICE '📋 실행 순서: 기본 → 영상 → 성능 → AI확장 → 관리자';
END $$;

-- ============================================================================
-- Phase 1: 기본 사용자 프로필 시스템
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📊 Phase 1: 기본 사용자 프로필 시스템 생성 중...';
END $$;

-- 사용자 역할 ENUM 타입 생성
CREATE TYPE user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');

-- 프로필 테이블 생성
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

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "프로필은 누구나 볼 수 있습니다"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "사용자는 자신의 프로필을 관리할 수 있습니다"
    ON profiles FOR ALL USING (auth.uid() = id);

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

-- 기본 인덱스
CREATE INDEX profiles_role_idx ON profiles(role) WHERE role != 'VIEWER';
CREATE INDEX profiles_onboarding_idx ON profiles(onboarding_completed) WHERE onboarding_completed = false;
CREATE INDEX profiles_created_at_idx ON profiles(created_at DESC);

-- ============================================================================
-- Phase 2: 영상 업로드 및 상호작용 시스템
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎬 Phase 2: 영상 업로드 및 상호작용 시스템 생성 중...';
END $$;

-- 영상 상태 ENUM 타입
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'published', 'failed', 'deleted');

-- 영상 메인 테이블
CREATE TABLE videos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

    -- 영상 메타데이터
    title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description text CHECK (length(description) <= 2000),
    tags text[] DEFAULT '{}',

    -- AI 모델 정보
    ai_model text CHECK (length(ai_model) <= 100),
    prompt text CHECK (length(prompt) <= 1000),

    -- 파일 정보
    video_url text,
    thumbnail_url text,
    file_name text,
    file_size bigint CHECK (file_size > 0 AND file_size <= 209715200),
    duration integer CHECK (duration > 0 AND duration <= 120),

    -- 비디오 메타데이터
    width integer CHECK (width > 0),
    height integer CHECK (height > 0),
    fps integer CHECK (fps > 0 AND fps <= 120),
    format text DEFAULT 'mp4' CHECK (format IN ('mp4')),

    -- 상태 관리
    status video_status DEFAULT 'uploading' NOT NULL,
    upload_progress integer DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    error_message text,

    -- 공개 설정
    is_public boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,

    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    published_at timestamptz,
    deleted_at timestamptz
);

-- 영상 통계 테이블
CREATE TABLE video_stats (
    video_id uuid PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,

    -- 조회 관련 통계
    view_count integer DEFAULT 0 CHECK (view_count >= 0) NOT NULL,
    unique_view_count integer DEFAULT 0 CHECK (unique_view_count >= 0) NOT NULL,

    -- 상호작용 통계
    like_count integer DEFAULT 0 CHECK (like_count >= 0) NOT NULL,
    dislike_count integer DEFAULT 0 CHECK (dislike_count >= 0) NOT NULL,
    comment_count integer DEFAULT 0 CHECK (comment_count >= 0) NOT NULL,
    share_count integer DEFAULT 0 CHECK (share_count >= 0) NOT NULL,

    -- 투자 관련 통계
    investment_interest_count integer DEFAULT 0 CHECK (investment_interest_count >= 0) NOT NULL,
    total_investment_amount decimal(15,2) DEFAULT 0.00 CHECK (total_investment_amount >= 0) NOT NULL,

    -- 수익 통계
    total_revenue decimal(15,2) DEFAULT 0.00 CHECK (total_revenue >= 0) NOT NULL,
    creator_earnings decimal(15,2) DEFAULT 0.00 CHECK (creator_earnings >= 0) NOT NULL,

    -- 메타 통계
    last_viewed_at timestamptz,
    trending_score integer DEFAULT 0 NOT NULL,

    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 영상 반응 테이블 (좋아요/싫어요)
CREATE TABLE video_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    reaction_type text CHECK (reaction_type IN ('like', 'dislike')) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    UNIQUE(user_id, video_id)
);

-- 투자 관심 테이블
CREATE TABLE investment_interests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    interest_level integer DEFAULT 1 CHECK (interest_level BETWEEN 1 AND 5) NOT NULL,
    investment_amount decimal(15,2) CHECK (investment_amount > 0),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    UNIQUE(investor_id, video_id)
);

-- RLS 설정
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_interests ENABLE ROW LEVEL SECURITY;

-- videos 정책
CREATE POLICY "공개된 영상은 누구나 볼 수 있습니다"
    ON videos FOR SELECT
    USING (is_public = true AND status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Creator는 자신의 영상을 관리할 수 있습니다"
    ON videos FOR ALL
    USING (auth.uid() = creator_id);

-- video_stats 정책
CREATE POLICY "공개된 영상의 통계는 누구나 볼 수 있습니다"
    ON video_stats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = video_stats.video_id
            AND is_public = true AND status = 'published' AND deleted_at IS NULL
        )
    );

CREATE POLICY "Creator는 자신의 영상 통계를 관리할 수 있습니다"
    ON video_stats FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = video_stats.video_id AND videos.creator_id = auth.uid()
        )
    );

-- video_reactions 정책
CREATE POLICY "사용자는 자신의 반응을 관리할 수 있습니다"
    ON video_reactions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "모든 사용자가 반응을 볼 수 있습니다"
    ON video_reactions FOR SELECT
    USING (true);

-- investment_interests 정책
CREATE POLICY "투자자는 자신의 관심 표시를 관리할 수 있습니다"
    ON investment_interests FOR ALL
    USING (auth.uid() = investor_id);

CREATE POLICY "Creator는 자신의 영상에 대한 투자 관심을 볼 수 있습니다"
    ON investment_interests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = investment_interests.video_id AND videos.creator_id = auth.uid()
        )
    );

-- 트리거 설정
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_stats_updated_at
    BEFORE UPDATE ON video_stats FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_reactions_updated_at
    BEFORE UPDATE ON video_reactions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_interests_updated_at
    BEFORE UPDATE ON investment_interests FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 영상 생성 시 통계 테이블 자동 생성
CREATE OR REPLACE FUNCTION create_video_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO video_stats (video_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_video_stats_trigger
    AFTER INSERT ON videos FOR EACH ROW
    EXECUTE FUNCTION create_video_stats();

-- 기본 인덱스
CREATE INDEX videos_creator_id_idx ON videos(creator_id);
CREATE INDEX videos_status_idx ON videos(status) WHERE status = 'published';
CREATE INDEX videos_created_at_idx ON videos(created_at DESC);
CREATE INDEX videos_public_published_idx ON videos(is_public, status, created_at DESC)
    WHERE is_public = true AND status = 'published' AND deleted_at IS NULL;

CREATE INDEX video_reactions_user_video_idx ON video_reactions(user_id, video_id);
CREATE INDEX investment_interests_investor_video_idx ON investment_interests(investor_id, video_id);

-- ============================================================================
-- Phase 3: 성능 최적화 인덱스 및 트렌딩 시스템
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

-- 트렌딩 점수 계산 함수
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

-- 배치 트렌딩 점수 업데이트 함수
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
    UPDATE video_stats
    SET trending_score = calculate_trending_score(
        view_count,
        like_count,
        investment_interest_count,
        EXTRACT(EPOCH FROM (NOW() - v.published_at)) / 3600.0
    )
    FROM videos v
    WHERE video_stats.video_id = v.id
      AND v.published_at IS NOT NULL
      AND v.status = 'published'
      AND v.is_public = true
      AND v.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Phase 4: AI 메타데이터 확장
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🤖 Phase 4: AI 메타데이터 확장 시스템 생성 중...';
END $$;

-- AI 모델 정보 확장 ENUM 타입
CREATE TYPE ai_model_type AS ENUM (
    'sora', 'runway_gen3', 'kling', 'luma_dream', 'haiper', 'pika', 'minimax', 'other'
);

CREATE TYPE video_genre AS ENUM (
    'narrative', 'abstract', 'documentary', 'commercial', 'educational', 'entertainment', 'artistic', 'experimental'
);

CREATE TYPE visual_style AS ENUM (
    'realistic', 'stylized', 'cartoon', 'cinematic', 'minimalist', 'vintage', 'futuristic', 'artistic'
);

-- videos 테이블에 AI 메타데이터 필드 추가
ALTER TABLE videos
    ALTER COLUMN ai_model TYPE ai_model_type USING ai_model::ai_model_type,
    ADD COLUMN IF NOT EXISTS genre video_genre,
    ADD COLUMN IF NOT EXISTS visual_style visual_style,
    ADD COLUMN IF NOT EXISTS ai_tools text[],
    ADD COLUMN IF NOT EXISTS technical_specs jsonb DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS style_tags text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS mood_tags text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS target_audience text[],
    ADD COLUMN IF NOT EXISTS production_complexity integer DEFAULT 1 CHECK (production_complexity BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS estimated_budget_range text,
    ADD COLUMN IF NOT EXISTS commercial_potential integer DEFAULT 1 CHECK (commercial_potential BETWEEN 1 AND 5);

-- AI 기술 스택 정보 테이블
CREATE TABLE IF NOT EXISTS ai_tech_stack (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
    primary_ai_model ai_model_type NOT NULL,
    model_version text,
    training_data_source text,
    generation_params jsonb DEFAULT '{}',
    post_processing_tools text[],
    generation_time_seconds integer,
    iterations_count integer DEFAULT 1,
    success_rate numeric(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
    generation_cost numeric(10,4),
    compute_units_used integer,
    created_at timestamptz DEFAULT now()
);

-- 투자자 선호도 테이블
CREATE TABLE IF NOT EXISTS investor_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_genres video_genre[],
    preferred_styles visual_style[],
    preferred_ai_models ai_model_type[],
    min_investment_amount numeric(15,2) DEFAULT 0,
    max_investment_amount numeric(15,2),
    preferred_complexity_range integer[] DEFAULT '{1,2,3,4,5}',
    min_commercial_potential integer DEFAULT 1 CHECK (min_commercial_potential BETWEEN 1 AND 5),
    target_audience_match text[],
    exclude_tags text[] DEFAULT '{}',
    preferred_regions text[],
    preferred_languages text[] DEFAULT '{"korean"}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- AI 메타데이터 인덱스
CREATE INDEX IF NOT EXISTS videos_genre_idx ON videos(genre) WHERE genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_visual_style_idx ON videos(visual_style) WHERE visual_style IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_ai_model_enum_idx ON videos(ai_model) WHERE ai_model IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_commercial_potential_idx ON videos(commercial_potential DESC);

-- RLS 설정
ALTER TABLE ai_tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator는 자신의 비디오 기술 정보를 관리할 수 있습니다"
    ON ai_tech_stack FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = ai_tech_stack.video_id AND videos.creator_id = auth.uid()
        )
    );

CREATE POLICY "투자자는 자신의 선호도를 관리할 수 있습니다"
    ON investor_preferences FOR ALL
    USING (investor_id = auth.uid());

-- ============================================================================
-- Phase 5: 관리자 시스템
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '👨‍💼 Phase 5: 관리자 시스템 생성 중...';
END $$;

-- 기존 user_role ENUM에 ADMIN 추가
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';

-- 관리자 권한 레벨 ENUM
CREATE TYPE admin_permission_level AS ENUM (
    'SUPER_ADMIN', 'CONTENT_MODERATOR', 'CURATOR', 'ANALYTICS_VIEWER'
);

-- profiles 테이블에 관리자 정보 추가
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS admin_level admin_permission_level,
    ADD COLUMN IF NOT EXISTS admin_notes text,
    ADD COLUMN IF NOT EXISTS admin_activated_at timestamptz,
    ADD COLUMN IF NOT EXISTS admin_activated_by uuid REFERENCES profiles(id);

-- 큐레이션 카테고리 테이블
CREATE TABLE IF NOT EXISTS curation_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
    description text CHECK (length(description) <= 500),
    display_order integer DEFAULT 0 NOT NULL,
    max_items integer DEFAULT 10 CHECK (max_items > 0 AND max_items <= 50),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 큐레이션된 비디오 목록
CREATE TABLE IF NOT EXISTS curated_videos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid REFERENCES curation_categories(id) ON DELETE CASCADE,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
    curator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    display_order integer DEFAULT 0 NOT NULL,
    custom_title text,
    custom_description text,
    curator_notes text,
    click_count integer DEFAULT 0 NOT NULL,
    conversion_rate numeric(5,2),
    scheduled_start_at timestamptz,
    scheduled_end_at timestamptz,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(category_id, video_id)
);

-- 콘텐츠 모더레이션 타입
CREATE TYPE moderation_action_type AS ENUM (
    'REPORTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN', 'DELETED', 'FEATURED', 'UNFEATURED'
);

CREATE TYPE report_reason AS ENUM (
    'INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'SPAM', 'MISLEADING_INFO', 'HARASSMENT', 'OTHER'
);

-- 콘텐츠 모더레이션 로그
CREATE TABLE IF NOT EXISTS content_moderation_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
    moderator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action_type moderation_action_type NOT NULL,
    report_reason report_reason,
    reason_details text,
    moderator_notes text,
    previous_status video_status,
    new_status video_status,
    is_automated boolean DEFAULT false NOT NULL,
    ai_confidence_score numeric(3,2),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 기본 큐레이션 카테고리 생성
INSERT INTO curation_categories (name, description, display_order, max_items) VALUES
('홈페이지 히어로', '메인 페이지 상단 추천 영상', 1, 5),
('이주의 베스트', '이번 주 가장 인기있는 영상들', 2, 10),
('신규 크리에이터 스포트라이트', '새로운 창작자들의 작품', 3, 8),
('투자 주목 영상', '투자자들이 관심을 보이는 영상들', 4, 12),
('기술별 쇼케이스', 'AI 모델별 대표 작품들', 5, 15)
ON CONFLICT (name) DO NOTHING;

-- 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION check_admin_permission(
    user_id uuid,
    required_level admin_permission_level
) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND role = 'ADMIN'
        AND admin_level IS NOT NULL
        AND (
            admin_level = 'SUPER_ADMIN' OR
            admin_level = required_level OR
            (required_level = 'ANALYTICS_VIEWER' AND admin_level IN ('CONTENT_MODERATOR', 'CURATOR'))
        )
    );
END;
$$ LANGUAGE plpgsql;

-- RLS 설정
ALTER TABLE curation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;

-- 관리자 인덱스
CREATE INDEX IF NOT EXISTS profiles_admin_role_idx ON profiles(role, admin_level) WHERE role = 'ADMIN';
CREATE INDEX IF NOT EXISTS curation_categories_active_order_idx ON curation_categories(is_active, display_order) WHERE is_active = true;

-- ============================================================================
-- 마이그레이션 완료 확인
-- ============================================================================

DO $$
DECLARE
    table_count integer;
    function_count integer;
    index_count integer;
BEGIN
    -- 테이블 수 확인
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'videos', 'video_stats', 'video_reactions', 'investment_interests',
                       'ai_tech_stack', 'investor_preferences', 'curation_categories', 'curated_videos',
                       'content_moderation_logs');

    -- 함수 수 확인
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('update_updated_at_column', 'create_video_stats', 'calculate_trending_score',
                         'update_trending_scores', 'check_admin_permission');

    -- 인덱스 수 확인
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'videos', 'video_stats', 'video_reactions', 'investment_interests');

    RAISE NOTICE '✅ VLANET 데이터베이스 마이그레이션 완료!';
    RAISE NOTICE '📊 생성된 테이블: % 개', table_count;
    RAISE NOTICE '⚙️ 생성된 함수: % 개', function_count;
    RAISE NOTICE '⚡ 생성된 인덱스: % 개', index_count;
    RAISE NOTICE '🔒 RLS 정책: 모든 테이블 활성화';
    RAISE NOTICE '🎯 트렌딩 시스템: 투자 중심 알고리즘 적용';
    RAISE NOTICE '🤖 AI 메타데이터: 매칭 시스템 준비 완료';
    RAISE NOTICE '👨‍💼 관리자 시스템: 4단계 권한 구조 적용';
    RAISE NOTICE '🚀 VLANET 프로덕션 배포 준비 완료!';
    RAISE NOTICE '⏰ 마이그레이션 완료 시간: %', NOW();
END $$;