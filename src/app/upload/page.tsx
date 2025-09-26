/**
 * Upload Page
 * Creator 전용 영상 업로드 페이지
 */

'use client';

import { useState } from 'react';
import { DropZone, UploadProgress, createVideoUpload, completeVideoUpload, failVideoUpload } from '@/features/upload-video';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import type { VideoStatus } from '@/entities/video';
import { validateVideoInput } from '@/entities/video';
import { CheckCircle, XCircle } from 'lucide-react';

interface VideoFileInfo {
  file: File;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

interface UploadState {
  videoId: string | null;
  uploadUrl: string | null;
  filePath: string | null;
  status: VideoStatus;
  progress: number;
  error: string | null;
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<VideoFileInfo | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    videoId: null,
    uploadUrl: null,
    filePath: null,
    status: 'uploading',
    progress: 0,
    error: null,
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ai_model: '',
    prompt: '',
    tags: '',
    is_public: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'metadata' | 'uploading' | 'complete'>('select');

  // 파일 선택 핸들러
  const handleFileSelect = (fileInfo: VideoFileInfo) => {
    setSelectedFile(fileInfo);
    setCurrentStep('metadata');

    // 파일명에서 제목 추출 (확장자 제거)
    const fileName = fileInfo.file.name;
    const titleFromFile = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setFormData(prev => ({
      ...prev,
      title: titleFromFile,
    }));
  };

  // 파일 제거 핸들러
  const handleFileRemove = () => {
    setSelectedFile(null);
    setCurrentStep('select');
    setFormData(prev => ({ ...prev, title: '' }));
  };

  // 입력 값 변경 핸들러
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 필드별 실시간 검증
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Supabase Storage 업로드
  const uploadToStorage = async (file: File, uploadUrl: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 진행률 추적
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState(prev => ({ ...prev, progress }));
        }
      };

      // 업로드 완료
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(true);
        } else {
          reject(new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`));
        }
      };

      // 업로드 에러
      xhr.onerror = () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      };

      // 업로드 중단
      xhr.onabort = () => {
        reject(new Error('업로드가 중단되었습니다.'));
      };

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('파일을 먼저 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // 클라이언트 사이드 검증
      const videoInput = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      };
      const validation = validateVideoInput(videoInput);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      // 서버 액션으로 메타데이터 생성
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('ai_model', formData.ai_model);
      form.append('prompt', formData.prompt);
      form.append('tags', formData.tags);
      form.append('is_public', formData.is_public.toString());
      form.append('file_name', selectedFile.file.name);
      form.append('file_size', selectedFile.file.size.toString());
      form.append('duration', selectedFile.duration.toString());
      form.append('width', selectedFile.width.toString());
      form.append('height', selectedFile.height.toString());
      form.append('fps', selectedFile.fps.toString());

      const createResult = await createVideoUpload(form);

      if (!createResult.success) {
        throw new Error(createResult.error || '메타데이터 생성에 실패했습니다.');
      }

      // 업로드 상태 초기화
      setUploadState({
        videoId: createResult.video_id!,
        uploadUrl: createResult.upload_url!,
        filePath: createResult.file_path!,
        status: 'uploading',
        progress: 0,
        error: null,
      });

      setCurrentStep('uploading');

      // 파일 업로드
      await uploadToStorage(selectedFile.file, createResult.upload_url!);

      // 업로드 완료 처리
      const completeForm = new FormData();
      completeForm.append('video_id', createResult.video_id!);
      completeForm.append('file_path', createResult.file_path!);

      const completeResult = await completeVideoUpload(completeForm);

      if (!completeResult.success) {
        throw new Error(completeResult.error || '업로드 완료 처리에 실패했습니다.');
      }

      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 100,
      }));

      // 잠시 후 완료 상태로 변경 (실제로는 백그라운드 작업 완료 시)
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, status: 'published' }));
        setCurrentStep('complete');
      }, 2000);

    } catch (error) {
      console.error('업로드 오류:', error);

      const errorMessage = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';

      setUploadState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));

      // 서버에 실패 상태 알림
      if (uploadState.videoId) {
        const failForm = new FormData();
        failForm.append('video_id', uploadState.videoId);
        failForm.append('error_message', errorMessage);
        await failVideoUpload(failForm);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 다시 시작 핸들러
  const handleRestart = () => {
    setSelectedFile(null);
    setUploadState({
      videoId: null,
      uploadUrl: null,
      filePath: null,
      status: 'uploading',
      progress: 0,
      error: null,
    });
    setFormData({
      title: '',
      description: '',
      ai_model: '',
      prompt: '',
      tags: '',
      is_public: true,
    });
    setValidationErrors({});
    setCurrentStep('select');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-4">
              영상 업로드
            </h1>
            <p className="text-secondary-600">
              AI로 생성한 영상을 업로드하여 투자자들과 연결하세요
            </p>
          </div>

          {/* 진행 단계 표시 */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                ['select', 'metadata', 'uploading', 'complete'].indexOf(currentStep) >= 0
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-200 text-secondary-500'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-3 ${
                ['metadata', 'uploading', 'complete'].indexOf(currentStep) >= 0
                  ? 'bg-primary-500'
                  : 'bg-secondary-200'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                ['metadata', 'uploading', 'complete'].indexOf(currentStep) >= 0
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-200 text-secondary-500'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-3 ${
                ['uploading', 'complete'].indexOf(currentStep) >= 0
                  ? 'bg-primary-500'
                  : 'bg-secondary-200'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                currentStep === 'complete'
                  ? 'bg-success-500 text-white'
                  : ['uploading'].indexOf(currentStep) >= 0
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-200 text-secondary-500'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-2 text-sm text-secondary-600">
              <span>파일 선택</span>
              <span>정보 입력</span>
              <span>업로드</span>
            </div>
          </div>

          {/* Step 1: 파일 선택 */}
          {currentStep === 'select' && (
            <Card className="p-8">
              <DropZone
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
              />
            </Card>
          )}

          {/* Step 2: 메타데이터 입력 */}
          {currentStep === 'metadata' && selectedFile && (
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-2">
                  영상 정보를 입력해주세요
                </h2>
                <p className="text-secondary-600">
                  선택한 파일: <span className="font-semibold">{selectedFile.file.name}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
                <div>
                  <Input
                    label="제목"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="영상 제목을 입력하세요"
                    required
                    error={validationErrors.title}
                    maxLength={100}
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="영상에 대한 설명을 입력하세요"
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-danger-600">{validationErrors.description}</p>
                  )}
                </div>

                {/* AI 모델 */}
                <div>
                  <Input
                    label="AI 모델 (선택사항)"
                    name="ai_model"
                    value={formData.ai_model}
                    onChange={(e) => handleInputChange('ai_model', e.target.value)}
                    placeholder="사용한 AI 모델명 (예: Sora, RunwayML)"
                    maxLength={100}
                  />
                </div>

                {/* 프롬프트 */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    프롬프트 (선택사항)
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => handleInputChange('prompt', e.target.value)}
                    placeholder="영상 생성에 사용한 프롬프트를 입력하세요"
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  {validationErrors.prompt && (
                    <p className="mt-1 text-sm text-danger-600">{validationErrors.prompt}</p>
                  )}
                </div>

                {/* 태그 */}
                <div>
                  <Input
                    label="태그 (선택사항)"
                    name="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="태그를 쉼표로 구분하여 입력하세요 (예: AI, 애니메이션, 단편)"
                    helperText="최대 10개, 각 태그는 30자 이하"
                  />
                  {validationErrors.tags && (
                    <p className="mt-1 text-sm text-danger-600">{validationErrors.tags}</p>
                  )}
                </div>

                {/* 공개 설정 */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_public" className="text-sm font-medium text-secondary-700">
                    공개 영상으로 설정 (다른 사용자들이 볼 수 있습니다)
                  </label>
                </div>

                {/* 버튼 */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileRemove}
                    className="flex-1"
                  >
                    이전 단계
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? '업로드 준비 중...' : '업로드 시작'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Step 3: 업로드 중 또는 완료 */}
          {(currentStep === 'uploading' || currentStep === 'complete') && selectedFile && (
            <div className="space-y-6">
              <UploadProgress
                videoId={uploadState.videoId || ''}
                status={uploadState.status}
                progress={uploadState.progress}
                fileName={selectedFile.file.name}
                onComplete={() => {
                  // 대시보드로 이동하거나 새 업로드 시작
                }}
                onError={(error) => {
                  console.error('업로드 오류:', error);
                }}
              />

              {/* 완료 후 액션 */}
              {currentStep === 'complete' && (
                <Card className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="text-success-600 flex justify-center mb-4">
                      <CheckCircle size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900">
                      업로드가 완료되었습니다!
                    </h3>
                    <p className="text-secondary-600">
                      영상이 성공적으로 업로드되었습니다. 대시보드에서 확인하거나 새로운 영상을 업로드하세요.
                    </p>
                    <div className="flex space-x-4 justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleRestart}
                      >
                        새 영상 업로드
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => window.location.href = '/dashboard'}
                      >
                        대시보드로 이동
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* 실패 시 재시도 */}
              {uploadState.status === 'failed' && (
                <Card className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="text-danger-600 flex justify-center mb-4">
                      <XCircle size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900">
                      업로드에 실패했습니다
                    </h3>
                    <p className="text-secondary-600">
                      {uploadState.error || '알 수 없는 오류가 발생했습니다.'}
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleRestart}
                    >
                      다시 시도
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}