/**
 * Next.js Instrumentation
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Sentry 서버 설정 로드
    await import('./sentry.server.config');
  }

  // Edge runtime에서만 실행
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Sentry Edge 설정 로드
    await import('./sentry.edge.config');
  }

  // 개발 환경에서는 추가 계측 도구들 활성화
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경 전용 모니터링 설정
    console.log('🔧 Instrumentation loaded for development environment');
  }

  // 프로덕션 환경에서는 성능 최적화된 설정
  if (process.env.NODE_ENV === 'production') {
    console.log('📊 Production instrumentation loaded');
  }
}