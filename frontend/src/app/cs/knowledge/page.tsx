'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { csApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, FileText, Upload, Search, Trash2, Loader2 } from 'lucide-react';

export default function KnowledgePage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const { data: documents } = useQuery({
    queryKey: ['documents', tenantId],
    queryFn: () => csApi.getDocuments(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      return csApi.uploadDocument(tenantId!, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => csApi.deleteDocument(tenantId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
    },
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => csApi.searchKnowledge(tenantId!, query, 5).then((r) => r.data),
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
  });

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = '';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchMutation.mutate(searchQuery.trim());
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cs" className="rounded-lg p-2 hover:bg-surface-100">
            <ArrowLeft className="h-5 w-5 text-surface-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">지식 베이스</h1>
            <p className="mt-1 text-sm text-surface-500">AI가 참조하는 문서를 관리하세요.</p>
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          문서 업로드
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* RAG Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="지식 베이스에서 검색하세요..."
            className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={searchMutation.isPending || !searchQuery.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '검색'}
        </button>
      </form>

      {/* Search Results */}
      {searchResults && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-surface-700">
              검색 결과 ({searchResults.length}건)
            </h2>
            <button
              onClick={() => { setSearchResults(null); setSearchQuery(''); }}
              className="text-xs text-surface-400 hover:text-surface-600"
            >
              닫기
            </button>
          </div>
          <div className="space-y-2">
            {searchResults.map((r: any, i: number) => (
              <div key={r.id || i} className="card-surface px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-brand-600">
                    유사도: {(r.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-surface-700 line-clamp-3">{r.content}</p>
              </div>
            ))}
            {searchResults.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">검색 결과가 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="mt-6 space-y-3">
        {uploadMutation.isPending && (
          <div className="flex items-center gap-3 card-surface px-6 py-4 border-brand-200 bg-brand-50">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <p className="text-sm text-brand-700">문서를 업로드하고 있습니다...</p>
          </div>
        )}
        {documents?.data?.map((doc: Record<string, any>) => (
          <div key={doc.id} className="flex items-center justify-between card-surface px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <FileText className="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <p className="font-medium text-surface-900">{doc.title || doc.filename}</p>
                <p className="text-sm text-surface-500">
                  {doc.chunkCount ?? 0}개 청크 | {formatDateTime(doc.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                doc.status === 'READY' ? 'bg-green-100 text-green-700' :
                doc.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {doc.status === 'READY' ? '처리 완료' : doc.status === 'FAILED' ? '실패' : '처리 중'}
              </span>
              <button
                onClick={() => deleteMutation.mutate(doc.id)}
                className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {!documents?.data?.length && !uploadMutation.isPending && (
          <div className="flex flex-col items-center justify-center card-surface py-16">
            <FileText className="h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-400">등록된 문서가 없습니다.</p>
            <p className="text-sm text-surface-300">문서를 업로드하면 AI가 자동으로 학습합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
