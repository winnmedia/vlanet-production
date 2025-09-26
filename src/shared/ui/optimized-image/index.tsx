/**
 * Optimized Image Component
 * Next.js Image 최적화 및 Core Web Vitals 개선
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

const DEFAULT_FALLBACK = '/images/placeholder.jpg';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fallbackSrc = DEFAULT_FALLBACK,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">이미지를 불러올 수 없습니다</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        quality={quality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}

// 특화된 이미지 컴포넌트들
export function VideoThumbnail({
  src,
  alt,
  className,
  priority = false,
}: Pick<OptimizedImageProps, 'src' | 'alt' | 'className' | 'priority'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={320}
      height={180}
      priority={priority}
      className={cn('aspect-video object-cover', className)}
      sizes="(max-width: 768px) 100vw, 320px"
      quality={85}
      fallbackSrc="/images/video-placeholder.jpg"
    />
  );
}

export function UserAvatar({
  src,
  alt,
  size = 40,
  className,
}: Pick<OptimizedImageProps, 'src' | 'alt' | 'className'> & {
  size?: number;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      sizes={`${size}px`}
      quality={90}
      fallbackSrc="/images/avatar-placeholder.png"
    />
  );
}