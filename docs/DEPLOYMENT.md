# VLANET 배포 가이드

## 개요

VLANET 플랫폼의 배포 전략과 절차를 설명합니다.

## 배포 아키텍처

```
GitHub Repository
├── main 브랜치 → Vercel Production
├── develop 브랜치 → Vercel Staging
└── feature/* 브랜치 → Vercel Preview
```

## 환경 구성

### 프로덕션 환경
- **URL**: https://vlanet.vercel.app
- **데이터베이스**: Supabase Production
- **CDN**: Vercel Edge Network (ICN1, NRT1)
- **모니터링**: Sentry, Vercel Analytics

### 스테이징 환경
- **URL**: https://vlanet-staging.vercel.app
- **데이터베이스**: Supabase Staging
- **용도**: QA 테스트, 프로덕션 전 검증

## 배포 절차

### 1. 프로덕션 배포

```bash
# main 브랜치에 Push하면 자동 배포
git checkout main
git merge develop
git push origin main
```

자동 실행 단계:
1. 코드 품질 검사 (타입체크, 린트, 테스트)
2. 데이터베이스 마이그레이션 검증
3. Vercel 프로덕션 배포
4. 배포 후 헬스체크

### 2. 스테이징 배포

```bash
# develop 브랜치에 Push하면 자동 배포
git checkout develop
git push origin develop
```

### 3. 수동 배포

```bash
# GitHub Actions에서 "Deploy Production" 워크플로우 수동 실행
# 강제 배포 옵션으로 테스트 실패 무시 가능
```

## 환경 변수 설정

### Vercel 대시보드 설정 필요

#### Production 환경변수
```
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_APP_URL=https://vlanet.vercel.app
```

#### Staging 환경변수
```
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
NEXT_PUBLIC_APP_URL=https://vlanet-staging.vercel.app
```

### GitHub Secrets 설정 필요

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
SUPABASE_URL_PRODUCTION=your-production-supabase-url
SUPABASE_ANON_KEY_PRODUCTION=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY_PRODUCTION=your-production-service-key
SUPABASE_URL_STAGING=your-staging-supabase-url
SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY_STAGING=your-staging-service-key
```

## 데이터베이스 마이그레이션

### 1. 마이그레이션 실행

```bash
# Supabase SQL Editor에서 실행
# 파일: scripts/migrate.sql
```

### 2. 마이그레이션 검증

```bash
# 환경 변수 설정 후 실행
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

node scripts/verify-migration.js
```

## 롤백 절차

### 1. Vercel 배포 롤백

```bash
# Vercel CLI 사용
vercel rollback
```

### 2. 데이터베이스 롤백

```sql
-- 수동으로 이전 상태로 복원
-- 백업 복원 또는 역방향 마이그레이션 실행
```

## 모니터링

### 1. 성능 지표
- **LCP**: < 2.5초
- **INP**: < 200ms
- **CLS**: < 0.1

### 2. 알림 설정
- Vercel 배포 실패 알림
- Sentry 에러 임계치 알림
- 성능 예산 초과 알림

## 문제 해결

### 자주 발생하는 문제

1. **빌드 실패**
   ```bash
   # 로컬에서 빌드 테스트
   pnpm build
   ```

2. **환경 변수 누락**
   ```bash
   # Vercel 환경 변수 확인
   vercel env ls
   ```

3. **데이터베이스 연결 실패**
   ```bash
   # 마이그레이션 검증 실행
   node scripts/verify-migration.js
   ```

## 보안 고려사항

1. **환경 변수 보안**
   - Service Role Key는 절대 클라이언트에 노출 금지
   - GitHub Secrets에만 저장

2. **도메인 보안**
   - CORS 설정 확인
   - Supabase RLS 정책 검증

3. **배포 보안**
   - 브랜치 보호 규칙 설정
   - 필수 상태 체크 통과 요구