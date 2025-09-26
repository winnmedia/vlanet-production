# VideoPlanet MVP 개발 액션플랜 v1.0.0

> 본 문서는 VideoPlanet 프로젝트의 MVP 개발을 위한 상세 실행 계획입니다.
> CLAUDE.md의 개발 표준과 Vlanet.md의 비즈니스 요구사항을 통합한 실무 가이드입니다.

## 📌 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 아키텍처](#2-기술-아키텍처)
3. [Phase 0: 프로젝트 초기화](#phase-0-프로젝트-초기화)
4. [Phase 1: 핵심 인프라](#phase-1-핵심-인프라)
5. [Phase 2: 사용자 시스템](#phase-2-사용자-시스템)
6. [Phase 3: 콘텐츠 관리](#phase-3-콘텐츠-관리)
7. [Phase 4: 상호작용 기능](#phase-4-상호작용-기능)
8. [Phase 5: 펀딩 시스템](#phase-5-펀딩-시스템)
9. [Phase 6: 품질 보증](#phase-6-품질-보증)
10. [Phase 7: 배포 및 운영](#phase-7-배포-및-운영)
11. [위험 관리](#위험-관리)
12. [체크리스트](#체크리스트)

---

## 1. 프로젝트 개요

### 1.1 비전 및 목표
- **비전**: "Prompt to Profit" - AI 창작자의 아이디어를 상업적 성공으로
- **MVP 목표**:
  - 창작자의 AI 영상 포트폴리오 업로드/관리
  - 투자자의 콘텐츠 탐색 및 창작자 발견
  - 핵심 사이클(업로드 → 발견 → 제안) 검증

### 1.2 핵심 사용자
1. **AI 영상 창작자 (Creator)**
   - AI 툴로 영상을 제작하는 개인/팀
   - 상업화 기회를 찾는 크리에이터

2. **콘텐츠 투자자 (Funder)**
   - 제작사, 광고 에이전시 담당자
   - 신선한 IP와 창작자를 찾는 기업

### 1.3 MVP 범위 정의
- **포함 (In Scope)**:
  - 소셜 로그인 (Google OAuth)
  - 역할 기반 프로필 시스템
  - 영상 업로드 및 관리 (제한적)
  - 메인 피드 및 탐색
  - 간소화된 연락 시스템

- **제외 (Out of Scope)**:
  - 실시간 채팅
  - 결제 시스템
  - AI 매칭 알고리즘
  - 고급 분석 도구

---

## 2. 기술 아키텍처

### 2.1 기술 스택
```
Frontend:
├── Next.js 15.x (App Router)
├── TypeScript 5.5.x
├── Tailwind CSS v3.x
├── Shadcn/UI Components
└── Video.js / Plyr (Video Player)

Backend:
├── Supabase (BaaS)
│   ├── PostgreSQL (Database)
│   ├── Auth (Authentication)
│   └── Storage (File Storage)
└── Server Actions (Data Mutations)

Deployment:
├── Vercel (Hosting)
├── GitHub Actions (CI/CD)
└── Sentry (Error Tracking)
```

### 2.2 FSD 아키텍처 구조
```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # 인증 관련 라우트
│   ├── (main)/         # 메인 애플리케이션
│   ├── api/            # API 라우트
│   └── layout.tsx      # 루트 레이아웃
│
├── pages/              # FSD 페이지 레이어
│   ├── home/          # 홈 페이지
│   ├── project/       # 프로젝트 상세
│   ├── upload/        # 업로드 페이지
│   └── dashboard/     # 대시보드
│
├── widgets/            # 재사용 가능한 UI 블록
│   ├── header/        # 헤더
│   ├── footer/        # 푸터
│   ├── project-card/  # 프로젝트 카드
│   └── video-player/  # 비디오 플레이어
│
├── features/           # 비즈니스 기능
│   ├── auth/          # 인증 기능
│   ├── upload/        # 업로드 기능
│   ├── like/          # 좋아요 기능
│   └── proposal/      # 제안 기능
│
├── entities/           # 도메인 엔티티
│   ├── user/          # 사용자
│   ├── project/       # 프로젝트
│   ├── proposal/      # 제안
│   └── comment/       # 댓글
│
└── shared/            # 공통 리소스
    ├── api/           # API 클라이언트
    ├── config/        # 설정
    ├── lib/           # 유틸리티
    └── ui/            # 기본 UI 컴포넌트
```

### 2.3 데이터베이스 스키마

#### 2.3.1 사용자 관련
```sql
-- 사용자 역할 Enum
CREATE TYPE user_role AS ENUM ('CREATOR', 'FUNDER', 'VIEWER');

-- 프로필 테이블
CREATE TABLE profiles (
    id uuid REFERENCES auth.users PRIMARY KEY,
    username text UNIQUE,
    avatar_url text,
    bio text,
    role user_role DEFAULT 'VIEWER',
    company text, -- Funder인 경우
    website text,
    social_links jsonb, -- {twitter, instagram, etc}
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### 2.3.2 콘텐츠 관련
```sql
-- 프로젝트 테이블
CREATE TABLE projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text NOT NULL,
    duration integer, -- 초 단위
    file_size bigint, -- 바이트 단위

    -- 메타데이터 (AI 준비)
    genre text[],
    style text[],
    ai_tools text[],
    tags text[],

    -- 통계
    views_count bigint DEFAULT 0,
    likes_count bigint DEFAULT 0,
    comments_count bigint DEFAULT 0,

    -- 관리
    is_featured boolean DEFAULT false,
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### 2.3.3 상호작용 관련
```sql
-- 좋아요 테이블
CREATE TABLE likes (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
);

-- 댓글 테이블
CREATE TABLE comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 제안 상태 Enum
CREATE TYPE proposal_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- 제안 테이블
CREATE TABLE proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    funder_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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
```

---

## Phase 0: 프로젝트 초기화

### 목표
- 개발 환경 구성 및 프로젝트 기반 설정
- 예상 소요 시간: 1-2일

### 0.1 Next.js 프로젝트 생성

```bash
# 프로젝트 생성
pnpm create next-app@latest videoplanet \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd videoplanet

# 추가 패키지 설치
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zod react-hook-form @hookform/resolvers
pnpm add clsx tailwind-merge class-variance-authority
pnpm add video.js @types/video.js
pnpm add -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 0.2 프로젝트 구조 설정

```bash
# FSD 디렉토리 생성
mkdir -p src/{pages,widgets,features,entities,shared}
mkdir -p src/shared/{api,config,lib,ui}
mkdir -p src/entities/{user,project,proposal,comment}
mkdir -p src/features/{auth,upload,like,proposal}
mkdir -p src/widgets/{header,footer,project-card,video-player}
mkdir -p src/pages/{home,project,upload,dashboard}
```

### 0.3 환경 변수 설정

`.env.local` 파일 생성:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storage Limits
NEXT_PUBLIC_MAX_VIDEO_SIZE=209715200 # 200MB in bytes
NEXT_PUBLIC_MAX_VIDEO_DURATION=120 # 2 minutes in seconds
NEXT_PUBLIC_MAX_VIDEO_RESOLUTION=1080
```

### 0.4 환경 변수 검증 설정

`src/shared/config/env.ts`:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_MAX_VIDEO_SIZE: z.string().transform(Number),
  NEXT_PUBLIC_MAX_VIDEO_DURATION: z.string().transform(Number),
  NEXT_PUBLIC_MAX_VIDEO_RESOLUTION: z.string().transform(Number),
});

export const env = envSchema.parse(process.env);
```

### 0.5 Supabase 클라이언트 설정

`src/shared/api/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/shared/config/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

`src/shared/api/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 0.6 ESLint 및 Prettier 설정

`.eslintrc.json`:
```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["@/features/*/*"],
            "message": "Use public API (index.ts) imports only"
          }
        ]
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

`.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 0.7 Tailwind 설정

`tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // VLANET 브랜드 색상 (로고 기반)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0059db', // 로고 밝은 블루
          600: '#004ac1', // 로고 진한 블루
          700: '#003a9b',
          800: '#1e3a8a',
          900: '#1e2b4f',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          900: '#7f1d1d',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Phase 1: 핵심 인프라

### 목표
- 인증 시스템 구축
- 기본 라우팅 설정
- 비디오 인프라 구축
- 예상 소요 시간: 3-5일

### 1.1 인증 시스템 구현

#### 1.1.1 OAuth 콜백 핸들러
`src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/shared/api/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
```

#### 1.1.2 로그인 페이지
`src/pages/auth/login/index.tsx`:
```typescript
'use client';

import { createClient } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui/button';

export function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">VideoPlanet</h1>
          <p className="mt-2 text-gray-600">AI 창작자와 투자자를 연결합니다</p>
        </div>

        <Button
          onClick={handleGoogleLogin}
          className="w-full"
          variant="primary"
        >
          Google로 시작하기
        </Button>
      </div>
    </div>
  );
}
```

#### 1.1.3 미들웨어 설정
`src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 보호된 라우트 체크
  const protectedRoutes = ['/upload', '/dashboard', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 온보딩 체크
  if (user && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();

    if (!profile?.username || !profile?.role) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 1.2 비디오 인프라 구축

#### 1.2.1 비디오 업로드 유효성 검사
`src/features/upload/lib/validation.ts`:
```typescript
import { z } from 'zod';
import { env } from '@/shared/config/env';

export const videoFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type === 'video/mp4', {
      message: 'MP4 형식만 지원됩니다',
    })
    .refine((file) => file.size <= env.NEXT_PUBLIC_MAX_VIDEO_SIZE, {
      message: '파일 크기는 200MB 이하여야 합니다',
    }),
});

export const projectUploadSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  description: z.string().min(10, '최소 10자 이상 입력해주세요').max(1000),
  genre: z.array(z.string()).min(1, '최소 1개 이상의 장르를 선택해주세요'),
  style: z.array(z.string()).min(1, '최소 1개 이상의 스타일을 선택해주세요'),
  aiTools: z.array(z.string()).min(1, '사용한 AI 툴을 선택해주세요'),
});

// 비디오 메타데이터 추출 함수
export async function extractVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}
```

#### 1.2.2 표준 비디오 플레이어 컴포넌트
`src/shared/ui/video-player/index.tsx`:
```typescript
'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  onReady?: (player: Player) => void;
}

export function VideoPlayer({ src, poster, className, onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type: 'video/mp4' }],
        poster,
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
          volumePanel: {
            inline: false,
          },
        },
      }, () => {
        onReady?.(player);
      }));
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, onReady]);

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} />
    </div>
  );
}
```

### 1.3 Server Actions 기본 설정

`src/shared/lib/server-action.ts`:
```typescript
import { createClient } from '@/shared/api/supabase/server';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function authenticatedAction<T, R>(
  action: (userId: string, data: T) => Promise<ActionResult<R>>
) {
  return async (data: T): Promise<ActionResult<R>> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '인증이 필요합니다' };
    }

    try {
      return await action(user.id, data);
    } catch (error) {
      console.error('Server action error:', error);
      return { success: false, error: '서버 오류가 발생했습니다' };
    }
  };
}
```

---

## Phase 2: 사용자 시스템

### 목표
- 온보딩 플로우 구현
- 역할 기반 프로필 시스템
- 예상 소요 시간: 3일

### 2.1 온보딩 구현

`src/pages/onboarding/index.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/shared/api/supabase/client';
import { UserRole } from '@/entities/user/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '' as UserRole,
    username: '',
    bio: '',
    company: '',
  });

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      router.push('/');
    }
  };

  if (step === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-2xl space-y-8 p-8">
          <h1 className="text-center text-3xl font-bold">
            어떤 목적으로 사용하시나요?
          </h1>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => handleRoleSelect('CREATOR')}
              className="group rounded-lg border-2 border-gray-200 p-8 transition hover:border-primary-500"
            >
              <h2 className="text-xl font-semibold">창작자</h2>
              <p className="mt-2 text-gray-600">
                AI로 만든 영상을 공유하고 투자 기회를 찾습니다
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect('FUNDER')}
              className="group rounded-lg border-2 border-gray-200 p-8 transition hover:border-primary-500"
            >
              <h2 className="text-xl font-semibold">투자자</h2>
              <p className="mt-2 text-gray-600">
                재능 있는 창작자를 발굴하고 협업 기회를 제안합니다
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold">프로필 설정</h1>

        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            사용자명
          </label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            placeholder="@username"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            소개
          </label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="간단한 소개를 작성해주세요"
          />
        </div>

        {formData.role === 'FUNDER' && (
          <div>
            <label htmlFor="company" className="block text-sm font-medium">
              소속
            </label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="회사명"
            />
          </div>
        )}

        <Button type="submit" className="w-full">
          시작하기
        </Button>
      </form>
    </div>
  );
}
```

### 2.2 프로필 엔티티 정의

`src/entities/user/types.ts`:
```typescript
export type UserRole = 'CREATOR' | 'FUNDER' | 'VIEWER';

export interface Profile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  company?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

`src/entities/user/api.ts`:
```typescript
import { createClient } from '@/shared/api/supabase/server';
import type { Profile } from './types';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  return data;
}
```

---

## Phase 3: 콘텐츠 관리

### 목표
- 프로젝트 업로드 시스템
- 메인 피드 구현
- 프로젝트 상세 페이지
- 예상 소요 시간: 4일

### 3.1 업로드 페이지

`src/pages/upload/index.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadProject } from '@/features/upload/actions';
import { projectUploadSchema, extractVideoMetadata } from '@/features/upload/lib/validation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select } from '@/shared/ui/select';
import { FileUpload } from '@/features/upload/components/file-upload';

const GENRES = ['SF', '판타지', '드라마', '액션', '코미디', '호러', '다큐멘터리'];
const STYLES = ['애니메이션', '실사', '하이퍼리얼리즘', '2D', '3D', '믹스'];
const AI_TOOLS = ['RunwayML', 'Pika', 'Stable Diffusion', 'Midjourney', 'DALL-E'];

export function UploadPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(projectUploadSchema),
  });

  const onSubmit = async (data: any) => {
    if (!videoFile || !thumbnailFile) return;

    setUploading(true);

    try {
      // 비디오 메타데이터 추출
      const metadata = await extractVideoMetadata(videoFile);

      // 파일 업로드 및 프로젝트 생성
      const result = await uploadProject({
        ...data,
        videoFile,
        thumbnailFile,
        duration: Math.floor(metadata.duration),
        fileSize: videoFile.size,
      });

      if (result.success) {
        router.push(`/projects/${result.data.id}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">프로젝트 업로드</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 비디오 업로드 */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              비디오 파일 (MP4, 최대 200MB)
            </label>
            <FileUpload
              accept="video/mp4"
              maxSize={200 * 1024 * 1024}
              onFileSelect={setVideoFile}
              className="h-64"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-gray-600">
                {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* 썸네일 업로드 */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              썸네일 이미지
            </label>
            <FileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              onFileSelect={setThumbnailFile}
              className="h-64"
              preview
            />
          </div>
        </div>

        {/* 프로젝트 정보 */}
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              제목
            </label>
            <Input
              id="title"
              {...register('title')}
              placeholder="프로젝트 제목을 입력하세요"
              error={errors.title?.message}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium">
              설명
            </label>
            <Textarea
              id="description"
              {...register('description')}
              rows={5}
              placeholder="프로젝트에 대해 설명해주세요"
              error={errors.description?.message}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">장르</label>
              <Select
                multiple
                options={GENRES.map(g => ({ value: g, label: g }))}
                onChange={(values) => setValue('genre', values)}
                error={errors.genre?.message}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">스타일</label>
              <Select
                multiple
                options={STYLES.map(s => ({ value: s, label: s }))}
                onChange={(values) => setValue('style', values)}
                error={errors.style?.message}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">사용 AI 툴</label>
              <Select
                multiple
                options={AI_TOOLS.map(t => ({ value: t, label: t }))}
                onChange={(values) => setValue('aiTools', values)}
                error={errors.aiTools?.message}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/')}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={uploading || !videoFile || !thumbnailFile}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### 3.2 업로드 Server Action

`src/features/upload/actions.ts`:
```typescript
'use server';

import { createClient } from '@/shared/api/supabase/server';
import { authenticatedAction } from '@/shared/lib/server-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const uploadSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  genre: z.array(z.string()),
  style: z.array(z.string()),
  aiTools: z.array(z.string()),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  duration: z.number(),
  fileSize: z.number(),
});

export const uploadProject = authenticatedAction(async (userId, data) => {
  const validated = uploadSchema.parse(data);

  const supabase = await createClient();

  // 프로젝트 생성
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      creator_id: userId,
      title: validated.title,
      description: validated.description,
      video_url: validated.videoUrl,
      thumbnail_url: validated.thumbnailUrl,
      duration: validated.duration,
      file_size: validated.fileSize,
      genre: validated.genre,
      style: validated.style,
      ai_tools: validated.aiTools,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: '프로젝트 생성에 실패했습니다' };
  }

  revalidatePath('/');
  revalidatePath('/dashboard/projects');

  return { success: true, data: project };
});
```

### 3.3 메인 피드 구현

`src/pages/home/index.tsx`:
```typescript
import { Suspense } from 'react';
import { createClient } from '@/shared/api/supabase/server';
import { ProjectCard } from '@/widgets/project-card';
import { ProjectFilters } from '@/features/project/components/filters';
import { Pagination } from '@/shared/ui/pagination';

interface HomePageProps {
  searchParams: {
    page?: string;
    sort?: 'latest' | 'popular';
    genre?: string;
    style?: string;
  };
}

export async function HomePage({ searchParams }: HomePageProps) {
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || 'latest';
  const limit = 12;
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // 쿼리 빌드
  let query = supabase
    .from('projects')
    .select(`
      *,
      creator:profiles!creator_id(username, avatar_url)
    `, { count: 'exact' })
    .eq('is_public', true)
    .range(offset, offset + limit - 1);

  // 정렬
  if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'popular') {
    query = query.order('likes_count', { ascending: false });
  }

  // 필터
  if (searchParams.genre) {
    query = query.contains('genre', [searchParams.genre]);
  }
  if (searchParams.style) {
    query = query.contains('style', [searchParams.style]);
  }

  const { data: projects, count } = await query;
  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">VideoPlanet's Pick</h2>
        <Suspense fallback={<div>Loading featured...</div>}>
          <FeaturedProjects />
        </Suspense>
      </section>

      {/* 필터 */}
      <ProjectFilters />

      {/* 프로젝트 그리드 */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/"
      />
    </div>
  );
}

async function FeaturedProjects() {
  const supabase = await createClient();

  const { data: featured } = await supabase
    .from('projects')
    .select(`
      *,
      creator:profiles!creator_id(username, avatar_url)
    `)
    .eq('is_featured', true)
    .eq('is_public', true)
    .limit(4);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {featured?.map((project) => (
        <ProjectCard key={project.id} project={project} featured />
      ))}
    </div>
  );
}
```

---

## Phase 4: 상호작용 기능

### 목표
- 좋아요 시스템
- 댓글 기능
- 예상 소요 시간: 3일

### 4.1 좋아요 기능

`src/features/like/actions.ts`:
```typescript
'use server';

import { createClient } from '@/shared/api/supabase/server';
import { authenticatedAction } from '@/shared/lib/server-action';
import { revalidatePath } from 'next/cache';

export const toggleLike = authenticatedAction(async (userId, projectId: string) => {
  const supabase = await createClient();

  // 기존 좋아요 확인
  const { data: existingLike } = await supabase
    .from('likes')
    .select()
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();

  if (existingLike) {
    // 좋아요 취소
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);
  } else {
    // 좋아요 추가
    await supabase
      .from('likes')
      .insert({ user_id: userId, project_id: projectId });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/');

  return { success: true, data: { liked: !existingLike } };
});
```

`src/features/like/components/like-button.tsx`:
```typescript
'use client';

import { useState, useTransition } from 'react';
import { toggleLike } from '../actions';
import { Heart } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LikeButtonProps {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeButton({
  projectId,
  initialLiked,
  initialCount,
  size = 'md'
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    startTransition(async () => {
      const result = await toggleLike(projectId);
      if (!result.success) {
        // Revert on error
        setLiked(liked);
        setCount(count);
      }
    });
  };

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-1.5 transition',
        'hover:bg-gray-100',
        liked && 'text-red-500'
      )}
    >
      <Heart
        className={cn(
          'transition',
          size === 'sm' && 'h-4 w-4',
          size === 'md' && 'h-5 w-5',
          size === 'lg' && 'h-6 w-6',
          liked && 'fill-current'
        )}
      />
      <span className="text-sm font-medium">{count}</span>
    </button>
  );
}
```

### 4.2 댓글 시스템

`src/features/comment/actions.ts`:
```typescript
'use server';

import { createClient } from '@/shared/api/supabase/server';
import { authenticatedAction } from '@/shared/lib/server-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const commentSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export const addComment = authenticatedAction(async (userId, data) => {
  const validated = commentSchema.parse(data);

  const supabase = await createClient();

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      project_id: validated.projectId,
      content: validated.content,
    })
    .select(`
      *,
      user:profiles!user_id(username, avatar_url)
    `)
    .single();

  if (error) {
    return { success: false, error: '댓글 작성에 실패했습니다' };
  }

  revalidatePath(`/projects/${validated.projectId}`);

  return { success: true, data: comment };
});

export const deleteComment = authenticatedAction(async (userId, commentId: string) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: '댓글 삭제에 실패했습니다' };
  }

  revalidatePath('/');

  return { success: true, data: null };
});
```

---

## Phase 5: 펀딩 시스템

### 목표
- 간소화된 연락 시스템
- 제안 관리 대시보드
- 예상 소요 시간: 3일

### 5.1 연락하기 기능

`src/features/proposal/components/contact-modal.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendProposal } from '../actions';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

const proposalSchema = z.object({
  subject: z.string().min(1, '제목을 입력해주세요'),
  message: z.string().min(10, '메시지를 입력해주세요'),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
});

interface ContactModalProps {
  creatorId: string;
  projectId?: string;
  creatorName: string;
  open: boolean;
  onClose: () => void;
}

export function ContactModal({
  creatorId,
  projectId,
  creatorName,
  open,
  onClose,
}: ContactModalProps) {
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(proposalSchema),
  });

  const onSubmit = async (data: any) => {
    setSending(true);

    const result = await sendProposal({
      ...data,
      creatorId,
      projectId,
    });

    if (result.success) {
      reset();
      onClose();
      // Show success toast
    }

    setSending(false);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-4 text-2xl font-bold">
          {creatorName}님에게 제안하기
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium">
              제목
            </label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="제안 제목"
              error={errors.subject?.message}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium">
              메시지
            </label>
            <Textarea
              id="message"
              {...register('message')}
              rows={5}
              placeholder="제안 내용을 자세히 작성해주세요"
              error={errors.message?.message}
            />
          </div>

          <div>
            <label htmlFor="budgetRange" className="block text-sm font-medium">
              예산 범위 (선택)
            </label>
            <Input
              id="budgetRange"
              {...register('budgetRange')}
              placeholder="예: 500-1000만원"
            />
          </div>

          <div>
            <label htmlFor="timeline" className="block text-sm font-medium">
              일정 (선택)
            </label>
            <Input
              id="timeline"
              {...register('timeline')}
              placeholder="예: 2024년 1분기"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? '전송 중...' : '제안하기'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
```

### 5.2 제안 대시보드

`src/pages/dashboard/proposals/index.tsx`:
```typescript
import { createClient } from '@/shared/api/supabase/server';
import { getCurrentProfile } from '@/entities/user/api';
import { ProposalList } from '@/features/proposal/components/proposal-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export async function ProposalsDashboard() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // 받은 제안 (Creator)
  const { data: receivedProposals } = await supabase
    .from('proposals')
    .select(`
      *,
      funder:profiles!funder_id(username, avatar_url, company),
      project:projects(title, thumbnail_url)
    `)
    .eq('creator_id', profile.id)
    .order('created_at', { ascending: false });

  // 보낸 제안 (Funder)
  const { data: sentProposals } = await supabase
    .from('proposals')
    .select(`
      *,
      creator:profiles!creator_id(username, avatar_url),
      project:projects(title, thumbnail_url)
    `)
    .eq('funder_id', profile.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">제안 관리</h1>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            받은 제안 ({receivedProposals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sent">
            보낸 제안 ({sentProposals?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <ProposalList
            proposals={receivedProposals || []}
            type="received"
          />
        </TabsContent>

        <TabsContent value="sent">
          <ProposalList
            proposals={sentProposals || []}
            type="sent"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Phase 6: 품질 보증

### 목표
- 테스트 구현
- 성능 최적화
- 보안 강화
- 예상 소요 시간: 3일

### 6.1 테스트 설정

`jest.config.js`:
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### 6.2 RLS 테스트

`supabase/tests/rls.test.sql`:
```sql
-- RLS 테스트 (pgTap 사용)
BEGIN;

SELECT plan(10);

-- 테스트 사용자 생성
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'creator@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'funder@test.com');

INSERT INTO public.profiles (id, username, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'creator1', 'CREATOR'),
  ('22222222-2222-2222-2222-222222222222', 'funder1', 'FUNDER');

-- Test: 프로필은 누구나 볼 수 있다
SET LOCAL role TO anon;
SELECT ok(
  EXISTS(SELECT 1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111'),
  'Anonymous users can view profiles'
);

-- Test: 사용자는 자신의 프로필만 수정할 수 있다
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';

UPDATE public.profiles SET bio = 'Updated bio' WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT ok(
  (SELECT bio FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111') = 'Updated bio',
  'User can update their own profile'
);

-- Test: 다른 사용자의 프로필은 수정할 수 없다
UPDATE public.profiles SET bio = 'Hacked' WHERE id = '22222222-2222-2222-2222-222222222222';
SELECT ok(
  (SELECT bio FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222') IS NULL,
  'User cannot update other profiles'
);

-- 더 많은 테스트...

SELECT * FROM finish();
ROLLBACK;
```

### 6.3 성능 최적화 체크리스트

```typescript
// src/shared/lib/performance.ts

export const performanceConfig = {
  // 이미지 최적화
  images: {
    formats: ['webp', 'avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },

  // 성능 예산
  budgets: {
    lcp: 2500, // 2.5초
    inp: 200,  // 200ms
    cls: 0.1,  // 0.1
    ttfb: 800, // 800ms
  },

  // 캐싱 전략
  caching: {
    static: 31536000,     // 1년
    dynamic: 3600,        // 1시간
    revalidate: 60,       // 1분
  },
};
```

---

## Phase 7: 배포 및 운영

### 목표
- 프로덕션 배포
- 모니터링 설정
- 예상 소요 시간: 2일

### 7.1 Vercel 배포 설정

`vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "regions": ["icn1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 7.2 모니터링 설정

`src/shared/lib/monitoring.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // PII 필터링
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });
  }
}

// 커스텀 에러 리포팅
export function reportError(error: Error, context?: Record<string, any>) {
  console.error('Application error:', error);

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
```

---

## 위험 관리

### 기술적 위험
1. **비디오 스토리지 비용**
   - 완화: 엄격한 업로드 제한
   - 모니터링: 일일 사용량 추적
   - 대응: 임계값 도달 시 알림

2. **스케일링 이슈**
   - 완화: 서버리스 아키텍처
   - 모니터링: 성능 메트릭 추적
   - 대응: CDN 및 캐싱 전략

3. **보안 취약점**
   - 완화: RLS 정책 적용
   - 모니터링: 보안 감사 로그
   - 대응: 정기 보안 점검

### 비즈니스 위험
1. **사용자 획득**
   - 전략: 커뮤니티 파트너십
   - 측정: 가입/이탈률 추적

2. **콘텐츠 품질**
   - 전략: 큐레이션 시스템
   - 측정: 사용자 피드백

---

## 체크리스트

### 개발 완료 체크리스트
- [ ] 모든 FSD 레이어 구현
- [ ] 테스트 커버리지 70% 이상
- [ ] 성능 예산 충족
- [ ] RLS 정책 검증
- [ ] 접근성 검사 통과

### 배포 전 체크리스트
- [ ] 환경 변수 설정
- [ ] 프로덕션 DB 마이그레이션
- [ ] 도메인 설정
- [ ] SSL 인증서
- [ ] 모니터링 도구 설정

### 출시 후 체크리스트
- [ ] 사용자 피드백 수집
- [ ] 성능 모니터링
- [ ] 에러 추적
- [ ] 보안 감사
- [ ] 백업 검증

---

## 부록: 참고 자료

### 공식 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Feature-Sliced Design](https://feature-sliced.design)

### 프로젝트 관련 문서
- `CLAUDE.md`: 개발 표준 및 가이드라인
- `Vlanet.md`: 비즈니스 요구사항
- 본 문서: 실행 계획

---

**문서 버전:** 1.0.0
**최종 수정:** 2024년 현재
**다음 리뷰:** MVP 완료 후
