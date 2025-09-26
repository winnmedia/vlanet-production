'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 에러가 발생했음을 state에 기록
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry에 에러 보고
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', true);
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      });
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    // 부모 컴포넌트의 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // 개발 환경에서는 콘솔에 에러 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReportError = () => {
    if (this.state.error) {
      // 사용자 피드백과 함께 에러 보고
      Sentry.showReportDialog({
        eventId: Sentry.captureException(this.state.error),
        title: '문제가 발생했습니다',
        subtitle: '이 문제를 해결하는 데 도움을 주세요.',
        subtitle2: '문제에 대한 설명을 입력해주세요.',
        labelName: '이름',
        labelEmail: '이메일',
        labelComments: '어떤 일이 일어났나요?',
        labelClose: '닫기',
        labelSubmit: '보고서 전송',
        errorGeneric: '알 수 없는 오류가 발생했습니다.',
        errorFormEntry: '일부 필드가 유효하지 않습니다. 확인 후 다시 시도해주세요.',
        successMessage: '피드백이 전송되었습니다. 감사합니다!',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-danger-600">
                문제가 발생했습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-secondary-600">
                예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 rounded bg-secondary-100 p-3 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-secondary-700">
                    개발자 정보
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs text-secondary-600">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  size="sm"
                >
                  다시 시도
                </Button>

                <Button
                  onClick={this.handleReportError}
                  variant="outline"
                  size="sm"
                >
                  문제 신고
                </Button>
              </div>

              {this.state.errorId && (
                <p className="text-xs text-secondary-400">
                  오류 ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}