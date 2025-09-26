'use client';

/**
 * Global Error Handler for Next.js App Router
 * Sentry 에러 리포팅과 함께 글로벌 에러 처리
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Sentry에 에러 리포팅
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="text-red-500 text-6xl mb-6">
              <AlertTriangle size={64} className="mx-auto" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              문제가 발생했습니다
            </h1>

            <p className="text-gray-600 mb-6">
              예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-red-800 mb-2">개발 모드 에러 정보:</h3>
                <pre className="text-xs text-red-700 whitespace-pre-wrap">
                  {error.message}
                </pre>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">
                    Error Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={reset}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <RefreshCw size={18} className="mr-2" />
                다시 시도
              </Button>

              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Home size={18} className="mr-2" />
                홈으로 돌아가기
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              문제가 지속되면 고객 지원팀에 문의해주세요.
            </p>
          </Card>
        </div>
      </body>
    </html>
  );
}