# VLANET 프로덕션 배포 가이드

## 🚀 배포 전 체크리스트

### ✅ 완료된 항목들
- [x] 마이그레이션 스크립트 준비 (`scripts/migrate-safe.sql`)
- [x] 마이그레이션 검증 스크립트 (`scripts/verify-migration.js`)
- [x] Vercel 배포 설정 (`vercel.json`)
- [x] 환경변수 템플릿 (`.env.production`, `.env.staging`)
- [x] CI/CD 파이프라인 (`.github/workflows/`)
- [x] 성능 모니터링 (`.lighthouserc.js`, `monitoring.ts`)
- [x] 전역 에러 핸들러 (`global-error.tsx`)
- [x] 헬스체크 API (`/api/health`)

### 📋 배포 실행 단계

## Step 1: Supabase 설정

### 1.1. 데이터베이스 마이그레이션
1. Supabase 대시보드 접속
2. SQL Editor에서 `scripts/migrate-safe.sql` 전체 실행
3. 성공 메시지 확인:
   ```
   ✅ VLANET 데이터베이스 마이그레이션 완료! (Phase 1-3)
   📊 생성된 테이블: profiles, videos, video_stats, video_reactions, investment_interests
   ⚡ 트렌딩 시스템: 투자 중심 알고리즘 (25x 가중치) 적용
   ```

### 1.2. 환경변수 복사
프로덕션 Supabase 프로젝트에서 다음 값들 복사:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: GitHub 설정

### 2.1. Repository Secrets 설정
GitHub → Settings → Secrets and variables → Actions에서 설정:

```bash
# Vercel 설정
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

# Supabase 프로덕션
SUPABASE_URL_PRODUCTION=https://your-production-project.supabase.co
SUPABASE_ANON_KEY_PRODUCTION=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY_PRODUCTION=your-production-service-key

# Supabase 스테이징 (선택사항)
SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY_STAGING=your-staging-service-key
```

### 2.2. 브랜치 보호 규칙
- `main` 브랜치 보호 활성화
- PR 필수 리뷰 설정
- 상태 체크 통과 필수 설정

## Step 3: Vercel 설정

### 3.1. 프로젝트 연결
1. Vercel 대시보드에서 GitHub 레포지토리 연결
2. Framework Preset: **Next.js** 선택
3. Root Directory: `/` (기본값)
4. Build Command: `pnpm ci`
5. Output Directory: `.next` (기본값)

### 3.2. 환경변수 설정
Vercel → Settings → Environment Variables:

**Production 환경:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NEXT_PUBLIC_APP_URL=https://vlanet.vercel.app
NODE_ENV=production
```

**Preview 환경:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key
NEXT_PUBLIC_APP_URL=https://vlanet-staging.vercel.app
NODE_ENV=development
```

## Step 4: 배포 실행

### 4.1. 자동 배포 (권장)
```bash
git add .
git commit -m "feat: VLANET 프로덕션 배포 준비 완료

- 마이그레이션 스크립트 및 검증 시스템
- Vercel 배포 설정 및 환경변수 템플릿
- CI/CD 파이프라인 (프로덕션/스테이징)
- 성능 모니터링 및 에러 추적
- 투자 중심 트렌딩 알고리즘 (25x 가중치)

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 4.2. 수동 배포
```bash
# Vercel CLI 설치
npm install -g vercel@latest

# 로그인 및 프로젝트 연결
vercel login
vercel link

# 프로덕션 배포
vercel --prod
```

## Step 5: 배포 후 검증

### 5.1. 헬스체크 확인
```bash
curl https://vlanet.vercel.app/api/health

# 예상 응답:
{
  "status": "healthy",
  "service": "VLANET",
  "timestamp": "2025-01-XX...",
  "database": "connected",
  "environment": "production",
  "version": "1.0.0"
}
```

### 5.2. 마이그레이션 검증
```bash
# 로컬에서 실행 (환경변수 설정 후)
export NEXT_PUBLIC_SUPABASE_URL="https://your-production-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-production-service-key"

node scripts/verify-migration.js

# 예상 출력:
# ✅ 테이블: 통과
# ✅ ENUM 타입: 통과
# ✅ RLS 정책: 통과
# ✅ 함수: 통과
# ✅ 기본 데이터: 통과
```

### 5.3. 트렌딩 알고리즘 테스트
Supabase SQL Editor에서 실행:
```sql
SELECT calculate_trending_score(1000, 50, 5, 24) as trending_score;
-- 예상 결과: ~500 (투자 중심 25x 가중치 적용)
```

### 5.4. 성능 체크
```bash
# Lighthouse CI 실행 (선택사항)
npx lhci autorun --url=https://vlanet.vercel.app

# Core Web Vitals 목표:
# - LCP: < 2.5초
# - INP: < 200ms
# - CLS: < 0.1
```

## 🎯 성공 지표

배포가 성공하면 다음이 활성화됩니다:

- ✅ **투자 중심 트렌딩 시스템** (25x 가중치)
- ✅ **"Prompt to Profit" 비전 구현**
- ✅ **자동화된 성능 모니터링**
- ✅ **실시간 에러 추적 (Sentry)**
- ✅ **CI/CD 파이프라인 자동화**

## 🚨 문제 해결

### 빌드 실패 시
1. 로컬에서 `pnpm build` 실행하여 오류 확인
2. TypeScript 오류 수정
3. 환경변수 누락 확인

### 데이터베이스 연결 실패 시
1. Supabase 환경변수 확인
2. RLS 정책 검증
3. Service Role Key 권한 확인

### 성능 문제 시
1. Lighthouse CI 결과 분석
2. Core Web Vitals 모니터링 확인
3. 번들 크기 분석 (`pnpm analyze`)

---

**🎬 VLANET "Prompt to Profit" 플랫폼 배포 완료!**

AI 영상 창작자와 투자자를 연결하는 혁신적인 플랫폼이 프로덕션에 준비되었습니다.