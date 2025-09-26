# 🚀 VideoPlanet 설정 가이드

VideoPlanet을 로컬에서 실행하기 위한 단계별 설정 가이드입니다.

## 📋 사전 요구사항

- **Node.js 18 이상**
- **pnpm** (권장 패키지 매니저)
- **Supabase 계정**

## 🔧 1단계: 프로젝트 설정

### 1. 저장소 복제 및 의존성 설치
```bash
git clone <repository-url>
cd VideoPlanet
pnpm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
```

## 🗄️ 2단계: Supabase 설정

### 1. Supabase 프로젝트 생성
1. [https://supabase.com](https://supabase.com)에서 로그인
2. "New Project" 클릭
3. Organization 선택 후 프로젝트 이름 입력
4. 데이터베이스 비밀번호 설정
5. Region 선택 (Asia Northeast (Seoul) 권장)

### 2. API 키 복사
1. 프로젝트 대시보드에서 **Settings → API** 이동
2. 다음 값들을 복사하여 `.env.local`에 입력:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. 데이터베이스 스키마 적용
1. Supabase 대시보드에서 **SQL Editor** 이동
2. 다음 파일들을 순서대로 실행:
   ```sql
   -- 1. 기본 스키마
   \i database-schema.sql

   -- 2. Phase 2 스키마 (영상 업로드)
   \i database-schema-phase2.sql

   -- 3. Phase 3 스키마 (상호작용 시스템)
   \i database-schema-phase3.sql
   ```

### 4. Google OAuth 설정 (선택)
1. **Authentication → Providers** 이동
2. **Google** 활성화
3. Google Cloud Console에서 OAuth 클라이언트 생성:
   - **Authorized redirect URIs**: `https://your-project.supabase.co/auth/v1/callback`
4. Client ID와 Client Secret을 Supabase에 입력

### 5. 스토리지 버킷 생성
1. **Storage** 메뉴 이동
2. **Create Bucket** 클릭
3. 버킷 이름: `videos`
4. Public bucket 활성화
5. 파일 크기 제한: 200MB 설정

### 6. RLS (Row Level Security) 정책 확인
데이터베이스 스키마 파일 실행 후 다음 정책들이 생성되었는지 확인:
- `profiles` 테이블: 본인 데이터만 수정 가능
- `videos` 테이블: 공개 영상은 조회 가능, 본인 영상만 수정 가능
- `video_reactions` 테이블: 본인 반응만 생성/수정 가능

## 🏃‍♂️ 3단계: 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001) 접속

## ✅ 4단계: 동작 확인

### 기본 기능 체크리스트
- [ ] 홈페이지가 정상적으로 로드됨
- [ ] "시작하기" 버튼 클릭 시 로그인 페이지 이동
- [ ] Google 로그인 동작 (OAuth 설정한 경우)
- [ ] 온보딩 페이지에서 프로필 생성 가능
- [ ] 대시보드에서 영상 업로드 가능
- [ ] 업로드된 영상이 홈페이지 트렌딩 섹션에 표시
- [ ] 영상 클릭 시 재생 페이지 이동
- [ ] 좋아요/투자 관심 버튼 동작

## 🐛 트러블슈팅

### 환경 변수 오류
```
❌ 환경 변수 검증 실패: NEXT_PUBLIC_SUPABASE_URL
```
**해결**: `.env.local` 파일의 Supabase URL이 올바른지 확인 (https://로 시작하는 전체 URL)

### TypeScript 컴파일 오류
```bash
npx tsc --noEmit
```
**해결**: 타입 오류 수정 후 다시 실행

### 포트 충돌 (Port 3000 in use)
**해결**: 자동으로 3001 포트 사용, 문제없음

### Supabase 연결 오류
1. API 키가 올바른지 확인
2. RLS 정책이 올바르게 설정되었는지 확인
3. 브라우저 개발자 도구에서 네트워크 탭 확인

## 📚 추가 참고자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js App Router 가이드](https://nextjs.org/docs/app)
- [Tailwind CSS 가이드](https://tailwindcss.com/docs)

## 🤝 문제 발생 시

1. **GitHub Issues** 확인
2. **개발자 도구 콘솔** 에러 메시지 확인
3. **Supabase 로그** 확인 (Dashboard → Logs)

---

**설정 완료 후 즐거운 개발 되세요! 🎉**