/**
 * Lighthouse CI 설정
 * 성능 예산 및 품질 게이트 설정
 */

module.exports = {
  ci: {
    // 수집 설정
    collect: {
      // 로컬 서버에서 테스트할 URL들
      url: [
        'http://localhost:3000',
        'http://localhost:3000/videos',
        'http://localhost:3000/upload',
        'http://localhost:3000/dashboard',
      ],
      // 테스트 실행 횟수 (일관성을 위해)
      numberOfRuns: 3,
      // 설정
      settings: {
        // 모바일 디바이스 시뮬레이션
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // 성능 측정을 위한 네트워크 시뮬레이션
        throttling: {
          rttMs: 40,
          throughputKbps: 1024,
          cpuSlowdownMultiplier: 1,
        },
      },
    },

    // 업로드 설정 (Vercel 등에서 사용)
    upload: {
      target: 'temporary-public-storage',
    },

    // 성능 예산 및 assertion 설정
    assert: {
      assertions: {
        // Core Web Vitals 임계값
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // 세부 메트릭
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],

        // 리소스 크기 제한
        'total-byte-weight': ['warn', { maxNumericValue: 1000000 }], // 1MB
        'unused-javascript': ['warn', { maxNumericValue: 100000 }], // 100KB

        // 접근성
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',

        // 보안
        'is-on-https': 'error',
        'external-anchors-use-rel-noopener': 'error',
      },
    },

    // 서버 설정 (선택사항)
    server: {
      port: 9009,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
  },
};