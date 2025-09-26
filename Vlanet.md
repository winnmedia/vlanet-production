## MVP 개발 지시서

본 문서는 AI 네이티브 IP 엑셀러레이팅 플랫폼의 최소 기능 제품(MVP) 개발을 위한 상세 지시사항을 포함합니다. 기획 의도, 사용자 여정, 기능 요구사항(FRD), 제품 요구사항(PRD)을 바탕으로 효율적인 개발을 진행해 주시기 바랍니다.

-----

### 1\. 프로젝트 개요 및 기획 의도

  * **비전:** Prompt to Profit. AI 창작자의 아이디어가 상업적 성공으로 이어지는 생태계의 허브를 구축합니다.
  * **기획 의도:** AI 영상 기술 발전으로 콘텐츠 제작 장벽은 낮아졌지만, 창작자들이 투자자와 연결될 기회는 부족합니다. AetherFlow는 초기 AI 영상(Seed IP)을 발굴하고, 시장성을 검증하며, 투자자와 연결하는 다리 역할을 합니다.
  * **MVP 개발 목표:**
    1.  창작자의 포트폴리오 업로드 및 관리 핵심 기능 구현.
    2.  투자자의 콘텐츠 탐색 및 창작자 발견 기능 구현.
    3.  핵심 사이클(업로드 -\> 발견 -\> 제안)의 기능성 검증.

### 2\. MVP 기술 스택 및 아키텍처 (확정)

개발 속도와 효율성, 확장성을 고려하여 최신 서버리스 스택을 사용합니다.

  * **Frontend & Framework:**
      * **Next.js (TypeScript, App Router 기반):** SSR 및 SEO 최적화, Server Components와 Server Actions를 활용한 효율적인 데이터 처리.
      * **UI:** Tailwind CSS (Shadcn/UI 라이브러리 활용 적극 권장).
  * **Backend (BaaS):** **Supabase**
      * **Database:** PostgreSQL (데이터 저장).
      * **Authentication:** Supabase Auth (소셜 로그인 포함).
      * **Storage:** Supabase Storage (영상 및 이미지 파일 저장).
  * **Deployment:** **Vercel** (Next.js 프론트엔드 배포 및 호스팅).

**아키텍처 핵심:** 사용자는 Vercel에 호스팅된 Next.js와 상호작용합니다. Next.js는 Server Components에서 직접 데이터를 가져오거나(Read), Server Actions을 통해 데이터를 수정(CUD)하며, 이 모든 과정은 Supabase와 통신하여 이루어집니다. 보안은 Supabase RLS(Row Level Security)를 통해 확보합니다.

### 3\. 사용자 정의 및 여정 시나리오 (MVP 버전)

#### A. AI 영상 창작자 (Creator)

  * **정의:** AI 툴로 영상을 제작하며 상업화 기회를 찾는 개인/팀.
  * **MVP 여정:**
    1.  **(가입)** 소셜 로그인으로 가입하고 '창작자' 역할을 선택.
    2.  **(업로드)** AI 단편 영상(MP4), 썸네일, 설명을 업로드.
    3.  **(반응 확인)** 자신의 작품에 대한 '좋아요'와 '댓글' 확인.
    4.  **(제안 수신)** 대시보드에서 투자자로부터 수신된 펀딩 제안을 확인하고 수락/거절.

#### B. 콘텐츠 투자자 (Funder)

  * **정의:** 신선한 IP나 역량 있는 창작자를 찾는 기업 담당자 (제작사, 광고 에이전시 등).
  * **MVP 여정:**
    1.  **(가입)** 가입 시 '투자자' 역할을 선택하고 소속 정보 입력.
    2.  **(탐색)** 메인 피드에서 최신순/인기순으로 콘텐츠 탐색.
    3.  **(발견)** 마음에 드는 영상과 창작자의 프로필 확인.
    4.  **(제안)** '펀딩 제안하기' 버튼을 눌러 협업 내용과 예산을 작성하여 발송.

### 4\. 핵심 기능 명세서 (FRD - Functional Requirements Document)

| 분류 | 기능명 | 상세 설명 | 우선순위 (MVP) |
| :--- | :--- | :--- | :--- |
| **인증/회원** | 소셜 로그인 | 구글 등 OAuth를 이용한 간편 로그인/회원가입. | P0 (Must Have) |
| | 역할 기반 프로필 | 가입 시 역할(Creator/Funder) 선택 및 역할별 프로필 정보 관리. | P0 |
| **콘텐츠 관리** | 프로젝트 업로드 | 영상(MP4), 썸네일, 제목, 설명 업로드. (MVP 용량 제한 필요) | P0 |
| | 내 프로젝트 관리 | 업로드한 프로젝트 목록 조회, 수정, 삭제. | P1 (Should Have) |
| **탐색/피드백** | 메인 피드 | 전체 프로젝트 목록 조회 (최신순, 인기순 정렬). 무한 스크롤 권장. | P0 |
| | 프로젝트 상세 보기 | 영상 재생, 상세 정보, 창작자 정보 조회. | P0 |
| | 좋아요 및 댓글 | 특정 프로젝트에 '좋아요' 표시 및 댓글 작성 기능. | P1 |
| **펀딩 (MVP)** | 펀딩 제안하기 | 투자자가 창작자에게 비공개로 펀딩/협업 제안 (폼 입력 방식). | P0 |
| | 제안 관리 대시보드 | 수신/발신된 제안 목록 확인 및 상태(수락/거절/대기) 관리. | P0 |

### 5\. 제품 요구사항 명세서 (PRD - Product Requirements Document) 및 개발 지시서

이 섹션은 실제 개발에 필요한 기술적 요구사항과 상세 구현 지침을 제공합니다.

#### 5.1. 개발 환경 설정

1.  **Next.js 설정:** TypeScript 기반, App Router 구조로 프로젝트를 초기화합니다.
2.  **Supabase 연동:**
      * Supabase 프로젝트를 생성하고 `.env.local`에 URL과 Anon Key를 설정합니다.
      * **중요:** Next.js App Router 환경에서는 `@supabase/ssr` 패키지를 사용하여 인증 및 데이터 통신을 처리합니다.
      * 인증 처리를 위한 클라이언트 및 서버 유틸리티를 설정합니다. (Supabase 공식 문서의 Next.js SSR 가이드 참고)
3.  **Vercel 연동:** GitHub 리포지토리와 Vercel을 연동하고, Vercel 환경 변수에도 Supabase 키를 등록합니다.
4.  **타입 생성 (권장):** Supabase CLI를 사용하여 DB 스키마 기반의 TypeScript 타입을 자동 생성(`supabase gen types typescript...`)하면 개발 효율성과 안정성이 크게 향상됩니다.

#### 5.2. 데이터베이스 스키마 및 RLS 설정 (Supabase)

Supabase 대시보드의 SQL Editor에서 아래 스크립트를 실행하여 테이블을 생성하고 RLS(Row Level Security)를 설정합니다. RLS는 보안을 위해 필수적입니다.

##### A. 사용자 프로필 (`profiles`)

```sql
-- 사용자 유형 Enum 타입 생성
CREATE TYPE public.user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');

-- 프로필 테이블 생성 (auth.users와 연결)
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    username text UNIQUE,
    avatar_url text,
    bio text,
    role public.user_role DEFAULT 'VIEWER'::public.user_role NOT NULL,
    company text -- FUNDER인 경우 소속
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "프로필은 누구나 볼 수 있습니다." ON profiles FOR SELECT USING (true);
CREATE POLICY "사용자는 자신의 프로필을 삽입할 수 있습니다." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "사용자는 자신의 프로필을 수정할 수 있습니다." ON profiles FOR UPDATE USING (auth.uid() = id);

-- [중요] auth.users에 사용자가 생성될 때 profiles에 자동으로 레코드를 생성하는 Trigger를 설정해야 합니다.
-- Supabase 가이드를 따라 Function과 Trigger를 설정하세요. (Supabase Dashboard -> Database -> Triggers)
```

##### B. 프로젝트 (`projects`)

```sql
-- 프로젝트(영상) 테이블 생성
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text NOT NULL,
    likes_count bigint DEFAULT 0 NOT NULL,
    is_public boolean DEFAULT true NOT NULL
);

-- RLS 활성화
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "공개된 프로젝트는 누구나 볼 수 있습니다." ON projects FOR SELECT USING (is_public = true);
CREATE POLICY "로그인한 사용자는 프로젝트를 생성할 수 있습니다." ON projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "창작자는 자신의 프로젝트를 관리(수정)할 수 있습니다." ON projects FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "창작자는 자신의 프로젝트를 삭제할 수 있습니다." ON projects FOR DELETE USING (auth.uid() = creator_id);
```

##### C. 상호작용 (`likes`, `comments`)

```sql
-- 좋아요 테이블 생성
CREATE TABLE public.likes (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, project_id) -- 복합키 (중복 방지)
);

-- 댓글 테이블 생성 (P1 기능)
CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL
);

-- RLS 활성화
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 (likes 예시)
CREATE POLICY "좋아요는 누구나 볼 수 있습니다." ON likes FOR SELECT USING (true);
CREATE POLICY "로그인한 사용자는 좋아요를 작성할 수 있습니다." ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "사용자는 자신의 좋아요를 삭제할 수 있습니다." ON likes FOR DELETE USING (auth.uid() = user_id);

-- [참고] likes 테이블 변경 시 projects 테이블의 likes_count를 업데이트하는 Trigger 설정이 필요합니다.
```

##### D. 펀딩 제안 (`proposals`)

```sql
CREATE TYPE public.proposal_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- 제안 테이블 생성
CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    funder_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- 제안자
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- 수신자
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL, -- 관련 프로젝트 (Optional)
    message text NOT NULL,
    budget_range text,
    status public.proposal_status DEFAULT 'PENDING'::public.proposal_status NOT NULL
);

-- RLS 활성화
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 (보안 중요)
CREATE POLICY "제안자 또는 수신자만 제안을 볼 수 있습니다." ON proposals FOR SELECT USING (auth.uid() = funder_id OR auth.uid() = creator_id);
CREATE POLICY "제안자만 제안을 보낼 수 있습니다." ON proposals FOR INSERT WITH CHECK (auth.uid() = funder_id);
CREATE POLICY "수신자(창작자)는 상태(status)를 업데이트 할 수 있습니다." ON proposals FOR UPDATE USING (auth.uid() = creator_id);
-- (참고: funder_id가 실제로 FUNDER 역할인지 검증하는 로직은 애플리케이션 레벨에서 처리하거나, 더 복잡한 RLS 정책으로 구현할 수 있습니다.)
```

#### 5.3. 상세 개발 태스크 지시

##### Task 1: 인증 및 회원 관리

1.  **Supabase Auth 설정:** Google OAuth Provider를 활성화하고 Credentials를 등록합니다.
2.  **로그인 UI 구현 (`/login`):** 소셜 로그인 버튼을 배치합니다.
3.  **인증 처리:** `@supabase/ssr`을 사용하여 서버 및 클라이언트에서 인증 상태를 관리합니다. OAuth 콜백 라우트 핸들러(`app/auth/callback/route.ts`)를 구현합니다.
4.  **온보딩 구현 (`/onboarding`):** 최초 로그인 후 리디렉션합니다. 역할(Creator/Funder) 선택 및 닉네임 입력 폼을 구현합니다.
5.  **프로필 저장 (Server Action):** 입력받은 정보를 Next.js Server Action을 사용하여 `profiles` 테이블에 저장/업데이트합니다.
6.  **라우트 보호 (Middleware):** `middleware.ts`를 사용하여 인증이 필요한 페이지(업로드, 대시보드 등) 접근 시 로그인 상태를 확인하고 리디렉션 처리합니다.

##### Task 2: 프로젝트 업로드 및 관리

1.  **Supabase Storage 설정:** `videos`와 `thumbnails` 버킷을 생성합니다. Public으로 설정하되, 업로드 정책(Policy)을 설정하여 인증된 사용자만 업로드 가능하게 하고, 최대 파일 크기를 제한합니다 (예: 500MB).
2.  **업로드 UI 구현 (`/upload`):** 파일 선택(영상, 썸네일), 제목, 설명 입력 폼을 구현합니다.
3.  **파일 업로드 로직:** 클라이언트 컴포넌트에서 직접 Supabase Storage로 파일을 업로드합니다 (`supabase.storage.from(...).upload(...)`). 업로드 성공 시 파일의 Public URL을 받습니다. (대용량 파일 처리에 유리)
4.  **메타데이터 저장 (Server Action):** 파일 URL과 폼 데이터를 Server Action으로 전달하여 `projects` 테이블에 새로운 레코드를 생성합니다.

##### Task 3: 콘텐츠 탐색 및 피드백

1.  **메인 피드 구현 (`/`):**
      * **Server Component**를 사용하여 `projects` 테이블에서 데이터를 조회합니다. (창작자 정보는 JOIN 활용: `.select('*, creator:profiles(*)')` )
      * 최신순/인기순 정렬 기능을 구현합니다.
      * 무한 스크롤 또는 페이지네이션을 구현합니다.
2.  **상세 페이지 구현 (`/projects/[id]`):**
      * 동적 라우팅을 사용합니다.
      * 영상 플레이어를 배치합니다 (기본 HTML `<video>` 태그 또는 video.js 활용).
3.  **좋아요 기능 (Server Action):**
      * 좋아요 버튼 클릭 시 Server Action을 호출하여 `likes` 테이블에 데이터를 추가/삭제합니다.
      * Server Action 완료 후 `revalidatePath('/')` 등을 호출하여 데이터를 갱신합니다. Optimistic UI 업데이트를 적용하면 사용자 경험이 향상됩니다.

##### Task 4: 펀딩 제안 시스템

1.  **제안 버튼 및 모달 구현:** 프로젝트 상세 페이지에 '펀딩 제안하기' 버튼을 배치합니다. (현재 사용자가 Funder 역할일 때만 표시되도록 조건부 렌더링). 제안 내용 입력을 위한 모달 폼을 구현합니다.
2.  **제안 발송 (Server Action):** 폼 데이터를 Server Action으로 전달하여 `proposals` 테이블에 저장합니다.
3.  **대시보드 구현 (`/dashboard/proposals`):**
      * Server Component에서 현재 사용자에게 온 제안(`creator_id`가 본인) 또는 보낸 제안(`funder_id`가 본인) 목록을 조회합니다. (RLS 덕분에 안전하게 조회 가능)
4.  **상태 관리 (Server Action):** 창작자가 '수락'/'거절' 버튼 클릭 시 Server Action을 호출하여 `proposals` 테이블의 `status`를 업데이트합니다.

### 6\. 개발 가이드라인

  * **보안:** Supabase를 사용할 때는 RLS 설정이 가장 중요합니다. 모든 테이블의 RLS 정책이 의도대로 작동하는지 항상 확인하세요.
  * **코드 품질:** 자동 생성된 Supabase 타입을 적극 활용하여 타입 안정성을 확보하고, ESLint/Prettier 설정을 준수합니다.
  * **협업:** Feature 브랜치 전략을 사용하며, 모든 PR은 코드 리뷰를 거친 후 main에 병합합니다.
  * **소통:** 개발 중 발생하는 이슈나 의문점은 즉시 공유하고 논의합니다.



  A. 비디오 인프라 및 비용 관리 전략 (매우 중요)
문제 인식: Supabase Storage는 파일 저장소이지 전문 비디오 스트리밍 서비스(CDN)가 아닙니다. 트랜스코딩(다양한 해상도 변환)이나 어댑티브 비트레이트 스트리밍(네트워크 환경에 따른 화질 자동 조절)을 지원하지 않습니다. 이는 사용자 시청 경험 저하와 급격한 대역폭(Bandwidth) 비용 증가로 이어질 수 있습니다.

MVP 구현 방안 (필수):

엄격한 업로드 제한: 비용 및 성능 관리를 위해 파일 형식(MP4 H.264 코덱 권장), 최대 용량(예: 영상당 200MB), 해상도(최대 1080p), 최대 길이(예: 2분)를 철저하게 제한합니다.

기술적 강제: 클라이언트 측 검증뿐만 아니라, Supabase Storage Bucket의 RLS 정책에서도 파일 사이즈 제한을 반드시 설정해야 합니다.

플레이어 개선: 기본 HTML <video> 태그 대신 Video.js나 Plyr 같은 전문 플레이어 라이브러리를 도입하여 시청 경험을 개선합니다.

Post-MVP 계획 (필수): 트래픽 증가 시 Mux, Cloudinary 같은 전문 비디오 API 서비스로 마이그레이션해야 합니다. 개발팀은 향후 인프라 변경을 염두에 두고 개발해야 합니다.

B. 데이터 구조화 및 AI 준비 (미래 경쟁력)
향후 핵심 기능인 'AI 매치메이킹'을 위해 MVP 단계부터 데이터 구조를 준비해야 합니다.

구조화된 메타데이터 입력: 영상 업로드 시, 단순 설명 외에 영상의 특징을 나타내는 구조화된 데이터를 필수로 입력받습니다.

입력 필드 예시:

장르 (SF, 판타지 등)

스타일 (애니메이션, 실사, 하이퍼리얼리즘 등)

사용된 핵심 AI 툴 (RunwayML, Pika, Stable Diffusion 등)

개발 지시: projects 테이블에 해당 데이터를 저장할 컬럼(JSONB 타입 또는 별도 태그 테이블)을 설계합니다. 이는 향후 Supabase의 pgvector 확장을 사용한 시맨틱 검색의 기반이 됩니다.

C. 데이터베이스 성능 및 안정성 확보
인덱싱 (필수): 데이터 조회 속도 향상을 위해 자주 사용되는 컬럼에 인덱스를 설정해야 합니다.

projects 테이블: created_at (최신순 정렬), likes_count (인기순 정렬), creator_id (특정 창작자 조회).

오류 모니터링: Vercel 환경에서 발생하는 프론트엔드 및 서버리스 함수(Server Actions)의 오류를 실시간으로 추적하기 위해 Sentry와 같은 모니터링 툴 도입을 권장합니다.

3. MVP 전략 현실화 및 우선순위 재조정
MVP의 목표는 핵심 가설을 가장 빠르게 검증하는 것입니다. 개발 속도를 높이기 위해 일부 기능의 복잡도를 낮춥니다.

핵심 가설: "AI 영상 창작자들은 투자 기회를 원하며, 투자자들은 VLANET에서 상업적 잠재력이 있는 창작자를 찾을 것이다."

A. '펀딩 제안' 시스템 간소화 (Phase 0 접근)
기존: 펀딩 제안 관리 대시보드 및 상태(수락/거절) 관리 시스템 개발.

변경 (MVP): 복잡한 시스템 대신 '창작자에게 연락하기 (Contact Creator)' 버튼으로 대체합니다. 투자자가 버튼 클릭 시 간단한 메시지 폼을 작성하여 창작자에게 발송(내부 알림 또는 이메일)되도록 구현합니다.

이유: 초기에는 시스템 구축보다 실제 매칭 시도가 발생하는지(수요 검증) 확인하는 것이 더 중요합니다. 수요가 검증되면 P1 단계에서 정식 시스템을 구축합니다.

B. 초기 품질 관리를 위한 '관리자 큐레이션'
기획 의도: 알고리즘이 없는 초기에는 운영자가 직접 우수작을 선정하여 플랫폼의 수준을 유지해야 합니다.

개발 지시:

projects 테이블에 is_featured (Boolean) 컬럼을 추가합니다.

관리자 계정(ADMIN)으로 로그인 시 'Featured 선정/해제' 기능을 구현합니다.

메인 페이지 상단에 'VLANET's Pick' 섹션을 만들어 Featured 프로젝트들을 노출합니다.