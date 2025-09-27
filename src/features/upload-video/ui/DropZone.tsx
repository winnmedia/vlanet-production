/**
 * Video Upload Drop Zone Component
 * 드래그 앤 드롭 영상 업로드 인터페이스
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { validateVideoFile, validateVideoCodec, VIDEO_CONSTRAINTS, formatFileSize } from '../../../entities/video';

interface VideoFileInfo {
  file: File;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

interface DropZoneProps {
  onFileSelect: (fileInfo: VideoFileInfo) => void;
  onFileRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropZone({
  onFileSelect,
  onFileRemove,
  disabled = false,
  className = '',
}: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VideoFileInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 비디오 메타데이터 추출
  const extractVideoMetadata = useCallback((file: File): Promise<VideoFileInfo> => {
    return new Promise((resolve, reject) => {
      // 브라우저 환경 체크
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        reject(new Error('브라우저 환경에서만 실행 가능합니다.'));
        return;
      }

      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.addEventListener('loadedmetadata', () => {
        const fileInfo: VideoFileInfo = {
          file,
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // 기본값, 실제로는 더 정확한 방법 필요
        };

        URL.revokeObjectURL(url);
        resolve(fileInfo);
      });

      video.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('비디오 메타데이터를 읽을 수 없습니다.'));
      });

      video.src = url;
      video.load();
    });
  }, []);

  // 파일 처리
  const handleFile = useCallback(async (file: File) => {
    if (disabled) return;

    setErrors([]);
    setIsAnalyzing(true);

    try {
      // 기본 파일 검증
      const validation = validateVideoFile(file);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsAnalyzing(false);
        return;
      }

      // H.264 코덱 검증 (서버 트랜스코딩 비용 절약)
      const codecValidation = await validateVideoCodec(file);
      if (!codecValidation.valid) {
        setErrors([codecValidation.error || 'H.264 코덱이 필요합니다.']);
        setIsAnalyzing(false);
        return;
      }

      // 비디오 메타데이터 추출
      const fileInfo = await extractVideoMetadata(file);

      // 길이 검증
      if (fileInfo.duration > VIDEO_CONSTRAINTS.MAX_DURATION) {
        setErrors([`영상 길이는 ${VIDEO_CONSTRAINTS.MAX_DURATION / 60}분 이하여야 합니다.`]);
        setIsAnalyzing(false);
        return;
      }

      setSelectedFile(fileInfo);
      onFileSelect(fileInfo);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('파일 분석 오류:', error);
      setErrors(['파일을 분석하는 중 오류가 발생했습니다.']);
      setIsAnalyzing(false);
    }
  }, [disabled, extractVideoMetadata, onFileSelect]);

  // 드래그 이벤트 처리
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  // 파일 선택 이벤트
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // 파일 제거
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setErrors([]);
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileRemove]);

  // 파일 선택기 열기
  const openFileSelector = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 드롭존 */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileSelector}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragActive
            ? 'border-primary-500 bg-primary-50'
            : errors.length > 0
            ? 'border-danger-300 bg-danger-50'
            : selectedFile
            ? 'border-success-300 bg-success-50'
            : 'border-secondary-300 bg-secondary-50 hover:border-primary-400 hover:bg-primary-25'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isAnalyzing ? 'pointer-events-none' : ''}
        `}
      >
        <div className="px-8 py-12 text-center">
          {isAnalyzing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600">비디오 파일을 분석하는 중...</p>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4">
              <div className="text-success-600 text-4xl">✓</div>
              <div className="space-y-2">
                <p className="font-semibold text-secondary-900">{selectedFile.file.name}</p>
                <div className="text-sm text-secondary-600 space-y-1">
                  <p>크기: {formatFileSize(selectedFile.file.size)}</p>
                  <p>길이: {Math.floor(selectedFile.duration / 60)}:{(selectedFile.duration % 60).toString().padStart(2, '0')}</p>
                  <p>해상도: {selectedFile.width} × {selectedFile.height}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="text-sm text-danger-600 hover:text-danger-700 underline"
              >
                다른 파일 선택
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-secondary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-secondary-900">
                  비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-secondary-600">
                  지원 형식: MP4 (H.264 코덱 필수) | 최대 크기: {formatFileSize(VIDEO_CONSTRAINTS.MAX_FILE_SIZE)} | 최대 길이: {VIDEO_CONSTRAINTS.MAX_DURATION / 60}분
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,.mp4"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 mt-0.5">
              <svg className="w-5 h-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-danger-900 mb-2">파일 검증 오류</h4>
              <ul className="text-sm text-danger-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 제한 안내 */}
      <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
        <h4 className="font-semibold text-secondary-900 mb-2">업로드 제한사항</h4>
        <div className="text-sm text-secondary-700 grid sm:grid-cols-2 gap-2">
          <div>• 형식: MP4 (H.264 코덱 필수)</div>
          <div>• 최대 크기: {formatFileSize(VIDEO_CONSTRAINTS.MAX_FILE_SIZE)}</div>
          <div>• 최대 길이: {VIDEO_CONSTRAINTS.MAX_DURATION / 60}분</div>
          <div>• 최대 해상도: 1920×1080</div>
        </div>
      </div>
    </div>
  );
}