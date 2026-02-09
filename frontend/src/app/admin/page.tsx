'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { tenantApi } from '@/lib/api';
import { Shield, Users, Building2, Activity } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();

  const { data: tenants } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => tenantApi.list().then((r) => r.data),
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">접근 권한 없음</h2>
        <p className="mt-2 text-gray-500">관리자 권한이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">관리자</h1>
      <p className="mt-1 text-sm text-gray-500">시스템 전체 현황을 관리합니다.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 테넌트</p>
              <p className="text-2xl font-bold text-gray-900">{tenants?.data?.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 사용자</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">시스템 상태</p>
              <p className="text-lg font-bold text-green-600">정상</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">테넌트 목록</h2>
        <div className="mt-4 space-y-3">
          {tenants?.data?.map((tenant: Record<string, any>) => (
            <div key={tenant.id} className="flex items-center justify-between rounded-xl border bg-white px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.slug} | {tenant.businessType || 'GENERAL'}</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                활성
              </span>
            </div>
          ))}
          {!tenants?.data?.length && (
            <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-12">
              <Building2 className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-gray-400">등록된 테넌트가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
