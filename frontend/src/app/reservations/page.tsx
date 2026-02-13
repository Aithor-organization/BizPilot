'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { reservationApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Calendar, List } from 'lucide-react';

export default function ReservationsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', serviceId: '', employeeId: '', date: '', startTime: '', endTime: '', note: '' });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', tenantId, selectedDate],
    queryFn: () => reservationApi.list(tenantId!, { date: selectedDate }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: services } = useQuery({
    queryKey: ['services', tenantId],
    queryFn: () => reservationApi.getServices(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => reservationApi.create(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('예약이 등록되었습니다.');
      setShowForm(false);
      setForm({ customerId: '', serviceId: '', employeeId: '', date: '', startTime: '', endTime: '', note: '' });
    },
    onError: () => toast.error('예약 등록에 실패했습니다.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      reservationApi.updateStatus(tenantId!, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('상태가 변경되었습니다.');
    },
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-brand-100 text-brand-800',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-surface-100 text-surface-500',
    NO_SHOW: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    PENDING: '대기', CONFIRMED: '확정', COMPLETED: '완료', CANCELLED: '취소', NO_SHOW: '노쇼',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">예약 관리</h1>
          <p className="mt-1 text-sm text-surface-500">예약을 확인하고 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border bg-white">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-surface-500'}`}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 text-sm ${view === 'calendar' ? 'bg-brand-50 text-brand-700' : 'text-surface-500'}`}>
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> 새 예약
          </button>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {showForm && (
        <div className="mt-4 card-surface p-6">
          <h3 className="text-lg font-semibold">새 예약 등록</h3>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
            className="mt-4 grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-surface-700">날짜</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">서비스</label>
              <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">선택</option>
                {services?.map((s: Record<string, string>) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">시작 시간</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">종료 시간</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700">메모</label>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">등록</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-surface-600">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {reservations?.data?.length ? (
          reservations.data.map((r: Record<string, any>) => (
            <div key={r.id} className="flex items-center justify-between card-surface px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-surface-900">{r.startTime}</p>
                  <p className="text-xs text-surface-400">{r.endTime}</p>
                </div>
                <div>
                  <p className="font-medium text-surface-900">{r.customer?.name || '미등록 고객'}</p>
                  <p className="text-sm text-surface-500">{r.service?.name || '서비스 미지정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status] || ''}`}>
                  {statusLabels[r.status] || r.status}
                </span>
                {r.status === 'PENDING' && (
                  <button onClick={() => statusMutation.mutate({ id: r.id, status: 'CONFIRMED' })} className="rounded-lg border px-3 py-1 text-xs text-brand-600 hover:bg-brand-50">
                    확정
                  </button>
                )}
                {r.status === 'CONFIRMED' && (
                  <button onClick={() => statusMutation.mutate({ id: r.id, status: 'COMPLETED' })} className="rounded-lg border px-3 py-1 text-xs text-green-600 hover:bg-green-50">
                    완료
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card-surface py-12 text-center text-surface-400">
            {selectedDate} 예약이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
