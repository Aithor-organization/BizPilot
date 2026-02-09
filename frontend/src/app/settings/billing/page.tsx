'use client';

import { CreditCard, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">결제/크레딧</h1>
      <p className="mt-1 text-sm text-gray-500">크레딧 잔액과 결제 내역을 확인하세요.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Coins className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">크레딧 잔액</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이번 달 사용량</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">결제 수단</p>
              <p className="text-lg font-bold text-gray-900">미등록</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">크레딧 충전</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[10000, 30000, 50000, 100000].map((amount) => (
            <button
              key={amount}
              className="rounded-xl border bg-white p-4 text-center hover:border-brand-300 hover:bg-brand-50 transition-all"
            >
              <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
              <p className="text-sm text-gray-500">충전</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">결제 내역</h2>
        <div className="mt-4 rounded-xl border bg-white">
          <div className="flex flex-col items-center justify-center py-12">
            <ArrowDownRight className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-400">결제 내역이 없습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
