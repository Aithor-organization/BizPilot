'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { invoiceApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Printer } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tenantId } = useAuth();

  const { data: invoice } = useQuery({
    queryKey: ['invoice', tenantId, id],
    queryFn: () => invoiceApi.get(tenantId!, id).then((r) => r.data),
    enabled: !!tenantId && !!id,
  });

  if (!invoice) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  const typeLabels: Record<string, string> = { ESTIMATE: '견적서', TAX_INVOICE: '세금계산서', RECEIPT: '영수증' };
  const statusLabels: Record<string, string> = { DRAFT: '작성 중', SENT: '발송됨', PAID: '결제됨', OVERDUE: '연체', CANCELLED: '취소' };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> 목록으로
      </button>

      <div className="card-surface p-8 max-w-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{typeLabels[invoice.type]}</h1>
            <p className="text-lg text-surface-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              {statusLabels[invoice.status]}
            </span>
            <p className="mt-2 text-sm text-surface-500">발행일: {formatDate(invoice.issueDate)}</p>
            {invoice.dueDate && <p className="text-sm text-surface-500">만기일: {formatDate(invoice.dueDate)}</p>}
          </div>
        </div>

        {invoice.customer && (
          <div className="mt-6 rounded-lg bg-surface-50 p-4">
            <p className="text-sm font-medium text-surface-700">고객: {invoice.customer.name}</p>
            {invoice.customer.phone && <p className="text-sm text-surface-500">{invoice.customer.phone}</p>}
          </div>
        )}

        <table className="mt-6 w-full">
          <thead>
            <tr className="border-b text-left text-xs font-medium text-surface-500 uppercase">
              <th className="pb-3">품목</th>
              <th className="pb-3 text-right w-20">수량</th>
              <th className="pb-3 text-right w-28">단가</th>
              <th className="pb-3 text-right w-28">금액</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: Record<string, unknown>) => (
              <tr key={item.id as string} className="border-b">
                <td className="py-3 text-sm">{item.description as string}</td>
                <td className="py-3 text-sm text-right">{item.quantity as number}</td>
                <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice as number)}</td>
                <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.amount as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">공급가액</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.taxAmount > 0 && <div className="flex justify-between"><span className="text-surface-500">세액</span><span>{formatCurrency(invoice.taxAmount)}</span></div>}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>합계</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {invoice.note && (
          <div className="mt-6 rounded-lg bg-surface-50 p-4">
            <p className="text-sm text-surface-600">{invoice.note}</p>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm text-surface-600 hover:bg-surface-50">
            <Printer className="h-4 w-4" /> 인쇄
          </button>
        </div>
      </div>
    </div>
  );
}
