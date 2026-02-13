'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { Bot, CalendarCheck, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('로그인 성공!');
      router.push('/dashboard');
    } catch {
      toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 좌측: 브랜드 패널 */}
      <div className="bg-auth-brand relative hidden w-[45%] flex-col justify-between p-12 lg:flex">
        {/* 미세한 도트 패턴 오버레이 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white backdrop-blur-sm">
              BP
            </div>
            <span className="text-lg font-bold text-white">BizPilot</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight text-white">
            비즈니스 운영을
            <br />
            <span className="text-accent-400">AI와 함께</span> 시작하세요
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-200">
            고객 응대, 예약, 매출 관리까지 하나의 플랫폼에서.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Bot, text: 'AI 자동 고객 응대' },
              { icon: CalendarCheck, text: '스마트 예약 관리' },
              { icon: BarChart3, text: '실시간 매출 분석' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-brand-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4 text-accent-400" />
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-brand-300">
          &copy; 2026 BizPilot
        </div>
      </div>

      {/* 우측: 로그인 폼 */}
      <div className="flex flex-1 items-center justify-center bg-surface-50 px-6">
        <div className="w-full max-w-sm">
          {/* 모바일용 로고 */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
                BP
              </div>
              <span className="text-lg font-bold text-surface-900">BizPilot</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900">로그인</h1>
            <p className="mt-2 text-sm text-surface-500">계정에 로그인하여 비즈니스를 관리하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-colors placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-colors placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            계정이 없으신가요?{' '}
            <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800">
              무료 회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
