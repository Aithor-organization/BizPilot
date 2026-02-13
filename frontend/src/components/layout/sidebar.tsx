'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Users,
  FileText,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/cs', label: '고객 지원', icon: MessageSquare },
  { href: '/reservations', label: '예약 관리', icon: CalendarDays },
  { href: '/customers', label: '고객 CRM', icon: Users },
  { href: '/invoices', label: '견적/계산서', icon: FileText },
  { href: '/reports', label: '리포트', icon: BarChart3 },
  { href: '/hr', label: '직원 관리', icon: UserCog },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="bg-sidebar fixed left-0 top-0 z-40 flex h-screen w-64 flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-surface-200 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
            BP
          </div>
          <span className="text-lg font-bold text-surface-900">BizPilot</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-800 shadow-xs'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-surface-800',
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-brand-700')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-surface-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-800">
            {user?.name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-surface-900">{user?.name || user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
