-- VideoPlanet Phase 4: 댓글 시스템
-- 영상 댓글 및 대댓글 기능을 위한 데이터베이스 구조
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행

-- ==========================================
-- 1. 댓글 테이블 생성
-- ==========================================

-- 댓글 메인 테이블
CREATE TABLE comments (
    -- 기본 필드
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,

    -- 대댓글 지원 (계층 구조)
    parent_id uuid REFERENCES comments(id) ON DELETE CASCADE, -- NULL이면 최상위 댓글

    -- 댓글 내용
    content text NOT NULL,

    -- 상태 관리
    is_edited boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL, -- 소프트 삭제 (댓글 내용 숨김)

    -- 타임스탬프
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- 유효성 검증
    CONSTRAINT valid_content_length CHECK (length(trim(content)) >= 1 AND length(content) <= 1000),
    CONSTRAINT prevent_self_reference CHECK (id != parent_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_video_created ON comments(video_id, created_at);

-- 복합 인덱스 (댓글 목록 조회 최적화)
CREATE INDEX idx_comments_video_parent_created ON comments(video_id, parent_id, created_at)
WHERE is_deleted = false;

-- ==========================================
-- 2. RLS (Row Level Security) 설정
-- ==========================================

-- RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 공개 댓글을 볼 수 있음 (삭제되지 않은 댓글만)
CREATE POLICY "공개 댓글은 누구나 볼 수 있습니다"
    ON comments
    FOR SELECT
    USING (is_deleted = false);

-- 정책 2: 인증된 사용자는 댓글을 작성할 수 있음
CREATE POLICY "인증된 사용자는 댓글을 작성할 수 있습니다"
    ON comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        is_deleted = false AND
        length(trim(content)) >= 1
    );

-- 정책 3: 사용자는 자신의 댓글을 수정할 수 있음 (24시간 이내)
CREATE POLICY "사용자는 자신의 댓글을 수정할 수 있습니다"
    ON comments
    FOR UPDATE
    USING (
        auth.uid() = user_id AND
        is_deleted = false AND
        created_at > now() - interval '24 hours'
    )
    WITH CHECK (
        auth.uid() = user_id AND
        length(trim(content)) >= 1
    );

-- 정책 4: 사용자는 자신의 댓글을 삭제할 수 있음 (소프트 삭제)
CREATE POLICY "사용자는 자신의 댓글을 삭제할 수 있습니다"
    ON comments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 3. 댓글 수 업데이트 트리거
-- ==========================================

-- 영상 통계 테이블에 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_video_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT 시
    IF TG_OP = 'INSERT' THEN
        -- 삭제되지 않은 댓글인 경우에만 카운트 증가
        IF NEW.is_deleted = false THEN
            UPDATE video_stats
            SET
                comment_count = comment_count + 1,
                updated_at = now()
            WHERE video_id = NEW.video_id;
        END IF;
        RETURN NEW;
    END IF;

    -- UPDATE 시 (소프트 삭제/복구)
    IF TG_OP = 'UPDATE' THEN
        -- 댓글이 삭제된 경우
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            UPDATE video_stats
            SET
                comment_count = GREATEST(comment_count - 1, 0),
                updated_at = now()
            WHERE video_id = NEW.video_id;
        -- 댓글이 복구된 경우
        ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
            UPDATE video_stats
            SET
                comment_count = comment_count + 1,
                updated_at = now()
            WHERE video_id = NEW.video_id;
        END IF;
        RETURN NEW;
    END IF;

    -- DELETE 시 (하드 삭제)
    IF TG_OP = 'DELETE' THEN
        -- 삭제되지 않은 댓글이었던 경우에만 카운트 감소
        IF OLD.is_deleted = false THEN
            UPDATE video_stats
            SET
                comment_count = GREATEST(comment_count - 1, 0),
                updated_at = now()
            WHERE video_id = OLD.video_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER comments_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_video_comment_count();

-- ==========================================
-- 4. updated_at 자동 업데이트 트리거
-- ==========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER comments_updated_at_trigger
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comments_updated_at();

-- ==========================================
-- 5. 유용한 뷰 생성 (선택사항)
-- ==========================================

-- 댓글과 작성자 정보를 함께 가져오는 뷰
CREATE VIEW comments_with_author AS
SELECT
    c.id,
    c.video_id,
    c.parent_id,
    c.content,
    c.is_edited,
    c.is_deleted,
    c.created_at,
    c.updated_at,
    p.id as author_id,
    p.username as author_username,
    p.avatar_url as author_avatar_url,
    p.role as author_role,
    -- 대댓글 개수 (해당 댓글에 달린 답글 수)
    (
        SELECT COUNT(*)
        FROM comments replies
        WHERE replies.parent_id = c.id AND replies.is_deleted = false
    ) as reply_count
FROM comments c
JOIN profiles p ON c.user_id = p.id
WHERE c.is_deleted = false;

-- ==========================================
-- 6. 샘플 데이터 (개발용)
-- ==========================================
-- 실제 운영환경에서는 제거해야 합니다.

-- 주석 처리된 샘플 데이터
/*
-- 샘플 댓글 추가 (실제 사용자 ID와 영상 ID로 대체 필요)
INSERT INTO comments (user_id, video_id, content) VALUES
('sample-user-id-1', 'sample-video-id-1', '정말 멋진 영상이네요! AI 기술이 이렇게 발전했다니 놀랍습니다.'),
('sample-user-id-2', 'sample-video-id-1', '투자에 관심이 있어요. 연락 드릴 수 있을까요?'),
('sample-user-id-3', 'sample-video-id-1', '어떤 AI 모델을 사용하셨는지 궁금해요.');

-- 대댓글 추가
INSERT INTO comments (user_id, video_id, parent_id, content) VALUES
('sample-user-id-1', 'sample-video-id-1', 'first-comment-id', '감사합니다! 많은 시간을 투자해서 만든 작품이에요.');
*/

-- ==========================================
-- 7. 초기 데이터 정합성 확인 쿼리
-- ==========================================

-- 기존 영상들의 댓글 수를 0으로 초기화 (video_stats 테이블이 있는 경우)
-- UPDATE video_stats SET comment_count = 0;

-- 댓글 시스템 준비 완료!
-- 이제 애플리케이션에서 댓글 기능을 구현할 수 있습니다.