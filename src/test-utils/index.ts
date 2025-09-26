/**
 * 테스트 유틸리티 함수들
 * 테스트 작성을 위한 헬퍼 함수와 모킹 유틸리티를 제공합니다.
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server, makeEndpointError, simulateNetworkDelay } from '../mocks/server'

// 모의 사용자 데이터
export const mockUsers = {
  creator: {
    id: 'user-1',
    username: 'testcreator',
    avatar_url: null,
    bio: '테스트 창작자입니다',
    role: 'CREATOR' as const,
    company: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  funder: {
    id: 'user-2',
    username: 'testfunder',
    avatar_url: null,
    bio: '테스트 투자자입니다',
    role: 'FUNDER' as const,
    company: 'Test Investment',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  viewer: {
    id: 'user-3',
    username: 'testviewer',
    avatar_url: null,
    bio: '테스트 시청자입니다',
    role: 'VIEWER' as const,
    company: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
} as const

// 모의 영상 데이터
export const mockVideo = {
  id: 'video-1',
  creator_id: 'user-1',
  title: '테스트 AI 영상',
  description: '테스트용 AI 생성 영상입니다',
  video_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  duration: 120,
  file_size: 10485760,
  width: 1920,
  height: 1080,
  genre: ['애니메이션'],
  style: ['카툰'],
  ai_tools: ['Runway Gen-2'],
  tags: ['테스트', 'AI'],
  is_public: true,
  is_featured: false,
  status: 'published' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// 모의 댓글 데이터
export const mockComment = {
  id: 'comment-1',
  user_id: 'user-2',
  video_id: 'video-1',
  parent_id: null,
  content: '정말 훌륭한 작품이네요!',
  created_at: '2024-01-01T01:00:00Z',
  updated_at: '2024-01-01T01:00:00Z',
  author: mockUsers.funder,
}

// 모의 제안 데이터
export const mockProposal = {
  id: 'proposal-1',
  funder_id: 'user-2',
  creator_id: 'user-1',
  video_id: 'video-1',
  subject: '투자 제안드립니다',
  message: '귀하의 작품에 관심이 많습니다. 투자에 관해 논의해보실까요?',
  budget_range: '100만원~500만원',
  timeline: '2개월 내',
  status: 'PENDING' as const,
  responded_at: null,
  response_message: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  unread_messages_count: 0,
  funder: mockUsers.funder,
  creator: mockUsers.creator,
  video: mockVideo,
}

// 커스텀 렌더 함수 (추가적인 context provider가 필요한 경우 사용)
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // 필요시 provider props 추가 가능
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const user = userEvent.setup()

  return {
    user,
    ...render(ui, {
      ...options,
    })
  }
}

// 테스트 유틸리티 함수들
export const testUtils = {
  // 컴포넌트 렌더링
  render: customRender,

  // MSW 서버 제어
  server: {
    makeError: makeEndpointError,
    simulateDelay: simulateNetworkDelay,
    resetHandlers: () => server.resetHandlers(),
  },

  // 시간 관련 유틸리티
  time: {
    // 특정 날짜로 시간 고정
    mockDate: (date: string | Date) => {
      const mockDate = new Date(date)
      jest.useFakeTimers()
      jest.setSystemTime(mockDate)
      return () => jest.useRealTimers()
    },

    // 시간 진행 시뮬레이션
    advanceTime: (ms: number) => {
      jest.advanceTimersByTime(ms)
    },

    // 모든 타이머 실행
    runAllTimers: () => {
      jest.runAllTimers()
    },
  },

  // 폼 관련 유틸리티
  form: {
    // 폼 제출
    submitForm: async (form: HTMLFormElement, user = userEvent.setup()) => {
      await user.click(form.querySelector('button[type="submit"]') as HTMLElement)
    },

    // 입력 필드 채우기
    fillInput: async (
      input: HTMLInputElement | HTMLTextAreaElement,
      value: string,
      user = userEvent.setup()
    ) => {
      await user.clear(input)
      await user.type(input, value)
    },
  },

  // 파일 업로드 관련
  file: {
    // 가짜 비디오 파일 생성
    createMockVideoFile: (name = 'test-video.mp4', size = 1024 * 1024) => {
      return new File(['mock video content'], name, {
        type: 'video/mp4',
        lastModified: Date.now(),
      })
    },

    // 가짜 이미지 파일 생성
    createMockImageFile: (name = 'test-image.jpg', size = 1024) => {
      return new File(['mock image content'], name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
    },
  },

  // 에러 생성 유틸리티
  error: {
    // 네트워크 에러 시뮬레이션
    networkError: (endpoint: string) => makeEndpointError(endpoint, 500),

    // 권한 에러 시뮬레이션
    authError: (endpoint: string) => makeEndpointError(endpoint, 403),

    // 찾을 수 없음 에러 시뮬레이션
    notFoundError: (endpoint: string) => makeEndpointError(endpoint, 404),
  },

  // 대기 유틸리티
  wait: {
    // 특정 조건까지 대기
    forCondition: (condition: () => boolean, timeout = 5000) => {
      return new Promise<void>((resolve, reject) => {
        const start = Date.now()
        const check = () => {
          if (condition()) {
            resolve()
          } else if (Date.now() - start > timeout) {
            reject(new Error('Timeout waiting for condition'))
          } else {
            setTimeout(check, 10)
          }
        }
        check()
      })
    },
  },
}

// 테스트 어설션 헬퍼
export const assertions = {
  // 요소가 화면에 표시되는지 확인
  toBeVisible: (element: HTMLElement) => {
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
  },

  // 요소가 로딩 상태인지 확인
  toBeLoading: (container: HTMLElement) => {
    const loadingElements = container.querySelectorAll('[data-testid="loading"]')
    expect(loadingElements.length).toBeGreaterThan(0)
  },

  // 에러 메시지가 표시되는지 확인
  toShowError: (container: HTMLElement, message?: string) => {
    const errorElements = container.querySelectorAll('[role="alert"], .error-message')
    expect(errorElements.length).toBeGreaterThan(0)

    if (message) {
      const hasMessage = Array.from(errorElements).some(
        el => el.textContent?.includes(message)
      )
      expect(hasMessage).toBe(true)
    }
  },

  // 폼이 유효하지 않은 상태인지 확인
  toBeInvalid: (form: HTMLFormElement) => {
    expect(form.checkValidity()).toBe(false)
  },

  // 폼이 유효한 상태인지 확인
  toBeValid: (form: HTMLFormElement) => {
    expect(form.checkValidity()).toBe(true)
  },
}

// 재사용 가능한 셀렉터
export const selectors = {
  // 공통 UI 요소
  button: (text: string) => `button:has-text("${text}")`,
  link: (text: string) => `a:has-text("${text}")`,
  input: (label: string) => `input[aria-label="${label}"], input[placeholder*="${label}"]`,

  // 특정 컴포넌트
  videoCard: '[data-testid="video-card"]',
  commentItem: '[data-testid="comment-item"]',
  proposalCard: '[data-testid="proposal-card"]',

  // 상태 관련
  loading: '[data-testid="loading"]',
  error: '[role="alert"], .error-message',
  empty: '[data-testid="empty-state"]',
}

// Export everything
export * from '@testing-library/react'
export { userEvent }
export { screen } from '@testing-library/react'