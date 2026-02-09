'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { crmApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Phone, Mail, CalendarDays, FileText, MessageSquare } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();

  const { data: customer } = useQuery({
    queryKey: ['customer', tenantId, id],
    queryFn: () => crmApi.get(tenantId!, id).then((r) => r.data),
    enabled: !!tenantId && !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['customer-history', tenantId, id],
    queryFn: () => crmApi.getHistory(tenantId!, id).then((r) => r.data),
    enabled: !!tenantId && !!id,
  });

  if (!customer) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  const typeIcons: Record<string, React.ReactNode> = {
    RESERVATION: <CalendarDays className="h-4 w-4 text-blue-500" />,
    INVOICE: <FileText className="h-4 w-4 text-green-500" />,
    CONTACT: <MessageSquare className="h-4 w-4 text-purple-500" />,
  };

  return (
    <div>
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="mt-2 flex gap-4 text-sm text-gray-500">
              {customer.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{customer.email}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {customer.tags?.map((tag: string) => (
                <span key={tag} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{tag}</span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">누적 결제</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
            <p className="text-sm text-gray-500">{customer.totalVisits}회 방문</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">활동 이력</h2>
        <div className="mt-4 space-y-3">
          {history?.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-white px-5 py-4">
              <div className="mt-0.5">{typeIcons[item.type as string] || <MessageSquare className="h-4 w-4 text-gray-400" />}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.description as string}</p>
                <p className="text-xs text-gray-500">{formatDateTime(item.date as string)}</p>
              </div>
              {item.amount !== undefined && (
                <span className={`text-sm font-semibold ${(item.amount as number) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(item.amount as number)}
                </span>
              )}
            </div>
          ))}
          {!history?.length && <p className="py-8 text-center text-gray-400">활동 이력이 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
