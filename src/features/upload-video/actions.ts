/**
 * Upload Video Server Actions
 * 영상 업로드 관련 서버 액션들
 */

'use server';

import { createServerClient } from '../../shared/api/supabase/server';
import { getCurrentUser } from '../auth';
import { createVideo, updateVideoStatus } from '../../entities/video/api';
import type { VideoUploadInput } from '../../entities/video';
import { VIDEO_CONSTRAINTS } from '../../entities/video';
import { redirect } from 'next/navigation';
import { z } from 'zod';

/**
 * 영상 업로드 메타데이터 스키마
 */
const videoUploadSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH, `제목은 ${VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH}자 이하여야 합니다`),

  description: z
    .string()
    .max(VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH, `설명은 ${VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}자 이하여야 합니다`)
    .optional(),

  ai_model: z
    .string()
    .max(100, 'AI 모델명은 100자 이하여야 합니다')
    .optional(),

  prompt: z
    .string()
    .max(VIDEO_CONSTRAINTS.MAX_PROMPT_LENGTH, `프롬프트는 ${VIDEO_CONSTRAINTS.MAX_PROMPT_LENGTH}자 이하여야 합니다`)
    .optional(),

  tags: z
    .string()
    .optional(),

  categories: z
    .string()
    .optional(),

  is_public: z
    .boolean()
    .optional(),

  file_name: z
    .string()
    .min(1, '파일명은 필수입니다'),

  file_size: z
    .number()
    .min(1, '파일 크기는 0보다 커야 합니다')
    .max(VIDEO_CONSTRAINTS.MAX_FILE_SIZE, `파일 크기는 ${Math.round(VIDEO_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024)}MB 이하여야 합니다`),

  duration: z
    .number()
    .min(1, '영상 길이는 0보다 커야 합니다')
    .max(VIDEO_CONSTRAINTS.MAX_DURATION, `영상 길이는 ${Math.round(VIDEO_CONSTRAINTS.MAX_DURATION / 60)}분 이하여야 합니다`),

  width: z.number().min(1, '너비는 0보다 커야 합니다').optional(),
  height: z.number().min(1, '높이는 0보다 커야 합니다').max(VIDEO_CONSTRAINTS.MAX_RESOLUTION, `해상도는 ${VIDEO_CONSTRAINTS.MAX_RESOLUTION}p 이하여야 합니다`).optional(),
  fps: z.number().min(1, 'FPS는 0보다 커야 합니다').optional(),
});

/**
 * 영상 메타데이터 생성 및 업로드 URL 제공
 */
export async function createVideoUpload(formData: FormData) {
  try {
    const supabase = await createServerClient();

    // 현재 사용자 확인
    const user = await getCurrentUser();
    if (!user || user.profile?.role !== 'CREATOR') {
      throw new Error('Creator만 영상을 업로드할 수 있습니다.');
    }

    // 폼 데이터 파싱
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      ai_model: formData.get('ai_model') as string || undefined,
      prompt: formData.get('prompt') as string || undefined,
      tags: formData.get('tags') as string || undefined,
      categories: formData.get('categories') as string || undefined,
      is_public: formData.get('is_public') === 'true',
      file_name: formData.get('file_name') as string,
      file_size: parseInt(formData.get('file_size') as string),
      duration: parseInt(formData.get('duration') as string),
      width: parseInt(formData.get('width') as string) || undefined,
      height: parseInt(formData.get('height') as string) || undefined,
      fps: parseInt(formData.get('fps') as string) || undefined,
    };

    // 데이터 검증
    const validationResult = videoUploadSchema.safeParse(rawData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new Error(firstError.message);
    }

    const validatedData = validationResult.data;

    // 태그 파싱
    const tags = validatedData.tags
      ? validatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    // 카테고리 파싱
    const categories = validatedData.categories
      ? validatedData.categories.split(',').filter(Boolean)
      : [];

    // 영상 메타데이터 생성
    const videoInput: VideoUploadInput = {
      title: validatedData.title,
      description: validatedData.description,
      ai_model: validatedData.ai_model,
      prompt: validatedData.prompt,
      tags,
      categories,
      is_public: validatedData.is_public,
    };

    const result = await createVideo(user.id, videoInput);
    if (!result.success || !result.video) {
      throw new Error(result.error || '영상 메타데이터 생성에 실패했습니다.');
    }

    // Supabase Storage 업로드 URL 생성
    const videoId = result.video.id;
    const fileName = validatedData.file_name;
    const filePath = `${user.id}/${videoId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(filePath);

    if (uploadError) {
      console.error('업로드 URL 생성 오류:', uploadError);
      throw new Error('업로드 URL 생성에 실패했습니다.');
    }

    // 파일 메타데이터로 영상 정보 업데이트
    await updateVideoStatus(
      videoId,
      user.id,
      'uploading',
      0,
      undefined,
      {
        file_name: validatedData.file_name,
        file_size: validatedData.file_size,
        duration: validatedData.duration,
        width: validatedData.width,
        height: validatedData.height,
        fps: validatedData.fps,
      },
    );

    return {
      success: true,
      video_id: videoId,
      upload_url: uploadData.signedUrl,
      file_path: filePath,
    };
  } catch (error) {
    console.error('영상 업로드 생성 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 업로드 완료 처리
 */
export async function completeVideoUpload(formData: FormData) {
  try {
    const supabase = await createServerClient();

    // 현재 사용자 확인
    const user = await getCurrentUser();
    if (!user || user.profile?.role !== 'CREATOR') {
      throw new Error('인증이 필요합니다.');
    }

    const videoId = formData.get('video_id') as string;
    const filePath = formData.get('file_path') as string;

    if (!videoId || !filePath) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    // 파일이 업로드되었는지 확인
    const { data: fileData, error: fileError } = await supabase.storage
      .from('videos')
      .list(filePath.split('/').slice(0, -1).join('/'));

    if (fileError || !fileData?.length) {
      console.error('파일 확인 오류:', fileError);
      throw new Error('업로드된 파일을 찾을 수 없습니다.');
    }

    // 파일 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    // 영상 상태를 'processing'으로 업데이트
    const updateResult = await updateVideoStatus(
      videoId,
      user.id,
      'processing',
      100,
      undefined,
      {
        video_url: publicUrlData.publicUrl,
      },
    );

    if (!updateResult.success) {
      throw new Error(updateResult.error || '영상 상태 업데이트에 실패했습니다.');
    }

    // TODO: 백그라운드에서 썸네일 생성 작업 큐에 추가
    // 현재는 단순히 published 상태로 변경
    setTimeout(async () => {
      await updateVideoStatus(videoId, user.id, 'published');
    }, 1000);

    return {
      success: true,
      video_id: videoId,
    };
  } catch (error) {
    console.error('영상 업로드 완료 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 업로드 실패 처리
 */
export async function failVideoUpload(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.profile?.role !== 'CREATOR') {
      throw new Error('인증이 필요합니다.');
    }

    const videoId = formData.get('video_id') as string;
    const errorMessage = formData.get('error_message') as string;

    if (!videoId) {
      throw new Error('비디오 ID가 필요합니다.');
    }

    const result = await updateVideoStatus(
      videoId,
      user.id,
      'failed',
      undefined,
      errorMessage || '업로드 중 오류가 발생했습니다.',
    );

    if (!result.success) {
      throw new Error(result.error || '상태 업데이트에 실패했습니다.');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('영상 업로드 실패 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 업로드 진행률 업데이트
 */
export async function updateUploadProgress(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.profile?.role !== 'CREATOR') {
      throw new Error('인증이 필요합니다.');
    }

    const videoId = formData.get('video_id') as string;
    const progress = parseInt(formData.get('progress') as string);

    if (!videoId || isNaN(progress)) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    const result = await updateVideoStatus(
      videoId,
      user.id,
      'uploading',
      Math.max(0, Math.min(100, progress)),
    );

    if (!result.success) {
      throw new Error(result.error || '진행률 업데이트에 실패했습니다.');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('업로드 진행률 업데이트 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 영상 삭제
 */
export async function deleteVideoAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.profile?.role !== 'CREATOR') {
      throw new Error('인증이 필요합니다.');
    }

    const videoId = formData.get('video_id') as string;
    if (!videoId) {
      throw new Error('비디오 ID가 필요합니다.');
    }

    // 영상 삭제 (소프트 삭제)
    const { deleteVideo } = await import('../../entities/video');
    const result = await deleteVideo(videoId, user.id);

    if (!result.success) {
      throw new Error(result.error || '영상 삭제에 실패했습니다.');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('영상 삭제 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
    };
  }
}

/**
 * 업로드 페이지로 리디렉션
 */
export async function redirectToUpload() {
  redirect('/upload');
}

/**
 * 대시보드로 리디렉션
 */
export async function redirectToDashboard() {
  redirect('/dashboard');
}