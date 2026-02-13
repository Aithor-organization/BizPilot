'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { invoiceApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText } from 'lucide-react';

export default function InvoicesPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ type: '', status: '' });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', tenantId, filter],
    queryFn: () => invoiceApi.list(tenantId!, filter).then((r) => r.data),
    enabled: !!tenantId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoiceApi.updateStatus(tenantId!, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('상태가 변경되었습니다.');
    },
  });

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-surface-100 text-surface-600',
    SENT: 'bg-brand-100 text-brand-800',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-surface-100 text-surface-400',
  };

  const typeLabels: Record<string, string> = {
    ESTIMATE: '견적서', TAX_INVOICE: '세금계산서', RECEIPT: '영수증',
  };
  const statusLabels: Record<string, string> = {
    DRAFT: '작성 중', SENT: '발송됨', PAID: '결제됨', OVERDUE: '연체', CANCELLED: '취소',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">견적/계산서</h1>
          <p className="mt-1 text-sm text-surface-500">견적서와 세금계산서를 관리하세요.</p>
        </div>
        <Link href="/invoices/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> 새 견적서
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">전체 유형</option>
          <option value="ESTIMATE">견적서</option>
          <option value="TAX_INVOICE">세금계산서</option>
          <option value="RECEIPT">영수증</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">전체 상태</option>
          <option value="DRAFT">작성 중</option>
          <option value="SENT">발송됨</option>
          <option value="PAID">결제됨</option>
          <option value="OVERDUE">연체</option>
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {invoices?.data?.map((inv: Record<string, unknown>) => (
          <div key={inv.id as string} className="flex items-center justify-between card-surface px-6 py-4">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-surface-400" />
              <div>
                <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                  {inv.invoiceNumber as string}
                </Link>
                <p className="text-xs text-surface-500">
                  {typeLabels[inv.type as string]} | {inv.customer ? (inv.customer as Record<string, string>).name : '미지정'} | {formatDate(inv.issueDate as string)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-surface-900">{formatCurrency(inv.totalAmount as number)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status as string] || ''}`}>
                {statusLabels[inv.status as string]}
              </span>
              {inv.status === 'DRAFT' && (
                <button onClick={() => statusMutation.mutate({ id: inv.id as string, status: 'SENT' })} className="rounded-lg border px-3 py-1 text-xs text-brand-600 hover:bg-brand-50">
                  발송
                </button>
              )}
              {inv.status === 'SENT' && (
                <button onClick={() => statusMutation.mutate({ id: inv.id as string, status: 'PAID' })} className="rounded-lg border px-3 py-1 text-xs text-green-600 hover:bg-green-50">
                  결제 확인
                </button>
              )}
            </div>
          </div>
        ))}
        {!invoices?.data?.length && (
          <div className="card-surface py-12 text-center text-surface-400">
            견적서/계산서가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
