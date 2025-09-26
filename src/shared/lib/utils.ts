import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 조건부 스타일링과 클래스 중복 제거를 동시에 처리
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 시간을 MM:SS 형태로 포맷
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 날짜를 상대적 시간으로 표시 (예: "2시간 전")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;

  return date.toLocaleDateString('ko-KR');
}

/**
 * 이메일 주소 유효성 검사
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 파일이 지원되는 비디오 형식인지 확인
 */
export function isValidVideoFile(file: File): boolean {
  const supportedTypes = ['video/mp4'];
  return supportedTypes.includes(file.type);
}

/**
 * 파일이 지원되는 이미지 형식인지 확인
 */
export function isValidImageFile(file: File): boolean {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return supportedTypes.includes(file.type);
}

/**
 * URL 안전성 검증 (XSS 방지)
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 한국어 텍스트가 포함되어 있는지 확인
 */
export function hasKorean(text: string): boolean {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koreanRegex.test(text);
}

/**
 * 텍스트 길이 제한 (말줄임표 추가)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}