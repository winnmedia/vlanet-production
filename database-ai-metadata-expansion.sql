-- VLANET Database AI Metadata Expansion - Phase 2
-- 미래 투자자-창작자 매칭을 위한 AI 메타데이터 구조 확장
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행

-- ============================================================================
-- 1. AI 모델 정보 확장을 위한 ENUM 타입 생성
-- ============================================================================

-- 지원되는 AI 모델 목록 정의
CREATE TYPE ai_model_type AS ENUM (
    'sora',
    'runway_gen3',
    'kling',
    'luma_dream',
    'haiper',
    'pika',
    'minimax',
    'other'
);

-- 비디오 장르 카테고리
CREATE TYPE video_genre AS ENUM (
    'narrative',        -- 내러티브/스토리
    'abstract',         -- 추상적
    'documentary',      -- 다큐멘터리
    'commercial',       -- 광고/상업적
    'educational',      -- 교육용
    'entertainment',    -- 엔터테인먼트
    'artistic',         -- 예술적
    'experimental'      -- 실험적
);

-- 비주얼 스타일 카테고리
CREATE TYPE visual_style AS ENUM (
    'realistic',        -- 사실적
    'stylized',         -- 양식화된
    'cartoon',          -- 만화/애니메이션
    'cinematic',        -- 영화적
    'minimalist',       -- 미니멀
    'vintage',          -- 빈티지
    'futuristic',       -- 미래적
    'artistic'          -- 예술적
);

-- ============================================================================
-- 2. videos 테이블에 AI 메타데이터 필드 추가
-- ============================================================================

-- AI 모델 필드 타입 변경 및 신규 필드 추가
ALTER TABLE videos
    ALTER COLUMN ai_model TYPE ai_model_type USING ai_model::ai_model_type,
    ADD COLUMN IF NOT EXISTS genre video_genre,
    ADD COLUMN IF NOT EXISTS visual_style visual_style,
    ADD COLUMN IF NOT EXISTS ai_tools text[], -- 사용된 AI 도구들의 배열
    ADD COLUMN IF NOT EXISTS technical_specs jsonb DEFAULT '{}', -- 기술적 사양
    ADD COLUMN IF NOT EXISTS style_tags text[] DEFAULT '{}', -- 스타일 관련 태그
    ADD COLUMN IF NOT EXISTS mood_tags text[] DEFAULT '{}', -- 무드/감정 태그
    ADD COLUMN IF NOT EXISTS target_audience text[], -- 타겟 오디언스
    ADD COLUMN IF NOT EXISTS production_complexity integer DEFAULT 1 CHECK (production_complexity BETWEEN 1 AND 5), -- 제작 복잡도 (1-5)
    ADD COLUMN IF NOT EXISTS estimated_budget_range text, -- 예상 제작비 범위
    ADD COLUMN IF NOT EXISTS commercial_potential integer DEFAULT 1 CHECK (commercial_potential BETWEEN 1 AND 5); -- 상업적 잠재력 (1-5)

-- ============================================================================
-- 3. AI 기술 스택 정보를 위한 별도 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_tech_stack (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,

    -- AI 모델별 세부 정보
    primary_ai_model ai_model_type NOT NULL,
    model_version text,
    training_data_source text,

    -- 생성 파라미터
    generation_params jsonb DEFAULT '{}', -- 프롬프트, seed, guidance scale 등
    post_processing_tools text[], -- 후처리에 사용된 도구들

    -- 품질 메트릭
    generation_time_seconds integer,
    iterations_count integer DEFAULT 1,
    success_rate numeric(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),

    -- 비용 정보
    generation_cost numeric(10,4),
    compute_units_used integer,

    created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. 투자자 매칭을 위한 투자 선호도 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS investor_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,

    -- 선호하는 컨텐츠 타입
    preferred_genres video_genre[],
    preferred_styles visual_style[],
    preferred_ai_models ai_model_type[],

    -- 투자 기준
    min_investment_amount numeric(15,2) DEFAULT 0,
    max_investment_amount numeric(15,2),
    preferred_complexity_range integer[] DEFAULT '{1,2,3,4,5}',
    min_commercial_potential integer DEFAULT 1 CHECK (min_commercial_potential BETWEEN 1 AND 5),

    -- 추가 필터
    target_audience_match text[],
    exclude_tags text[] DEFAULT '{}',

    -- 지역/언어 선호도
    preferred_regions text[],
    preferred_languages text[] DEFAULT '{"korean"}',

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. 매칭 점수 계산을 위한 함수 생성
-- ============================================================================

-- 투자자-비디오 매칭 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_investor_video_match_score(
    p_video_id uuid,
    p_investor_id uuid
) RETURNS integer AS $$
DECLARE
    v_record RECORD;
    pref_record RECORD;
    match_score integer := 0;
    genre_match boolean := false;
    style_match boolean := false;
    ai_model_match boolean := false;
BEGIN
    -- 비디오 정보 조회
    SELECT v.*, vs.* INTO v_record
    FROM videos v
    LEFT JOIN video_stats vs ON v.id = vs.video_id
    WHERE v.id = p_video_id;

    -- 투자자 선호도 조회
    SELECT * INTO pref_record
    FROM investor_preferences
    WHERE investor_id = p_investor_id;

    -- 선호도 정보가 없으면 기본 점수 반환
    IF pref_record IS NULL THEN
        RETURN 50; -- 중립 점수
    END IF;

    -- 장르 매칭 (30점)
    IF v_record.genre = ANY(pref_record.preferred_genres) THEN
        match_score := match_score + 30;
        genre_match := true;
    END IF;

    -- 비주얼 스타일 매칭 (25점)
    IF v_record.visual_style = ANY(pref_record.preferred_styles) THEN
        match_score := match_score + 25;
        style_match := true;
    END IF;

    -- AI 모델 매칭 (20점)
    IF v_record.ai_model = ANY(pref_record.preferred_ai_models) THEN
        match_score := match_score + 20;
        ai_model_match := true;
    END IF;

    -- 상업적 잠재력 매칭 (15점)
    IF v_record.commercial_potential >= pref_record.min_commercial_potential THEN
        match_score := match_score + 15;
    END IF;

    -- 제작 복잡도 매칭 (10점)
    IF v_record.production_complexity = ANY(pref_record.preferred_complexity_range) THEN
        match_score := match_score + 10;
    END IF;

    -- 투자 실적 기반 보너스 점수 (최대 20점)
    IF v_record.investment_interest_count > 5 THEN
        match_score := match_score + LEAST(20, v_record.investment_interest_count * 2);
    END IF;

    -- 종합 매칭 보너스 (모든 주요 카테고리 매칭 시)
    IF genre_match AND style_match AND ai_model_match THEN
        match_score := match_score + 15; -- 보너스
    END IF;

    RETURN LEAST(100, match_score); -- 최대 100점으로 제한
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 매칭 추천 시스템을 위한 뷰 생성
-- ============================================================================

-- 투자자별 추천 비디오 뷰
CREATE OR REPLACE VIEW investor_recommended_videos AS
SELECT
    ip.investor_id,
    v.id as video_id,
    v.title,
    v.creator_id,
    p.username as creator_username,
    v.genre,
    v.visual_style,
    v.ai_model,
    v.commercial_potential,
    vs.investment_interest_count,
    vs.total_investment_amount,
    calculate_investor_video_match_score(v.id, ip.investor_id) as match_score,
    v.created_at,
    vs.trending_score
FROM investor_preferences ip
CROSS JOIN videos v
JOIN profiles p ON v.creator_id = p.id
LEFT JOIN video_stats vs ON v.id = vs.video_id
WHERE v.status = 'published'
  AND v.is_public = true
  AND v.deleted_at IS NULL
  AND calculate_investor_video_match_score(v.id, ip.investor_id) >= 60; -- 60점 이상만 추천

-- 창작자별 잠재 투자자 뷰
CREATE OR REPLACE VIEW creator_potential_investors AS
SELECT
    v.creator_id,
    v.id as video_id,
    ip.investor_id,
    inv_prof.username as investor_username,
    calculate_investor_video_match_score(v.id, ip.investor_id) as match_score,
    ip.max_investment_amount,
    ip.min_investment_amount,
    v.commercial_potential,
    vs.investment_interest_count
FROM videos v
JOIN video_stats vs ON v.id = vs.video_id
CROSS JOIN investor_preferences ip
JOIN profiles inv_prof ON ip.investor_id = inv_prof.id
WHERE v.status = 'published'
  AND v.is_public = true
  AND v.deleted_at IS NULL
  AND calculate_investor_video_match_score(v.id, ip.investor_id) >= 70 -- 더 높은 기준
  AND inv_prof.role = 'FUNDER'
  AND inv_prof.onboarding_completed = true;

-- ============================================================================
-- 7. 인덱스 추가 (성능 최적화)
-- ============================================================================

-- AI 메타데이터 검색용 인덱스
CREATE INDEX IF NOT EXISTS videos_genre_idx ON videos(genre) WHERE genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_visual_style_idx ON videos(visual_style) WHERE visual_style IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_ai_model_enum_idx ON videos(ai_model) WHERE ai_model IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_commercial_potential_idx ON videos(commercial_potential DESC);
CREATE INDEX IF NOT EXISTS videos_production_complexity_idx ON videos(production_complexity);

-- AI 도구 배열 검색용 인덱스 (GIN)
CREATE INDEX IF NOT EXISTS videos_ai_tools_idx ON videos USING GIN(ai_tools) WHERE ai_tools IS NOT NULL;
CREATE INDEX IF NOT EXISTS videos_style_tags_idx ON videos USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS videos_mood_tags_idx ON videos USING GIN(mood_tags);
CREATE INDEX IF NOT EXISTS videos_target_audience_idx ON videos USING GIN(target_audience);

-- AI 기술 스택 테이블 인덱스
CREATE INDEX IF NOT EXISTS ai_tech_stack_video_id_idx ON ai_tech_stack(video_id);
CREATE INDEX IF NOT EXISTS ai_tech_stack_primary_ai_model_idx ON ai_tech_stack(primary_ai_model);
CREATE INDEX IF NOT EXISTS ai_tech_stack_generation_cost_idx ON ai_tech_stack(generation_cost DESC);

-- 투자자 선호도 인덱스
CREATE INDEX IF NOT EXISTS investor_preferences_investor_id_idx ON investor_preferences(investor_id);
CREATE INDEX IF NOT EXISTS investor_preferences_genres_idx ON investor_preferences USING GIN(preferred_genres);
CREATE INDEX IF NOT EXISTS investor_preferences_styles_idx ON investor_preferences USING GIN(preferred_styles);
CREATE INDEX IF NOT EXISTS investor_preferences_ai_models_idx ON investor_preferences USING GIN(preferred_ai_models);

-- ============================================================================
-- 8. RLS (Row Level Security) 설정
-- ============================================================================

-- ai_tech_stack 테이블 RLS
ALTER TABLE ai_tech_stack ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator는 자신의 비디오 기술 정보를 관리할 수 있습니다"
    ON ai_tech_stack
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = ai_tech_stack.video_id
            AND videos.creator_id = auth.uid()
        )
    );

CREATE POLICY "공개된 비디오의 기술 정보는 누구나 볼 수 있습니다"
    ON ai_tech_stack
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = ai_tech_stack.video_id
            AND videos.is_public = true
            AND videos.status = 'published'
            AND videos.deleted_at IS NULL
        )
    );

-- investor_preferences 테이블 RLS
ALTER TABLE investor_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "투자자는 자신의 선호도를 관리할 수 있습니다"
    ON investor_preferences
    FOR ALL
    USING (investor_id = auth.uid());

-- ============================================================================
-- 9. 샘플 데이터 (개발/테스트용)
-- ============================================================================

-- 기본 AI 모델별 기술 정보 예시 (필요시만 실행)
/*
-- Sora 기본 설정 예시
INSERT INTO ai_tech_stack (video_id, primary_ai_model, model_version, generation_params)
SELECT
    id,
    'sora'::ai_model_type,
    '1.0',
    '{"prompt_strength": 0.8, "guidance_scale": 7.5, "steps": 50}'::jsonb
FROM videos
WHERE ai_model = 'sora'::ai_model_type
LIMIT 5;

-- 샘플 투자자 선호도
INSERT INTO investor_preferences (
    investor_id,
    preferred_genres,
    preferred_styles,
    preferred_ai_models,
    min_investment_amount,
    max_investment_amount,
    min_commercial_potential
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002', -- jane_funder UUID
    ARRAY['commercial', 'entertainment']::video_genre[],
    ARRAY['cinematic', 'realistic']::visual_style[],
    ARRAY['sora', 'runway_gen3']::ai_model_type[],
    10000.00,
    500000.00,
    3
);
*/

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ VLANET Phase 2 AI 메타데이터 확장이 완료되었습니다!';
    RAISE NOTICE '🤖 추가된 ENUM: ai_model_type, video_genre, visual_style';
    RAISE NOTICE '📊 확장된 테이블: videos (9개 필드), ai_tech_stack, investor_preferences 추가';
    RAISE NOTICE '🎯 매칭 시스템: calculate_investor_video_match_score() 함수';
    RAISE NOTICE '📈 추천 뷰: investor_recommended_videos, creator_potential_investors';
    RAISE NOTICE '⚡ 인덱스: AI 메타데이터 검색 최적화 완료';
    RAISE NOTICE '🔒 RLS: 투자자 선호도 및 기술 정보 보안 설정';
    RAISE NOTICE '🚀 Phase 2 투자자 매칭 시스템 준비 완료!';
END $$;