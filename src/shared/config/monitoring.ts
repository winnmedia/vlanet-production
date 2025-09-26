/**
 * 모니터링 및 분석 설정
 * 성능 모니터링, 에러 추적, 사용자 분석
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Core Web Vitals 임계값
export const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

// 성능 메트릭 타입
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userId?: string;
}

/**
 * Core Web Vitals 수집 및 리포팅
 */
export function initWebVitals() {
  // LCP (Largest Contentful Paint)
  getLCP((metric) => {
    reportMetric({
      name: 'LCP',
      value: metric.value,
      rating: getRating(metric.value, VITALS_THRESHOLDS.LCP),
      timestamp: Date.now(),
      url: window.location.href,
    });
  });

  // FID (First Input Delay) - 더 이상 사용되지 않지만 레거시 호환성을 위해 유지
  getFID((metric) => {
    reportMetric({
      name: 'FID',
      value: metric.value,
      rating: getRating(metric.value, VITALS_THRESHOLDS.FID),
      timestamp: Date.now(),
      url: window.location.href,
    });
  });

  // CLS (Cumulative Layout Shift)
  getCLS((metric) => {
    reportMetric({
      name: 'CLS',
      value: metric.value,
      rating: getRating(metric.value, VITALS_THRESHOLDS.CLS),
      timestamp: Date.now(),
      url: window.location.href,
    });
  });

  // FCP (First Contentful Paint)
  getFCP((metric) => {
    reportMetric({
      name: 'FCP',
      value: metric.value,
      rating: getRating(metric.value, VITALS_THRESHOLDS.FCP),
      timestamp: Date.now(),
      url: window.location.href,
    });
  });

  // TTFB (Time to First Byte)
  getTTFB((metric) => {
    reportMetric({
      name: 'TTFB',
      value: metric.value,
      rating: getRating(metric.value, VITALS_THRESHOLDS.TTFB),
      timestamp: Date.now(),
      url: window.location.href,
    });
  });
}

/**
 * 메트릭 등급 계산
 */
function getRating(
  value: number,
  thresholds: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 메트릭 리포팅
 */
function reportMetric(metric: PerformanceMetric) {
  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [${metric.name}]`, {
      value: `${metric.value}ms`,
      rating: metric.rating,
      url: metric.url,
    });
  }

  // 프로덕션에서는 분석 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics 4에 전송
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        custom_parameter: metric.value,
        metric_rating: metric.rating,
        page_location: metric.url,
      });
    }

    // Vercel Analytics에 전송
    if (typeof window !== 'undefined' && 'va' in window) {
      (window as any).va('track', `vitals_${metric.name}`, {
        value: metric.value,
        rating: metric.rating,
      });
    }

    // 자체 분석 API로 전송 (선택사항)
    sendToAnalytics(metric);
  }
}

/**
 * 자체 분석 API로 메트릭 전송
 */
async function sendToAnalytics(metric: PerformanceMetric) {
  try {
    await fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    });
  } catch (error) {
    // 분석 전송 실패는 조용히 무시
    console.warn('Analytics reporting failed:', error);
  }
}

/**
 * 커스텀 성능 메트릭 추적
 */
export function trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
  const metric: PerformanceMetric & { metadata?: Record<string, any> } = {
    name: `custom_${name}`,
    value,
    rating: 'good', // 커스텀 메트릭은 기본적으로 good
    timestamp: Date.now(),
    url: window.location.href,
    metadata,
  };

  reportMetric(metric);
}

/**
 * 페이지 로드 시간 측정
 */
export function measurePageLoad() {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;

      trackCustomMetric('page_load_time', pageLoadTime, {
        dns_time: navigation.domainLookupEnd - navigation.domainLookupStart,
        connection_time: navigation.connectEnd - navigation.connectStart,
        response_time: navigation.responseEnd - navigation.responseStart,
        dom_processing_time: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      });
    }
  }
}

/**
 * API 응답 시간 측정
 */
export function measureApiCall(endpoint: string, startTime: number) {
  const duration = Date.now() - startTime;

  trackCustomMetric('api_response_time', duration, {
    endpoint,
    timestamp: Date.now(),
  });
}

/**
 * 에러 추적
 */
export function trackError(error: Error, context?: Record<string, any>) {
  // Sentry가 있으면 Sentry로 전송
  if (typeof window !== 'undefined' && 'Sentry' in window) {
    (window as any).Sentry.captureException(error, {
      extra: context,
    });
  }

  // 자체 에러 로깅
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        context,
      }),
    }).catch(() => {
      // 에러 로깅 실패는 조용히 무시
    });
  }
}

/**
 * 사용자 행동 추적
 */
export function trackUserAction(action: string, category: string, metadata?: Record<string, any>) {
  // Google Analytics 4에 전송
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      ...metadata,
    });
  }

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [User Action]`, { action, category, metadata });
  }
}