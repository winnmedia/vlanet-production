import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Edge runtime에서는 낮은 샘플링 비율 사용 (성능 고려)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug 모드 설정 (개발 환경에서만 활성화)
  debug: process.env.NODE_ENV === 'development',

  // Edge runtime 전용 설정
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // 민감한 정보 필터링 (Edge runtime에서는 간소화)
  beforeSend(event) {
    // 민감한 데이터 제거
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Request headers에서 인증 정보 제거
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },

  // Edge runtime에서는 제한된 인테그레이션만 사용
  integrations: [
    // 기본 에러 캡처만 사용
    Sentry.captureConsoleIntegration(),
  ],

  // 에러 필터링 (Edge runtime 특화)
  ignoreErrors: [
    'NetworkError',
    'AbortError',
    'TimeoutError',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
  ],

  // 태그 추가
  initialScope: {
    tags: {
      component: 'edge',
      runtime: 'edge',
    },
  },

  // Edge runtime에서는 성능 프로파일링 비활성화
  profilesSampleRate: 0,

  // 트랜잭션 샘플링 (Edge runtime 최적화)
  tracesSampler: (samplingContext) => {
    // Health check나 static 리소스는 제외
    if (samplingContext.request?.url?.includes('/api/health')) {
      return 0;
    }

    // Middleware에서 발생하는 요청들은 낮은 비율로 샘플링
    if (samplingContext.name?.includes('middleware')) {
      return 0.01;
    }

    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },
});