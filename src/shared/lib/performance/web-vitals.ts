/**
 * Core Web Vitals 모니터링
 * LCP, FID/INP, CLS 추적 및 성능 최적화
 */

'use client';

import React from 'react';

// Core Web Vitals 타입 정의
export interface Metric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

// 성능 임계값 설정 (Core Web Vitals 기준)
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// 메트릭 등급 계산
function getRating(metricName: Metric['name'], value: number): Metric['rating'] {
  const thresholds = PERFORMANCE_THRESHOLDS[metricName];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// 성능 데이터 수집 및 전송
class PerformanceTracker {
  private metrics: Metric[] = [];
  private endpoint = '/api/analytics/performance';

  // 메트릭 수집
  collectMetric(metric: Metric) {
    const enhancedMetric = {
      ...metric,
      rating: getRating(metric.name, metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      deviceMemory: this.getDeviceMemory(),
    };

    this.metrics.push(enhancedMetric);
    this.sendMetric(enhancedMetric);
  }

  // 연결 정보 수집
  private getConnectionInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    } : null;
  }

  // 디바이스 메모리 정보
  private getDeviceMemory() {
    return (navigator as any).deviceMemory || null;
  }

  // 서버로 메트릭 전송 (배치 처리)
  private async sendMetric(metric: any) {
    try {
      // 개발 환경에서는 콘솔에만 출력
      if (process.env.NODE_ENV === 'development') {
        console.group(`🔍 Core Web Vitals: ${metric.name}`);
        console.log('값:', metric.value);
        console.log('등급:', metric.rating);
        console.log('상세:', metric);
        console.groupEnd();
        return;
      }

      // 프로덕션에서는 실제 API 전송
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.warn('Performance metric 전송 실패:', error);
    }
  }

  // 모든 메트릭 반환
  getMetrics() {
    return [...this.metrics];
  }

  // 성능 점수 계산 (0-100)
  getPerformanceScore() {
    if (this.metrics.length === 0) return null;

    const scores = this.metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 75;
        case 'poor': return 50;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
}

// 전역 인스턴스
const performanceTracker = new PerformanceTracker();

// Web Vitals 초기화
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // web-vitals 라이브러리 동적 로드
  import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
    getCLS((metric) => performanceTracker.collectMetric(metric));
    getFCP((metric) => performanceTracker.collectMetric(metric));
    getFID((metric) => performanceTracker.collectMetric(metric));
    getLCP((metric) => performanceTracker.collectMetric(metric));
    getTTFB((metric) => performanceTracker.collectMetric(metric));

    // INP 측정 (FID 대체)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-input') {
              const inp: Metric = {
                name: 'INP',
                value: entry.processingStart - entry.startTime,
                rating: getRating('INP', entry.processingStart - entry.startTime),
                delta: entry.processingStart - entry.startTime,
                id: `inp_${Date.now()}`,
              };
              performanceTracker.collectMetric(inp);
            }
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('INP 측정 실패:', error);
      }
    }
  }).catch((error) => {
    console.warn('web-vitals 라이브러리 로드 실패:', error);
  });
}

// 커스텀 성능 메트릭 추적
export function trackCustomMetric(name: string, value: number, unit = 'ms') {
  const customMetric = {
    name: name as any,
    value,
    rating: 'good' as const,
    delta: value,
    id: `custom_${Date.now()}`,
    unit,
    custom: true,
  };

  performanceTracker.collectMetric(customMetric);
}

// 페이지 로드 시간 측정
export function trackPageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      trackCustomMetric('pageLoad', navigation.loadEventEnd - navigation.fetchStart);
      trackCustomMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      trackCustomMetric('firstPaint', navigation.responseStart - navigation.fetchStart);
    }
  });
}

// React 컴포넌트 렌더링 시간 측정 Hook
export function useRenderTime(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      trackCustomMetric(`render_${componentName}`, endTime - startTime);
    };
  }, [componentName]);
}

// 성능 데이터 액세스
export function getPerformanceData() {
  return {
    metrics: performanceTracker.getMetrics(),
    score: performanceTracker.getPerformanceScore(),
  };
}

// 성능 문제 감지 및 알림
export function detectPerformanceIssues() {
  const metrics = performanceTracker.getMetrics();
  const issues = [];

  metrics.forEach(metric => {
    if (metric.rating === 'poor') {
      issues.push({
        metric: metric.name,
        value: metric.value,
        threshold: PERFORMANCE_THRESHOLDS[metric.name]?.poor,
        recommendation: getRecommendation(metric.name),
      });
    }
  });

  return issues;
}

// 성능 개선 권장사항
function getRecommendation(metricName: Metric['name']): string {
  const recommendations = {
    LCP: 'Large Contentful Paint를 개선하려면 이미지 최적화, Critical CSS 인라인화, 서버 응답 시간 단축을 고려하세요.',
    FID: 'First Input Delay를 개선하려면 JavaScript 실행 시간을 줄이고, 코드 분할을 활용하세요.',
    INP: 'Interaction to Next Paint를 개선하려면 이벤트 핸들러 최적화와 메인 스레드 차단을 줄이세요.',
    CLS: 'Cumulative Layout Shift를 개선하려면 이미지/동영상에 크기 속성을 추가하고, 폰트 로딩을 최적화하세요.',
    FCP: 'First Contentful Paint를 개선하려면 Critical CSS를 인라인화하고, 렌더링 차단 리소스를 줄이세요.',
    TTFB: 'Time to First Byte를 개선하려면 서버 응답 시간을 최적화하고, CDN을 활용하세요.',
  };

  return recommendations[metricName] || '성능 최적화를 위해 전문가와 상담하세요.';
}