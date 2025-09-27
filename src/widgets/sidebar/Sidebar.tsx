/**
 * 사이드바 네비게이션 위젯
 * 역할별 메뉴와 마우스오버 확장 기능 제공
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  BarChart3,
  MessageSquare,
  Settings,
  Search,
  Briefcase,
  Send,
  TrendingUp,
  ChevronRight,
  Home,
  FileVideo,
  Eye,
  Lock,
  FileText,
  PieChart,
  Zap,
  Heart,
  Users,
  DollarSign,
  CheckCircle2,
  X,
  Menu,
} from 'lucide-react';
import { Logo } from '../../shared/ui/logo';
import type { UserRole } from '../../entities/user';

export interface SidebarProps {
  userRole: UserRole;
  className?: string;
  isMobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  children?: MenuItem[];
  active?: boolean;
}

/**
 * Creator용 메뉴 구성
 */
const CREATOR_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'my-videos',
    label: '내 영상',
    icon: Video,
    href: '/dashboard/videos',
    children: [
      {
        id: 'all-videos',
        label: '전체 보기',
        icon: FileVideo,
        href: '/dashboard/videos',
      },
      {
        id: 'public-videos',
        label: '공개 영상',
        icon: Eye,
        href: '/dashboard/videos?status=public',
      },
      {
        id: 'private-videos',
        label: '비공개 영상',
        icon: Lock,
        href: '/dashboard/videos?status=private',
      },
      {
        id: 'draft-videos',
        label: '초안',
        icon: FileText,
        href: '/dashboard/videos?status=draft',
      },
    ],
  },
  {
    id: 'analytics',
    label: '통계 분석',
    icon: BarChart3,
    href: '/dashboard/analytics',
    children: [
      {
        id: 'views-analytics',
        label: '조회수 분석',
        icon: Eye,
        href: '/dashboard/analytics/views',
      },
      {
        id: 'revenue-report',
        label: '수익 리포트',
        icon: DollarSign,
        href: '/dashboard/analytics/revenue',
      },
      {
        id: 'trend-analysis',
        label: '트렌드 분석',
        icon: TrendingUp,
        href: '/dashboard/analytics/trends',
      },
    ],
  },
  {
    id: 'funding',
    label: '펀딩 관리',
    icon: MessageSquare,
    href: '/dashboard/proposals',
    children: [
      {
        id: 'received-proposals',
        label: '받은 제안',
        icon: MessageSquare,
        href: '/dashboard/proposals?filter=received',
      },
      {
        id: 'in-progress',
        label: '진행중',
        icon: Zap,
        href: '/dashboard/proposals?filter=in-progress',
      },
      {
        id: 'completed',
        label: '완료된 거래',
        icon: CheckCircle2,
        href: '/dashboard/proposals?filter=completed',
      },
    ],
  },
  {
    id: 'messages',
    label: '메시지함',
    icon: MessageSquare,
    href: '/messages',
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    href: '/settings',
  },
];

/**
 * Funder용 메뉴 구성
 */
const FUNDER_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'explore',
    label: '영상 탐색',
    icon: Search,
    href: '/explore',
    children: [
      {
        id: 'trending',
        label: '트렌딩',
        icon: TrendingUp,
        href: '/explore?filter=trending',
      },
      {
        id: 'categories',
        label: '카테고리별',
        icon: PieChart,
        href: '/explore?filter=categories',
      },
      {
        id: 'recommended',
        label: '추천 영상',
        icon: Heart,
        href: '/explore?filter=recommended',
      },
    ],
  },
  {
    id: 'portfolio',
    label: '포트폴리오',
    icon: Briefcase,
    href: '/portfolio',
    children: [
      {
        id: 'watchlist',
        label: '관심 목록',
        icon: Heart,
        href: '/portfolio?tab=watchlist',
      },
      {
        id: 'investments-progress',
        label: '투자 진행중',
        icon: Zap,
        href: '/portfolio?tab=in-progress',
      },
      {
        id: 'investments-completed',
        label: '투자 완료',
        icon: CheckCircle2,
        href: '/portfolio?tab=completed',
      },
    ],
  },
  {
    id: 'proposals',
    label: '제안 관리',
    icon: Send,
    href: '/proposals',
    children: [
      {
        id: 'sent-proposals',
        label: '보낸 제안',
        icon: Send,
        href: '/proposals?filter=sent',
      },
      {
        id: 'pending-response',
        label: '응답 대기',
        icon: MessageSquare,
        href: '/proposals?filter=pending',
      },
      {
        id: 'accepted',
        label: '수락됨',
        icon: CheckCircle2,
        href: '/proposals?filter=accepted',
      },
    ],
  },
  {
    id: 'investment-analysis',
    label: '투자 분석',
    icon: BarChart3,
    href: '/investment-analysis',
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    href: '/settings',
  },
];

/**
 * 메뉴 아이템 컴포넌트
 */
function MenuItem({
  item,
  isExpanded,
  pathname,
}: {
  item: MenuItem;
  isExpanded: boolean;
  pathname: string;
}) {
  const [isChildrenOpen, setIsChildrenOpen] = useState(false);
  const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren && isExpanded) {
      setIsChildrenOpen(!isChildrenOpen);
    }
  };

  return (
    <div>
      {/* 메인 아이템 */}
      <div
        className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-primary-50 ${
          isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:text-primary-600'
        }`}
        onClick={handleClick}
      >
        <Link href={item.href} className="flex items-center flex-1 min-w-0">
          <item.icon
            size={20}
            className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-primary-500'}`}
          />
          {isExpanded && (
            <>
              <span className="ml-3 truncate">{item.label}</span>
              {hasChildren && (
                <ChevronRight
                  size={16}
                  className={`ml-auto flex-shrink-0 transition-transform ${
                    isChildrenOpen ? 'transform rotate-90' : ''
                  }`}
                />
              )}
            </>
          )}
        </Link>
      </div>

      {/* 자식 아이템들 */}
      {hasChildren && isExpanded && isChildrenOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children!.map((child) => (
            <Link
              key={child.id}
              href={child.href}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                pathname === child.href
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-500 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <child.icon size={16} className="flex-shrink-0 mr-3" />
              <span className="truncate">{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 사이드바 메인 컴포넌트
 */
export function Sidebar({ userRole, className, isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  const menuItems = userRole === 'CREATOR' ? CREATOR_MENU_ITEMS : FUNDER_MENU_ITEMS;

  // 화면 크기 변화 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일에서 메뉴 항목 클릭 시 사이드바 닫기
  const handleMobileMenuClick = () => {
    if (onMobileToggle && isMobile) {
      onMobileToggle(false);
    }
  };

  // ESC 키로 모바일 사이드바 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileOpen && onMobileToggle) {
        onMobileToggle(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileToggle]);

  return (
    <>
      {/* 모바일 백드롭 오버레이 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => onMobileToggle?.(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-secondary-200 shadow-sm transition-all duration-300 ease-in-out z-40 ${
          isMobile
            ? (isMobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full')
            : (isExpanded ? 'w-60' : 'w-16')
        } ${className}`}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
        role="complementary"
        aria-label="사이드바 네비게이션"
        aria-hidden={isMobile && !isMobileOpen}
      >
      {/* 로고 영역 */}
      <div className="flex items-center h-16 border-b border-secondary-200 px-4">
        {/* 모바일 닫기 버튼 */}
        {isMobile && (
          <button
            onClick={() => onMobileToggle?.(false)}
            className="mr-3 p-2 hover:bg-secondary-100 rounded-lg lg:hidden"
            aria-label="사이드바 닫기"
            type="button"
          >
            <X size={20} className="text-secondary-600" />
          </button>
        )}

        <div className="flex-1 flex justify-center lg:justify-start">
          {(isExpanded && !isMobile) || isMobile ? (
            <Logo variant="full" theme="color" size="sm" />
          ) : (
            <Logo variant="icon" theme="color" size="sm" />
          )}
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav
        className="flex-1 px-2 py-4 space-y-1 overflow-y-auto"
        aria-label="주요 네비게이션"
        role="navigation"
      >
        {menuItems.map((item) => (
          <div key={item.id} onClick={handleMobileMenuClick}>
            <MenuItem
              item={item}
              isExpanded={(isExpanded && !isMobile) || isMobile}
              pathname={pathname}
            />
          </div>
        ))}
      </nav>

      {/* 사용자 정보 (하단) */}
      <div className="border-t border-secondary-200 p-2">
        <div className={`flex items-center px-2 py-3 ${
          (isExpanded && !isMobile) || isMobile ? 'justify-start' : 'justify-center'
        }`}>
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 text-sm font-semibold">U</span>
          </div>
          {((isExpanded && !isMobile) || isMobile) && (
            <div className="ml-3 min-w-0">
              <div className="text-sm font-medium text-secondary-900 truncate">
                사용자
              </div>
              <div className="text-xs text-secondary-500 truncate">
                {userRole === 'CREATOR' ? '창작자' : '투자자'}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}