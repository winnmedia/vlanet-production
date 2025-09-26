-- VLANET Database Admin System - Phase 3
-- 관리자 기능, 큐레이션 시스템, 콘텐츠 모더레이션 구현
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행

-- ============================================================================
-- 1. 관리자 역할 및 권한 시스템 확장
-- ============================================================================

-- 기존 user_role ENUM 타입에 ADMIN 추가
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';

-- 관리자 권한 레벨 ENUM 생성
CREATE TYPE admin_permission_level AS ENUM (
    'SUPER_ADMIN',      -- 최고 관리자 (모든 권한)
    'CONTENT_MODERATOR', -- 콘텐츠 관리자
    'CURATOR',          -- 큐레이터 (featured 영상 관리)
    'ANALYTICS_VIEWER'  -- 분석 뷰어 (읽기 전용)
);

-- profiles 테이블에 관리자 정보 추가
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS admin_level admin_permission_level,
    ADD COLUMN IF NOT EXISTS admin_notes text,
    ADD COLUMN IF NOT EXISTS admin_activated_at timestamptz,
    ADD COLUMN IF NOT EXISTS admin_activated_by uuid REFERENCES profiles(id);

-- ============================================================================
-- 2. 큐레이션 시스템 테이블 생성
-- ============================================================================

-- 큐레이션 카테고리 (홈페이지 섹션별)
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

    -- 큐레이션 정보
    display_order integer DEFAULT 0 NOT NULL,
    custom_title text, -- 큐레이션용 제목 (선택사항)
    custom_description text, -- 큐레이션용 설명 (선택사항)
    curator_notes text, -- 큐레이터 노트

    -- 성과 추적
    click_count integer DEFAULT 0 NOT NULL,
    conversion_rate numeric(5,2), -- 클릭 후 투자관심 전환율

    -- 일정 관리
    scheduled_start_at timestamptz,
    scheduled_end_at timestamptz,
    is_active boolean DEFAULT true NOT NULL,

    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    UNIQUE(category_id, video_id)
);

-- ============================================================================
-- 3. 콘텐츠 모더레이션 시스템 테이블
-- ============================================================================

-- 신고/모더레이션 액션 타입
CREATE TYPE moderation_action_type AS ENUM (
    'REPORTED',         -- 신고됨
    'UNDER_REVIEW',     -- 검토 중
    'APPROVED',         -- 승인됨
    'REJECTED',         -- 거부됨
    'HIDDEN',           -- 숨김 처리
    'DELETED',          -- 삭제됨
    'FEATURED',         -- 추천됨
    'UNFEATURED'        -- 추천 해제
);

-- 신고 사유 ENUM
CREATE TYPE report_reason AS ENUM (
    'INAPPROPRIATE_CONTENT',  -- 부적절한 콘텐츠
    'COPYRIGHT_VIOLATION',    -- 저작권 위반
    'SPAM',                   -- 스팸
    'MISLEADING_INFO',        -- 잘못된 정보
    'HARASSMENT',             -- 괴롭힘
    'OTHER'                   -- 기타
);

-- 콘텐츠 모더레이션 로그
CREATE TABLE IF NOT EXISTS content_moderation_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
    moderator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

    action_type moderation_action_type NOT NULL,
    report_reason report_reason,

    -- 상세 정보
    reason_details text,
    moderator_notes text,
    previous_status video_status,
    new_status video_status,

    -- 자동화 정보
    is_automated boolean DEFAULT false NOT NULL,
    ai_confidence_score numeric(3,2), -- AI 모더레이션 신뢰도 (0-1)

    created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 4. 관리자 대시보드를 위한 통계 테이블
-- ============================================================================

-- 일별 플랫폼 통계
CREATE TABLE IF NOT EXISTS daily_platform_stats (
    stat_date date PRIMARY KEY,

    -- 콘텐츠 통계
    total_videos integer DEFAULT 0 NOT NULL,
    new_videos integer DEFAULT 0 NOT NULL,
    published_videos integer DEFAULT 0 NOT NULL,

    -- 사용자 통계
    total_users integer DEFAULT 0 NOT NULL,
    new_users integer DEFAULT 0 NOT NULL,
    active_creators integer DEFAULT 0 NOT NULL,
    active_investors integer DEFAULT 0 NOT NULL,

    -- 참여 통계
    total_views integer DEFAULT 0 NOT NULL,
    total_likes integer DEFAULT 0 NOT NULL,
    total_investments numeric(15,2) DEFAULT 0.00 NOT NULL,

    -- 모더레이션 통계
    reports_submitted integer DEFAULT 0 NOT NULL,
    reports_resolved integer DEFAULT 0 NOT NULL,
    content_moderated integer DEFAULT 0 NOT NULL,

    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5. 관리자 기능을 위한 함수들
-- ============================================================================

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

-- 큐레이션 성과 계산 함수
CREATE OR REPLACE FUNCTION calculate_curation_performance(
    p_category_id uuid,
    p_days_back integer DEFAULT 30
) RETURNS TABLE (
    total_curated_videos integer,
    total_clicks integer,
    avg_click_rate numeric,
    total_conversions integer,
    avg_conversion_rate numeric,
    top_performing_video_id uuid,
    performance_score numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH curation_stats AS (
        SELECT
            COUNT(*)::integer as curated_videos,
            SUM(cv.click_count)::integer as total_clicks,
            AVG(cv.click_count) as avg_clicks,
            SUM(CASE WHEN cv.conversion_rate > 0 THEN 1 ELSE 0 END)::integer as conversions,
            AVG(cv.conversion_rate) as avg_conv_rate,
            (SELECT video_id FROM curated_videos WHERE category_id = p_category_id ORDER BY click_count DESC LIMIT 1) as top_video
        FROM curated_videos cv
        WHERE cv.category_id = p_category_id
        AND cv.created_at >= NOW() - (p_days_back || ' days')::interval
        AND cv.is_active = true
    )
    SELECT
        cs.curated_videos,
        cs.total_clicks,
        COALESCE(cs.avg_clicks, 0)::numeric,
        cs.conversions,
        COALESCE(cs.avg_conv_rate, 0)::numeric,
        cs.top_video,
        -- 성과 점수: 클릭률(50%) + 전환율(30%) + 큐레이션 수(20%)
        COALESCE(
            (cs.avg_clicks * 0.5) +
            (cs.avg_conv_rate * 30) +
            (cs.curated_videos * 2),
            0
        )::numeric as performance_score
    FROM curation_stats cs;
END;
$$ LANGUAGE plpgsql;

-- 일별 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_daily_platform_stats(
    target_date date DEFAULT CURRENT_DATE
) RETURNS void AS $$
BEGIN
    INSERT INTO daily_platform_stats (
        stat_date,
        total_videos,
        new_videos,
        published_videos,
        total_users,
        new_users,
        active_creators,
        active_investors,
        total_views,
        total_likes,
        total_investments,
        reports_submitted,
        reports_resolved,
        content_moderated
    )
    SELECT
        target_date,
        (SELECT COUNT(*) FROM videos WHERE deleted_at IS NULL),
        (SELECT COUNT(*) FROM videos WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM videos WHERE status = 'published' AND is_public = true),
        (SELECT COUNT(*) FROM profiles),
        (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM profiles WHERE role = 'CREATOR' AND onboarding_completed = true),
        (SELECT COUNT(*) FROM profiles WHERE role = 'FUNDER' AND onboarding_completed = true),
        (SELECT COALESCE(SUM(view_count), 0) FROM video_stats),
        (SELECT COALESCE(SUM(like_count), 0) FROM video_stats),
        (SELECT COALESCE(SUM(total_investment_amount), 0) FROM video_stats),
        (SELECT COUNT(*) FROM content_moderation_logs WHERE DATE(created_at) = target_date AND action_type = 'REPORTED'),
        (SELECT COUNT(*) FROM content_moderation_logs WHERE DATE(created_at) = target_date AND action_type IN ('APPROVED', 'REJECTED')),
        (SELECT COUNT(*) FROM content_moderation_logs WHERE DATE(created_at) = target_date AND action_type IN ('HIDDEN', 'DELETED'))
    ON CONFLICT (stat_date)
    DO UPDATE SET
        total_videos = EXCLUDED.total_videos,
        new_videos = EXCLUDED.new_videos,
        published_videos = EXCLUDED.published_videos,
        total_users = EXCLUDED.total_users,
        new_users = EXCLUDED.new_users,
        active_creators = EXCLUDED.active_creators,
        active_investors = EXCLUDED.active_investors,
        total_views = EXCLUDED.total_views,
        total_likes = EXCLUDED.total_likes,
        total_investments = EXCLUDED.total_investments,
        reports_submitted = EXCLUDED.reports_submitted,
        reports_resolved = EXCLUDED.reports_resolved,
        content_moderated = EXCLUDED.content_moderated,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 관리자 대시보드 뷰 생성
-- ============================================================================

-- 콘텐츠 모더레이션 대시보드 뷰
CREATE OR REPLACE VIEW admin_moderation_dashboard AS
SELECT
    v.id as video_id,
    v.title,
    v.creator_id,
    p.username as creator_username,
    v.status,
    v.created_at,
    v.published_at,
    vs.view_count,
    vs.like_count,
    vs.investment_interest_count,

    -- 최근 모더레이션 액션
    (SELECT action_type FROM content_moderation_logs WHERE video_id = v.id ORDER BY created_at DESC LIMIT 1) as last_moderation_action,
    (SELECT created_at FROM content_moderation_logs WHERE video_id = v.id ORDER BY created_at DESC LIMIT 1) as last_moderation_at,

    -- 신고 횟수
    (SELECT COUNT(*) FROM content_moderation_logs WHERE video_id = v.id AND action_type = 'REPORTED') as report_count,

    -- 우선순위 점수 (신고 수 + 조회수 가중치)
    COALESCE((SELECT COUNT(*) FROM content_moderation_logs WHERE video_id = v.id AND action_type = 'REPORTED'), 0) * 10 +
    COALESCE(vs.view_count / 1000, 0) as priority_score

FROM videos v
LEFT JOIN profiles p ON v.creator_id = p.id
LEFT JOIN video_stats vs ON v.id = vs.video_id
WHERE v.deleted_at IS NULL
ORDER BY priority_score DESC;

-- 큐레이션 관리 뷰
CREATE OR REPLACE VIEW admin_curation_overview AS
SELECT
    cc.id as category_id,
    cc.name as category_name,
    cc.display_order,
    cc.max_items,
    cc.is_active as category_active,
    COUNT(cv.id) as current_items,
    COALESCE(SUM(cv.click_count), 0) as total_clicks,
    COALESCE(AVG(cv.conversion_rate), 0) as avg_conversion_rate,
    MAX(cv.updated_at) as last_updated
FROM curation_categories cc
LEFT JOIN curated_videos cv ON cc.id = cv.category_id AND cv.is_active = true
GROUP BY cc.id, cc.name, cc.display_order, cc.max_items, cc.is_active
ORDER BY cc.display_order;

-- ============================================================================
-- 7. RLS (Row Level Security) 설정
-- ============================================================================

-- 큐레이션 테이블 RLS
ALTER TABLE curation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_platform_stats ENABLE ROW LEVEL SECURITY;

-- 관리자만 큐레이션 관리 가능
CREATE POLICY "큐레이터 이상만 큐레이션을 관리할 수 있습니다"
    ON curation_categories
    FOR ALL
    USING (check_admin_permission(auth.uid(), 'CURATOR'::admin_permission_level));

CREATE POLICY "큐레이터 이상만 큐레이션 비디오를 관리할 수 있습니다"
    ON curated_videos
    FOR ALL
    USING (check_admin_permission(auth.uid(), 'CURATOR'::admin_permission_level));

-- 모든 사용자가 큐레이션 정보 조회 가능 (읽기 전용)
CREATE POLICY "모든 사용자가 큐레이션 카테고리를 볼 수 있습니다"
    ON curation_categories
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "모든 사용자가 큐레이션된 비디오를 볼 수 있습니다"
    ON curated_videos
    FOR SELECT
    USING (is_active = true AND scheduled_start_at <= NOW() AND (scheduled_end_at IS NULL OR scheduled_end_at > NOW()));

-- 콘텐츠 모더레이션 로그 접근 제한
CREATE POLICY "콘텐츠 관리자만 모더레이션 로그를 관리할 수 있습니다"
    ON content_moderation_logs
    FOR ALL
    USING (check_admin_permission(auth.uid(), 'CONTENT_MODERATOR'::admin_permission_level));

-- 플랫폼 통계 접근 제한
CREATE POLICY "분석 뷰어 이상만 플랫폼 통계를 볼 수 있습니다"
    ON daily_platform_stats
    FOR SELECT
    USING (check_admin_permission(auth.uid(), 'ANALYTICS_VIEWER'::admin_permission_level));

-- ============================================================================
-- 8. 인덱스 생성 (성능 최적화)
-- ============================================================================

-- 큐레이션 시스템 인덱스
CREATE INDEX IF NOT EXISTS curation_categories_active_order_idx ON curation_categories(is_active, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS curated_videos_category_order_idx ON curated_videos(category_id, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS curated_videos_performance_idx ON curated_videos(click_count DESC, conversion_rate DESC);

-- 모더레이션 시스템 인덱스
CREATE INDEX IF NOT EXISTS moderation_logs_video_action_idx ON content_moderation_logs(video_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_logs_moderator_idx ON content_moderation_logs(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_logs_reports_idx ON content_moderation_logs(action_type, created_at DESC) WHERE action_type = 'REPORTED';

-- 관리자 권한 인덱스
CREATE INDEX IF NOT EXISTS profiles_admin_role_idx ON profiles(role, admin_level) WHERE role = 'ADMIN';

-- 플랫폼 통계 인덱스
CREATE INDEX IF NOT EXISTS daily_stats_date_idx ON daily_platform_stats(stat_date DESC);

-- ============================================================================
-- 9. 기본 데이터 삽입
-- ============================================================================

-- 기본 큐레이션 카테고리 생성
INSERT INTO curation_categories (name, description, display_order, max_items) VALUES
('홈페이지 히어로', '메인 페이지 상단 추천 영상', 1, 5),
('이주의 베스트', '이번 주 가장 인기있는 영상들', 2, 10),
('신규 크리에이터 스포트라이트', '새로운 창작자들의 작품', 3, 8),
('투자 주목 영상', '투자자들이 관심을 보이는 영상들', 4, 12),
('기술별 쇼케이스', 'AI 모델별 대표 작품들', 5, 15)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 트리거 설정
-- ============================================================================

-- 큐레이션 테이블 updated_at 트리거
CREATE TRIGGER update_curation_categories_updated_at
    BEFORE UPDATE ON curation_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curated_videos_updated_at
    BEFORE UPDATE ON curated_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_platform_stats_updated_at
    BEFORE UPDATE ON daily_platform_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ VLANET Phase 3 관리자 시스템이 완료되었습니다!';
    RAISE NOTICE '👨‍💼 권한 시스템: ADMIN 역할 + 4단계 권한 레벨';
    RAISE NOTICE '🎯 큐레이션 시스템: 카테고리별 추천 영상 관리';
    RAISE NOTICE '🛡️ 모더레이션: 신고/검토/승인 시스템 구축';
    RAISE NOTICE '📊 관리자 대시보드: 실시간 통계 및 성과 추적';
    RAISE NOTICE '🔒 RLS 보안: 권한별 세분화된 접근 제어';
    RAISE NOTICE '⚡ 성능 최적화: 관리자 기능 전용 인덱스';
    RAISE NOTICE '🚀 Phase 3 관리자 기능 준비 완료!';
END $$;