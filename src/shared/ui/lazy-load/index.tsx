/**
 * Lazy Loading Components
 * 동적 import를 통한 코드 스플리팅 및 성능 최적화
 */

'use client';

import { lazy, Suspense, ComponentType, useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

// 로딩 스피너 컴포넌트
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// 로딩 스켈레톤 컴포넌트
function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-gray-200 rounded-md h-full w-full" />
    </div>
  );
}

// 에러 경계 컴포넌트
function LazyLoadError({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <p className="text-red-600 mb-2">컴포넌트를 불러오는 중 오류가 발생했습니다.</p>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

// 지연 로딩 래퍼 컴포넌트
interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  skeleton?: boolean;
}

export function LazyLoadWrapper({
  children,
  fallback,
  className,
  skeleton = false,
}: LazyLoadWrapperProps) {
  const defaultFallback = skeleton
    ? <LoadingSkeleton className={className} />
    : <LoadingSpinner className={className} />;

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// 동적 컴포넌트 로더 유틸리티
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);

  return function LazyLoadedComponent(props: P) {
    return (
      <LazyLoadWrapper fallback={fallback && <fallback />}>
        <LazyComponent {...props} />
      </LazyLoadWrapper>
    );
  };
}

// 교차점 관찰자를 사용한 지연 로딩
interface IntersectionLazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export function IntersectionLazy({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  className,
}: IntersectionLazyProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// 미리 정의된 지연 로딩 컴포넌트들
export const LazyVideoPlayer = createLazyComponent(
  () => import('@/widgets/video-player/VideoPlayer'),
  () => <LoadingSkeleton className="aspect-video w-full" />
);

export const LazyVideoComments = createLazyComponent(
  () => import('@/widgets/video-comments/VideoComments'),
  () => <LoadingSkeleton className="h-96 w-full" />
);

export const LazyVideoRecommendations = createLazyComponent(
  () => import('@/widgets/video-recommendations/VideoRecommendations'),
  () => <LoadingSkeleton className="h-64 w-full" />
);

export const LazyProposalDashboard = createLazyComponent(
  () => import('@/widgets/proposal-dashboard'),
  () => <LoadingSkeleton className="h-screen w-full" />
);

// React.lazy 래퍼 (호환성을 위해)
export { lazy, Suspense } from 'react';