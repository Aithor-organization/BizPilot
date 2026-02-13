'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { creditApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreditCard, Coins, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery({
    queryKey: ['credit-balance', tenantId],
    queryFn: () => creditApi.getBalance(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: transactions } = useQuery({
    queryKey: ['credit-transactions', tenantId],
    queryFn: () => creditApi.getTransactions(tenantId!, { limit: 20 }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const chargeMutation = useMutation({
    mutationFn: (amount: number) => creditApi.charge(tenantId!, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-balance', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions', tenantId] });
    },
  });

  const monthlyUsage = transactions?.items
    ?.filter((t: any) => t.type === 'DEDUCT')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">결제/크레딧</h1>
      <p className="mt-1 text-sm text-surface-500">크레딧 잔액과 결제 내역을 확인하세요.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="card-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Coins className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">크레딧 잔액</p>
              <p className="text-2xl font-bold text-surface-900">{formatCurrency(balance?.balance ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <ArrowUpRight className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <p className="text-sm text-surface-500">이번 달 사용량</p>
              <p className="text-2xl font-bold text-surface-900">{formatCurrency(monthlyUsage)}</p>
            </div>
          </div>
        </div>
        <div className="card-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">결제 수단</p>
              <p className="text-lg font-bold text-surface-900">미등록</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-surface-900">크레딧 충전</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[10000, 30000, 50000, 100000].map((amount) => (
            <button
              key={amount}
              onClick={() => chargeMutation.mutate(amount)}
              disabled={chargeMutation.isPending}
              className="card-surface p-4 text-center hover:border-brand-300 hover:bg-brand-50 transition-all disabled:opacity-50"
            >
              {chargeMutation.isPending ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-600" />
              ) : (
                <>
                  <p className="text-lg font-bold text-surface-900">{formatCurrency(amount)}</p>
                  <p className="text-sm text-surface-500">충전</p>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-surface-900">결제 내역</h2>
        <div className="mt-4 card-surface">
          {transactions?.items?.length ? (
            <div className="divide-y">
              {transactions.items.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{t.description}</p>
                    <p className="text-xs text-surface-400">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-xs text-surface-400">잔액 {formatCurrency(t.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowDownRight className="h-10 w-10 text-surface-300" />
              <p className="mt-3 text-surface-400">결제 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
