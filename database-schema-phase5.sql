-- VideoPlanet Phase 5: Contact System (Proposals & Notifications)
-- 목표: Funder가 Creator에게 안전하게 연락할 수 있는 제안 시스템 구축

-- ========================================
-- 1. PROPOSAL STATUS ENUM
-- ========================================

CREATE TYPE proposal_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'ARCHIVED');

-- ========================================
-- 2. PROPOSALS TABLE (제안 테이블)
-- ========================================

CREATE TABLE proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    funder_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_id uuid REFERENCES videos(id) ON DELETE SET NULL,

    -- 제안 내용
    subject text NOT NULL CHECK (length(subject) >= 5 AND length(subject) <= 200),
    message text NOT NULL CHECK (length(message) >= 10 AND length(message) <= 5000),
    budget_range text CHECK (length(budget_range) <= 100),
    timeline text CHECK (length(timeline) <= 500),

    -- 상태 관리
    status proposal_status DEFAULT 'PENDING' NOT NULL,
    responded_at timestamptz,
    response_message text CHECK (length(response_message) <= 2000),

    -- 메타데이터
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    -- 제약 조건
    CONSTRAINT no_self_proposal CHECK (funder_id != creator_id)
);

-- ========================================
-- 3. PROPOSAL MESSAGES TABLE (제안별 메시지 스레드)
-- ========================================

CREATE TABLE proposal_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

    -- 메시지 내용
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),

    -- 첨부파일 (향후 확장 가능)
    attachment_url text,
    attachment_name text,

    -- 메타데이터
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- 4. NOTIFICATIONS TABLE (알림 시스템)
-- ========================================

CREATE TYPE notification_type AS ENUM (
    'NEW_PROPOSAL', 'PROPOSAL_RESPONSE', 'NEW_MESSAGE',
    'PROPOSAL_ACCEPTED', 'PROPOSAL_REJECTED'
);

CREATE TABLE notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

    -- 알림 내용
    type notification_type NOT NULL,
    title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),

    -- 연관 데이터
    proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
    video_id uuid REFERENCES videos(id) ON DELETE SET NULL,

    -- 상태
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamptz,

    -- 메타데이터
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- 5. INDEXES (성능 최적화)
-- ========================================

-- Proposals 인덱스
CREATE INDEX idx_proposals_funder_id ON proposals(funder_id);
CREATE INDEX idx_proposals_creator_id ON proposals(creator_id);
CREATE INDEX idx_proposals_video_id ON proposals(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposals_updated_at ON proposals(updated_at DESC);

-- Proposal Messages 인덱스
CREATE INDEX idx_proposal_messages_proposal_id ON proposal_messages(proposal_id);
CREATE INDEX idx_proposal_messages_sender_id ON proposal_messages(sender_id);
CREATE INDEX idx_proposal_messages_created_at ON proposal_messages(proposal_id, created_at DESC);
CREATE INDEX idx_proposal_messages_unread ON proposal_messages(proposal_id, is_read) WHERE is_read = false;

-- Notifications 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_proposal_id ON notifications(proposal_id) WHERE proposal_id IS NOT NULL;
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- ========================================
-- 6. ROW LEVEL SECURITY (보안 정책)
-- ========================================

-- Proposals RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "제안 당사자만 볼 수 있습니다"
ON proposals FOR SELECT USING (
    auth.uid() = funder_id OR auth.uid() = creator_id
);

CREATE POLICY "Funder는 제안을 생성할 수 있습니다"
ON proposals FOR INSERT WITH CHECK (
    auth.uid() = funder_id AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FUNDER'
    )
);

CREATE POLICY "제안 당사자는 제안을 수정할 수 있습니다"
ON proposals FOR UPDATE USING (
    auth.uid() = funder_id OR auth.uid() = creator_id
);

CREATE POLICY "Funder는 자신의 제안을 삭제할 수 있습니다"
ON proposals FOR DELETE USING (
    auth.uid() = funder_id
);

-- Proposal Messages RLS
ALTER TABLE proposal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "제안 당사자만 메시지를 볼 수 있습니다"
ON proposal_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM proposals p
        WHERE p.id = proposal_id
        AND (p.funder_id = auth.uid() OR p.creator_id = auth.uid())
    )
);

CREATE POLICY "제안 당사자만 메시지를 작성할 수 있습니다"
ON proposal_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM proposals p
        WHERE p.id = proposal_id
        AND (p.funder_id = auth.uid() OR p.creator_id = auth.uid())
    )
);

CREATE POLICY "메시지 작성자만 메시지를 수정할 수 있습니다"
ON proposal_messages FOR UPDATE USING (
    auth.uid() = sender_id
);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 알림만 볼 수 있습니다"
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "시스템만 알림을 생성할 수 있습니다"
ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 알림을 수정할 수 있습니다"
ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 알림을 삭제할 수 있습니다"
ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 7. TRIGGER FUNCTIONS (자동화)
-- ========================================

-- updated_at 자동 업데이트 함수 (재사용)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposal_messages_updated_at
    BEFORE UPDATE ON proposal_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 제안 상태 변경 시 알림 생성 함수
CREATE OR REPLACE FUNCTION create_proposal_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title text;
    notification_content text;
    notification_type_val notification_type;
    recipient_id uuid;
BEGIN
    -- 새 제안인 경우
    IF TG_OP = 'INSERT' THEN
        notification_title := '새로운 투자 제안이 도착했습니다';
        notification_content := format('"%s"님이 투자 제안을 보냈습니다: %s',
            (SELECT username FROM profiles WHERE id = NEW.funder_id),
            NEW.subject
        );
        notification_type_val := 'NEW_PROPOSAL';
        recipient_id := NEW.creator_id;

        INSERT INTO notifications (user_id, type, title, content, proposal_id, video_id)
        VALUES (recipient_id, notification_type_val, notification_title, notification_content, NEW.id, NEW.video_id);

    -- 제안 상태 변경인 경우
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'ACCEPTED' THEN
            notification_title := '제안이 수락되었습니다';
            notification_content := format('"%s"님이 회원님의 제안을 수락했습니다: %s',
                (SELECT username FROM profiles WHERE id = NEW.creator_id),
                NEW.subject
            );
            notification_type_val := 'PROPOSAL_ACCEPTED';
            recipient_id := NEW.funder_id;
        ELSIF NEW.status = 'REJECTED' THEN
            notification_title := '제안이 거절되었습니다';
            notification_content := format('"%s"님이 회원님의 제안을 거절했습니다: %s',
                (SELECT username FROM profiles WHERE id = NEW.creator_id),
                NEW.subject
            );
            notification_type_val := 'PROPOSAL_REJECTED';
            recipient_id := NEW.funder_id;
        ELSE
            RETURN NEW; -- 다른 상태 변경은 무시
        END IF;

        INSERT INTO notifications (user_id, type, title, content, proposal_id, video_id)
        VALUES (recipient_id, notification_type_val, notification_title, notification_content, NEW.id, NEW.video_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 제안 알림 트리거
CREATE TRIGGER proposal_notification_trigger
    AFTER INSERT OR UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION create_proposal_notification();

-- 새 메시지 알림 함수
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id uuid;
    sender_name text;
    proposal_subject text;
BEGIN
    -- 메시지 수신자 찾기 (발신자가 아닌 제안 당사자)
    SELECT
        CASE
            WHEN p.funder_id = NEW.sender_id THEN p.creator_id
            ELSE p.funder_id
        END,
        p.subject
    INTO recipient_id, proposal_subject
    FROM proposals p
    WHERE p.id = NEW.proposal_id;

    -- 발신자 이름 조회
    SELECT username INTO sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, content, proposal_id)
    VALUES (
        recipient_id,
        'NEW_MESSAGE',
        '새로운 메시지가 도착했습니다',
        format('"%s"님이 "%s" 제안에 새 메시지를 보냈습니다', sender_name, proposal_subject)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 메시지 알림 트리거
CREATE TRIGGER message_notification_trigger
    AFTER INSERT ON proposal_messages
    FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- ========================================
-- 8. VIDEO STATS 업데이트 (proposals_count 추가)
-- ========================================

-- video_stats에 proposals_count 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'video_stats' AND column_name = 'proposals_count'
    ) THEN
        ALTER TABLE video_stats ADD COLUMN proposals_count bigint DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- 제안 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_video_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.video_id IS NOT NULL THEN
        UPDATE video_stats
        SET proposals_count = proposals_count + 1
        WHERE video_id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' AND OLD.video_id IS NOT NULL THEN
        UPDATE video_stats
        SET proposals_count = GREATEST(0, proposals_count - 1)
        WHERE video_id = OLD.video_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- video_id가 변경된 경우 (드물지만 가능)
        IF OLD.video_id IS DISTINCT FROM NEW.video_id THEN
            IF OLD.video_id IS NOT NULL THEN
                UPDATE video_stats
                SET proposals_count = GREATEST(0, proposals_count - 1)
                WHERE video_id = OLD.video_id;
            END IF;
            IF NEW.video_id IS NOT NULL THEN
                UPDATE video_stats
                SET proposals_count = proposals_count + 1
                WHERE video_id = NEW.video_id;
            END IF;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 제안 수 카운트 트리거
CREATE TRIGGER video_proposals_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_video_proposals_count();

-- ========================================
-- 9. 초기 데이터 및 설정
-- ========================================

-- 기존 비디오들의 proposals_count 초기화
UPDATE video_stats
SET proposals_count = (
    SELECT COUNT(*)
    FROM proposals p
    WHERE p.video_id = video_stats.video_id
);

-- ========================================
-- 10. 데이터 정합성 검증 함수
-- ========================================

CREATE OR REPLACE FUNCTION verify_proposal_system_integrity()
RETURNS TABLE (
    table_name text,
    issue_description text,
    affected_count bigint
) AS $$
BEGIN
    -- 고아 메시지 검사
    RETURN QUERY
    SELECT
        'proposal_messages'::text,
        'Messages without valid proposal'::text,
        COUNT(*)
    FROM proposal_messages pm
    LEFT JOIN proposals p ON pm.proposal_id = p.id
    WHERE p.id IS NULL;

    -- 고아 알림 검사
    RETURN QUERY
    SELECT
        'notifications'::text,
        'Notifications without valid proposal'::text,
        COUNT(*)
    FROM notifications n
    WHERE n.proposal_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM proposals p WHERE p.id = n.proposal_id);

    -- 잘못된 proposals_count 검사
    RETURN QUERY
    SELECT
        'video_stats'::text,
        'Incorrect proposals_count'::text,
        COUNT(*)
    FROM video_stats vs
    WHERE vs.proposals_count != (
        SELECT COUNT(*) FROM proposals p WHERE p.video_id = vs.video_id
    );

END;
$$ LANGUAGE plpgsql;

-- Phase 5 완료!
-- 다음 단계: Proposal 엔티티 구현 (src/entities/proposal/)