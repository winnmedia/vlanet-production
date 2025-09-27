// Sentry 설정을 임시로 비활성화 (프로덕션 배포 우선)
// 추후 Sentry DSN이 설정되면 다시 활성화
import * as Sentry from '@sentry/nextjs';

// Sentry DSN이 설정된 경우에만 초기화
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 간단한 설정으로 변경
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    enabled: typeof window !== 'undefined',

    // 기본 integration만 사용
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    environment: process.env.NODE_ENV,
  });
}