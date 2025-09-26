// Jest 테스트 환경 설정 파일

// Testing Library의 Jest DOM 확장 기능 추가
import '@testing-library/jest-dom'
import 'jest-axe/extend-expect' // 접근성 테스트 확장
import React from 'react'

// Supabase 모킹 설정
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
        limit: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  })),
}))

// React 19 useOptimistic Hook 모킹 (React 18 환경에서 사용)
Object.defineProperty(React, 'useOptimistic', {
  value: jest.fn((initialState, updateFn) => {
    const [state, setState] = React.useState(initialState)
    const setOptimisticState = React.useCallback((action) => {
      setState(updateFn(state, action))
    }, [state, updateFn])
    return [state, setOptimisticState]
  }),
  writable: true,
})

// Next.js 라우터 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Next.js Image 컴포넌트 모킹
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// 브라우저 API 모킹
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// ResizeObserver 모킹 (Chart.js 등에서 필요)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// IntersectionObserver 모킹
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// HTMLVideoElement 모킹 (비디오 플레이어 테스트용)
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
})

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(HTMLVideoElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
})

Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
  writable: true,
  value: NaN,
})

// 콘솔 에러 숨기기 (테스트 중 불필요한 로그 제거)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// MSW 서버 설정 (임시 비활성화)
// import { server } from './src/mocks/server'

// // 모든 테스트 시작 전에 MSW 서버 시작
// beforeAll(() => {
//   server.listen({
//     onUnhandledRequest: 'warn',
//   })
// })

// // 각 테스트 후에 핸들러 초기화
// afterEach(() => {
//   server.resetHandlers()
// })

// // 모든 테스트 완료 후 MSW 서버 종료
// afterAll(() => {
//   server.close()
// })

// 테스트 환경에서의 환경 변수 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001'