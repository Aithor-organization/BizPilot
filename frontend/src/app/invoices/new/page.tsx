'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { invoiceApi, crmApi, reservationApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { tenantId } = useAuth();
  const [type, setType] = useState('ESTIMATE');
  const [customerId, setCustomerId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  const { data: customers } = useQuery({
    queryKey: ['customers', tenantId],
    queryFn: () => crmApi.list(tenantId!, { limit: 100 }).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { data: services } = useQuery({
    queryKey: ['services', tenantId],
    queryFn: () => reservationApi.getServices(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => invoiceApi.create(tenantId!, data),
    onSuccess: (res) => {
      toast.success('견적서가 생성되었습니다.');
      router.push(`/invoices/${res.data.id}`);
    },
    onError: () => toast.error('생성에 실패했습니다.'),
  });

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const selectService = (index: number, serviceId: string) => {
    const service = services?.find((s: Record<string, string>) => s.id === serviceId);
    if (service) {
      const updated = [...items];
      updated[index] = { ...updated[index], serviceId, description: service.name, unitPrice: service.price };
      setItems(updated);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = type === 'TAX_INVOICE' ? Math.round(subtotal * 0.1) : 0;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      type,
      customerId: customerId || undefined,
      note: note || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        serviceId: item.serviceId || undefined,
      })),
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">새 견적서 작성</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="card-surface p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">문서 유형</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">
                <option value="ESTIMATE">견적서</option>
                <option value="TAX_INVOICE">세금계산서</option>
                <option value="RECEIPT">영수증</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">고객</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">선택 안함</option>
                {customers?.data?.map((c: Record<string, string>) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">비고</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">항목</h3>
            <button type="button" onClick={addItem} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-brand-600 hover:bg-brand-50">
              <Plus className="h-4 w-4" /> 항목 추가
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-surface-500 uppercase">
                <th className="pb-2 pr-4">서비스</th>
                <th className="pb-2 pr-4">품목명</th>
                <th className="pb-2 pr-4 w-20">수량</th>
                <th className="pb-2 pr-4 w-32">단가</th>
                <th className="pb-2 w-32">금액</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <select value={item.serviceId || ''} onChange={(e) => selectService(i, e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm">
                      <option value="">직접 입력</option>
                      {services?.map((s: Record<string, string | number>) => <option key={s.id as string} value={s.id as string}>{s.name as string} ({formatCurrency(s.price as number)})</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required className="w-full rounded border px-2 py-1.5 text-sm" />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full rounded border px-2 py-1.5 text-sm" />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', parseInt(e.target.value) || 0)} className="w-full rounded border px-2 py-1.5 text-sm" />
                  </td>
                  <td className="py-2 text-sm font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                  <td className="py-2 pl-2">
                    <button type="button" onClick={() => removeItem(i)} className="text-surface-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">공급가액</span><span>{formatCurrency(subtotal)}</span></div>
              {type === 'TAX_INVOICE' && <div className="flex justify-between"><span className="text-surface-500">세액 (10%)</span><span>{formatCurrency(taxAmount)}</span></div>}
              <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>합계</span><span>{formatCurrency(totalAmount)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            저장
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border px-6 py-2.5 text-sm text-surface-600">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
