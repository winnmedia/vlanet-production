# VideoPlanet MVP 단계별 개발 계획 v2.0.0

> **핵심 원칙**: 각 Phase는 완전히 독립적으로 작동하는 기능을 제공해야 합니다.
> 다음 Phase로 진행하기 전에 현재 Phase의 모든 기능이 완벽히 동작해야 합니다.

## 🎨 브랜드 아이덴티티

### VLANET 로고 색상
- **Primary Blue**: `#0059db` (밝은 블루)
- **Primary Dark**: `#004ac1` (진한 네이비)
- **사용 방법**: primary-500, primary-600으로 Tailwind에서 활용

---

## Phase 0: 프로젝트 기반 설정 🚀
**기간**: 2-3일
**목표**: 개발 환경 완전 구축 및 기본 인증 시스템
**완료 기준**: 사용자가 로그인하고 브랜드가 적용된 기본 페이지를 볼 수 있음

### ✅ 핵심 작업

#### 1. 프로젝트 초기화
```bash
pnpm create next-app@latest videoplanet \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd videoplanet
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zod react-hook-form @hookform/resolvers
pnpm add clsx tailwind-merge class-variance-authority
pnpm add lucide-react
```

#### 2. FSD 아키텍처 설정
```bash
mkdir -p src/{pages,widgets,features,entities,shared}
mkdir -p src/shared/{api,config,lib,ui}
mkdir -p src/entities/{user,project}
mkdir -p src/features/{auth}
mkdir -p src/widgets/{header,footer}
mkdir -p src/pages/{auth,home}
```

#### 3. 브랜드 디자인 시스템
- **Tailwind 설정 업데이트**: VLANET 로고 색상 적용
- **로고 컴포넌트**: `src/shared/ui/logo/index.tsx`
- **기본 UI 컴포넌트**: Button, Input, Card (브랜드 색상 적용)

#### 4. 환경 설정
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 5. 인증 시스템
- Google OAuth 설정 (Supabase)
- 로그인/로그아웃 페이지 (`src/pages/auth/login`)
- 미들웨어 기반 라우트 보호 (`middleware.ts`)

### 🎯 검증 체크리스트
- [ ] 프로젝트가 오류 없이 실행됨 (`pnpm dev`)
- [ ] VLANET 로고가 올바르게 표시됨
- [ ] 브랜드 색상이 적용된 로그인 페이지
- [ ] Google로 로그인 가능
- [ ] 인증된 사용자만 보호된 페이지 접근 가능

### 📁 결과물 구조
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── auth/callback/
│   └── layout.tsx
├── shared/
│   ├── ui/
│   │   ├── logo/
│   │   ├── button/
│   │   └── input/
│   ├── config/
│   │   └── env.ts
│   └── api/
│       └── supabase/
└── middleware.ts
```

---

## Phase 1: 사용자 온보딩 시스템 👤
**기간**: 2일
**목표**: 역할 기반 프로필 시스템 완성
**완료 기준**: 사용자가 Creator/Funder 역할을 선택하고 프로필을 설정할 수 있음

### ✅ 핵심 작업

#### 1. 데이터베이스 스키마
```sql
-- Supabase SQL Editor에서 실행
CREATE TYPE user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');

CREATE TABLE profiles (
    id uuid REFERENCES auth.users PRIMARY KEY,
    username text UNIQUE NOT NULL,
    avatar_url text,
    bio text,
    role user_role DEFAULT 'VIEWER' NOT NULL,
    company text, -- Funder인 경우
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필은 누구나 볼 수 있습니다"
ON profiles FOR SELECT USING (true);

CREATE POLICY "사용자는 자신의 프로필을 관리할 수 있습니다"
ON profiles FOR ALL USING (auth.uid() = id);
```

#### 2. 사용자 엔티티 구현
- `src/entities/user/types.ts`: 타입 정의
- `src/entities/user/api.ts`: Supabase 접근 함수
- `src/entities/user/index.ts`: Public API

#### 3. 온보딩 플로우
- 역할 선택 페이지 (`src/pages/onboarding`)
- 프로필 정보 입력 폼
- Server Action으로 데이터 저장

#### 4. 헤더 위젯
- 사용자 프로필 드롭다운
- 로그아웃 기능

### 🎯 검증 체크리스트
- [ ] 신규 사용자가 온보딩 페이지로 자동 리디렉션
- [ ] Creator/Funder 역할 선택 가능
- [ ] 프로필 정보가 올바르게 저장됨
- [ ] RLS 정책이 작동함 (다른 사용자 프로필 수정 불가)
- [ ] 헤더에 사용자 정보 표시

### 📁 결과물 구조
```
src/
├── entities/user/
│   ├── types.ts
│   ├── api.ts
│   └── index.ts
├── pages/onboarding/
├── widgets/header/
└── features/auth/
    └── actions.ts (Server Actions)
```

---

## Phase 2: 콘텐츠 업로드 시스템 📹
**기간**: 3-4일
**목표**: Creator가 영상을 업로드하고 관리할 수 있음
**완료 기준**: Creator가 영상을 업로드하고 목록에서 확인할 수 있음

### ✅ 핵심 작업

#### 1. 비디오 인프라 구축
```bash
# 비디오 플레이어 라이브러리 설치
pnpm add video.js @types/video.js
# 또는
pnpm add plyr
```

- Supabase Storage 버킷 생성 (`videos`, `thumbnails`)
- RLS 정책으로 파일 크기 제한 (200MB)
- 비디오 플레이어 컴포넌트 (`src/shared/ui/video-player`)

#### 2. 프로젝트 엔티티 및 스키마
```sql
CREATE TABLE projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text NOT NULL,
    duration integer, -- 초 단위
    file_size bigint, -- 바이트 단위

    -- AI 준비 메타데이터
    genre text[],
    style text[],
    ai_tools text[],
    tags text[],

    -- 통계
    views_count bigint DEFAULT 0,
    likes_count bigint DEFAULT 0,

    -- 관리
    is_featured boolean DEFAULT false,
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS 정책
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공개된 프로젝트는 누구나 볼 수 있습니다"
ON projects FOR SELECT USING (is_public = true);

CREATE POLICY "창작자는 자신의 프로젝트를 관리할 수 있습니다"
ON projects FOR ALL USING (auth.uid() = creator_id);
```

#### 3. 업로드 기능
- 드래그 앤 드롭 파일 업로드 컴포넌트
- 비디오 메타데이터 추출 (duration, resolution)
- 폼 검증 (Zod 스키마)
- Server Action으로 프로젝트 생성

#### 4. 프로젝트 관리 대시보드
- Creator용 대시보드 (`/dashboard/projects`)
- 프로젝트 목록, 수정, 삭제 기능

### 🎯 검증 체크리스트
- [ ] Creator만 업로드 페이지 접근 가능
- [ ] 파일 크기/형식 제한이 클라이언트에서 검증됨
- [ ] 영상이 Supabase Storage에 업로드됨
- [ ] 프로젝트 메타데이터가 DB에 저장됨
- [ ] 업로드된 영상이 비디오 플레이어에서 재생됨
- [ ] Creator 대시보드에서 본인 프로젝트만 표시됨

### 📁 결과물 구조
```
src/
├── entities/project/
│   ├── types.ts
│   ├── api.ts
│   └── index.ts
├── features/upload/
│   ├── components/
│   ├── lib/validation.ts
│   └── actions.ts
├── pages/
│   ├── upload/
│   └── dashboard/projects/
└── shared/ui/video-player/
```

---

## Phase 3: 메인 피드 및 탐색 🔍
**기간**: 2-3일
**목표**: 모든 사용자가 콘텐츠를 탐색하고 볼 수 있음
**완료 기준**: 메인 페이지에서 모든 공개 프로젝트를 볼 수 있고 상세 페이지가 작동함

### ✅ 핵심 작업

#### 1. 메인 피드 구현
- 프로젝트 카드 위젯 (`src/widgets/project-card`)
- 반응형 그리드 레이아웃
- 무한 스크롤 또는 페이지네이션

#### 2. 프로젝트 상세 페이지
- 동적 라우팅 (`/projects/[id]`)
- 비디오 플레이어 통합
- 창작자 정보 표시
- 조회수 카운터

#### 3. 필터링 및 정렬
- 최신순/인기순 정렬
- 장르/스타일별 필터링
- URL 기반 상태 관리 (SearchParams)

#### 4. Featured 시스템
- 관리자 큐레이션을 위한 `is_featured` 활용
- 메인 페이지 상단에 Featured 섹션

### 🎯 검증 체크리스트
- [ ] 메인 페이지에 모든 공개 프로젝트가 카드 형태로 표시됨
- [ ] 프로젝트 카드에서 상세 페이지로 이동 가능
- [ ] 상세 페이지에서 비디오 재생 가능
- [ ] 창작자 정보가 올바르게 표시됨
- [ ] 정렬 및 필터링이 URL과 연동되어 작동
- [ ] Featured 프로젝트가 별도 섹션에 표시됨
- [ ] 모바일에서 반응형으로 표시됨

### 📁 결과물 구조
```
src/
├── pages/
│   ├── home/
│   └── project/[id]/
├── widgets/
│   └── project-card/
├── features/project/
│   └── components/filters/
└── shared/ui/
    └── pagination/
```

---

## Phase 4: 상호작용 기능 ❤️
**기간**: 2일
**목표**: 사용자가 콘텐츠에 좋아요와 댓글을 남길 수 있음
**완료 기준**: 좋아요/댓글 기능이 실시간으로 작동함

### ✅ 핵심 작업

#### 1. 좋아요 시스템
```sql
CREATE TABLE likes (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
);

-- RLS 정책
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "좋아요는 누구나 볼 수 있습니다"
ON likes FOR SELECT USING (true);

CREATE POLICY "인증된 사용자는 좋아요를 관리할 수 있습니다"
ON likes FOR ALL USING (auth.uid() = user_id);

-- likes_count 업데이트 트리거
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE projects SET likes_count = likes_count - 1 WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_likes_count();
```

#### 2. 댓글 시스템
```sql
CREATE TABLE comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS 정책
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "댓글은 누구나 볼 수 있습니다"
ON comments FOR SELECT USING (true);

CREATE POLICY "인증된 사용자는 댓글을 작성할 수 있습니다"
ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 댓글을 관리할 수 있습니다"
ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 댓글을 삭제할 수 있습니다"
ON comments FOR DELETE USING (auth.uid() = user_id);
```

#### 3. UI 컴포넌트
- 좋아요 버튼 (Optimistic UI)
- 댓글 목록 및 작성 폼
- 실시간 업데이트 (revalidatePath)

### 🎯 검증 체크리스트
- [ ] 인증된 사용자가 좋아요 버튼을 클릭할 수 있음
- [ ] 좋아요 수가 실시간으로 업데이트됨
- [ ] 좋아요를 취소할 수 있음
- [ ] 사용자가 댓글을 작성할 수 있음
- [ ] 자신의 댓글만 삭제할 수 있음
- [ ] 댓글이 실시간으로 표시됨

### 📁 결과물 구조
```
src/
├── features/
│   ├── like/
│   │   ├── components/like-button.tsx
│   │   └── actions.ts
│   └── comment/
│       ├── components/
│       └── actions.ts
└── entities/
    ├── like/
    └── comment/
```

---

## Phase 5: 연락 시스템 📧
**기간**: 2-3일
**목표**: Funder가 Creator에게 연락할 수 있음
**완료 기준**: 제안 발송 및 관리 대시보드가 완전히 작동함

### ✅ 핵심 작업

#### 1. 제안 시스템 스키마
```sql
CREATE TYPE proposal_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    funder_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,

    -- 제안 내용
    subject text NOT NULL,
    message text NOT NULL,
    budget_range text,
    timeline text,

    -- 상태 관리
    status proposal_status DEFAULT 'PENDING',
    responded_at timestamptz,

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS 정책 (보안 중요!)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "제안 당사자만 볼 수 있습니다"
ON proposals FOR SELECT USING (
    auth.uid() = funder_id OR auth.uid() = creator_id
);

CREATE POLICY "Funder만 제안을 보낼 수 있습니다"
ON proposals FOR INSERT WITH CHECK (
    auth.uid() = funder_id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'FUNDER'
);

CREATE POLICY "Creator만 제안 상태를 변경할 수 있습니다"
ON proposals FOR UPDATE USING (auth.uid() = creator_id);
```

#### 2. 연락하기 기능
- "창작자에게 연락하기" 버튼 (Funder만 표시)
- 연락 폼 모달
- 역할 기반 접근 제어

#### 3. 제안 관리 대시보드
- 받은 제안 목록 (Creator용)
- 보낸 제안 목록 (Funder용)
- 제안 상태 관리 (수락/거절)

### 🎯 검증 체크리스트
- [ ] Funder만 "연락하기" 버튼을 볼 수 있음
- [ ] 연락 폼에서 제안을 작성하고 발송할 수 있음
- [ ] Creator가 받은 제안을 대시보드에서 확인 가능
- [ ] Funder가 보낸 제안 목록을 확인 가능
- [ ] Creator가 제안에 응답(수락/거절)할 수 있음
- [ ] RLS로 인해 당사자만 제안을 볼 수 있음

### 📁 결과물 구조
```
src/
├── features/proposal/
│   ├── components/
│   │   ├── contact-modal.tsx
│   │   └── proposal-list.tsx
│   └── actions.ts
├── pages/dashboard/proposals/
└── entities/proposal/
```

---

## Phase 6: 품질 보증 및 최적화 🔧
**기간**: 2-3일
**목표**: 프로덕션 준비 완료
**완료 기준**: 모든 테스트 통과 및 성능 최적화 완료

### ✅ 핵심 작업

#### 1. 테스트 구현
```bash
# 테스트 의존성 설치
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D jest jest-environment-jsdom
pnpm add -D @types/jest
```

- 단위 테스트: 유틸리티 함수, 스키마 검증
- 컴포넌트 테스트: UI 컴포넌트 렌더링 및 상호작용
- RLS 테스트: pgTap을 사용한 데이터베이스 정책 테스트

#### 2. 성능 최적화
- 이미지 최적화 (Next/Image)
- 코드 스플리팅 확인
- 번들 크기 분석
- Core Web Vitals 측정

#### 3. 보안 강화
- 환경 변수 검증 (Zod)
- XSS 방어 (입력값 sanitization)
- 에러 핸들링 개선
- PII 데이터 보호

#### 4. 접근성 개선
- 키보드 네비게이션
- 스크린 리더 지원
- 색상 대비 확인
- ARIA 레이블

### 🎯 검증 체크리스트
- [ ] 테스트 커버리지 70% 이상
- [ ] 모든 핵심 기능의 컴포넌트 테스트 통과
- [ ] RLS 정책 테스트 통과
- [ ] LCP 2.5초 이하, INP 200ms 이하, CLS 0.1 이하
- [ ] 번들 크기가 적정 수준
- [ ] 접근성 체크 통과

---

## Phase 7: 배포 및 모니터링 🚀
**기간**: 1-2일
**목표**: 프로덕션 배포 및 운영 준비
**완료 기준**: 안정적인 프로덕션 서비스 운영

### ✅ 핵심 작업

#### 1. 배포 설정
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "regions": ["icn1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### 2. 모니터링 설정
```bash
# 에러 트래킹
pnpm add @sentry/nextjs
```

- Sentry 에러 트래킹 설정
- Vercel Analytics 연동
- 성능 모니터링 설정

#### 3. 운영 준비
- 환경별 설정 분리 (dev/staging/prod)
- 백업 전략 수립
- 사용자 피드백 수집 도구

### 🎯 검증 체크리스트
- [ ] Vercel에 프로덕션 배포 성공
- [ ] 커스텀 도메인 연결 완료
- [ ] SSL 인증서 적용
- [ ] 모든 환경 변수 올바르게 설정
- [ ] Sentry 에러 트래킹 동작
- [ ] 성능 모니터링 대시보드 확인

---

## 🚀 Phase별 완료 기준 요약

| Phase | 핵심 기능 | 검증 방법 |
|-------|----------|----------|
| 0 | 기본 인증 시스템 | Google 로그인 → 보호된 페이지 접근 |
| 1 | 역할 기반 온보딩 | Creator/Funder 선택 → 프로필 생성 |
| 2 | 콘텐츠 업로드 | Creator가 영상 업로드 → 대시보드에서 확인 |
| 3 | 메인 피드 | 모든 사용자가 프로젝트 탐색 → 상세 페이지 조회 |
| 4 | 상호작용 | 좋아요/댓글 → 실시간 업데이트 |
| 5 | 연락 시스템 | Funder가 제안 → Creator가 응답 |
| 6 | 품질 보증 | 테스트 통과 → 성능 기준 충족 |
| 7 | 배포/운영 | 프로덕션 배포 → 모니터링 설정 |

## 📝 개발 시 주의사항

1. **한 번에 하나의 Phase만**: 현재 Phase가 완전히 완료되기 전에는 다음으로 넘어가지 않음
2. **철저한 검증**: 각 Phase의 모든 체크리스트가 완료된 후 다음 단계 진행
3. **FSD 아키텍처 준수**: 모든 코드는 Feature-Sliced Design 규칙을 따름
4. **브랜드 일관성**: VLANET 로고 색상을 모든 UI에 일관성 있게 적용
5. **보안 우선**: RLS 정책을 먼저 설정하고 기능 구현
6. **테스트 주도**: 핵심 기능은 반드시 테스트 코드와 함께 작성

---

**문서 버전**: 2.0.0
**최종 수정**: 2024년 현재
**다음 검토**: Phase 0 완료 후