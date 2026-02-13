'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { reportApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CalendarDays, DollarSign, Users, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function DashboardPage() {
  const { tenantId } = useAuth();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', tenantId],
    queryFn: () => reportApi.getDashboard(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-trend', tenantId],
    queryFn: () => reportApi.getTrend(tenantId!, { months: 6 }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const stats = [
    {
      label: '오늘 예약',
      value: dashboard?.todayReservations ?? 0,
      icon: CalendarDays,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-700',
    },
    {
      label: '이번 달 매출',
      value: formatCurrency(dashboard?.monthlyRevenue ?? 0),
      icon: DollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: '전체 고객',
      value: dashboard?.totalCustomers ?? 0,
      icon: Users,
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-700',
    },
    {
      label: 'AI 자동 응답률',
      value: `${dashboard?.aiResponseRate ?? 0}%`,
      icon: TrendingUp,
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-800',
    },
  ];

  const chartData = trendData?.map((t: any) => ({
    month: t.month,
    매출: t.income || 0,
    지출: Math.abs(t.expense || 0),
  })) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">대시보드</h1>
      <p className="mt-1 text-sm text-surface-500">비즈니스 현황을 한눈에 확인하세요.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-surface-500">{stat.label}</p>
                <p className="text-xl font-bold text-surface-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      {chartData.length > 0 && (
        <div className="mt-8 card-surface p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">월별 매출 추세</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} />
              <YAxis tick={{ fontSize: 12, fill: '#737373' }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#262626' }}
              />
              <Legend />
              <Bar dataKey="매출" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-surface-900">최근 예약</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.recentReservations?.length ? (
              dashboard.recentReservations.map((r: Record<string, string>) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{r.customerName || '미등록 고객'}</p>
                    <p className="text-xs text-surface-400">{r.serviceName} - {r.startTime}</p>
                  </div>
                  <span className="rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {r.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-surface-400">오늘 예약이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-surface-900">최근 거래</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.recentTransactions?.length ? (
              dashboard.recentTransactions.map((t: Record<string, string | number>) => (
                <div key={t.id as string} className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{t.description}</p>
                    <p className="text-xs text-surface-400">{t.category}</p>
                  </div>
                  <span className={`text-sm font-semibold ${(t.amount as number) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(t.amount as number)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-surface-400">최근 거래가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
