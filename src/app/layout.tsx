import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SkipLink } from '../shared/lib/accessibility';
import { initWebVitals } from '../shared/lib/performance/web-vitals';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | VLANET',
    default: 'VLANET - AI 창작물이 비즈니스로 진화하는 곳',
  },
  description: '당신의 AI 작품을 투자 기회로 연결하는 국내 최초 플랫폼',
  keywords: ['AI', '창작', '투자', '영상', '콘텐츠', 'IP'],
  authors: [{ name: 'VLANET Team' }],
  creator: 'VLANET',
  publisher: 'VLANET',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'VLANET - AI 창작물이 비즈니스로 진화하는 곳',
    description: '당신의 AI 작품을 투자 기회로 연결하는 국내 최초 플랫폼',
    siteName: 'VLANET',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VLANET - AI 창작물이 비즈니스로 진화하는 곳',
    description: '당신의 AI 작품을 투자 기회로 연결하는 국내 최초 플랫폼',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// 클라이언트 컴포넌트로 Web Vitals 초기화
function WebVitalsInitializer() {
  if (typeof window !== 'undefined') {
    initWebVitals();
  }
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full bg-white text-secondary-900 antialiased`}>
        {/* Skip Link - 키보드 사용자를 위한 메인 콘텐츠 바로가기 */}
        <SkipLink />

        {/* Web Vitals 성능 모니터링 초기화 */}
        <WebVitalsInitializer />

        {/* 메인 애플리케이션 */}
        <div id="root">
          {children}
        </div>

        {/* 메인 콘텐츠 마크업 (접근성을 위한 랜드마크) */}
        <div id="main-content" tabIndex={-1} className="sr-only">
          메인 콘텐츠 시작
        </div>
      </body>
    </html>
  );
}