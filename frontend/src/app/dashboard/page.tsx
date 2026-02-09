'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { reportApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CalendarDays, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { tenantId } = useAuth();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', tenantId],
    queryFn: () => reportApi.getDashboard(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const stats = [
    {
      label: '오늘 예약',
      value: dashboard?.todayReservations ?? 0,
      icon: CalendarDays,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: '이번 달 매출',
      value: formatCurrency(dashboard?.monthlyRevenue ?? 0),
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: '전체 고객',
      value: dashboard?.totalCustomers ?? 0,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'AI 자동 응답률',
      value: `${dashboard?.aiResponseRate ?? 0}%`,
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
      <p className="mt-1 text-sm text-gray-500">비즈니스 현황을 한눈에 확인하세요.</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">최근 예약</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.recentReservations?.length ? (
              dashboard.recentReservations.map((r: Record<string, string>) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.customerName || '미등록 고객'}</p>
                    <p className="text-xs text-gray-500">{r.serviceName} - {r.startTime}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {r.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">오늘 예약이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">최근 거래</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.recentTransactions?.length ? (
              dashboard.recentTransactions.map((t: Record<string, string | number>) => (
                <div key={t.id as string} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.description}</p>
                    <p className="text-xs text-gray-500">{t.category}</p>
                  </div>
                  <span className={`text-sm font-semibold ${(t.amount as number) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(t.amount as number)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">최근 거래가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
