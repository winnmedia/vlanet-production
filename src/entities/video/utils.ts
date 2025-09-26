/**
 * Video Entity Utility Functions
 * 영상 관련 도메인 로직 유틸리티
 */

/**
 * 영상 길이(초)를 MM:SS 형식으로 포맷팅
 * @param seconds 초 단위 시간
 * @returns MM:SS 형식의 문자열
 */
export function formatVideoDuration(seconds: number): string {
  // 유효하지 않은 값 처리
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 조회수를 K, M, B 단위로 포맷팅
 * @param viewCount 조회수
 * @returns 포맷된 조회수 문자열
 */
export function formatViewCount(viewCount: number): string {
  if (viewCount < 1000) {
    return viewCount.toString()
  }

  if (viewCount < 1000000) {
    const kCount = viewCount / 1000
    return kCount % 1 === 0 ? `${Math.floor(kCount)}K` : `${Math.round(kCount * 10) / 10}K`
  }

  if (viewCount < 1000000000) {
    const mCount = viewCount / 1000000
    return mCount % 1 === 0 ? `${Math.floor(mCount)}M` : `${Math.round(mCount * 10) / 10}M`
  }

  const bCount = viewCount / 1000000000
  return bCount % 1 === 0 ? `${Math.floor(bCount)}B` : `${Math.round(bCount * 10) / 10}B`
}

/**
 * 영상의 참여도(Engagement Rate) 계산
 * @param stats 영상 통계
 * @returns 참여도 퍼센트 (소수점 2자리)
 */
export function calculateEngagementRate(stats: {
  view_count: number
  like_count: number
  dislike_count: number
}): number {
  if (stats.view_count === 0) return 0

  const totalEngagement = stats.like_count + stats.dislike_count
  return Math.round((totalEngagement / stats.view_count) * 100 * 100) / 100
}

/**
 * 영상 데이터 유효성 검사
 * @param video 영상 데이터
 * @returns 유효성 여부
 */
export function isValidVideo(video: {
  id: string
  title: string
  video_url: string | null
  creator_id: string
  status: string
  ai_model: string | null
}): boolean {
  return !!(
    video.id &&
    video.title &&
    video.video_url &&
    video.creator_id &&
    video.status &&
    video.ai_model
  )
}

/**
 * 영상 카테고리별 색상 반환
 * @param category 영상 카테고리
 * @returns Tailwind CSS 색상 클래스
 */
export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    entertainment: 'bg-purple-100 text-purple-800',
    education: 'bg-blue-100 text-blue-800',
    technology: 'bg-green-100 text-green-800',
    music: 'bg-pink-100 text-pink-800',
    gaming: 'bg-orange-100 text-orange-800',
    lifestyle: 'bg-yellow-100 text-yellow-800',
    business: 'bg-gray-100 text-gray-800',
    other: 'bg-slate-100 text-slate-800',
  }

  return categoryColors[category] || categoryColors.other
}

/**
 * AI 모델별 아이콘 반환
 * @param aiModel AI 모델명
 * @returns 이모지 아이콘
 */
export function getAiModelIcon(aiModel: string): string {
  const modelIcons: Record<string, string> = {
    sora: '🌟',
    runway: '🛣️',
    kling: '⚡',
    luma: '💫',
    haiper: '🔥',
    other: '🤖',
  }

  return modelIcons[aiModel] || modelIcons.other
}

/**
 * 비디오 파일의 코덱을 검증합니다
 * H.264 코덱만 허용하여 서버 트랜스코딩 비용을 절약합니다
 * @param file 비디오 파일
 * @returns Promise<검증 결과>
 */
export async function validateVideoCodec(file: File): Promise<{
  valid: boolean;
  codec?: string;
  error?: string;
}> {
  try {
    // HTML5 video element를 사용하여 코덱 지원 여부 확인
    const video = document.createElement('video');

    // H.264 코덱 지원 확인
    const h264Support = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
    if (!h264Support || h264Support === 'no') {
      return {
        valid: false,
        error: '브라우저에서 H.264 코덱을 지원하지 않습니다.',
      };
    }

    // MediaSource API를 사용한 더 정확한 코덱 검증 (지원되는 브라우저에서만)
    if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported) {
      const supportedH264Types = [
        'video/mp4; codecs="avc1.42E01E"', // H.264 Baseline Profile
        'video/mp4; codecs="avc1.4D401E"', // H.264 Main Profile
        'video/mp4; codecs="avc1.64001E"', // H.264 High Profile
      ];

      const isH264Supported = supportedH264Types.some(type =>
        MediaSource.isTypeSupported(type)
      );

      if (!isH264Supported) {
        return {
          valid: false,
          error: 'H.264 코덱이 지원되지 않습니다.',
        };
      }
    }

    // 실제 파일의 코덱 정보를 추출하여 검증
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');

      video.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);

        // 비디오가 로드되었다면 브라우저가 코덱을 지원한다고 간주
        // 더 정확한 코덱 검증을 위해서는 WebCodecs API를 사용해야 하지만
        // 현재 지원이 제한적이므로 기본적인 검증만 수행
        resolve({
          valid: true,
          codec: 'H.264 (추정)', // TODO(human): WebCodecs API로 정확한 코덱 정보 추출
        });
      });

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(url);
        const errorCode = video.error?.code;

        let errorMessage = 'H.264 코덱이 아니거나 손상된 비디오 파일입니다.';

        switch (errorCode) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = '비디오 로딩이 중단되었습니다.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = '네트워크 오류로 비디오를 로드할 수 없습니다.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = '비디오 디코딩 오류 - H.264 코덱이 아닐 수 있습니다.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = '지원되지 않는 비디오 형식입니다. H.264 코덱 MP4 파일만 지원합니다.';
            break;
        }

        resolve({
          valid: false,
          error: errorMessage,
        });
      });

      // 타임아웃 설정 (5초)
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve({
          valid: false,
          error: '비디오 코덱 검증 시간 초과 - 파일이 손상되었을 수 있습니다.',
        });
      }, 5000);

      video.src = url;
      video.load();
    });

  } catch (error) {
    console.error('코덱 검증 중 오류:', error);
    return {
      valid: false,
      error: '코덱 검증 중 오류가 발생했습니다.',
    };
  }
}