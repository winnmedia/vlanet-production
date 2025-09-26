# 🎬 VLANET

> **Prompt to Profit** - AI 창작자의 아이디어가 상업적 성공으로 이어지는 생태계의 허브

VLANET은 AI 영상 창작자들이 콘텐츠를 업로드하고, 시장성을 검증받으며, 투자자와 연결될 수 있는 AI 네이티브 IP 엑셀러레이팅 플랫폼입니다.

## ✨ 프로젝트 비전

AI 영상 기술의 발전으로 콘텐츠 제작 장벽은 낮아졌지만, 창작자들이 투자자와 연결될 기회는 여전히 부족합니다. VLANET은:

- **초기 AI 영상(Seed IP) 발굴**
- **시장성 검증 및 피드백 수집**
- **투자자-창작자 연결**

이 모든 과정을 하나의 플랫폼에서 제공합니다.

## 🚀 개발 현황

### Phase 1: 기본 인프라 구축 ✅
- 사용자 인증 (Google OAuth)
- 프로필 관리 시스템
- 기본 UI/UX 구성

### Phase 2: 영상 업로드 및 관리 ✅
- 영상 업로드 및 스토리지
- 메타데이터 관리
- 대시보드 기능

### Phase 3: 상호작용 시스템 ✅ (완료!)
- 실시간 영상 시청 시스템
- 좋아요/싫어요 반응 시스템
- 투자 관심 표시 기능
- 실시간 통계 업데이트
- 트렌딩 및 추천 시스템
- 콘텐츠 탐색 페이지

## 🏗️ 기술 스택

### Frontend
- **Next.js 15.5** (App Router, Server Components)
- **React 19** (useOptimistic, useTransition)
- **TypeScript 5.7** (Strict mode)
- **Tailwind CSS v4** (Utility-first CSS)

### Backend (BaaS)
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Row Level Security (RLS)** for data protection

### Architecture
- **Feature-Sliced Design (FSD)** - 확장 가능한 아키텍처
- **Server Actions** - 서버-클라이언트 통신 최적화
- **Clean Architecture** - 도메인 중심 설계

### Development
- **TDD (Test-Driven Development)** - 품질 중심 개발
- **ESLint + Prettier** - 코드 품질 관리
- **pnpm** - 효율적인 패키지 관리

## 📁 프로젝트 구조 (FSD)

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지
│   ├── explore/           # 콘텐츠 탐색 페이지
│   └── video/[id]/        # 개별 영상 페이지
├── widgets/               # 독립적인 UI 블록
│   ├── video-player/      # 커스텀 영상 플레이어
│   ├── video-info/        # 영상 정보 표시
│   ├── video-interactions/ # 좋아요/투자관심 버튼
│   ├── trending-videos/   # 트렌딩 영상 목록
│   └── realtime-*/        # 실시간 업데이트 컴포넌트
├── features/              # 비즈니스 기능
│   ├── video-interactions/ # 반응 및 투자관심 관리
│   └── realtime-updates/  # 실시간 업데이트 훅
├── entities/              # 도메인 모델
│   ├── video/            # 영상 관련 타입 및 API
│   └── user/             # 사용자 관련 타입 및 API
└── shared/               # 공통 유틸리티
    ├── ui/               # 재사용 가능한 UI 컴포넌트
    ├── api/              # API 클라이언트
    └── lib/              # 유틸리티 함수
```

## 🎯 주요 기능

### 영상 시청 및 상호작용
- **커스텀 비디오 플레이어** - 진행률 추적 및 시청 통계
- **실시간 반응 시스템** - 좋아요/싫어요 즉시 반영
- **투자 관심 표시** - 투자자-창작자 연결 기능

### 실시간 업데이트
- **Supabase Realtime** 기반 실시간 통계 동기화
- **Optimistic UI** - 즉각적인 사용자 피드백
- **Connection Status** - 실시간 연결 상태 표시

### 콘텐츠 발견
- **트렌딩 시스템** - 인기 급상승 콘텐츠
- **카테고리별 탐색** - 8개 주요 카테고리
- **AI 모델별 필터링** - Sora, Runway, Kling 등

## 🛠️ 개발 시작하기

### 1. 환경 설정
```bash
# 저장소 복제
git clone <repository-url>
cd VLANET

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 편집하여 Supabase 키 입력
```

### 2. Supabase 설정
자세한 설정 가이드는 [SETUP.md](./SETUP.md)를 참조하세요.

### 3. 개발 서버 실행
```bash
pnpm dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001) 접속

## 📊 데이터베이스 스키마

### 주요 테이블
- **profiles** - 사용자 프로필 정보
- **videos** - 영상 메타데이터 및 상태
- **video_stats** - 영상별 통계 (조회수, 좋아요 등)
- **video_reactions** - 사용자 반응 (좋아요/싫어요)
- **video_views** - 시청 기록 및 진행률
- **investment_interests** - 투자 관심 표시

### 보안 정책 (RLS)
모든 테이블에 Row Level Security가 적용되어 있습니다:
- 사용자는 본인 데이터만 수정 가능
- 공개 콘텐츠는 모든 사용자가 조회 가능
- 민감한 정보는 소유자만 접근 가능

## 🧪 테스트 및 품질 관리

### 품질 게이트
- **TypeScript** - 타입 안정성 검사
- **ESLint** - 코드 품질 및 FSD 아키텍처 경계 검사
- **Prettier** - 코드 포맷팅 (Tailwind 클래스 정렬 포함)
- **성능 예산** - Core Web Vitals 기준 준수

### 개발 원칙
- **TDD (Test-Driven Development)** - 테스트 우선 개발
- **중복 방지** - 기존 코드 재사용 우선
- **단방향 의존성** - FSD 레이어 간 의존성 규칙 준수

## 🔄 실시간 기능 구현

### Supabase Realtime 활용
```typescript
// 실시간 통계 구독 예시
const channel = supabase
  .channel(`video_stats_${videoId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'video_stats',
    filter: `video_id=eq.${videoId}`
  }, (payload) => {
    // 통계 업데이트 처리
  })
  .subscribe();
```

### Optimistic Updates
React 19의 `useOptimistic`을 활용한 즉각적인 UI 피드백:
- 사용자 액션 즉시 UI 반영
- 서버 응답 대기 중에도 부드러운 경험 제공
- 에러 발생 시 자동 롤백

## 📈 성능 최적화

### Core Web Vitals 목표
- **LCP (Largest Contentful Paint)**: 2.5초 이내
- **INP (Interaction to Next Paint)**: 200ms 이내
- **CLS (Cumulative Layout Shift)**: 0.1 이하

### 최적화 기법
- **Server Components** - 서버 사이드 렌더링
- **Dynamic Imports** - 코드 스플리팅
- **Image Optimization** - Next.js Image 컴포넌트
- **Caching Strategy** - Supabase 캐싱 및 CDN 활용

## 🤝 기여 가이드

### 개발 워크플로우
1. **이슈 확인** - GitHub Issues에서 작업할 이슈 선택
2. **브랜치 생성** - `feature/issue-number` 형태
3. **TDD 개발** - 테스트 작성 → 구현 → 리팩토링
4. **품질 검사** - 모든 품질 게이트 통과 확인
5. **PR 생성** - Conventional Commits 형식 준수

### 커밋 메시지 형식
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정 등
```

## 📚 추가 문서

- [개발 지침 (CLAUDE.md)](./CLAUDE.md) - 상세한 개발 표준 및 아키텍처 가이드
- [설정 가이드 (SETUP.md)](./SETUP.md) - 프로젝트 설정 단계별 안내
- [메모리 로그 (MEMORY.md)](./MEMORY.md) - 개발 진행 상황 및 의사결정 기록

## 🎯 다음 단계 (Phase 4 예정)

- **고급 분석 대시보드** - 창작자를 위한 상세한 통계
- **투자자 매칭 시스템** - AI 기반 투자자-창작자 연결
- **수익화 기능** - 광고, 후원, 라이선싱 시스템
- **모바일 앱** - React Native 기반 모바일 경험

## 📞 문의

- **GitHub Issues** - 버그 리포트 및 기능 요청
- **Discussion** - 개발 관련 토론
- **Email** - 비즈니스 문의

---

**🌟 AI 창작의 새로운 가능성을 함께 만들어 나가요!**

*Built with ❤️ using Next.js, Supabase, and modern web technologies*