/**
 * 클라이언트 헤더 컴포넌트
 * 네비게이션 및 사용자 인터액션 처리
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '../../shared/ui/logo';
import { Button } from '../../shared/ui/button';
import { getCurrentUser } from '../../features/auth';
import { SearchModal } from '../search';
import { ProfileDropdown } from '../profile-dropdown';
import { Search, Bell, Menu } from 'lucide-react';

interface ClientHeaderProps {
  className?: string;
  user?: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  onMobileMenuToggle?: () => void;
}

/**
 * 클라이언트 헤더 컴포넌트 (검색 모달 포함)
 */
export function ClientHeader({ user, className, onMobileMenuToggle }: ClientHeaderProps) {
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
              <Link href="/">
                <Logo variant="full" theme="color" size="md" />
              </Link>
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
                    <Link href="/" className="text-secondary-700 hover:text-primary-600 transition-colors">
                      홈
                    </Link>
                    <Link href="/explore" className="text-secondary-700 hover:text-primary-600 transition-colors">
                      탐색
                    </Link>
                    {user.profile?.role === 'CREATOR' && (
                      <>
                        <Link href="/upload" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          업로드
                        </Link>
                        <Link href="/dashboard" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          대시보드
                        </Link>
                      </>
                    )}
                    {user.profile?.role === 'FUNDER' && (
                      <>
                        <Link href="/dashboard/funder" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          투자 대시보드
                        </Link>
                        <Link href="/dashboard/proposals" className="text-secondary-700 hover:text-primary-600 transition-colors">
                          제안 관리
                        </Link>
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
                  <Link href="/login">
                    <Button variant="outline" size="sm">로그인</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="primary" size="sm">시작하기</Button>
                  </Link>
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