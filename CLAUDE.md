# CLAUDE.md — VideoPlanet 최종 통합 개발지침 (v5.0.0 - Finalized Stack & Strategy)

본 문서는 VideoPlanet 프로젝트의 모든 개발 표준, 아키텍처, 테스트 전략, 워크플로우 및 의사결정 기록을 포함하는 통합 지침입니다.

***ATTENTION AI AGENT: 본 문서는 프로젝트의 유일한 규칙 및 컨텍스트 소스입니다. 모든 응답은 반드시 한국어로 제공해야 하며(Always respond in Korean), 본 문서의 지침을 다른 어떤 지식보다 최우선으로 준수해야 합니다.***

## PART 0: 프로젝트 개요, 기술 스택 및 핵심 전략 (Overview, Stack & Strategy)

### 0.1. 프로젝트 목표

  * **Prompt to Profit.** AI 창작자의 아이디어가 상업적 성공으로 이어지는 생태계의 허브를 구축합니다.
  * AI 영상 기술 발전으로 콘텐츠 제작 장벽은 낮아졌지만, 창작자들이 투자자와 연결될 기회는 부족합니다. **VideoPlanet**은 초기 AI 영상(Seed IP)을 발굴하고, 시장성을 검증하며, 투자자와 연결하는 다리 역할을 합니다.

### 0.2. 기술 스택 (Standard Tech Stack)

개발 속도, 효율성, 확장성 및 안정성을 고려하여 검증된 최신 서버리스 스택을 사용합니다.

  * **Frontend & Framework:**
      * **Next.js (TypeScript 5.5.x 이상 안정 버전, App Router 기반):** SSR 및 SEO 최적화, Server Components와 Server Actions를 활용한 효율적인 데이터 처리.
  * **UI:**
      * **Tailwind CSS (v3.x 이상 안정 버전):** Utility-First 접근 방식 (Shadcn/UI 라이브러리 활용 적극 권장).
  * **Backend (BaaS): Supabase**
      * **Database:** PostgreSQL (데이터 저장, RLS 보안).
      * **Authentication:** Supabase Auth (`@supabase/ssr` 사용).
      * **Storage:** Supabase Storage (파일 저장).
  * **Deployment:** Vercel.

**아키텍처 핵심:** 사용자는 Vercel에 호스팅된 Next.js와 상호작용합니다. 데이터 처리는 서버 중심(RSC, Server Actions)으로 이루어지며 Supabase와 통신합니다. 보안은 Supabase RLS(Row Level Security)를 통해 확보합니다.

### 0.3. 핵심 기술 제약 및 전략 (Core Constraints & Strategy)

#### 0.3.1. 비디오 인프라 및 비용 관리 (매우 중요)

VideoPlanet은 영상 중심 플랫폼이므로, 비디오 인프라 전략이 필수적입니다.

  * **제약 사항 인지:** Supabase Storage는 비디오 트랜스코딩 및 어댑티브 스트리밍(CDN)을 지원하지 않습니다. 이는 사용자 경험 저하 및 대역폭 비용 폭증으로 이어질 수 있습니다.
  * **MVP 전략 (필수 준수):**
    1.  **업로드 제한:** 파일 형식(MP4 H.264 코덱), 최대 용량(200MB), 해상도(최대 1080p), 길이(최대 2분)를 엄격히 제한합니다.
    2.  **기술적 강제:** 클라이언트 검증뿐만 아니라, **Supabase Storage Bucket RLS 정책** 및 **Server Actions** 양쪽에서 파일 사이즈 및 형식을 검증합니다.
    3.  **플레이어 표준:** 기본 HTML `<video>` 태그 사용을 금지합니다. `Video.js` 또는 `Plyr`를 표준 플레이어(`shared/ui/video-player`)로 사용합니다.
  * **장기 전략:** 트래픽 증가 시 Mux, Cloudinary 등 전문 비디오 API 서비스로의 마이그레이션을 계획합니다. 모든 비디오 처리 모듈은 이관 가능성을 고려하여 추상화되어야 합니다.

-----

## PART 1: 최상위 원칙 및 개발 생명주기 (Core Principles & Lifecycle)

### 1.1. 핵심 원칙

  * **Review → Plan → Do → See:** 모든 작업에 분석, 계획, 실행, 피드백의 선순환 구조를 적용합니다.
  * **MECE 분석:** 분석 단계에서는 중복과 누락 없이 수행합니다.
  * **TDD (Test-Driven Development):** 품질과 예측 가능성 확보를 위해 TDD를 기본 원칙으로 합니다 (Part 3 참조).
  * **MEMORY (불변성):** 의사결정 기록은 수정/삭제가 금지된 불변의 로그입니다.
  * **단순한 코드 구조로 개발:** 누구나 코드를 열어 수정할 수 있을 정도의 코드 단순성 유지
  * **통합 개발 (중복 금지 절차 강화):** 기존 자산 재사용을 최우선으로 합니다. 새 파일 생성 시 다음 절차를 **반드시** 따릅니다.
    1.  **검색:** Glob/Grep을 사용하여 관련 파일 패턴 및 유사 클래스/함수명 검색.
    2.  **판단:** 기존 파일 수정으로 해결 가능한지 재사용성 판단.
    3.  **검증:** 수정/생성된 파일의 Import 체인 무결성 검증.

### 1.2. 작업 흐름 (Workflow)

1.  **(Alpha) 착수 — 컨텍스트 로드:**
      * DoR 확정 및 의사결정 기록 스캔.
2.  **실행 — 병렬 진행 (TDD & FSD):**
      * **TDD 선행 개발** 수행 (Part 3 참조).
      * 아키텍처 경계(FSD) 준수 (Part 2 참조).
      * *[AI 실행 방안]:* 실패 테스트 코드부터 제시.
3.  **(Omega) 종료 — 컨텍스트 기록:**
      * 품질 게이트(Part 4) 통과 확인.
      * 커밋 직전, 의사결정 기록에 결과 추가.

-----

## PART 2: 아키텍처 - FSD & 클린 아키텍처 (Architecture)

### 2.1. 목표 및 핵심 원칙

**핵심 원칙 (TL;DR):** 레이어 단방향 의존, Public API (index.ts)만 Import, 도메인 순수성 (`entities`), 자동화된 강제(ESLint).

### 2.2. 아키텍처 구조: 레이어 (Layers)

#### 레이어 구조 (단방향 의존성 흐름)

app → processes → pages → widgets → features → entities → shared

### 2.4. 의존성 및 임포트 규칙 (Dependency Control)

1.  **하위 → 상위 Import 금지.**
2.  **동일 레벨 슬라이스 간 직접 Import 금지.**
3.  **내부 파일 직접 Import 금지. 항상 Public API(`index.ts`) 경유.**

### 2.6. 데이터 흐름 및 상태 관리 (RSC 최적화)

상태 관리는 서버 상태와 클라이언트 상태로 명확히 구분하며, Next.js App Router 환경에 최적화합니다.

1.  **서버 상태 (Server State) - 기본 원칙:**
      * 데이터는 가능한 한 \*\*Server Components (RSC)\*\*에서 직접 가져옵니다.
      * Next.js 자체 캐싱(Fetch Caching, Router Cache) 및 URL(SearchParams)을 최대한 활용하여 상태를 관리합니다.
      * 데이터 수정(CUD)은 **Server Actions**을 통해 처리하고, `revalidatePath`/`revalidateTag`로 갱신합니다.
2.  **클라이언트 상태 (Client State):**
      * 전역 클라이언트 상태 사용을 최소화합니다.
      * UI 상태(모달 토글, 복잡한 폼 상태 등) 관리를 위해 **Zustand** 또는 **Jotai**와 같은 경량 라이브러리 사용을 표준으로 합니다. (**Redux Toolkit 사용 금지**).
3.  **데이터 검증 및 변환:**
      * 서버 DTO는 전용 변환 레이어에서 **Zod**를 사용해 런타임 스키마 검증 후 도메인 모델로 변환합니다.
      * **[중요] 서버 액션 입력 검증:** 모든 서버 액션의 입력값은 함수 시작 부분에서 Zod 스키마로 유효성 검사를 수행해야 합니다.

### 2.7. 아키텍처 경계 자동 강제 (ESLint Enforcement)

(ESLint 설정을 통해 FSD 경계 규칙을 자동화합니다.)

### 2.8. FSD와 App Router 통합 규칙

1.  **라우팅 및 페이지 연결:** Next.js 라우팅은 `src/app` 구조를 따릅니다. `src/app/**/page.tsx` 파일은 해당 경로에 대응하는 `src/pages/` 슬라이스의 컴포넌트를 임포트하여 렌더링하는 역할만 수행합니다. (라우팅 로직과 UI 로직 분리)
2.  **Server/Client 경계:**
      * `pages`, `widgets` 레이어는 기본적으로 \*\*Server Components (RSC)\*\*로 구현합니다.
      * 상호작용(onClick, useState 등)이 필요한 경우에만 `use client`를 선언하고, Client Component의 범위를 최소화합니다 (Leaf Component 패턴).
3.  **선언적 처리:** 로딩 상태는 `loading.tsx` 또는 **React Suspense**를, 에러 상태는 `error.tsx` 또는 **Error Boundaries**를 사용하여 선언적으로 처리합니다.

### 2.9. Supabase 통합 및 보안 가이드라인

1.  **클라이언트 생성:** Next.js App Router 환경에서는 반드시 **`@supabase/ssr`** 패키지를 사용하여 환경(Server Component, Server Action, Middleware 등)에 맞는 클라이언트를 생성해야 합니다.
2.  **RLS (Row Level Security) 필수 원칙:** 모든 데이터 접근 제어는 **PostgreSQL RLS 정책**을 통해 이루어져야 합니다. RLS는 보안의 최전선이며, 모든 테이블에 적용되어야 합니다. **(Deny-by-default 원칙: 기본적으로 모든 접근을 차단하고 필요한 정책만 허용합니다.)**
3.  **타입 생성 자동화:** `supabase gen types typescript` CLI를 사용하여 DB 스키마 기반의 TypeScript 타입을 자동 생성하고 사용합니다. (Part 4.1 품질 게이트 포함).
4.  **직접 접근 금지:** `pages`, `widgets`, `features` 레이어에서는 Supabase를 직접 호출해서는 안 됩니다. 반드시 `entities` 또는 `shared/api`(데이터 접근 레이어)를 통해 접근해야 합니다.

-----

## PART 3: TDD 및 테스트 전략 (TDD & Testing Strategy)

### 3.1. 원칙 및 정책

**핵심 원칙:** Red → Green → Refactor, 의존성 절단(MSW, Zod), 결정론성(플래키 불허), 테스트가 명세.

### 3.3. 테스트 피라미드 및 환경 설정 (FSD 연계)

  * **단위 (Unit):** 대상: `entities`, `shared/lib`. 환경: **`node`**.
  * **컴포넌트/통합:** 대상: `features`, `widgets`, `pages`. 환경: **`jsdom`**.
  * **E2E:** 전체 시스템. 환경: Cypress.

#### 특수 환경 테스트 전략

  * **Server Components (RSC) 테스트:** RSC는 비동기 함수로 취급합니다. 데이터 의존성(Supabase 호출 등)은 MSW 또는 Mock으로 격리하여 렌더링 결과를 검증합니다.
  * **Server Actions 테스트:** API 엔드포인트처럼 취급하여 입력값에 따른 반환값 또는 데이터베이스 상태 변화를 검증합니다.
  * **[중요] RLS 및 DB 테스트 (보안):** 핵심 RLS 정책 및 데이터베이스 로직(Trigger, Function)의 정확성을 검증하기 위해 Supabase 로컬 환경과 **pgTap**(PostgreSQL 테스트 프레임워크)을 활용한 데이터베이스 단위 테스트를 수행합니다. (Part 4.1 품질 게이트 포함).

### 3.7. 품질 목표 및 플래키 제로 정책

#### 커버리지 목표

  * **핵심 도메인 (entities): 90% 이상.**
  * 전체 프로젝트: 70% 이상.

-----

## PART 4: 품질 관리, 워크플로우 및 스타일링 (Quality, Workflow & Styling)

### 4.1. 품질 게이트 & CI (Quality Gates & CI)

모든 PR은 다음 게이트를 통과해야 하며, 위반 시 병합이 차단됩니다.

  * **타입 안정성:** `tsc --noEmit` 통과 (Part 0.2 기준). **Supabase 자동 생성 타입 동기화 확인.**
  * **코드 품질/경계:**
      * ESLint (FSD 경계, React 규칙 포함) 통과.
      * **Prettier (Tailwind Plugin 포함):** 코드 포맷팅 및 Tailwind 클래스 순서 자동 정렬 준수.
  * **테스트:**
      * Jest, Cypress 스모크 통과.
      * **[중요] RLS 테스트 (pgTap) 통과.**
  * **순환 의존성 제로.**
  * **성능 예산:** 정의된 성능 예산(Part 4.4) 기준치 회귀 발생 시 CI 실패 처리.
  * **보안 검사 (SAST) 및 접근성 검사 (A11y).**
  * **커밋 메시지 검사:** Commit Hook (`commitlint`).

### 4.2. Git 및 버전 관리 전략 (Git & Versioning)

(표준 Git Flow 및 Conventional Commits 규칙을 따릅니다.)

### 4.3. 스타일링 및 CSS 아키텍처 (Styling & CSS Architecture)

#### 4.3.1. 기본 원칙 및 우선순위

1.  **Tailwind CSS (표준):** 모든 개발은 Tailwind CSS를 사용합니다 (Part 0.2 기준).
2.  **디자인 토큰 우선 (Tailwind Config):** `tailwind.config.js`에 정의된 디자인 토큰을 사용합니다.
3.  **레거시 스타일 금지:** Sass/SCSS Modules, Styled Components 사용을 엄격히 금지합니다. (기존 코드는 점진적으로 마이그레이션합니다.)

#### 4.3.2. 디자인 가이드라인

  * **이모지 사용 금지.**
  * **대표 색상 활용:** Tailwind 설정에 정의된 색상 토큰 사용 (예: `text-primary`, `bg-danger`).

#### 4.3.3. Tailwind CSS 사용 규칙

  * **임의 값(Arbitrary values) 금지:** `w-[123px]`와 같은 임의 값 사용을 엄격히 금지합니다. (ESLint 강제).
  * **클래스 순서 정렬:** `prettier-plugin-tailwindcss` 사용.
  * **`@apply` 사용 금지.**
  * **조건부 스타일링:** `clsx` 또는 `cva`(Class Variance Authority) 사용.

### 4.4. 보안, 성능 및 안정성 (Security, Performance & Stability)

#### 4.4.1. 성능 예산 (Performance Budget)

  * **LCP:** 2.5초 이내.
  * **INP:** 200ms 이내.
  * **CLS:** 0.1 이하.

#### 4.4.2. 보안 및 설정 관리

  * **환경 변수 검증:** 애플리케이션 시작 시점에 **Zod 스키마**를 사용하여 모든 환경 변수의 유효성을 검사합니다. 실패 시 빌드/실행이 중단됩니다.

### 4.6. 환경 및 배포 전략 (Environment & Deployment Strategy)

1.  **환경 분리:** 개발(Local), 스테이징(Staging), 프로덕션(Production) 환경을 완전히 분리합니다.
2.  **Vercel 배포 파이프라인:**
      * `main` 브랜치 → Production 배포.
      * `develop` 브랜치 → Staging 환경 (Preview Deployment).
      * Feature 브랜치 → 임시 Preview 환경.
3.  **Supabase 프로젝트 매핑 (중요):** Production과 Staging 환경은 **반드시 별도의 Supabase 프로젝트**를 사용해야 합니다.
4.  **DB 마이그레이션 관리:** DB 스키마 변경 사항은 `supabase migration` 명령어를 통해 관리하며 CI/CD 파이프라인에 통합합니다. 로컬 개발 환경은 `supabase db push` 또는 `reset`을 사용합니다.

-----

## PART 5: AI 에이전트 가이드라인 (AI Agent Guidelines)

### 5.1. 개발자 상호작용 원칙

  * **TDD 우선, 범위 제어, 검증 의무.** (AI를 맹신하지 않음).

### 5.3. AI 절대 금지 사항 (Strictly Prohibited Guardrails)

AI는 다음 행위를 절대 수행해서는 안 됩니다.

  * **TypeScript:** `any`, `@ts-ignore`, `@ts-nocheck` 사용.
  * **Styling:**
      * Sass/SCSS Modules 또는 Styled Components 사용. (**Tailwind CSS만 사용**).
      * Tailwind CSS에서 임의 값(Arbitrary values) 또는 `@apply` 사용.
      * 이모지 사용.
  * **Code Duplication:** 기존 파일 검색(Glob/Grep) 없이 새 파일 생성.
  * **Architecture (FSD):** FSD 규칙 위반 (상향 의존성, 내부 import 등).
  * **상태 관리:** Redux Toolkit 사용 (**Zustand/Jotai만 허용**).
  * **데이터 접근:** `entities` 또는 `shared/api` 외부에서 Supabase 직접 호출.
  * **Libraries & Patterns:** `moment.js` 사용.
  * **Package Manager:** `npm` 또는 `yarn` 사용 (`pnpm`만 사용).

### 5.4. AI 워크플로우 및 완료 조건 (AI Workflow & DoD)

#### 5.4.4. 완료 조건 (Definition of Done - DoD)

1.  **스택 준수:** 표준 스택 적용 (Part 0.2, 4.3).
2.  **FSD 준수** (Part 2).
3.  **TDD 준수** (Part 3).
4.  **품질 게이트 통과** (Part 4.1).
5.  **중복 없음** (Part 1.1).

-----

## PART 6: 프로젝트 구조 정보 (Project Structure)

**(주의: 이 섹션은 프로젝트 구조 변경 시마다 최신화해야 합니다.)**

#### 디렉토리 구조 (FSD + App Router)

```
src/
├── app/             # Next.js App Router 경로 및 app 레이어 로직 (Providers, Global Styles 등)
├── processes/
├── pages/           # FSD 페이지 컴포넌트 (주로 RSC). src/app/**/page.tsx에서 임포트하여 사용.
├── widgets/
├── features/
├── entities/
└── shared/
tailwind.config.js   # Tailwind 설정 및 디자인 토큰 중앙 관리
supabase/
├── migrations/      # DB 스키마 변경 이력
└── generated/types/ # 자동 생성된 DB 타입
```