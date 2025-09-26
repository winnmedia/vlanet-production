import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of the transactions for performance monitoring
  // This is the recommended setting for production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug 모드 설정 (개발 환경에서만 활성화)
  debug: process.env.NODE_ENV === 'development',

  // 브라우저에서 발생하는 에러만 캡처
  enabled: typeof window !== 'undefined',

  // Performance 및 에러 모니터링 설정
  integrations: [
    // React 컴포넌트 에러 캡처
    Sentry.replayIntegration({
      // Session replay 샘플링 비율
      sessionSampleRate: 0.1,
      // 에러가 발생한 세션의 replay 캡처 비율
      errorSampleRate: 1.0,
    }),
    // Web Vitals 모니터링
    Sentry.browserTracingIntegration(),
    // React Router 인테그레이션 (Next.js App Router 용)
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: Sentry.reactIntegration.useEffect,
    }),
  ],

  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Error:', event, hint);
    }

    // 민감한 데이터 제거
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // 환경 변수나 기타 민감한 정보 제거
    if (event.contexts?.runtime?.name === 'node') {
      delete event.contexts.runtime;
    }

    return event;
  },

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 릴리즈 버전 설정
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // 에러 필터링 설정
  ignoreErrors: [
    // 브라우저 확장 프로그램 에러 무시
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'Script error.',
    // 네트워크 관련 에러 (사용자 네트워크 문제)
    'NetworkError when attempting to fetch resource',
    'ChunkLoadError',
    'Loading chunk',
    // 사용자 인터랙션 관련 에러 (의도적인 페이지 이탈 등)
    'AbortError',
    'The operation was aborted',
    // AdBlocker 관련 에러
    'blocked:*',
    'adblockcdn.com',
  ],

  // 허용할 도메인 설정 (크로스 도메인 에러 필터링)
  allowUrls: [
    process.env.NEXT_PUBLIC_APP_URL!,
    'localhost',
    '127.0.0.1',
  ],

  // 성능 모니터링 설정
  profilesSampleRate: 0.1,

  // 태그 추가
  initialScope: {
    tags: {
      component: 'frontend',
      runtime: 'browser',
    },
  },
});