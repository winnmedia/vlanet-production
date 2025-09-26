/**
 * Video Player Widget
 * HTML5 비디오 플레이어 with 커스텀 컨트롤
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { VideoWithDetails } from '@/entities/video';
import type { User } from '@/entities/user';
import { trackVideoViewClient } from '@/features/video-analytics';

interface VideoPlayerProps {
  video: VideoWithDetails;
  user?: User | null;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({ video, user, autoPlay = false, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // 영상 URL이 없는 경우 처리
  if (!video.video_url) {
    return (
      <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">📹</div>
            <p className="text-lg">영상을 준비 중입니다</p>
            <p className="text-sm text-gray-300 mt-2">
              잠시만 기다려주세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  // 시간 포맷팅 (mm:ss)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 바 클릭 처리
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;
    const clickRatio = clickX / progressWidth;
    const newTime = clickRatio * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 볼륨 변경
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 컨트롤 숨김/보임 관리
  const showControlsTemporary = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // 시청 시작 추적
  const handlePlay = () => {
    setIsPlaying(true);
    if (!watchStartTime) {
      setWatchStartTime(Date.now());
    }
  };

  // 시청 일시정지
  const handlePause = () => {
    setIsPlaying(false);
  };

  // 시청 완료 추적
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);

    // 시청 시간 추적 (30초마다)
    if (watchStartTime && currentTime > 0 && currentTime % 30 === 0) {
      trackVideoViewClient({
        videoId: video.id,
        userId: user?.id || null,
        watchDuration: Math.floor(currentTime),
        totalDuration: Math.floor(duration),
      });
    }
  };

  // 영상 메타데이터 로드
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  // 에러 처리
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 컴포넌트 언마운트 시 시청 시간 기록
  useEffect(() => {
    return () => {
      if (watchStartTime && videoRef.current) {
        const watchDuration = Math.floor(videoRef.current.currentTime);
        if (watchDuration > 0) {
          trackVideoViewClient({
            videoId: video.id,
            userId: user?.id || null,
            watchDuration,
            totalDuration: Math.floor(duration),
          });
        }
      }
    };
  }, [video.id, user?.id, duration, watchStartTime]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => {
            const newVolume = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = newVolume;
            return newVolume;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => {
            const newVolume = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = newVolume;
            return newVolume;
          });
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, duration]);

  if (hasError) {
    return (
      <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-lg">영상을 불러올 수 없습니다</p>
            <p className="text-sm text-gray-300 mt-2">
              잠시 후 다시 시도해주세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-black rounded-lg overflow-hidden relative group ${className}`}
      onMouseMove={showControlsTemporary}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      {/* 비디오 엘리먼트 */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster={video.thumbnail_url || undefined}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
      >
        <source src={video.video_url} type="video/mp4" />
        <p className="text-white text-center py-8">
          이 브라우저는 비디오 재생을 지원하지 않습니다.
        </p>
      </video>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>영상을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 재생 버튼 오버레이 */}
      {!isPlaying && !isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-30"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200">
            <div className="text-black text-3xl pl-1">▶️</div>
          </div>
        </div>
      )}

      {/* 컨트롤 바 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 진행률 바 */}
        <div
          ref={progressRef}
          className="w-full h-2 bg-gray-600 rounded-full mb-4 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          ></div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            {/* 재생/일시정지 */}
            <button
              onClick={togglePlay}
              className="text-2xl hover:text-primary-400 transition-colors"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* 시간 표시 */}
            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center space-x-2">
              <span className="text-lg">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 전체화면 버튼 */}
            <button
              onClick={toggleFullscreen}
              className="text-xl hover:text-primary-400 transition-colors"
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
          </div>
        </div>
      </div>

      {/* 키보드 단축키 안내 (우측 상단) */}
      <div className="absolute top-4 right-4 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Space: 재생/정지 | F: 전체화면
      </div>
    </div>
  );
}

// CSS 스타일 (Tailwind로 표현하기 어려운 부분)
const styles = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #0059db;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #0059db;
  cursor: pointer;
  border: none;
}
`;

// 스타일 주입
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}