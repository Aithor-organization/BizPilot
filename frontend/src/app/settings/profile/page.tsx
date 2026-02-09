'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { businessProfileApi } from '@/lib/api';

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export default function BusinessProfilePage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    businessName: '', ownerName: '', bizNumber: '', address: '', phone: '',
    openTime: '09:00', closeTime: '18:00', closedDays: [] as number[],
  });

  const { data: profile } = useQuery({
    queryKey: ['business-profile', tenantId],
    queryFn: () => businessProfileApi.get(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || '',
        ownerName: profile.ownerName || '',
        bizNumber: profile.bizNumber || '',
        address: profile.address || '',
        phone: profile.phone || '',
        openTime: profile.openTime || '09:00',
        closeTime: profile.closeTime || '18:00',
        closedDays: profile.closedDays || [],
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => businessProfileApi.upsert(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      toast.success('프로필이 저장되었습니다.');
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  const toggleClosedDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter((d) => d !== day)
        : [...prev.closedDays, day],
    }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">업종 프로필</h1>
      <p className="mt-1 text-sm text-gray-500">비즈니스 기본 정보를 설정하세요.</p>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="mt-6 space-y-6">
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">상호명 *</label>
              <input type="text" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">대표자명</label>
              <input type="text" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">사업자등록번호</label>
              <input type="text" value={form.bizNumber} onChange={(e) => setForm({ ...form, bizNumber: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" placeholder="000-00-00000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">대표 전화번호</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">주소</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">영업 시간</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">영업 시작</label>
              <input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">영업 종료</label>
              <input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">휴무일</label>
            <div className="flex gap-2">
              {dayLabels.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleClosedDay(i)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    form.closedDays.includes(i)
                      ? 'bg-red-100 text-red-700 border-red-200 border'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          저장
        </button>
      </form>
    </div>
  );
}
