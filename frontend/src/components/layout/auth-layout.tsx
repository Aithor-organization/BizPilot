'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-800 border-t-transparent" />
          <span className="text-sm text-surface-400">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-app-surface">
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
