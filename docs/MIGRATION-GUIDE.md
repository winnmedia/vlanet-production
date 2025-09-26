# VLANET 마이그레이션 가이드

## 개요

VLANET 프로젝트의 데이터베이스 마이그레이션 절차와 실행 방법을 설명합니다.

## 마이그레이션 구조

### 실행 순서
```
Phase 1: 기본 사용자 프로필 시스템
  ↓
Phase 2: 영상 시스템 및 통계
  ↓
Phase 3: 성능 최적화 (인덱스, 함수)
  ↓
Phase 4: AI 메타데이터 확장
  ↓
Phase 5: 관리자 시스템
```

### 생성되는 테이블
- **profiles**: 사용자 프로필
- **videos**: 영상 정보
- **video_stats**: 영상 통계
- **video_reactions**: 영상 반응 (좋아요, 싫어요)
- **investment_interests**: 투자 관심 표시
- **ai_tech_stack**: AI 기술 스택 정보
- **investor_preferences**: 투자자 선호도
- **curation_categories**: 큐레이션 카테고리
- **curated_videos**: 큐레이션된 영상
- **content_moderation_logs**: 콘텐츠 모더레이션 로그

## 실행 방법

### 1. Supabase SQL Editor 사용 (권장)

1. Supabase 대시보드 로그인
2. SQL Editor 탭 이동
3. `scripts/migrate.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. 전체 스크립트 실행 (Run)

### 2. Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

## 마이그레이션 검증

### 자동 검증 스크립트 실행

```bash
# 환경 변수 설정
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 검증 실행
node scripts/verify-migration.js
```

### 검증 항목

1. **테이블 존재 여부**: 모든 필수 테이블 생성 확인
2. **ENUM 타입**: 사용자 역할, 영상 상태 등 ENUM 타입 확인
3. **RLS 정책**: Row Level Security 정책 활성화 확인
4. **함수**: 트렌딩 점수 계산 등 데이터베이스 함수 확인
5. **기본 데이터**: 큐레이션 카테고리 등 기본 데이터 확인

### 수동 검증 방법

```sql
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ENUM 타입 확인
SELECT typname
FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;

-- 함수 확인
SELECT proname
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
```

## 롤백 절차

### 데이터베이스 롤백

```sql
-- 모든 테이블 삭제 (주의: 데이터 손실)
DROP TABLE IF EXISTS content_moderation_logs CASCADE;
DROP TABLE IF EXISTS curated_videos CASCADE;
DROP TABLE IF EXISTS curation_categories CASCADE;
DROP TABLE IF EXISTS investor_preferences CASCADE;
DROP TABLE IF EXISTS ai_tech_stack CASCADE;
DROP TABLE IF EXISTS investment_interests CASCADE;
DROP TABLE IF EXISTS video_reactions CASCADE;
DROP TABLE IF EXISTS video_stats CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ENUM 타입 삭제
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS video_status CASCADE;
DROP TYPE IF EXISTS ai_model_type CASCADE;
DROP TYPE IF EXISTS video_genre CASCADE;
DROP TYPE IF EXISTS visual_style CASCADE;
DROP TYPE IF EXISTS admin_permission_level CASCADE;
DROP TYPE IF EXISTS moderation_action_type CASCADE;
DROP TYPE IF EXISTS report_reason CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS create_video_stats CASCADE;
DROP FUNCTION IF EXISTS calculate_trending_score CASCADE;
DROP FUNCTION IF EXISTS update_trending_scores CASCADE;
DROP FUNCTION IF EXISTS check_admin_permission CASCADE;
```

## 문제 해결

### 자주 발생하는 오류

1. **권한 오류**
   ```
   ERROR: permission denied for schema public
   ```
   - 해결: Service Role Key 사용 확인

2. **테이블 이미 존재**
   ```
   ERROR: relation "profiles" already exists
   ```
   - 해결: `IF NOT EXISTS` 구문이 포함되어 있어 무시 가능

3. **함수 실행 오류**
   ```
   ERROR: function calculate_trending_score does not exist
   ```
   - 해결: 마이그레이션 스크립트 재실행

### 디버깅 팁

1. **단계별 실행**: 각 Phase를 개별적으로 실행하여 문제 구간 파악
2. **로그 확인**: Supabase 대시보드의 Logs 탭에서 에러 로그 확인
3. **검증 스크립트**: 각 단계 후 검증 스크립트로 상태 확인

## 성능 고려사항

### 인덱스 최적화
- 트렌딩 알고리즘 최적화를 위한 복합 인덱스
- 투자 관심도 기반 검색 성능 향상

### 함수 최적화
- `calculate_trending_score`: 투자 잠재력 기반 가중치 적용
- `update_trending_scores`: 시간별 자동 업데이트

## 모니터링

### 마이그레이션 후 확인사항

1. **API 엔드포인트 테스트**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **데이터베이스 연결 테스트**
   ```bash
   node scripts/verify-migration.js
   ```

3. **성능 테스트**
   - 트렌딩 알고리즘 응답 시간
   - 영상 업로드 프로세스
   - 사용자 인증 플로우