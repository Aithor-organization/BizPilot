'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { reportApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const { tenantId } = useAuth();
  const [period, setPeriod] = useState('month');

  const now = new Date();
  const startDate = period === 'month'
    ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    : new Date(now.getFullYear(), 0, 1).toISOString();
  const endDate = now.toISOString();

  const { data: summary } = useQuery({
    queryKey: ['report-summary', tenantId, startDate, endDate],
    queryFn: () => reportApi.getSummary(tenantId!, { startDate, endDate }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: categoryData } = useQuery({
    queryKey: ['report-category', tenantId, startDate, endDate],
    queryFn: () => reportApi.getByCategory(tenantId!, { startDate, endDate }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: trendData } = useQuery({
    queryKey: ['report-trend', tenantId],
    queryFn: () => reportApi.getTrend(tenantId!, { months: 6 }).then((r) => r.data),
    enabled: !!tenantId,
  });

  // Recharts data transformation
  const trendChartData = trendData?.map((t: any) => ({
    month: t.month,
    매출: t.income || 0,
    지출: Math.abs(t.expense || 0),
  })) || [];

  const pieChartData = categoryData
    ?.filter((c: any) => c.type === 'INCOME')
    .map((c: any) => ({ name: c.category, value: Math.abs(c.amount) })) || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">매출 리포트</h1>
          <p className="mt-1 text-sm text-surface-500">매출과 지출을 분석하세요.</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="month">이번 달</option>
          <option value="year">올해</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">매출</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary?.totalIncome ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">지출</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(summary?.totalExpense ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">순이익</p>
              <p className="text-xl font-bold text-brand-700">{formatCurrency(summary?.netProfit ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="card-surface p-6">
          <h3 className="text-lg font-semibold text-surface-900">카테고리별 분석</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="mt-4 space-y-3">
              {categoryData?.map((c: Record<string, unknown>) => {
                const maxAmount = Math.max(...(categoryData?.map((d: Record<string, unknown>) => Math.abs(d.amount as number)) || [1]));
                const width = Math.max(5, (Math.abs(c.amount as number) / maxAmount) * 100);
                return (
                  <div key={c.category as string}>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-700">{c.category as string}</span>
                      <span className={`font-medium ${(c.type as string) === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(c.amount as number)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-surface-100">
                      <div
                        className={`h-2 rounded-full ${(c.type as string) === 'INCOME' ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!categoryData?.length && <p className="text-sm text-surface-400">데이터가 없습니다.</p>}
            </div>
          )}
        </div>

        {/* Trend Bar Chart */}
        <div className="card-surface p-6">
          <h3 className="text-lg font-semibold text-surface-900">월별 추세 (최근 6개월)</h3>
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="매출" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="mt-4">
              {trendData?.map((t: Record<string, unknown>) => (
                <div key={t.month as string} className="flex items-center gap-4 mb-2">
                  <span className="w-16 text-sm text-surface-500">{t.month as string}</span>
                  <div className="flex-1">
                    <div className="flex gap-1">
                      <div className="h-4 rounded bg-green-400" style={{ width: `${Math.max(2, ((t.income as number) / Math.max(1, (t.income as number) + Math.abs(t.expense as number))) * 100)}%` }} />
                      <div className="h-4 rounded bg-red-400" style={{ width: `${Math.max(2, (Math.abs(t.expense as number) / Math.max(1, (t.income as number) + Math.abs(t.expense as number))) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-surface-500">{formatCurrency((t.income as number) + (t.expense as number))}</span>
                </div>
              ))}
              {!trendData?.length && <p className="text-sm text-surface-400">데이터가 없습니다.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
