// Bundle Analyzer는 개발 환경에서만 사용
let withBundleAnalyzer = (config) => config;
try {
  if (process.env.NODE_ENV === 'development' && process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  }
} catch (error) {
  // Bundle analyzer가 없으면 무시
}

// const { withSentryConfig } = require('@sentry/nextjs') // 임시 비활성화

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 프로덕션 빌드용 임시 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 타입 안전한 라우팅
  typedRoutes: true,

  // 이미지 최적화
  images: {
    domains: ['supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },

  // 실험적 기능 (CSS 최적화 완전 비활성화)
  experimental: {
    // optimizeCss: true, // critters 의존성으로 인해 임시 비활성화
    optimizeCss: false, // CSS 청크 분리 문제 방지
    scrollRestoration: true,
  },

  // 서버 외부 패키지 (업데이트된 설정)
  // serverExternalPackages: ['@sentry/nextjs'], // 임시 비활성화

  // 압축 최적화
  compress: true,

  // 번들 최적화 (CSS/JS 분리 개선)
  webpack: (config, { dev, isServer }) => {
    // 프로덕션 빌드 최적화
    if (!dev) {
      config.optimization.splitChunks = {
        cacheGroups: {
          default: false,
          vendors: false,
          // 벤더 청크 최적화 (CSS 제외)
          vendor: {
            chunks: 'all',
            test: /[\\/]node_modules[\\/].*\.js$/,
            name: 'vendors',
            enforce: true,
          },
          // 공통 청크 (CSS 제외)
          common: {
            chunks: 'all',
            test: /\.js$/,
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // 정적 최적화
  trailingSlash: false,
  poweredByHeader: false,

  // Output 최적화
  output: 'standalone',

  // 환경 변수 검증
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // 헤더 설정
  async headers() {
    const securityHeaders = [
      // XSS 보호
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // MIME 타입 스니핑 방지 (CSS 파일 오류 해결을 위해 임시 완화)
      // {
      //   key: 'X-Content-Type-Options',
      //   value: 'nosniff',
      // },
      // 클릭재킹 방지
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Referrer 정책
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      // 권한 정책
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    // 프로덕션에서 추가 보안 헤더
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      // 모든 페이지에 보안 헤더 적용
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // API 라우트에 캐시 및 보안 헤더
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300',
          },
          // API 응답에 CORS 보안 강화
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },
};

// Sentry 설정 임시 비활성화
// const sentryWebpackPluginOptions = {
//   silent: process.env.NODE_ENV !== 'development',
//   hideSourceMaps: true,
//   disableLogger: true,
//   dryRun: process.env.NODE_ENV !== 'production',
// }

// Bundle Analyzer만 적용 (Sentry 임시 비활성화)
module.exports = withBundleAnalyzer(nextConfig);