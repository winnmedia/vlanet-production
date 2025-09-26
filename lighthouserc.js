module.exports = {
  ci: {
    // Build 설정
    collect: {
      // Lighthouse가 테스트할 URL들
      url: [
        'http://localhost:3000',
        'http://localhost:3000/upload',
        'http://localhost:3000/video/sample-id',
      ],
      // 시작 서버 명령어
      startServerCommand: 'pnpm start',
      // 서버 준비 시간 (ms)
      startServerReadyPattern: 'ready on',
      // 테스트 실행 횟수 (정확성을 위해)
      numberOfRuns: 3,
      // 설정
      settings: {
        // Chrome 플래그
        chromeFlags: '--no-sandbox --headless --disable-dev-shm-usage',
        // 폼 팩터 설정
        preset: 'desktop',
        // 확장 감사 포함
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },

    // 성능 예산 설정
    assert: {
      assertions: {
        // Core Web Vitals 임계값
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // 성능 점수
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // 리소스 크기 제한
        'resource-summary:document:size': ['error', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:script:size': ['error', { maxNumericValue: 300000 }], // 300KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:image:size': ['error', { maxNumericValue: 200000 }], // 200KB

        // 네트워크 요청 수 제한
        'resource-summary:total:count': ['warn', { maxNumericValue: 50 }],

        // 접근성 검사
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',

        // SEO 검사
        'document-title': 'error',
        'meta-description': 'error',
        'viewport': 'error',

        // 보안 검사
        'is-on-https': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'uses-https': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      },
    },

    // 업로드 설정 (선택사항)
    upload: {
      target: 'temporary-public-storage',
      // GitHub Actions에서 사용할 경우
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    // 서버 설정 (Lighthouse CI Server 사용 시)
    server: {
      port: 9001,
      // 보관할 빌드 수
      maxBuilds: 50,
    },

    // 위자드 설정
    wizard: {
      // GitHub integration 설정
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
  },
};

// 환경별 설정
if (process.env.NODE_ENV === 'production') {
  module.exports.ci.collect.url = [
    process.env.NEXT_PUBLIC_APP_URL || 'https://vlanet.net',
    `${process.env.NEXT_PUBLIC_APP_URL}/upload`,
    `${process.env.NEXT_PUBLIC_APP_URL}/video/sample-id`,
  ];

  // 프로덕션에서는 더 엄격한 성능 기준 적용
  module.exports.ci.assert.assertions = {
    ...module.exports.ci.assert.assertions,
    'categories:performance': ['error', { minScore: 0.85 }],
    'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
  };
}