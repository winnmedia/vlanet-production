/**
 * MSW 서버 설정 (Node.js 환경용)
 * Jest 테스트에서 사용됩니다.
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// MSW 서버 인스턴스 생성
export const server = setupServer(...handlers)

// 서버 시작/종료 유틸리티
export function startServer() {
  server.listen({
    onUnhandledRequest: 'warn', // 처리되지 않은 요청에 대해 경고 표시
  })
}

export function stopServer() {
  server.close()
}

export function resetServer() {
  server.resetHandlers()
}

// 테스트별 핸들러 재정의를 위한 유틸리티
export function overrideHandlers(...newHandlers: Parameters<typeof server.use>) {
  server.use(...newHandlers)
}

// 특정 엔드포인트를 에러로 만드는 유틸리티
export function makeEndpointError(endpoint: string, status: number = 500) {
  const { http, HttpResponse } = require('msw')

  server.use(
    http.get(endpoint, () => {
      return HttpResponse.json(
        { error: 'Test error' },
        { status }
      )
    }),
    http.post(endpoint, () => {
      return HttpResponse.json(
        { error: 'Test error' },
        { status }
      )
    }),
    http.patch(endpoint, () => {
      return HttpResponse.json(
        { error: 'Test error' },
        { status }
      )
    }),
    http.delete(endpoint, () => {
      return HttpResponse.json(
        { error: 'Test error' },
        { status }
      )
    }),
  )
}

// 네트워크 지연 시뮬레이션
export function simulateNetworkDelay(ms: number = 100) {
  const { http, delay } = require('msw')

  server.use(
    http.all('*', async ({ request }) => {
      await delay(ms)
      // 원래 핸들러로 전달
      return undefined
    })
  )
}