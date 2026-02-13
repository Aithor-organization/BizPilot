'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { hrApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Clock, LogIn, LogOut } from 'lucide-react';

export default function HrPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: '', payType: 'HOURLY', payRate: '' });

  const { data: employees } = useQuery({
    queryKey: ['employees', tenantId],
    queryFn: () => hrApi.getEmployees(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => hrApi.createEmployee(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('직원이 등록되었습니다.');
      setShowForm(false);
    },
  });

  const clockInMutation = useMutation({
    mutationFn: (employeeId: string) => hrApi.clockIn(tenantId!, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('출근 처리되었습니다.');
    },
    onError: () => toast.error('출근 처리에 실패했습니다.'),
  });

  const clockOutMutation = useMutation({
    mutationFn: (employeeId: string) => hrApi.clockOut(tenantId!, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('퇴근 처리되었습니다.');
    },
    onError: () => toast.error('퇴근 처리에 실패했습니다.'),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">직원 관리</h1>
          <p className="mt-1 text-sm text-surface-500">직원 정보와 출퇴근을 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/leaves" className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50">
            <Clock className="h-4 w-4" /> 휴가 관리
          </Link>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> 직원 등록
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-4 card-surface p-6">
          <h3 className="text-lg font-semibold">새 직원 등록</h3>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, payRate: parseInt(form.payRate) || 0 }); }} className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">이름 *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">전화번호</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">직책</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" placeholder="매니저, 스태프" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">급여 유형</label>
              <select value={form.payType} onChange={(e) => setForm({ ...form, payType: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">
                <option value="HOURLY">시급</option>
                <option value="MONTHLY">월급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">급여 (원)</label>
              <input type="number" value={form.payRate} onChange={(e) => setForm({ ...form, payRate: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">등록</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-surface-600">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        {employees?.map((emp: Record<string, any>) => (
          <div key={emp.id as string} className="card-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-surface-900">{emp.name as string}</p>
                <p className="text-sm text-surface-500">{(emp.role as string) || '미지정'} | {(emp.payType as string) === 'HOURLY' ? '시급' : '월급'} {formatCurrency(emp.payRate as number)}</p>
                {emp.phone && <p className="text-sm text-surface-400">{String(emp.phone)}</p>}
              </div>
              <div className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${(emp.isActive as boolean) ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>
                {(emp.isActive as boolean) ? '재직' : '퇴사'}
              </div>
            </div>
            {(emp.isActive as boolean) && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => clockInMutation.mutate(emp.id as string)} className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                  <LogIn className="h-3 w-3" /> 출근
                </button>
                <button onClick={() => clockOutMutation.mutate(emp.id as string)} className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                  <LogOut className="h-3 w-3" /> 퇴근
                </button>
              </div>
            )}
          </div>
        ))}
        {!employees?.length && (
          <div className="col-span-2 card-surface py-12 text-center text-surface-400">
            등록된 직원이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
