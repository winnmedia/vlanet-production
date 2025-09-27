/**
 * 헤더 위젯
 * 네비게이션 및 사용자 정보 표시
 */

import { getCurrentUser } from '../../features/auth';
import { ClientHeader } from './ClientHeader';


/**
 * 서버 컴포넌트 헤더 래퍼
 */
export async function Header({ className, onMobileMenuToggle }: { className?: string; onMobileMenuToggle?: () => void }) {
  const user = await getCurrentUser();

  return <ClientHeader user={user} className={className} onMobileMenuToggle={onMobileMenuToggle} />;
}