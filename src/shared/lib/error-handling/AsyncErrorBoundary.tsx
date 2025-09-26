'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/nextjs';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Async 컴포넌트와 Promise 기반 에러를 위한 Error Boundary
 * React Query, SWR 등의 비동기 데이터 페칭 에러를 캐치합니다.
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };

    // 전역 Promise rejection 처리
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 비동기 에러에 특별한 태그 추가
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'async');
      scope.setTag('errorType', 'component');
      scope.setContext('asyncErrorBoundary', {
        componentStack: errorInfo.componentStack,
      });
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('Async Error Boundary caught an error:', error, errorInfo);
    }
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Promise rejection을 에러로 변환
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    // Sentry에 비동기 에러로 보고
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'async');
      scope.setTag('errorType', 'unhandledRejection');
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled Promise Rejection:', event.reason);
    }

    // 에러 상태 업데이트
    this.setState({
      hasError: true,
      error,
    });

    // 기본 동작 방지
    event.preventDefault();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용, 없으면 기본 ErrorBoundary로 위임
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 ErrorBoundary를 사용하되 비동기 에러임을 표시
      return (
        <ErrorBoundary
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-secondary-900">
                    데이터 로딩 중 문제가 발생했습니다
                  </h2>
                  <p className="mt-2 text-sm text-secondary-600">
                    서버와의 연결에 문제가 발생했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.
                  </p>
                  <button
                    onClick={this.handleRetry}
                    className="mt-4 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          }
          onError={this.props.onError}
        >
          {/* ErrorBoundary가 이미 에러를 캐치했으므로 children을 렌더링하지 않음 */}
          <div />
        </ErrorBoundary>
      );
    }

    return this.props.children;
  }
}