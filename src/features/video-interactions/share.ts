/**
 * Video Sharing
 * 영상 공유 기능
 */

export interface ShareVideoParams {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
}

/**
 * 영상 공유 처리
 */
export async function shareVideo(params: ShareVideoParams) {
  const videoUrl = `${window.location.origin}/video/${params.videoId}`;

  return {
    url: videoUrl,
    title: params.title,
    description: params.description,
    image: params.thumbnailUrl,
  };
}

/**
 * 소셜 미디어 공유 URL 생성
 */
export function generateSocialShareUrls(params: ShareVideoParams) {
  const videoUrl = `${window.location.origin}/video/${params.videoId}`;
  const encodedUrl = encodeURIComponent(videoUrl);
  const encodedTitle = encodeURIComponent(params.title);
  const encodedDescription = encodeURIComponent(params.description || '');

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://telegram.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };
}

/**
 * 임베드 코드 생성
 */
export function generateEmbedCode(
  videoId: string,
  options: {
    width?: number;
    height?: number;
    autoplay?: boolean;
    controls?: boolean;
  } = {}
) {
  const {
    width = 560,
    height = 315,
    autoplay = false,
    controls = true,
  } = options;

  const baseUrl = `${window.location.origin}/video/${videoId}/embed`;
  const params = new URLSearchParams();

  if (autoplay) params.set('autoplay', '1');
  if (!controls) params.set('controls', '0');

  const embedUrl = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;

  return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
}

/**
 * 네이티브 공유 API 사용 (지원되는 브라우저에서)
 */
export async function shareViaWebAPI(params: ShareVideoParams): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: params.title,
      text: params.description,
      url: `${window.location.origin}/video/${params.videoId}`,
    });
    return true;
  } catch (error) {
    console.error('Web Share API 오류:', error);
    return false;
  }
}

/**
 * 클립보드에 링크 복사
 */
export async function copyVideoLinkToClipboard(videoId: string): Promise<boolean> {
  const videoUrl = `${window.location.origin}/video/${videoId}`;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(videoUrl);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = videoUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('클립보드 복사 오류:', error);
    return false;
  }
}