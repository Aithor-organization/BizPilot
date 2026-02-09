'use client';

import { MessageSquare, Globe, MessageCircle, Mail } from 'lucide-react';

const channels = [
  {
    name: '웹챗',
    description: '웹사이트에 채팅 위젯을 추가하여 실시간 고객 상담을 제공합니다.',
    icon: Globe,
    color: 'bg-blue-50 text-blue-600',
    connected: false,
  },
  {
    name: '카카오톡',
    description: '카카오톡 채널을 연동하여 고객 메시지를 통합 관리합니다.',
    icon: MessageCircle,
    color: 'bg-yellow-50 text-yellow-600',
    connected: false,
  },
  {
    name: 'SMS',
    description: 'SMS를 통해 예약 알림, 안내 메시지를 자동 발송합니다.',
    icon: MessageSquare,
    color: 'bg-green-50 text-green-600',
    connected: false,
  },
  {
    name: '이메일',
    description: '이메일로 견적서 발송 및 고객 안내를 자동화합니다.',
    icon: Mail,
    color: 'bg-purple-50 text-purple-600',
    connected: false,
  },
];

export default function ChannelsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">채널 설정</h1>
      <p className="mt-1 text-sm text-gray-500">옴니채널 연동을 설정하세요.</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {channels.map((ch) => (
          <div key={ch.name} className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${ch.color}`}>
                <ch.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{ch.name}</h3>
                <p className="text-sm text-gray-500">{ch.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                ch.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {ch.connected ? '연결됨' : '미연결'}
              </span>
              <button className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {ch.connected ? '설정' : '연결하기'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
