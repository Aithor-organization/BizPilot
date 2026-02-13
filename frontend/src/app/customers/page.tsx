'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { crmApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Phone, Mail } from 'lucide-react';

export default function CustomersPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' });

  const { data: customers } = useQuery({
    queryKey: ['customers', tenantId, search],
    queryFn: () => crmApi.list(tenantId!, { search, limit: 50 }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => crmApi.create(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('고객이 등록되었습니다.');
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', note: '' });
    },
    onError: () => toast.error('고객 등록에 실패했습니다.'),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">고객 CRM</h1>
          <p className="mt-1 text-sm text-surface-500">고객 정보를 관리하고 이력을 추적하세요.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> 고객 등록
        </button>
      </div>

      <div className="mt-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
        <input
          type="text"
          placeholder="이름 또는 전화번호로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm"
        />
      </div>

      {showForm && (
        <div className="mt-4 card-surface p-6">
          <h3 className="text-lg font-semibold">새 고객 등록</h3>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">이름 *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">전화번호</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" placeholder="010-0000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">이메일</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">메모</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">등록</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-surface-600">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6">
        <div className="overflow-hidden card-surface">
          <table className="min-w-full divide-y">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">방문</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">누적 결제</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">최근 방문</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">태그</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers?.data?.map((c: Record<string, any>) => (
                <tr key={c.id as string} className="hover:bg-surface-50">
                  <td className="px-6 py-4">
                    <Link href={`/customers/${c.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                      {c.name as string}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{String(c.phone)}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{String(c.email)}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-900">{c.totalVisits as number}회</td>
                  <td className="px-6 py-4 text-sm text-surface-900">{formatCurrency(c.totalSpent as number)}</td>
                  <td className="px-6 py-4 text-sm text-surface-500">{c.lastVisitAt ? formatDate(c.lastVisitAt as string) : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags as string[])?.map((tag) => (
                        <span key={tag} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!customers?.data?.length && (
            <div className="py-12 text-center text-surface-400">등록된 고객이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
