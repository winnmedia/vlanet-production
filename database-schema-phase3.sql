-- VideoPlanet Phase 3: 영상 시청 및 상호작용 시스템
-- 영상 반응, 시청 기록, 투자 관심 시스템을 위한 테이블 확장

-- ==========================================
-- 1. 영상 반응 시스템 (좋아요/싫어요)
-- ==========================================

-- 반응 타입 ENUM
CREATE TYPE reaction_type AS ENUM ('like', 'dislike');

-- 영상 반응 테이블
CREATE TABLE video_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    reaction_type reaction_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- 사용자당 영상별 하나의 반응만 허용
    UNIQUE(user_id, video_id)
);

-- 인덱스 생성
CREATE INDEX idx_video_reactions_user_id ON video_reactions(user_id);
CREATE INDEX idx_video_reactions_video_id ON video_reactions(video_id);
CREATE INDEX idx_video_reactions_type ON video_reactions(reaction_type);
CREATE INDEX idx_video_reactions_created_at ON video_reactions(created_at);

-- ==========================================
-- 2. 시청 기록 시스템
-- ==========================================

-- 시청 기록 테이블
CREATE TABLE video_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL 허용 (익명 시청)
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,  -- 세션 기반 중복 방지
    watch_duration integer DEFAULT 0 NOT NULL,  -- 시청 시간 (초)
    total_duration integer NOT NULL,  -- 전체 영상 길이 (초)
    completion_rate decimal(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_duration > 0 THEN LEAST(100, (watch_duration::decimal / total_duration) * 100)
            ELSE 0
        END
    ) STORED,  -- 시청 완료율 (%)
    ip_address inet,  -- 중복 방지용 IP
    user_agent text,  -- 브라우저 정보
    referrer text,  -- 유입 경로
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- 유효성 검증
    CONSTRAINT valid_watch_duration CHECK (watch_duration >= 0),
    CONSTRAINT valid_total_duration CHECK (total_duration > 0)
);

-- 인덱스 생성
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_user_id ON video_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_video_views_session_id ON video_views(session_id);
CREATE INDEX idx_video_views_created_at ON video_views(created_at);
CREATE INDEX idx_video_views_ip_address ON video_views(ip_address);

-- ==========================================
-- 3. 투자 관심 시스템
-- ==========================================

-- 투자 관심 상태 ENUM
CREATE TYPE investment_status AS ENUM ('interested', 'contacted', 'negotiating', 'completed', 'cancelled');

-- 투자 관심 테이블
CREATE TABLE investment_interests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,  -- 정규화를 위해 추가
    status investment_status DEFAULT 'interested' NOT NULL,
    amount_range_min decimal(12,2),  -- 최소 투자 희망액
    amount_range_max decimal(12,2),  -- 최대 투자 희망액
    currency varchar(3) DEFAULT 'KRW' NOT NULL,
    message text,  -- 투자자 메시지
    contact_email varchar(255),  -- 연락용 이메일
    contact_phone varchar(20),   -- 연락용 전화번호
    is_public boolean DEFAULT false NOT NULL,  -- 공개 투자 의향 여부
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- 투자자는 영상당 한 번의 관심만 표시 가능
    UNIQUE(investor_id, video_id),

    -- 유효성 검증
    CONSTRAINT valid_amount_range CHECK (
        (amount_range_min IS NULL AND amount_range_max IS NULL) OR
        (amount_range_min IS NOT NULL AND amount_range_max IS NOT NULL AND amount_range_min <= amount_range_max)
    ),
    CONSTRAINT valid_currency CHECK (currency IN ('KRW', 'USD', 'EUR', 'JPY'))
);

-- 인덱스 생성
CREATE INDEX idx_investment_interests_investor_id ON investment_interests(investor_id);
CREATE INDEX idx_investment_interests_video_id ON investment_interests(video_id);
CREATE INDEX idx_investment_interests_creator_id ON investment_interests(creator_id);
CREATE INDEX idx_investment_interests_status ON investment_interests(status);
CREATE INDEX idx_investment_interests_created_at ON investment_interests(created_at);
CREATE INDEX idx_investment_interests_is_public ON investment_interests(is_public);

-- ==========================================
-- 4. 영상 통계 확장 (기존 video_stats 테이블 확장)
-- ==========================================

-- video_stats 테이블에 새 컬럼 추가
ALTER TABLE video_stats ADD COLUMN IF NOT EXISTS dislike_count integer DEFAULT 0 NOT NULL;
ALTER TABLE video_stats ADD COLUMN IF NOT EXISTS unique_view_count integer DEFAULT 0 NOT NULL;
ALTER TABLE video_stats ADD COLUMN IF NOT EXISTS average_watch_duration decimal(8,2) DEFAULT 0 NOT NULL;
ALTER TABLE video_stats ADD COLUMN IF NOT EXISTS completion_rate decimal(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE video_stats ADD COLUMN IF NOT EXISTS bounce_rate decimal(5,2) DEFAULT 0 NOT NULL;

-- ==========================================
-- 5. RLS (Row Level Security) 정책
-- ==========================================

-- video_reactions 테이블 RLS 활성화
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;

-- 반응 조회: 모든 사용자가 공개 영상의 반응 조회 가능
CREATE POLICY "Anyone can view reactions for public videos" ON video_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM videos
        WHERE videos.id = video_reactions.video_id
        AND videos.is_public = true
        AND videos.status = 'published'
        AND videos.deleted_at IS NULL
    )
);

-- 반응 생성: 인증된 사용자만 자신의 반응 생성
CREATE POLICY "Users can create their own reactions" ON video_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 반응 수정: 사용자는 자신의 반응만 수정 가능
CREATE POLICY "Users can update their own reactions" ON video_reactions
FOR UPDATE USING (auth.uid() = user_id);

-- 반응 삭제: 사용자는 자신의 반응만 삭제 가능
CREATE POLICY "Users can delete their own reactions" ON video_reactions
FOR DELETE USING (auth.uid() = user_id);

-- video_views 테이블 RLS 활성화
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- 시청 기록 조회: 영상 소유자와 본인만 조회 가능
CREATE POLICY "Creators and users can view video stats" ON video_views
FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM videos
        WHERE videos.id = video_views.video_id
        AND videos.creator_id = auth.uid()
    )
);

-- 시청 기록 생성: 모든 사용자가 공개 영상의 시청 기록 생성 가능
CREATE POLICY "Anyone can create view records for public videos" ON video_views
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM videos
        WHERE videos.id = video_views.video_id
        AND videos.is_public = true
        AND videos.status = 'published'
        AND videos.deleted_at IS NULL
    )
);

-- investment_interests 테이블 RLS 활성화
ALTER TABLE investment_interests ENABLE ROW LEVEL SECURITY;

-- 투자 관심 조회: 투자자, 창작자, 공개 의향인 경우 조회 가능
CREATE POLICY "Investment interests visibility" ON investment_interests
FOR SELECT USING (
    auth.uid() = investor_id OR
    auth.uid() = creator_id OR
    is_public = true
);

-- 투자 관심 생성: FUNDER 역할 사용자만 생성 가능
CREATE POLICY "Funders can create investment interests" ON investment_interests
FOR INSERT WITH CHECK (
    auth.uid() = investor_id AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'FUNDER'
    )
);

-- 투자 관심 수정: 투자자만 자신의 관심 수정 가능
CREATE POLICY "Investors can update their own interests" ON investment_interests
FOR UPDATE USING (auth.uid() = investor_id);

-- 투자 관심 삭제: 투자자만 자신의 관심 삭제 가능
CREATE POLICY "Investors can delete their own interests" ON investment_interests
FOR DELETE USING (auth.uid() = investor_id);

-- ==========================================
-- 6. 트리거 함수 (자동 통계 업데이트)
-- ==========================================

-- 반응 수 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_video_reaction_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 좋아요/싫어요 수 업데이트
    UPDATE video_stats
    SET
        like_count = (
            SELECT COUNT(*)
            FROM video_reactions
            WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
            AND reaction_type = 'like'
        ),
        dislike_count = (
            SELECT COUNT(*)
            FROM video_reactions
            WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
            AND reaction_type = 'dislike'
        ),
        updated_at = now()
    WHERE video_id = COALESCE(NEW.video_id, OLD.video_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 반응 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_video_reaction_stats ON video_reactions;
CREATE TRIGGER trigger_update_video_reaction_stats
    AFTER INSERT OR UPDATE OR DELETE ON video_reactions
    FOR EACH ROW EXECUTE FUNCTION update_video_reaction_stats();

-- 시청 통계 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_video_view_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 시청 통계 업데이트
    UPDATE video_stats
    SET
        view_count = (
            SELECT COUNT(*)
            FROM video_views
            WHERE video_id = NEW.video_id
        ),
        unique_view_count = (
            SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address::text))
            FROM video_views
            WHERE video_id = NEW.video_id
        ),
        average_watch_duration = (
            SELECT COALESCE(AVG(watch_duration), 0)
            FROM video_views
            WHERE video_id = NEW.video_id
        ),
        completion_rate = (
            SELECT COALESCE(AVG(completion_rate), 0)
            FROM video_views
            WHERE video_id = NEW.video_id
        ),
        last_viewed_at = now(),
        updated_at = now()
    WHERE video_id = NEW.video_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 시청 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_video_view_stats ON video_views;
CREATE TRIGGER trigger_update_video_view_stats
    AFTER INSERT ON video_views
    FOR EACH ROW EXECUTE FUNCTION update_video_view_stats();

-- 투자 관심 수 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_video_investment_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 투자 관심 수 업데이트
    UPDATE video_stats
    SET
        investment_interest_count = (
            SELECT COUNT(*)
            FROM investment_interests
            WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
            AND status != 'cancelled'
        ),
        updated_at = now()
    WHERE video_id = COALESCE(NEW.video_id, OLD.video_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 투자 관심 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_video_investment_stats ON investment_interests;
CREATE TRIGGER trigger_update_video_investment_stats
    AFTER INSERT OR UPDATE OR DELETE ON investment_interests
    FOR EACH ROW EXECUTE FUNCTION update_video_investment_stats();

-- ==========================================
-- 7. 유틸리티 함수
-- ==========================================

-- 영상 트렌딩 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_trending_score(
    video_id_param uuid,
    weight_views decimal DEFAULT 0.3,
    weight_likes decimal DEFAULT 0.2,
    weight_completion decimal DEFAULT 0.2,
    weight_investment decimal DEFAULT 0.15,
    weight_recency decimal DEFAULT 0.15
) RETURNS decimal AS $$
DECLARE
    score decimal := 0;
    video_age_hours decimal;
    stats_record video_stats%ROWTYPE;
BEGIN
    -- 영상 통계 조회
    SELECT * INTO stats_record
    FROM video_stats
    WHERE video_id = video_id_param;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- 영상 생성 경과 시간 계산 (시간 단위)
    SELECT EXTRACT(EPOCH FROM (now() - videos.created_at)) / 3600
    INTO video_age_hours
    FROM videos
    WHERE id = video_id_param;

    -- 트렌딩 점수 계산
    score :=
        -- 조회수 점수 (최대 100점)
        (LEAST(stats_record.view_count, 1000) / 10.0) * weight_views +

        -- 좋아요 점수 (최대 100점)
        (LEAST(stats_record.like_count, 500) / 5.0) * weight_likes +

        -- 완주율 점수 (0~100점)
        stats_record.completion_rate * weight_completion +

        -- 투자 관심 점수 (최대 100점)
        (LEAST(stats_record.investment_interest_count, 50) * 2.0) * weight_investment +

        -- 최신성 점수 (24시간 이내 최대, 이후 감소)
        (CASE
            WHEN video_age_hours <= 24 THEN 100
            WHEN video_age_hours <= 168 THEN 100 - ((video_age_hours - 24) / 144 * 80)  -- 7일간 선형 감소
            ELSE 20
        END) * weight_recency;

    RETURN GREATEST(0, score);
END;
$$ LANGUAGE plpgsql;

-- 트렌딩 점수 업데이트 함수
CREATE OR REPLACE FUNCTION update_all_trending_scores() RETURNS void AS $$
BEGIN
    UPDATE video_stats
    SET
        trending_score = calculate_trending_score(video_id),
        updated_at = now()
    WHERE video_id IN (
        SELECT id FROM videos
        WHERE status = 'published'
        AND is_public = true
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. 초기 데이터 및 설정
-- ==========================================

-- 기존 영상들의 확장된 통계 초기화
UPDATE video_stats
SET
    dislike_count = 0,
    unique_view_count = view_count,  -- 기본값으로 설정
    average_watch_duration = 0,
    completion_rate = 0,
    bounce_rate = 0
WHERE dislike_count IS NULL;

-- 트렌딩 점수 초기 계산
SELECT update_all_trending_scores();

-- ==========================================
-- Phase 3 스키마 완료
-- ==========================================

-- 스키마 버전 정보
INSERT INTO schema_versions (phase, version, description, applied_at)
VALUES (
    'phase3',
    '1.0.0',
    'Video interaction system: reactions, views, investment interests',
    now()
) ON CONFLICT (phase) DO UPDATE SET
    version = EXCLUDED.version,
    description = EXCLUDED.description,
    applied_at = EXCLUDED.applied_at;