'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { csApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, Brain, Zap } from 'lucide-react';

export default function PatternsPage() {
  const { tenantId } = useAuth();

  const { data: patterns } = useQuery({
    queryKey: ['patterns', tenantId],
    queryFn: () => csApi.getPatterns(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  return (
    <div>
      <div className="flex items-center gap-4">
        <Link href="/cs" className="rounded-lg p-2 hover:bg-surface-100">
          <ArrowLeft className="h-5 w-5 text-surface-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI 학습 패턴</h1>
          <p className="mt-1 text-sm text-surface-500">AI가 학습한 자동 응답 패턴을 확인하세요.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {patterns?.data?.map((pattern: Record<string, any>) => (
          <div key={pattern.id} className="card-surface px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">{pattern.pattern || pattern.trigger}</p>
                  <p className="text-sm text-surface-500 line-clamp-1">{pattern.response}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-surface-500">
                  <Zap className="h-3.5 w-3.5" />
                  {Math.round((pattern.confidence ?? 0) * 100)}%
                </div>
                <span className="text-xs text-surface-400">{formatDateTime(pattern.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
        {!patterns?.data?.length && (
          <div className="flex flex-col items-center justify-center card-surface py-16">
            <Brain className="h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-400">학습된 패턴이 없습니다.</p>
            <p className="text-sm text-surface-300">고객 대화가 축적되면 AI가 자동으로 패턴을 학습합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
