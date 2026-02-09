'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { reservationApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function ReservationSettingsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Services
  const { data: services } = useQuery({
    queryKey: ['services', tenantId],
    queryFn: () => reservationApi.getServices(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '', category: '' });
  const [showServiceForm, setShowServiceForm] = useState(false);

  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => reservationApi.createService(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('서비스가 등록되었습니다.');
      setShowServiceForm(false);
      setServiceForm({ name: '', price: '', duration: '', category: '' });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => reservationApi.deleteService(tenantId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('서비스가 삭제되었습니다.');
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">예약 설정</h1>
      <p className="mt-1 text-sm text-gray-500">서비스/메뉴와 예약 가능 시간을 설정하세요.</p>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">서비스/메뉴 목록</h3>
          <button onClick={() => setShowServiceForm(true)} className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> 추가
          </button>
        </div>

        {showServiceForm && (
          <form onSubmit={(e) => { e.preventDefault(); createServiceMutation.mutate({ ...serviceForm, price: parseInt(serviceForm.price), duration: parseInt(serviceForm.duration) }); }} className="mb-4 grid grid-cols-4 gap-3 rounded-lg bg-gray-50 p-4">
            <input type="text" placeholder="서비스명 *" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required className="rounded-lg border px-3 py-2 text-sm" />
            <input type="number" placeholder="가격 (원) *" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} required className="rounded-lg border px-3 py-2 text-sm" />
            <input type="number" placeholder="소요시간 (분) *" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} required className="rounded-lg border px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white">등록</button>
              <button type="button" onClick={() => setShowServiceForm(false)} className="rounded-lg border px-3 py-2 text-sm text-gray-600">취소</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {services?.map((s: Record<string, unknown>) => (
            <div key={s.id as string} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{s.name as string}</p>
                <p className="text-sm text-gray-500">{String(s.duration)}분 | {formatCurrency(s.price as number)}</p>
              </div>
              <button onClick={() => deleteServiceMutation.mutate(s.id as string)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!services?.length && <p className="py-4 text-center text-gray-400">등록된 서비스가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
