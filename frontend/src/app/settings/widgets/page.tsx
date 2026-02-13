'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { widgetApi } from '@/lib/api';
import { Copy, Check, Palette, Code, Loader2 } from 'lucide-react';

export default function WidgetsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [color, setColor] = useState('#4F46E5');
  const [greeting, setGreeting] = useState('안녕하세요! 무엇을 도와드릴까요?');
  const [position, setPosition] = useState('bottom-right');

  const { data: widgets } = useQuery({
    queryKey: ['widgets', tenantId],
    queryFn: () => widgetApi.getAll(tenantId!).then((r) => r.data),
    enabled: !!tenantId,
  });

  const widget = widgets?.[0];

  useEffect(() => {
    if (widget) {
      setColor(widget.primaryColor || '#4F46E5');
      setGreeting(widget.greeting || '안녕하세요! 무엇을 도와드릴까요?');
      setPosition(widget.position || 'bottom-right');
    }
  }, [widget]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (widget) {
        return widgetApi.update(tenantId!, widget.id, data);
      }
      return widgetApi.create(tenantId!, { name: '기본 위젯', ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', tenantId] });
    },
  });

  const embedCode = widget
    ? `<script src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/widget/${widget.embedToken}/embed.js" async></script>`
    : `<script src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/widget.js" data-token="YOUR_EMBED_TOKEN"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    updateMutation.mutate({
      primaryColor: color,
      greeting,
      position,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">웹챗 위젯</h1>
      <p className="mt-1 text-sm text-surface-500">고객 웹사이트에 설치할 채팅 위젯을 설정하세요.</p>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="card-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <Code className="h-5 w-5 text-brand-700" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900">임베드 코드</h2>
          </div>
          <div className="relative rounded-lg bg-surface-900 p-4">
            <pre className="text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 rounded-lg bg-surface-700 p-2 text-surface-300 hover:bg-surface-600"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-3 text-sm text-surface-500">
            위 코드를 웹사이트의 &lt;/body&gt; 태그 앞에 붙여넣기 하세요.
          </p>
          {!widget && (
            <p className="mt-2 text-xs text-amber-600">
              위젯이 아직 생성되지 않았습니다. 설정을 저장하면 자동 생성됩니다.
            </p>
          )}
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900">위젯 커스터마이징</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">위젯 색상</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 h-10 w-20 cursor-pointer rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">환영 메시지</label>
              <input
                type="text"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="mt-1 w-full rounded-lg border px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">위젯 위치</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-1 w-full rounded-lg border px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="bottom-right">우측 하단</option>
                <option value="bottom-left">좌측 하단</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {updateMutation.isSuccess ? '저장 완료!' : '설정 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
