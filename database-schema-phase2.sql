-- VideoPlanet Database Schema Phase 2
-- 영상 업로드 시스템 및 관련 테이블 구조
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행

-- ============================================================================
-- 1. 영상 상태 ENUM 타입 생성
-- ============================================================================
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'published', 'failed', 'deleted');

-- ============================================================================
-- 2. 영상 메인 테이블 생성
-- ============================================================================
CREATE TABLE videos (
    -- 기본 필드
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
    file_size bigint CHECK (file_size > 0 AND file_size <= 209715200), -- 200MB 제한
    duration integer CHECK (duration > 0 AND duration <= 120), -- 2분(120초) 제한

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

-- ============================================================================
-- 3. 영상 통계 테이블 생성
-- ============================================================================
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

    -- 타임스탬프
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 4. 영상 카테고리 테이블 생성 (향후 확장용)
-- ============================================================================
CREATE TABLE video_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL CHECK (length(name) >= 2 AND length(name) <= 50),
    description text CHECK (length(description) <= 500),
    color text DEFAULT '#0059db' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5. 영상-카테고리 연결 테이블
-- ============================================================================
CREATE TABLE video_category_relations (
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
    category_id uuid REFERENCES video_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, category_id)
);

-- ============================================================================
-- 6. RLS (Row Level Security) 설정
-- ============================================================================

-- videos 테이블 RLS 활성화
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 공개된 영상을 볼 수 있음
CREATE POLICY "공개된 영상은 누구나 볼 수 있습니다"
    ON videos
    FOR SELECT
    USING (is_public = true AND status = 'published' AND deleted_at IS NULL);

-- 정책 2: Creator는 자신의 모든 영상을 관리할 수 있음
CREATE POLICY "Creator는 자신의 영상을 관리할 수 있습니다"
    ON videos
    FOR ALL
    USING (auth.uid() = creator_id);

-- video_stats 테이블 RLS 활성화
ALTER TABLE video_stats ENABLE ROW LEVEL SECURITY;

-- 정책 3: 모든 사용자가 공개된 영상의 통계를 볼 수 있음
CREATE POLICY "공개된 영상의 통계는 누구나 볼 수 있습니다"
    ON video_stats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = video_stats.video_id
            AND is_public = true
            AND status = 'published'
            AND deleted_at IS NULL
        )
    );

-- 정책 4: Creator는 자신의 영상 통계를 관리할 수 있음
CREATE POLICY "Creator는 자신의 영상 통계를 관리할 수 있습니다"
    ON video_stats
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = video_stats.video_id
            AND videos.creator_id = auth.uid()
        )
    );

-- 카테고리 테이블 RLS (누구나 읽기 가능, 관리자만 수정)
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "카테고리는 누구나 볼 수 있습니다"
    ON video_categories FOR SELECT USING (is_active = true);

ALTER TABLE video_category_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "카테고리 관계는 누구나 볼 수 있습니다"
    ON video_category_relations FOR SELECT USING (true);

-- ============================================================================
-- 7. 트리거 함수 및 트리거 생성
-- ============================================================================

-- videos 테이블 updated_at 트리거
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- video_stats 테이블 updated_at 트리거
CREATE TRIGGER update_video_stats_updated_at
    BEFORE UPDATE ON video_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 영상 생성 시 통계 테이블 자동 생성 트리거
CREATE OR REPLACE FUNCTION create_video_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO video_stats (video_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_video_stats_trigger
    AFTER INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION create_video_stats();

-- 영상 상태 변경 시 published_at 자동 설정
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    -- published 상태로 변경 시 published_at 설정
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at = now();
    -- published 상태에서 다른 상태로 변경 시 published_at 제거
    ELSIF NEW.status != 'published' AND OLD.status = 'published' THEN
        NEW.published_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_published_at_trigger
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION set_published_at();

-- ============================================================================
-- 8. 인덱스 생성 (성능 최적화)
-- ============================================================================

-- 기본 조회용 인덱스
CREATE INDEX videos_creator_id_idx ON videos(creator_id);
CREATE INDEX videos_status_idx ON videos(status) WHERE status = 'published';
CREATE INDEX videos_created_at_idx ON videos(created_at DESC);
CREATE INDEX videos_published_at_idx ON videos(published_at DESC) WHERE published_at IS NOT NULL;

-- 공개 영상 조회용 복합 인덱스
CREATE INDEX videos_public_published_idx ON videos(is_public, status, created_at DESC)
    WHERE is_public = true AND status = 'published' AND deleted_at IS NULL;

-- 태그 검색용 인덱스 (GIN)
CREATE INDEX videos_tags_idx ON videos USING GIN(tags);

-- 전문 검색용 인덱스
CREATE INDEX videos_search_idx ON videos USING GIN(to_tsvector('korean', title || ' ' || coalesce(description, '')));

-- 통계 조회용 인덱스
CREATE INDEX video_stats_view_count_idx ON video_stats(view_count DESC);
CREATE INDEX video_stats_trending_idx ON video_stats(trending_score DESC);

-- 카테고리 인덱스
CREATE INDEX video_categories_active_idx ON video_categories(is_active, sort_order) WHERE is_active = true;

-- ============================================================================
-- 9. 기본 카테고리 데이터 삽입
-- ============================================================================
INSERT INTO video_categories (name, description, color, sort_order) VALUES
('AI 애니메이션', 'AI로 생성된 애니메이션 영상들', '#FF6B6B', 1),
('AI 실사', 'AI로 생성된 실사 영상들', '#4ECDC4', 2),
('음악 비디오', 'AI가 제작한 뮤직 비디오', '#45B7D1', 3),
('단편 영화', 'AI 기술로 만든 단편 영화', '#96CEB4', 4),
('광고/마케팅', '상업용 AI 영상 콘텐츠', '#FECA57', 5),
('교육', '교육용 AI 영상 콘텐츠', '#FF9FF3', 6),
('실험적', '실험적이고 창의적인 AI 영상', '#54A0FF', 7);

-- ============================================================================
-- 10. 유용한 뷰 생성
-- ============================================================================

-- 공개된 인기 영상 뷰
CREATE VIEW popular_videos_view AS
SELECT
    v.id,
    v.title,
    v.description,
    v.thumbnail_url,
    v.duration,
    v.created_at,
    v.published_at,
    p.username as creator_username,
    p.avatar_url as creator_avatar,
    vs.view_count,
    vs.like_count,
    vs.comment_count,
    vs.trending_score
FROM videos v
JOIN profiles p ON v.creator_id = p.id
JOIN video_stats vs ON v.id = vs.video_id
WHERE v.is_public = true
  AND v.status = 'published'
  AND v.deleted_at IS NULL
  AND p.onboarding_completed = true;

-- Creator의 영상 대시보드 뷰
CREATE VIEW creator_dashboard_view AS
SELECT
    v.id,
    v.title,
    v.description,
    v.thumbnail_url,
    v.status,
    v.upload_progress,
    v.duration,
    v.file_size,
    v.is_public,
    v.created_at,
    v.updated_at,
    v.published_at,
    vs.view_count,
    vs.like_count,
    vs.investment_interest_count,
    vs.total_revenue,
    vs.creator_earnings
FROM videos v
LEFT JOIN video_stats vs ON v.id = vs.video_id
WHERE v.deleted_at IS NULL;

-- ============================================================================
-- 11. Supabase Storage 버킷을 위한 정책 함수
-- ============================================================================

-- 영상 파일 업로드 권한 검사 함수
CREATE OR REPLACE FUNCTION can_upload_video(bucket_name text, object_name text, creator_uuid uuid)
RETURNS boolean AS $$
BEGIN
    -- Creator 역할 확인
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = creator_uuid
        AND role = 'CREATOR'
        AND onboarding_completed = true
    ) THEN
        RETURN false;
    END IF;

    -- 파일 경로 형식 확인 (creator_id/video_id/filename.mp4)
    IF object_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/.*\.mp4$' THEN
        RETURN false;
    END IF;

    -- 경로의 creator_id가 실제 사용자와 일치하는지 확인
    IF split_part(object_name, '/', 1) != creator_uuid::text THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. 검색 및 필터링 함수
-- ============================================================================

-- 영상 전문 검색 함수
CREATE OR REPLACE FUNCTION search_videos(
    search_query text,
    category_filter uuid[] DEFAULT NULL,
    creator_filter uuid DEFAULT NULL,
    limit_count integer DEFAULT 20,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    thumbnail_url text,
    creator_username text,
    view_count integer,
    like_count integer,
    created_at timestamptz,
    relevance real
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.title,
        v.description,
        v.thumbnail_url,
        p.username as creator_username,
        vs.view_count,
        vs.like_count,
        v.created_at,
        ts_rank(to_tsvector('korean', v.title || ' ' || coalesce(v.description, '')),
                plainto_tsquery('korean', search_query)) as relevance
    FROM videos v
    JOIN profiles p ON v.creator_id = p.id
    JOIN video_stats vs ON v.id = vs.video_id
    LEFT JOIN video_category_relations vcr ON v.id = vcr.video_id
    WHERE v.is_public = true
      AND v.status = 'published'
      AND v.deleted_at IS NULL
      AND (search_query IS NULL OR to_tsvector('korean', v.title || ' ' || coalesce(v.description, '')) @@ plainto_tsquery('korean', search_query))
      AND (category_filter IS NULL OR vcr.category_id = ANY(category_filter))
      AND (creator_filter IS NULL OR v.creator_id = creator_filter)
    ORDER BY
        CASE WHEN search_query IS NOT NULL THEN ts_rank(to_tsvector('korean', v.title || ' ' || coalesce(v.description, '')), plainto_tsquery('korean', search_query)) ELSE 0 END DESC,
        vs.trending_score DESC,
        v.published_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ VideoPlanet Phase 2 데이터베이스 스키마 설정이 완료되었습니다!';
    RAISE NOTICE '📊 생성된 테이블: videos, video_stats, video_categories, video_category_relations';
    RAISE NOTICE '🔒 RLS 정책: Creator 기반 접근 제어 활성화';
    RAISE NOTICE '⚡ 인덱스: 검색 및 성능 최적화 인덱스 생성 완료';
    RAISE NOTICE '📈 뷰: popular_videos_view, creator_dashboard_view 생성';
    RAISE NOTICE '🔍 기능: 전문 검색, 카테고리 필터링 지원';
    RAISE NOTICE '🎬 Phase 2 영상 업로드 시스템 준비 완료!';
END $$;