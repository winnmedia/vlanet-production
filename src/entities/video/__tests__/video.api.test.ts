/**
 * Video API Test Suite
 * 영상 API 함수들의 단위 테스트
 */

import {
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoById,
  getCreatorVideos,
  getPublicVideos,
  getCreatorDashboardStats,
  getVideoCategories,
  getTrendingVideos
} from '../api'
import type {
  VideoUploadInput,
  VideoUpdateInput,
  GetVideosOptions
} from '../types'

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
}

// API 함수들이 사용하는 Supabase 클라이언트 모킹
jest.mock('@/shared/api/supabase/server', () => ({
  createServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// 테스트용 모의 데이터
const mockVideo = {
  id: 'video-123',
  creator_id: 'creator-123',
  title: '테스트 영상',
  description: '테스트 영상 설명',
  video_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration: 120,
  tags: ['AI', '테스트'],
  ai_model: 'stable-diffusion',
  prompt: '테스트 프롬프트',
  is_public: true,
  status: 'published',
  upload_progress: 100,
  view_count: 0,
  like_count: 0,
  comment_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockVideoWithCreator = {
  ...mockVideo,
  creator: {
    id: 'creator-123',
    username: 'testcreator',
    avatar_url: null,
    role: 'CREATOR'
  }
}

describe('Video API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.from.mockReturnValue(mockQuery)

    // mockQuery를 Promise로 동작하게 설정
    Object.assign(mockQuery, {
      then: jest.fn().mockImplementation((callback) =>
        callback({ data: mockVideo, error: null })
      ),
      catch: jest.fn()
    })
  })

  describe('createVideo', () => {
    it('should create video successfully', async () => {
      // Arrange
      const videoInput: VideoUploadInput = {
        title: '새로운 영상',
        description: '영상 설명',
        tags: ['AI', '테스트'],
        ai_model: 'stable-diffusion',
        prompt: '테스트 프롬프트',
        is_public: true
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockVideo, title: '새로운 영상' },
        error: null
      })

      // Act
      const result = await createVideo('creator-123', videoInput)

      // Assert
      expect(result.success).toBe(true)
      expect(result.video?.title).toBe('새로운 영상')
      expect(mockQuery.insert).toHaveBeenCalled()
    })

    it('should handle creation error', async () => {
      // Arrange
      const videoInput: VideoUploadInput = {
        title: '테스트 영상',
        is_public: true
      }

      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      // Act
      const result = await createVideo('creator-123', videoInput)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('getVideoById', () => {
    it('should return video by ID', async () => {
      // Arrange
      mockQuery.single.mockResolvedValue({
        data: mockVideoWithCreator,
        error: null
      })

      // Act
      const result = await getVideoById('video-123')

      // Assert
      expect(result).toEqual(mockVideoWithCreator)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'video-123')
    })

    it('should return null when video not found', async () => {
      // Arrange
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Act
      const result = await getVideoById('nonexistent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateVideo', () => {
    it('should update video successfully', async () => {
      // Arrange
      const updateInput: VideoUpdateInput = {
        title: '수정된 제목',
        description: '수정된 설명'
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockVideo, title: '수정된 제목' },
        error: null
      })

      // Act
      const result = await updateVideo('video-123', updateInput)

      // Assert
      expect(result.success).toBe(true)
      expect(result.video?.title).toBe('수정된 제목')
      expect(mockQuery.update).toHaveBeenCalled()
    })
  })

  describe('deleteVideo', () => {
    it('should delete video successfully', async () => {
      // Arrange
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: null
      })

      // Act
      const result = await deleteVideo('video-123')

      // Assert
      expect(result.success).toBe(true)
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'video-123')
    })
  })

  describe('getCreatorVideos', () => {
    it('should return creator videos', async () => {
      // Arrange
      const mockVideos = [mockVideo]
      mockQuery.then = jest.fn().mockImplementation((callback) =>
        callback({ data: mockVideos, error: null })
      )

      // Act
      const result = await getCreatorVideos('creator-123')

      // Assert
      expect(result.videos).toEqual(mockVideos)
      expect(mockQuery.eq).toHaveBeenCalledWith('creator_id', 'creator-123')
    })
  })

  describe('getPublicVideos', () => {
    it('should return public videos', async () => {
      // Arrange
      const mockVideos = [mockVideoWithCreator]
      const options: GetVideosOptions = { limit: 10, page: 1 }

      mockQuery.then = jest.fn().mockImplementation((callback) =>
        callback({ data: mockVideos, error: null, count: 1 })
      )

      // Act
      const result = await getPublicVideos(options)

      // Assert
      expect(result.videos).toEqual(mockVideos)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
    })
  })

  describe('getCreatorDashboardStats', () => {
    it('should return dashboard stats', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation((table) => ({
        select: jest.fn().mockResolvedValue({ count: 10, error: null })
      }))

      // Act
      const result = await getCreatorDashboardStats('creator-123')

      // Assert
      expect(result.totalVideos).toBe(10)
      expect(result.totalViews).toBe(10)
      expect(result.totalLikes).toBe(10)
      expect(result.totalComments).toBe(10)
    })
  })

  describe('getVideoCategories', () => {
    it('should return video categories', async () => {
      // Act
      const result = await getVideoCategories()

      // Assert
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('getTrendingVideos', () => {
    it('should return trending videos', async () => {
      // Arrange
      const mockTrendingVideos = [mockVideoWithCreator]
      mockQuery.then = jest.fn().mockImplementation((callback) =>
        callback({ data: mockTrendingVideos, error: null })
      )

      // Act
      const result = await getTrendingVideos(5)

      // Assert
      expect(result).toEqual(mockTrendingVideos)
      expect(mockQuery.limit).toHaveBeenCalledWith(5)
    })
  })
})