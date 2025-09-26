/**
 * User API Test Suite
 * 사용자 API 함수들의 단위 테스트
 */

import {
  getCurrentProfile,
  getProfileById,
  getProfileByUsername,
  createProfile,
  updateProfile,
  completeOnboarding,
  getProfileStatus,
  getProfiles,
  getUserStats
} from '../api'
import type { ProfileInput, ProfileUpdateInput, UserFilters, UserSortOptions, PaginationOptions } from '../types'

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
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  count: jest.fn(),
}

// API 함수들이 사용하는 Supabase 클라이언트 모킹
jest.mock('@/shared/api/supabase/server', () => ({
  createServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
  createServiceClient: jest.fn(() => Promise.resolve({
    ...mockSupabaseClient,
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
        gte: jest.fn().mockResolvedValue({ count: 10, error: null }),
        then: (resolve) => resolve({ count: 10, error: null }),
        catch: () => Promise.resolve({ count: 10, error: null })
      }))
    }))
  })),
}))

// 테스트용 모의 데이터
const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
}

const mockProfile = {
  id: 'user-123',
  username: 'testuser',
  avatar_url: null,
  bio: '테스트 사용자입니다',
  role: 'CREATOR',
  company: null,
  website: null,
  onboarding_completed: true,
  email_verified: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('User API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // 기본적으로 Supabase from() 메서드가 query 객체를 반환하도록 설정
    mockSupabaseClient.from.mockReturnValue(mockQuery)

    // mockQuery를 Promise로 동작하게 설정
    Object.assign(mockQuery, {
      then: jest.fn().mockImplementation((callback) =>
        callback({ data: [mockProfile], error: null, count: 1 })
      ),
      catch: jest.fn()
    })
  })

  describe('getCurrentProfile', () => {
    it('should return current user profile when authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockQuery.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      // Act
      const result = await getCurrentProfile()

      // Assert
      expect(result).toEqual({ profile: mockProfile })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockUser.id)
    })

    it('should return error when user is not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      // Act
      const result = await getCurrentProfile()

      // Assert
      expect(result).toEqual({
        profile: null,
        error: 'Authentication required'
      })
    })

    it('should return null profile when profile does not exist', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      // Act
      const result = await getCurrentProfile()

      // Assert
      expect(result).toEqual({ profile: null })
    })

    it('should handle database errors', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' }
      })

      // Act
      const result = await getCurrentProfile()

      // Assert
      expect(result).toEqual({
        profile: null,
        error: 'Database error'
      })
    })
  })

  describe('getProfileById', () => {
    it('should return profile by ID', async () => {
      // Arrange
      mockQuery.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      // Act
      const result = await getProfileById('user-123')

      // Assert
      expect(result).toEqual({ profile: mockProfile })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('should return null when profile not found', async () => {
      // Arrange
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Act
      const result = await getProfileById('nonexistent-id')

      // Assert
      expect(result).toEqual({ profile: null })
    })
  })

  describe('getProfileByUsername', () => {
    it('should return profile by username', async () => {
      // Arrange
      mockQuery.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      // Act
      const result = await getProfileByUsername('testuser')

      // Assert
      expect(result).toEqual({ profile: mockProfile })
      expect(mockQuery.eq).toHaveBeenCalledWith('username', 'testuser')
    })
  })

  describe('createProfile', () => {
    const profileInput: ProfileInput = {
      username: 'newuser',
      role: 'CREATOR',
      bio: '새로운 사용자',
      company: null,
      website: null
    }

    it('should create profile successfully', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Username availability check
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Profile creation
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockProfile, username: 'newuser' },
        error: null
      })

      // Act
      const result = await createProfile(profileInput)

      // Assert
      expect(result.success).toBe(true)
      expect(result.profile?.username).toBe('newuser')
      expect(mockQuery.insert).toHaveBeenCalled()
    })

    it('should fail when username already exists', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Username already exists
      mockQuery.single.mockResolvedValue({
        data: { id: 'other-user' },
        error: null
      })

      // Act
      const result = await createProfile(profileInput)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Username already exists')
    })

    it('should fail when user is not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      // Act
      const result = await createProfile(profileInput)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
  })

  describe('updateProfile', () => {
    const updateInput: ProfileUpdateInput = {
      bio: '업데이트된 소개',
      website: 'https://example.com'
    }

    it('should update profile successfully', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockQuery.single.mockResolvedValue({
        data: { ...mockProfile, ...updateInput },
        error: null
      })

      // Act
      const result = await updateProfile(updateInput)

      // Assert
      expect(result.success).toBe(true)
      expect(result.profile?.bio).toBe('업데이트된 소개')
      expect(mockQuery.update).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockUser.id)
    })

    it('should fail when user is not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      // Act
      const result = await updateProfile(updateInput)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should check username uniqueness when updating username', async () => {
      // Arrange
      const updateWithUsername = { ...updateInput, username: 'newusername' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Username uniqueness check
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Profile update
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockProfile, username: 'newusername' },
        error: null
      })

      // Act
      const result = await updateProfile(updateWithUsername)

      // Assert
      expect(result.success).toBe(true)
      expect(mockQuery.neq).toHaveBeenCalledWith('id', mockUser.id)
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding successfully', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockQuery.single.mockResolvedValue({
        data: { ...mockProfile, onboarding_completed: true },
        error: null
      })

      // Act
      const result = await completeOnboarding()

      // Assert
      expect(result.success).toBe(true)
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_completed: true
        })
      )
    })
  })

  describe('getProfileStatus', () => {
    it('should return correct status for completed profile', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockQuery.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      // Act
      const result = await getProfileStatus()

      // Assert
      expect(result).toEqual({
        hasProfile: true,
        isOnboardingCompleted: true,
        needsOnboarding: false,
        role: 'CREATOR'
      })
    })

    it('should return correct status for incomplete profile', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockQuery.single.mockResolvedValue({
        data: { ...mockProfile, onboarding_completed: false },
        error: null
      })

      // Act
      const result = await getProfileStatus()

      // Assert
      expect(result).toEqual({
        hasProfile: true,
        isOnboardingCompleted: false,
        needsOnboarding: true,
        role: 'CREATOR'
      })
    })

    it('should return correct status when no profile exists', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      // Act
      const result = await getProfileStatus()

      // Assert
      expect(result).toEqual({
        hasProfile: false,
        isOnboardingCompleted: false,
        needsOnboarding: true,
      })
    })
  })

  describe('getProfiles', () => {
    const mockUsers = [mockProfile]

    it('should return paginated users list', async () => {
      // Arrange
      const pagination: PaginationOptions = { page: 1, limit: 10 }

      // Act
      const result = await getProfiles({}, {}, pagination)

      // Assert
      expect(result.users).toEqual(mockUsers)
      expect(result.totalCount).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.currentPage).toBe(1)
      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(false)
    })

    it('should apply role filter', async () => {
      // Arrange
      const filters: UserFilters = { role: 'CREATOR' }

      // Act
      const result = await getProfiles(filters)

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith('role', 'CREATOR')
    })

    it('should apply search filter', async () => {
      // Arrange
      const filters: UserFilters = { search: 'test' }

      // Act
      await getProfiles(filters)

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith('username.ilike.%test%,bio.ilike.%test%')
    })

    it('should apply sorting', async () => {
      // Arrange
      const sort: UserSortOptions = { field: 'username', direction: 'asc' }

      // Act
      await getProfiles({}, sort)

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('username', { ascending: true })
    })
  })

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      // Act - createServiceClient mock already handles this
      const result = await getUserStats()

      // Assert
      expect(result).toEqual({
        totalCreators: 10,
        totalFunders: 10,
        totalUsers: 10,
        recentSignups: 10
      })
    })

    it('should handle errors gracefully', async () => {
      // Arrange - Mock createServiceClient to throw error
      const mockCreateServiceClient = jest.requireMock('@/shared/api/supabase/server').createServiceClient
      mockCreateServiceClient.mockRejectedValueOnce(new Error('Database error'))

      // Act
      const result = await getUserStats()

      // Assert
      expect(result).toEqual({
        totalCreators: 0,
        totalFunders: 0,
        totalUsers: 0,
        recentSignups: 0
      })

      // Restore mock
      mockCreateServiceClient.mockImplementation(() => Promise.resolve({
        ...mockSupabaseClient,
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
            gte: jest.fn().mockResolvedValue({ count: 10, error: null }),
            then: (resolve) => resolve({ count: 10, error: null }),
            catch: () => Promise.resolve({ count: 10, error: null })
          }))
        }))
      }))
    })
  })
})