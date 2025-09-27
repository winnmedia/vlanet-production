/**
 * 프로필 드롭다운 메뉴 컴포넌트
 * 사용자 정보 및 빠른 액션 제공
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Settings,
  BarChart3,
  Upload,
  Briefcase,
  LogOut,
  ChevronDown,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { Card } from '../../shared/ui/card';
import { signOut } from '../../features/auth';
import { ROLE_LABELS, type UserRole } from '../../entities/user';
import type { getCurrentUser } from '../../features/auth';

interface ProfileDropdownProps {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  className?: string;
}

export function ProfileDropdown({ user, className }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMenuItemClick = (href: string) => {
    window.location.href = href;
    setIsOpen(false);
  };

  const menuItems = [
    // 공통 메뉴
    {
      icon: User,
      label: '내 프로필',
      href: '/profile',
      description: '프로필 정보 보기 및 수정'
    },
    {
      icon: Settings,
      label: '설정',
      href: '/settings',
      description: '계정 및 알림 설정'
    },

    // 역할별 메뉴
    ...(user.profile?.role === 'CREATOR' ? [
      {
        icon: BarChart3,
        label: '대시보드',
        href: '/dashboard',
        description: '내 영상 및 통계 관리'
      },
      {
        icon: Upload,
        label: '영상 업로드',
        href: '/upload',
        description: '새로운 영상 업로드'
      }
    ] : []),

    ...(user.profile?.role === 'FUNDER' ? [
      {
        icon: Briefcase,
        label: '투자 포트폴리오',
        href: '/portfolio',
        description: '투자 현황 및 수익 관리'
      },
      {
        icon: BarChart3,
        label: '투자 분석',
        href: '/analytics',
        description: '투자 성과 분석'
      }
    ] : []),

    // 하단 메뉴
    {
      divider: true
    },
    {
      icon: HelpCircle,
      label: '도움말',
      href: '/help',
      description: '자주 묻는 질문 및 지원'
    },
    {
      icon: Shield,
      label: '개인정보 보호',
      href: '/privacy',
      description: '개인정보 처리방침'
    }
  ];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 p-1 rounded-lg transition-colors ${
          isOpen
            ? 'bg-primary-50 ring-2 ring-primary-200'
            : 'hover:bg-secondary-50'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="프로필 메뉴 열기"
        type="button"
      >
        {/* 사용자 정보 (데스크톱) */}
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-secondary-900 truncate max-w-32">
            {user.profile?.username || user.email}
          </div>
          {user.profile?.role && (
            <div className="text-xs text-secondary-500">
              {ROLE_LABELS[user.profile.role as UserRole]}
            </div>
          )}
        </div>

        {/* 프로필 아바타 */}
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          {user.profile?.avatar_url ? (
            <Image
              src={user.profile.avatar_url}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full object-cover"
              priority={true}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          ) : (
            <span className="text-primary-600 text-sm font-semibold">
              {(user.profile?.username || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* 드롭다운 화살표 */}
        <ChevronDown
          size={16}
          className={`text-secondary-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <Card
          className="absolute right-0 top-full mt-2 w-72 bg-white shadow-lg border border-secondary-200 z-50"
          role="menu"
          aria-label="프로필 메뉴"
        >
          {/* 헤더 */}
          <div className="p-4 border-b border-secondary-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                {user.profile?.avatar_url ? (
                  <Image
                    src={user.profile.avatar_url}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                ) : (
                  <span className="text-primary-600 text-lg font-semibold">
                    {(user.profile?.username || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-secondary-900 truncate">
                  {user.profile?.username || 'Anonymous'}
                </div>
                <div className="text-sm text-secondary-600 truncate">
                  {user.email}
                </div>
                {user.profile?.role && (
                  <div className="inline-flex items-center px-2 py-1 mt-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                    {ROLE_LABELS[user.profile.role as UserRole]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메뉴 항목 */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              if ('divider' in item) {
                return (
                  <div key={index} className="my-2 border-t border-secondary-100" />
                );
              }

              const IconComponent = item.icon;

              return (
                <button
                  key={index}
                  onClick={() => handleMenuItemClick(item.href)}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-secondary-50 transition-colors group"
                  role="menuitem"
                  type="button"
                >
                  <div className="flex-shrink-0 mr-3">
                    <IconComponent size={16} className="text-secondary-500 group-hover:text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-secondary-900 group-hover:text-primary-700">
                      {item.label}
                    </div>
                    <div className="text-xs text-secondary-500 truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 로그아웃 버튼 */}
          <div className="p-3 border-t border-secondary-100">
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full justify-start text-danger-600 border-danger-200 hover:bg-danger-50 hover:border-danger-300"
              >
                <LogOut size={16} className="mr-2" />
                로그아웃
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}