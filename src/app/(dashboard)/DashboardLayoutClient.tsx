/**
 * 대시보드 레이아웃 클라이언트 컴포넌트
 * 모바일 사이드바 상태 관리
 */

'use client';

import { useState } from 'react';
import { Sidebar } from '../../widgets/sidebar';
import { Header } from '../../widgets/header';
import type { getCurrentUser } from '../../features/auth';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* 사이드바 */}
      <Sidebar
        userRole={user.profile!.role}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={setIsMobileMenuOpen}
      />

      {/* 메인 컴텐츠 영역 */}
      <div className="lg:ml-16 flex flex-col min-h-screen">
        {/* 헤더 (사이드바를 고려한 위치) */}
        <Header
          className="relative z-30"
          onMobileMenuToggle={handleMobileMenuToggle}
        />

        {/* 페이지 컴텐츠 */}
        <main
          id="main-content"
          className="flex-1 focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}