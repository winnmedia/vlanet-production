import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 서버에서는 더 높은 트레이스 샘플링 비율 사용
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Debug 모드 설정 (개발 환경에서만 활성화)
  debug: process.env.NODE_ENV === 'development',

  // 서버 사이드 에러만 캡처
  enabled: typeof window === 'undefined',

  // 서버 사이드 인테그레이션
  integrations: [
    // Node.js 성능 모니터링
    Sentry.nodeProfilingIntegration(),
    // HTTP 요청 추적
    Sentry.httpIntegration(),
    // GraphQL 인테그레이션 (필요한 경우)
    // Sentry.graphqlIntegration(),
  ],

  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server Error:', event, hint);
    }

    // 민감한 데이터 제거
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // 환경 변수 정보 제거
    if (event.contexts?.runtime?.name === 'node') {
      delete event.contexts.runtime;
    }

    // Request 데이터에서 민감한 정보 제거
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
      delete event.request.headers['x-api-key'];
    }

    // Query parameters에서 민감한 정보 제거
    if (event.request?.query_string) {
      const sensitiveParams = ['password', 'token', 'api_key', 'secret'];
      sensitiveParams.forEach(param => {
        if (event.request?.query_string?.includes(param)) {
          event.request.query_string = event.request.query_string
            .replace(new RegExp(`${param}=[^&]*`, 'gi'), `${param}=[REDACTED]`);
        }
      });
    }

    return event;
  },

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 릴리즈 버전 설정
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // 에러 필터링 설정
  ignoreErrors: [
    // Next.js 내부 에러 (정상적인 동작)
    'ENOENT: no such file or directory',
    'ECONNRESET',
    'EPIPE',
    'ECANCELED',
    // 사용자의 연결 해제로 인한 에러
    'Connection closed',
    'Client network socket disconnected',
    // Bot/Crawler 관련 에러
    'Request aborted',
    'socket hang up',
  ],

  // 성능 프로파일링 설정
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // 태그 추가
  initialScope: {
    tags: {
      component: 'backend',
      runtime: 'node',
    },
  },

  // Request 데이터 캡처 설정
  maxRequestBodySize: 'medium',
  captureRequestBody: true,

  // 성능 모니터링에서 제외할 트랜잭션
  tracesSampler: (samplingContext) => {
    // Health check 엔드포인트는 모니터링하지 않음
    if (samplingContext.request?.url?.includes('/api/health')) {
      return 0;
    }

    // Static 파일들은 모니터링하지 않음
    if (samplingContext.request?.url?.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      return 0;
    }

    // 기본 샘플링 비율 사용
    return process.env.NODE_ENV === 'production' ? 0.2 : 1.0;
  },
});