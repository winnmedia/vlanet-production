/**
 * 헤더 위젯
 * 네비게이션 및 사용자 정보 표시
 */

'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { getCurrentUser } from '@/features/auth';
import { SearchModal } from '@/widgets/search';
import { ProfileDropdown } from '@/widgets/profile-dropdown';
import { Search, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  className?: string;
  user?: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  onMobileMenuToggle?: () => void;
}

/**
 * 클라이언트 헤더 컴포넌트 (검색 모달 포함)
 */
function ClientHeader({ user, className, onMobileMenuToggle }: HeaderProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // 검색 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchModalOpen(true);
    window.addEventListener('openSearchModal', handleOpenSearch);
    return () => window.removeEventListener('openSearchModal', handleOpenSearch);
  }, []);

  return (
    <>
      <header className={`border-b border-secondary-200 bg-white/80 backdrop-blur-sm ${className}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 햄버거 메뉴 (모바일용) */}
            {user && (
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 hover:bg-secondary-100 rounded-lg mr-3"
              >
                <Menu size={24} className="text-secondary-700" />
              </button>
            )}

            {/* 로고 */}
            <div className="flex items-center">
              <a href="/">
                <Logo variant="full" theme="color" size="md" />
              </a>
            </div>

            {/* 중앙 검색 */}
            {user && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <Button
                  variant="outline"
                  className="w-full justify-start text-secondary-500 font-normal"
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  <Search size={16} className="mr-2" />
                  검색... (Ctrl+K)
                </Button>
              </div>
            )}

            {/* 네비게이션 & 사용자 정보 */}
            <div className="flex items-center space-x-4">
              {user ? (
                // 인증된 사용자
                <>
                  {/* 모바일 검색 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden p-2"
                    onClick={() => setIsSearchModalOpen(true)}
                  >
                    <Search size={20} />
                  </Button>

                  {/* 네비게이션 메뉴 */}
                  <nav className="hidden lg:flex items-center space-x-6">
                    <a href="/" className="text-secondary-700 hover:text-primary-600 transition-colors">
                      홈
                    </a>
                    {user.profile?.role === 'CREATOR' && (
                      <>
                        <a href="/upload" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          업로드
                        </a>
                        <a href="/dashboard" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          대시보드
                        </a>
                      </>
                    )}
                    {user.profile?.role === 'FUNDER' && (
                      <>
                        <a href="/explore" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          탐색
                        </a>
                        <a href="/portfolio" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          포트폴리오
                        </a>
                      </>
                    )}
                  </nav>

                  {/* 알림 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2"
                  >
                    <Bell size={20} />
                    {/* 알림 배지 */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full"></span>
                  </Button>

                  {/* 사용자 프로필 드롭다운 */}
                  <ProfileDropdown user={user} />
                </>
              ) : (
                // 미인증 사용자
                <div className="flex items-center space-x-3">
                  <a href="/login">
                    <Button variant="outline" size="sm">로그인</Button>
                  </a>
                  <a href="/login">
                    <Button variant="primary" size="sm">시작하기</Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 검색 모달 */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}

/**
 * 서버 컴포넌트 헤더 래퍼
 */
export async function Header({ className, onMobileMenuToggle }: { className?: string; onMobileMenuToggle?: () => void }) {
  const user = await getCurrentUser();

  return <ClientHeader user={user} className={className} onMobileMenuToggle={onMobileMenuToggle} />;
}