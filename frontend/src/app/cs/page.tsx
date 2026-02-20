'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { csApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Bot, User } from 'lucide-react';

export default function CsPage() {
  const { tenantId } = useAuth();

  const { data: conversations } = useQuery({
    queryKey: ['conversations', tenantId],
    queryFn: () => csApi.getConversations(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700',
    ASSIGNED: 'bg-brand-100 text-brand-800',
    RESOLVED: 'bg-surface-100 text-surface-600',
    CLOSED: 'bg-surface-100 text-surface-400',
  };
  const statusLabels: Record<string, string> = {
    OPEN: '대기 중', ASSIGNED: '담당 배정', RESOLVED: '해결됨', CLOSED: '종료',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">고객 지원 (CS)</h1>
          <p className="mt-1 text-sm text-surface-500">고객 대화를 관리하고 AI 학습 패턴을 확인하세요.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/cs/knowledge" className="rounded-lg border px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50">
            지식 베이스
          </Link>
          <Link href="/cs/patterns" className="rounded-lg border px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50">
            AI 학습 패턴
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {conversations?.items?.map((conv: Record<string, unknown>) => (
          <Link key={conv.id as string} href={`/cs/${conv.id}`} className="block card-surface px-6 py-4 hover:border-brand-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100">
                  <User className="h-5 w-5 text-surface-500" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">{(conv.visitorName as string) || (conv.visitorEmail as string) || '익명 방문자'}</p>
                  <p className="text-sm text-surface-500">{(conv.subject as string) || '제목 없음'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-400">{formatDateTime(conv.updatedAt as string)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[conv.status as string] || ''}`}>
                  {statusLabels[conv.status as string] || (conv.status as string)}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {!conversations?.items?.length && (
          <div className="flex flex-col items-center justify-center card-surface py-16">
            <MessageSquare className="h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-400">아직 대화가 없습니다.</p>
            <p className="text-sm text-surface-300">웹챗 위젯을 설정하면 고객 대화가 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
