/**
 * 대시보드 레이아웃
 * 사이드바가 포함된 대시보드 페이지들의 공통 레이아웃
 */

import { getCurrentUser } from '@/features/auth';
import { redirect } from 'next/navigation';
import { DashboardLayoutClient } from './DashboardLayoutClient';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  // 인증되지 않은 사용자 리디렉션
  if (!user) {
    redirect('/login');
  }

  // 프로필이 없는 경우 온보딩으로 리디렉션
  if (!user.profile) {
    redirect('/onboarding');
  }

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}