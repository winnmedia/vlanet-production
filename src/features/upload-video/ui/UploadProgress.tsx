/**
 * Upload Progress Component
 * 실시간 업로드 진행률 표시 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import type { VideoStatus } from '@/entities/video';
import { VIDEO_STATUS_LABELS, getVideoStatusColor } from '@/entities/video';

interface UploadProgressProps {
  videoId: string;
  status: VideoStatus;
  progress: number;
  fileName: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function UploadProgress({
  videoId,
  status,
  progress: initialProgress,
  fileName,
  onComplete,
  onError,
  className = '',
}: UploadProgressProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 상태별 아이콘
  const getStatusIcon = (status: VideoStatus) => {
    switch (status) {
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        );
      case 'processing':
        return (
          <div className="animate-pulse text-primary-600 text-xl">⚡</div>
        );
      case 'published':
        return <div className="text-success-600 text-xl">✅</div>;
      case 'failed':
        return <div className="text-danger-600 text-xl">❌</div>;
      default:
        return <div className="text-secondary-400 text-xl">📄</div>;
    }
  };

  // 상태별 메시지
  const getStatusMessage = (status: VideoStatus, progress: number) => {
    switch (status) {
      case 'uploading':
        return `업로드 중... ${progress}%`;
      case 'processing':
        return '영상을 처리하는 중입니다...';
      case 'published':
        return '업로드가 완료되었습니다!';
      case 'failed':
        return errorMessage || '업로드 중 오류가 발생했습니다.';
      default:
        return '준비 중...';
    }
  };

  // 진행률 바 색상
  const getProgressColor = (status: VideoStatus) => {
    switch (status) {
      case 'uploading':
        return 'bg-primary-600';
      case 'processing':
        return 'bg-yellow-500';
      case 'published':
        return 'bg-success-600';
      case 'failed':
        return 'bg-danger-600';
      default:
        return 'bg-secondary-400';
    }
  };

  // 상태 변경 감지
  useEffect(() => {
    if (status !== currentStatus) {
      setCurrentStatus(status);

      if (status === 'published' && onComplete) {
        onComplete();
      } else if (status === 'failed' && onError) {
        onError(errorMessage || '업로드 중 오류가 발생했습니다.');
      }
    }
  }, [status, currentStatus, onComplete, onError, errorMessage]);

  // 진행률 변경 감지
  useEffect(() => {
    if (initialProgress !== progress) {
      setProgress(initialProgress);
    }
  }, [initialProgress, progress]);

  const displayProgress = currentStatus === 'processing' ? 100 : progress;
  const isComplete = currentStatus === 'published';
  const isFailed = currentStatus === 'failed';
  const isActive = currentStatus === 'uploading' || currentStatus === 'processing';

  return (
    <div
      className={`
        rounded-lg border p-6 transition-all duration-200
        ${isComplete
          ? 'border-success-200 bg-success-50'
          : isFailed
          ? 'border-danger-200 bg-danger-50'
          : isActive
          ? 'border-primary-200 bg-primary-50'
          : 'border-secondary-200 bg-secondary-50'
        }
        ${className}
      `}
    >
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(currentStatus)}
            <div>
              <h3 className="font-semibold text-secondary-900 truncate max-w-xs">
                {fileName}
              </h3>
              <p className="text-sm text-secondary-600">
                {getStatusMessage(currentStatus, displayProgress)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${isComplete
                  ? 'bg-success-100 text-success-800'
                  : isFailed
                  ? 'bg-danger-100 text-danger-800'
                  : isActive
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-secondary-100 text-secondary-800'
                }
              `}
            >
              {VIDEO_STATUS_LABELS[currentStatus]}
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary-600">진행률</span>
            <span className="text-sm font-semibold text-secondary-900">
              {displayProgress}%
            </span>
          </div>

          <div className="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
            <div
              className={`
                h-full transition-all duration-300 ease-out rounded-full
                ${getProgressColor(currentStatus)}
                ${currentStatus === 'processing' ? 'animate-pulse' : ''}
              `}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* 추가 정보 */}
        {currentStatus === 'processing' && (
          <div className="flex items-center space-x-2 text-sm text-secondary-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-secondary-400"></div>
            <span>영상을 처리하고 썸네일을 생성하는 중입니다...</span>
          </div>
        )}

        {currentStatus === 'published' && (
          <div className="flex items-center space-x-2 text-sm text-success-700">
            <span>🎉</span>
            <span>영상이 성공적으로 업로드되었습니다!</span>
          </div>
        )}

        {currentStatus === 'failed' && (
          <div className="bg-danger-100 border border-danger-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-danger-600 text-lg">⚠️</div>
              <div className="flex-1">
                <h4 className="font-medium text-danger-900 mb-1">업로드 실패</h4>
                <p className="text-sm text-danger-700">
                  {errorMessage || '업로드 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}