'use client';

import Link from 'next/link';
import { Building2, Plug, CreditCard, Globe } from 'lucide-react';

const settingsItems = [
  { href: '/settings/profile', label: '업종 프로필', desc: '상호명, 영업시간, 휴무일 등을 설정합니다.', icon: Building2 },
  { href: '/settings/channels', label: '채널 설정', desc: '웹챗, 카카오톡 등 고객 소통 채널을 관리합니다.', icon: Globe },
  { href: '/settings/billing', label: '결제/크레딧', desc: '크레딧 잔액 확인 및 충전합니다.', icon: CreditCard },
  { href: '/settings/widgets', label: '위젯 설정', desc: '웹사이트에 삽입할 챗봇 위젯을 설정합니다.', icon: Plug },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">설정</h1>
      <p className="mt-1 text-sm text-gray-500">비즈니스 설정을 관리하세요.</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href} className="group rounded-xl border bg-white p-6 hover:border-brand-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
