# Phase 1: Supabase 설정 및 온보딩 시스템 구축 가이드

> **목표**: 사용자가 Creator/Funder 역할을 선택하고 프로필을 설정할 수 있는 완전한 온보딩 시스템 구축

## 🚀 Phase 1 시작 전 체크리스트

### ✅ Phase 0 완료 확인
- [x] TypeScript 에러 0개
- [x] FSD 아키텍처 완벽 구현
- [x] UI 컴포넌트 시스템 완성
- [x] Google OAuth 기반 인증 시스템 준비
- [x] 브랜드 디자인 시스템 적용
- [x] 개발 서버 실행 (localhost:3001)

## 📋 Phase 1 진행 계획

### 1️⃣ Supabase 프로젝트 설정 (필수)

#### 단계 1: Supabase 프로젝트 생성
1. https://supabase.com 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Project name**: `videplanet-mvp`
   - **Database password**: 안전한 비밀번호 생성
   - **Region**: `Northeast Asia (Seoul)` 선택
4. 프로젝트 생성 완료까지 대기 (2-3분)

#### 단계 2: 환경 변수 설정
1. Supabase 대시보드 → Settings → API
2. 다음 값들을 복사하여 `.env.local` 업데이트:

```env
# Supabase 설정 (실제 값으로 교체)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3001

# 기타 설정들 (이미 설정됨)
NEXT_PUBLIC_MAX_VIDEO_SIZE=209715200
NEXT_PUBLIC_MAX_VIDEO_DURATION=120
NEXT_PUBLIC_MAX_VIDEO_RESOLUTION=1080
NODE_ENV=development
```

#### 단계 3: Google OAuth Provider 설정
1. Supabase 대시보드 → Authentication → Providers
2. Google 활성화
3. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성:
   - https://console.cloud.google.com/apis/credentials
   - 승인된 리디렉션 URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. Client ID와 Client Secret을 Supabase에 입력

### 2️⃣ 데이터베이스 스키마 생성

#### SQL 스크립트 실행
Supabase SQL Editor에서 다음 스크립트 실행:

```sql
-- 사용자 역할 ENUM 타입 생성
CREATE TYPE user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');

-- 프로필 테이블 생성
CREATE TABLE profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username text UNIQUE NOT NULL CHECK (length(username) >= 2 AND length(username) <= 30),
    avatar_url text,
    bio text CHECK (length(bio) <= 500),
    role user_role DEFAULT 'VIEWER' NOT NULL,
    company text CHECK (length(company) <= 100),
    website text,
    onboarding_completed boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "프로필은 누구나 볼 수 있습니다"
    ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "사용자는 자신의 프로필을 관리할 수 있습니다"
    ON profiles
    FOR ALL
    USING (auth.uid() = id);

-- 프로필 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 사용자명 중복 검사를 위한 인덱스
CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);

-- 역할별 조회를 위한 인덱스
CREATE INDEX profiles_role_idx ON profiles(role);
```

### 3️⃣ 개발 서버 재시작 및 테스트

```bash
# 환경 변수 업데이트 후 서버 재시작
pnpm dev
```

예상 결과:
- ✅ 서버가 오류 없이 시작
- ✅ localhost:3001 접속 시 홈페이지 정상 표시
- ✅ 로그인 버튼 클릭 시 Google OAuth 페이지로 이동

## 📝 Phase 1 구현 작업 목록

### A. 사용자 엔티티 구현
```bash
src/entities/user/
├── types.ts        # TypeScript 타입 정의
├── api.ts          # Supabase 데이터 접근 함수
├── hooks.ts        # React Query 훅스 (선택사항)
└── index.ts        # Public API export
```

### B. 온보딩 페이지 구현
```bash
src/app/onboarding/
├── page.tsx        # 온보딩 메인 페이지
└── components/     # 온보딩 전용 컴포넌트
    ├── RoleSelector.tsx
    ├── ProfileForm.tsx
    └── index.ts
```

### C. 헤더 위젯 구현
```bash
src/widgets/header/
├── Header.tsx      # 메인 헤더 컴포넌트
├── UserDropdown.tsx # 사용자 프로필 드롭다운
└── index.ts
```

### D. 인증 Server Actions 확장
- 프로필 생성/업데이트 함수 추가
- 온보딩 완료 처리 함수 추가

## 🎯 Phase 1 완료 기준

### 핵심 기능 테스트
1. **신규 사용자 플로우**:
   - [x] Google 로그인 후 온보딩 페이지로 자동 리디렉션
   - [x] Creator/Funder 역할 선택 가능
   - [x] 프로필 정보 입력 및 저장 성공
   - [x] 온보딩 완료 후 홈페이지로 리디렉션

2. **기존 사용자 플로우**:
   - [x] 로그인 후 바로 홈페이지 접근
   - [x] 헤더에 사용자 정보 표시
   - [x] 프로필 수정 가능

3. **보안 검증**:
   - [x] RLS 정책으로 다른 사용자 프로필 보호
   - [x] 온보딩 미완료 시 보호된 페이지 접근 차단

### 품질 검증
- [x] TypeScript 에러 0개
- [x] 모든 폼 유효성 검사 작동
- [x] 에러 처리 및 사용자 피드백 제공
- [x] 반응형 디자인 적용

## 🚀 다음 단계 (Phase 2 Preview)

Phase 1 완료 후 Phase 2에서는:
- 📹 비디오 업로드 시스템 구축
- 🎬 비디오 플레이어 구현
- 📊 Creator 대시보드
- 💰 투자 프로포절 시스템

---

**현재 상태**: Phase 0 완료, Phase 1 준비 완료
**다음 작업**: Supabase 프로젝트 생성 및 실제 설정
**예상 소요 시간**: 2일