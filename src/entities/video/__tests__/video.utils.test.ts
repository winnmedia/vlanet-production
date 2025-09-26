/**
 * Video Utilities Unit Tests
 * entities 레이어 단위 테스트 - 도메인 로직 검증
 */

import { formatVideoDuration, formatViewCount } from '../utils'
import type { VideoStats, Video } from '../types'

describe('Video Utilities', () => {
  describe('formatVideoDuration', () => {
    it('should format seconds to MM:SS format', () => {
      expect(formatVideoDuration(0)).toBe('0:00')
      expect(formatVideoDuration(30)).toBe('0:30')
      expect(formatVideoDuration(90)).toBe('1:30')
      expect(formatVideoDuration(3661)).toBe('61:01') // 1시간 1분 1초
    })

    it('should handle edge cases', () => {
      expect(formatVideoDuration(-1)).toBe('0:00')
      expect(formatVideoDuration(NaN)).toBe('0:00')
      expect(formatVideoDuration(Infinity)).toBe('0:00')
    })
  })

  describe('formatViewCount', () => {
    it('should format view counts with appropriate suffixes', () => {
      expect(formatViewCount(0)).toBe('0')
      expect(formatViewCount(999)).toBe('999')
      expect(formatViewCount(1000)).toBe('1K')
      expect(formatViewCount(1500)).toBe('1.5K')
      expect(formatViewCount(1000000)).toBe('1M')
      expect(formatViewCount(1500000)).toBe('1.5M')
      expect(formatViewCount(1000000000)).toBe('1B')
    })

    it('should handle decimal places correctly', () => {
      expect(formatViewCount(1234)).toBe('1.2K')
      expect(formatViewCount(1256)).toBe('1.3K') // 반올림
      expect(formatViewCount(1000001)).toBe('1M') // 1.000001M -> 1M
    })
  })
})

describe('Video Domain Logic', () => {
  const mockVideo: Video = {
    id: 'test-video-id',
    creator_id: 'creator-1',
    title: 'Test Video',
    description: 'Test Description',
    tags: ['test', 'video'],
    ai_model: 'sora',
    prompt: 'Test prompt',
    video_url: 'https://example.com/video.mp4',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    file_name: 'test-video.mp4',
    file_size: 1024000,
    duration: 120,
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'mp4',
    status: 'published',
    upload_progress: 100,
    error_message: null,
    is_public: true,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    published_at: '2024-01-01T00:00:00Z',
    deleted_at: null
  }

  const mockStats: VideoStats = {
    video_id: 'test-video-id',
    view_count: 1000,
    unique_view_count: 800,
    like_count: 50,
    dislike_count: 5,
    comment_count: 12,
    share_count: 8,
    investment_interest_count: 10,
    total_investment_amount: 50000,
    total_revenue: 1000,
    creator_earnings: 800,
    last_viewed_at: '2024-01-01T12:00:00Z',
    trending_score: 75.5,
    completion_rate: 0.75,
    updated_at: '2024-01-01T00:00:00Z'
  }

  describe('Video validation', () => {
    it('should identify valid video data', () => {
      const isValidVideo = (video: Video): boolean => {
        return !!(
          video.id &&
          video.title &&
          video.video_url &&
          video.creator_id &&
          video.status &&
          video.ai_model
        )
      }

      expect(isValidVideo(mockVideo)).toBe(true)
    })

    it('should identify invalid video data', () => {
      const invalidVideo = { ...mockVideo, title: '' }
      const isValidVideo = (video: Video): boolean => {
        return !!(
          video.id &&
          video.title &&
          video.video_url &&
          video.creator_id &&
          video.status &&
          video.ai_model
        )
      }

      expect(isValidVideo(invalidVideo)).toBe(false)
    })
  })

  describe('Video statistics calculations', () => {
    it('should calculate engagement rate correctly', () => {
      const calculateEngagementRate = (stats: VideoStats): number => {
        if (stats.view_count === 0) return 0
        const totalEngagement = stats.like_count + stats.dislike_count
        return Math.round((totalEngagement / stats.view_count) * 100 * 100) / 100 // 소수점 2자리
      }

      expect(calculateEngagementRate(mockStats)).toBe(5.5) // (50 + 5) / 1000 * 100 = 5.5%
    })

    it('should handle zero views in engagement calculation', () => {
      const zeroViewStats = { ...mockStats, view_count: 0 }
      const calculateEngagementRate = (stats: VideoStats): number => {
        if (stats.view_count === 0) return 0
        const totalEngagement = stats.like_count + stats.dislike_count
        return Math.round((totalEngagement / stats.view_count) * 100 * 100) / 100
      }

      expect(calculateEngagementRate(zeroViewStats)).toBe(0)
    })
  })
})