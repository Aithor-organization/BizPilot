'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { channelApi } from '@/lib/api';
import { MessageSquare, Globe, MessageCircle, Mail, Loader2 } from 'lucide-react';

const channelDefaults = [
  {
    type: 'WEB_CHAT',
    name: '웹챗',
    description: '웹사이트에 채팅 위젯을 추가하여 실시간 고객 상담을 제공합니다.',
    icon: Globe,
    color: 'bg-brand-50 text-brand-700',
  },
  {
    type: 'KAKAO',
    name: '카카오톡',
    description: '카카오톡 채널을 연동하여 고객 메시지를 통합 관리합니다.',
    icon: MessageCircle,
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    type: 'SMS',
    name: 'SMS',
    description: 'SMS를 통해 예약 알림, 안내 메시지를 자동 발송합니다.',
    icon: MessageSquare,
    color: 'bg-green-50 text-green-600',
  },
  {
    type: 'EMAIL',
    name: '이메일',
    description: '이메일로 견적서 발송 및 고객 안내를 자동화합니다.',
    icon: Mail,
    color: 'bg-purple-50 text-purple-600',
  },
];

export default function ChannelsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: channels } = useQuery({
    queryKey: ['channels', tenantId],
    queryFn: () => channelApi.getAll(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string }) =>
      channelApi.create(tenantId!, { ...data, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', tenantId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      channelApi.update(tenantId!, id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', tenantId] });
    },
  });

  const getExistingChannel = (type: string) => {
    return channels?.find?.((ch: any) => ch.type === type) || null;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">채널 설정</h1>
      <p className="mt-1 text-sm text-surface-500">옴니채널 연동을 설정하세요.</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {channelDefaults.map((ch) => {
          const existing = getExistingChannel(ch.type);
          const connected = !!existing?.isActive;
          const isPending = createMutation.isPending || toggleMutation.isPending;

          return (
            <div key={ch.type} className="card-surface p-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${ch.color}`}>
                  <ch.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-surface-900">{ch.name}</h3>
                  <p className="text-sm text-surface-500">{ch.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  connected ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'
                }`}>
                  {connected ? '연결됨' : '미연결'}
                </span>
                <button
                  onClick={() => {
                    if (existing) {
                      toggleMutation.mutate({ id: existing.id, isActive: !existing.isActive });
                    } else {
                      createMutation.mutate({ name: ch.name, type: ch.type });
                    }
                  }}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {connected ? '해제' : '연결하기'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
