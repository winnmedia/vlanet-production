/**
 * Performance Monitoring System
 * 성능 지표 수집 및 분석을 위한 모니터링 시스템
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
import { reportError } from '../error-handling';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  timestamp: number;
}

export interface PagePerformanceData {
  pathname: string;
  searchParams?: string;
  referrer?: string;
  loadTime: number;
  domContentLoadedTime: number;
  metrics: PerformanceMetric[];
  resources: {
    totalRequests: number;
    totalSize: number;
    slowestResource: {
      name: string;
      duration: number;
    };
  };
}

class PerformanceMonitor {
  private sessionInfo: SessionInfo;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

    if (this.isEnabled) {
      this.sessionInfo = this.initializeSession();
      this.setupWebVitalsCollection();
      this.setupNavigationTiming();
      this.setupResourceTiming();
      this.setupPageUnloadHandler();
    }
  }

  private initializeSession(): SessionInfo {
    const connection = (navigator as any).connection;

    return {
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      } : undefined,
      timestamp: Date.now(),
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupWebVitalsCollection() {
    // Core Web Vitals 수집
    getCLS(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));
  }

  private setupNavigationTiming() {
    // Navigation Timing API 사용
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const nav = navEntries[0];

          // 페이지 로드 시간 측정
          const pageLoadTime = nav.loadEventEnd - nav.navigationStart;
          const domContentLoadedTime = nav.domContentLoadedEventEnd - nav.navigationStart;

          this.trackCustomMetric('page_load_time', pageLoadTime);
          this.trackCustomMetric('dom_content_loaded_time', domContentLoadedTime);
        }
      });
    }
  }

  private setupResourceTiming() {
    // Resource Timing API로 리소스 성능 모니터링
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const resources = entries.filter(entry => entry.entryType === 'resource');

        if (resources.length > 0) {
          this.analyzeResourcePerformance(resources);
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private setupPageUnloadHandler() {
    // 페이지 언로드 시 남은 메트릭 전송
    const handlePageUnload = () => {
      if (this.metricQueue.length > 0) {
        // sendBeacon API로 안전하게 전송
        this.sendMetricsOnUnload();
      }
    };

    // 다양한 페이지 이탈 이벤트 처리
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    // Visibility API로 탭 변경 감지
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handlePageUnload();
      }
    });

    // Next.js 라우터 변경 시에도 전송
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('popstate', handlePageUnload);
    }
  }

  private sendMetricsOnUnload() {
    if (this.metricQueue.length === 0) return;

    const batch = [...this.metricQueue];
    this.metricQueue = [];

    // sendBeacon으로 안전한 전송
    if ('sendBeacon' in navigator) {
      const data = JSON.stringify({
        metrics: batch,
        timestamp: Date.now(),
        sessionId: this.sessionInfo.sessionId,
      });

      // Google Analytics 전송
      if (typeof gtag !== 'undefined') {
        batch.forEach(metric => {
          navigator.sendBeacon(
            'https://www.google-analytics.com/g/collect',
            new URLSearchParams({
              tid: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
              t: 'event',
              ec: 'Performance',
              ea: metric.name,
              ev: Math.round(metric.value).toString(),
            })
          );
        });
      }

      // 커스텀 엔드포인트로도 전송
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        navigator.sendBeacon(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, data);
      }
    } else {
      // Fallback: localStorage에 저장
      this.saveToLocalStorage(batch);
    }
  }

  private analyzeResourcePerformance(resources: PerformanceEntry[]) {
    const totalSize = resources.reduce((sum, resource) => {
      return sum + ((resource as any).transferSize || 0);
    }, 0);

    const slowestResource = resources.reduce((slowest, current) => {
      return current.duration > slowest.duration ? current : slowest;
    });

    this.trackCustomMetric('total_resource_size', totalSize);
    this.trackCustomMetric('slowest_resource_time', slowestResource.duration);
  }

  private handleMetric(metric: PerformanceMetric) {
    this.metrics.set(metric.name, metric);

    // TODO(human): 성능 지표를 분석 서비스로 전송하는 로직 구현
    // 힌트: trackPerformanceMetric 함수에서 다음을 고려해야 합니다:
    // 1. Core Web Vitals 지표별 처리 (LCP, FID, CLS 등)
    // 2. 사용자 세션 정보와 페이지 컨텍스트 포함
    // 3. 분석 서비스(Google Analytics, Mixpanel 등)로 안전한 전송
    // 4. 에러 처리로 모니터링이 앱 성능에 영향주지 않도록 보장
    // 5. 지표별 임계값 체크하여 알림 필요 시 표시

    this.trackPerformanceMetric(metric);
  }

  private trackCustomMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      rating: this.getRating(name, value),
      id: `${name}_${Date.now()}`,
      navigationType: this.getNavigationType(),
    };

    this.handleMetric(metric);
  }

  private metricQueue: PerformanceMetric[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000;

  private trackPerformanceMetric(metric: PerformanceMetric) {
    try {
      // 성능이 poor인 경우 즉시 처리 및 경고
      if (metric.rating === 'poor') {
        this.handlePoorPerformance(metric);
      }

      // 배치 큐에 추가
      this.metricQueue.push({
        ...metric,
        ...this.getContextualInfo(),
      });

      // 배치 크기에 도달하거나 타이머가 만료되면 전송
      if (this.metricQueue.length >= this.BATCH_SIZE) {
        this.flushMetrics();
      } else if (!this.batchTimer) {
        this.scheduleBatchFlush();
      }

    } catch (error) {
      // 모니터링 자체가 앱에 영향을 주지 않도록 에러 무시
      reportError(new Error(`Performance tracking failed: ${error}`), {
        metric: metric.name,
        value: metric.value,
      });
    }
  }

  private handlePoorPerformance(metric: PerformanceMetric) {
    // 개발 환경에서 성능 경고 표시
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Poor ${metric.name} performance:`, {
        value: metric.value,
        rating: metric.rating,
        threshold: this.getThresholdForMetric(metric.name),
      });
    }

    // 즉시 분석 서비스로 전송 (중요한 성능 이슈)
    this.sendToAnalytics([{
      ...metric,
      ...this.getContextualInfo(),
      priority: 'high',
    }]);
  }

  private getContextualInfo() {
    return {
      sessionInfo: this.sessionInfo,
      page: {
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer,
      },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  private scheduleBatchFlush() {
    this.batchTimer = setTimeout(() => {
      this.flushMetrics();
    }, this.BATCH_TIMEOUT);
  }

  private flushMetrics() {
    if (this.metricQueue.length === 0) return;

    // requestIdleCallback으로 유휴 시간에 처리
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.processBatch();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.processBatch();
      }, 0);
    }
  }

  private processBatch() {
    const batch = [...this.metricQueue];
    this.metricQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.sendToAnalytics(batch);
  }

  private sendToAnalytics(metrics: any[]) {
    try {
      // Google Analytics 4 이벤트 전송
      if (typeof gtag !== 'undefined') {
        metrics.forEach(metric => {
          gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: metric.name,
            value: Math.round(metric.value),
            custom_map: {
              rating: metric.rating,
              session_id: this.sessionInfo.sessionId,
              page_path: metric.page?.pathname,
              user_agent: metric.userAgent,
            },
          });
        });
      }

      // 커스텀 분석 엔드포인트로도 전송 (있는 경우)
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        this.sendToCustomEndpoint(metrics);
      }

      // 개발 환경에서 로깅
      if (process.env.NODE_ENV === 'development') {
        console.group('📊 Performance Metrics Batch');
        metrics.forEach(metric => {
          console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
        });
        console.groupEnd();
      }

    } catch (error) {
      // 네트워크 에러 등의 경우 로컬 스토리지에 저장
      this.saveToLocalStorage(metrics);
      reportError(new Error(`Analytics sending failed: ${error}`));
    }
  }

  private async sendToCustomEndpoint(metrics: any[]) {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          sessionId: this.sessionInfo.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics endpoint error: ${response.status}`);
      }
    } catch (error) {
      // 실패한 메트릭을 로컬 스토리지에 저장
      this.saveToLocalStorage(metrics);
      throw error;
    }
  }

  private saveToLocalStorage(metrics: any[]) {
    try {
      const existingMetrics = this.getStoredMetrics();
      const updatedMetrics = [...existingMetrics, ...metrics];

      // 최대 100개까지만 저장 (메모리 관리)
      const trimmedMetrics = updatedMetrics.slice(-100);

      localStorage.setItem('performance_metrics', JSON.stringify(trimmedMetrics));
    } catch (error) {
      // localStorage 에러는 무시 (저장 공간 부족 등)
      console.warn('Failed to save metrics to localStorage:', error);
    }
  }

  private getStoredMetrics(): any[] {
    try {
      const stored = localStorage.getItem('performance_metrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getThresholdForMetric(name: string) {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      FID: { good: 100, poor: 300 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };
    return thresholds[name as keyof typeof thresholds];
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    // Web Vitals 기준값들
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      FID: { good: 100, poor: 300 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationType(): PerformanceMetric['navigationType'] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        return navEntries[0].type as PerformanceMetric['navigationType'];
      }
    }
    return 'navigate';
  }

  // 공용 메서드들
  public getSessionInfo(): SessionInfo {
    return this.sessionInfo;
  }

  public getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMetricByName(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// 유틸리티 함수들
export function measureExecutionTime<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      performanceMonitor['trackCustomMetric'](`execution_time_${name}`, duration);
    });
  } else {
    const duration = performance.now() - start;
    performanceMonitor['trackCustomMetric'](`execution_time_${name}`, duration);
    return result;
  }
}

export function markPerformancePoint(name: string) {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

export function measurePerformanceBetween(startMark: string, endMark: string, name: string) {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      if (measures.length > 0) {
        performanceMonitor['trackCustomMetric'](name, measures[0].duration);
      }
    } catch (error) {
      reportError(new Error(`Performance measurement failed: ${error}`));
    }
  }
}