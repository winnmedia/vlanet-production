const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 next.config.js와 .env 파일을 로드합니다
  dir: './',
})

// Jest의 커스텀 설정
const customJestConfig = {
  // 각 테스트 전에 실행할 설정 파일들
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: ['<rootDir>/jest.env.js'],

  // 테스트 환경 설정
  testEnvironment: 'jest-environment-jsdom',

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],

  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*.tsx', // App Router 페이지는 제외
    '!src/**/index.ts', // Public API 파일은 제외
    '!src/**/*.stories.{js,jsx,ts,tsx}', // Storybook 파일 제외
    '!src/mocks/**/*', // Mock 파일 제외
    '!src/test-utils/**/*', // 테스트 유틸리티 제외
    '!src/**/__tests__/**/*', // 테스트 파일 제외
    '!src/**/*.test.{js,jsx,ts,tsx}', // 테스트 파일 제외
  ],

  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // entities 레이어는 더 높은 커버리지 요구
    'src/entities/**/!(index).{js,jsx,ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // shared/lib 레이어도 높은 커버리지 요구
    'src/shared/lib/**/!(index).{js,jsx,ts,tsx}': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // 모듈 경로 매핑 설정
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

// Next.js 설정과 병합하여 Jest 설정 생성
module.exports = createJestConfig(customJestConfig)