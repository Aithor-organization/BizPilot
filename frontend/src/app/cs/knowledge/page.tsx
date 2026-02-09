'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { csApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, FileText, Upload } from 'lucide-react';

export default function KnowledgePage() {
  const { tenantId } = useAuth();

  const { data: documents } = useQuery({
    queryKey: ['documents', tenantId],
    queryFn: () => csApi.getDocuments(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cs" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">지식 베이스</h1>
            <p className="mt-1 text-sm text-gray-500">AI가 참조하는 문서를 관리하세요.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Upload className="h-4 w-4" />
          문서 업로드
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {documents?.data?.map((doc: Record<string, any>) => (
          <div key={doc.id} className="flex items-center justify-between rounded-xl border bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{doc.title || doc.filename}</p>
                <p className="text-sm text-gray-500">
                  {doc.chunkCount ?? 0}개 청크 | {formatDateTime(doc.createdAt)}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              doc.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {doc.status === 'COMPLETED' ? '처리 완료' : '처리 중'}
            </span>
          </div>
        ))}
        {!documents?.data?.length && (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-400">등록된 문서가 없습니다.</p>
            <p className="text-sm text-gray-300">문서를 업로드하면 AI가 자동으로 학습합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
