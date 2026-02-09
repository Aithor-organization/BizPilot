'use client';

import { useState } from 'react';
import { Copy, Check, Palette, Code } from 'lucide-react';

export default function WidgetsPage() {
  const [copied, setCopied] = useState(false);
  const embedCode = `<script src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/widget.js" data-token="YOUR_EMBED_TOKEN"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">웹챗 위젯</h1>
      <p className="mt-1 text-sm text-gray-500">고객 웹사이트에 설치할 채팅 위젯을 설정하세요.</p>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Code className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">임베드 코드</h2>
          </div>
          <div className="relative rounded-lg bg-gray-900 p-4">
            <pre className="text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 rounded-lg bg-gray-700 p-2 text-gray-300 hover:bg-gray-600"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            위 코드를 웹사이트의 &lt;/body&gt; 태그 앞에 붙여넣기 하세요.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">위젯 커스터마이징</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">위젯 색상</label>
              <input
                type="color"
                defaultValue="#4F46E5"
                className="mt-1 h-10 w-20 cursor-pointer rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">환영 메시지</label>
              <input
                type="text"
                defaultValue="안녕하세요! 무엇을 도와드릴까요?"
                className="mt-1 w-full rounded-lg border px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">위젯 위치</label>
              <select className="mt-1 w-full rounded-lg border px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="bottom-right">우측 하단</option>
                <option value="bottom-left">좌측 하단</option>
              </select>
            </div>
            <button className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
