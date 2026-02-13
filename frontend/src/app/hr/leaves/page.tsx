'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { hrApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Check, X } from 'lucide-react';

export default function LeavesPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', days: '1', reason: '' });

  const { data: leaves } = useQuery({
    queryKey: ['leaves', tenantId],
    queryFn: () => hrApi.getLeaves(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees', tenantId],
    queryFn: () => hrApi.getEmployees(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => hrApi.createLeave(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('휴가가 신청되었습니다.');
      setShowForm(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      hrApi.approveLeave(tenantId!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('처리되었습니다.');
    },
  });

  const typeLabels: Record<string, string> = { ANNUAL: '연차', SICK: '병가', PERSONAL: '개인', OTHER: '기타' };
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  const statusLabels: Record<string, string> = { PENDING: '대기', APPROVED: '승인', REJECTED: '거절' };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">휴가 관리</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> 휴가 신청
        </button>
      </div>

      {showForm && (
        <div className="mt-4 card-surface p-6">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, days: parseFloat(form.days) }); }} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">직원</label>
              <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">선택</option>
                {employees?.map((e: Record<string, string>) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">
                <option value="ANNUAL">연차</option>
                <option value="SICK">병가</option>
                <option value="PERSONAL">개인</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">일수</label>
              <input type="number" step="0.5" min="0.5" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">시작일</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">종료일</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">사유</label>
              <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="col-span-3 flex gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">신청</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-surface-600">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {leaves?.map((leave: Record<string, any>) => (
          <div key={leave.id as string} className="flex items-center justify-between card-surface px-6 py-4">
            <div>
              <p className="font-medium text-surface-900">{(leave.employee as Record<string, string>)?.name}</p>
              <p className="text-sm text-surface-500">
                {typeLabels[leave.type as string]} | {formatDate(leave.startDate as string)} ~ {formatDate(leave.endDate as string)} ({String(leave.days)}일)
              </p>
              {leave.reason && <p className="text-xs text-surface-400">{String(leave.reason)}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[leave.status as string] || ''}`}>
                {statusLabels[leave.status as string]}
              </span>
              {leave.status === 'PENDING' && (
                <>
                  <button onClick={() => approveMutation.mutate({ id: leave.id as string, status: 'APPROVED' })} className="rounded-lg border border-green-200 p-1.5 text-green-600 hover:bg-green-50">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => approveMutation.mutate({ id: leave.id as string, status: 'REJECTED' })} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {!leaves?.length && <div className="card-surface py-12 text-center text-surface-400">휴가 신청이 없습니다.</div>}
      </div>
    </div>
  );
}
