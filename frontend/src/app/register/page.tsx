'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.register({ email, password, name });
      toast.success('회원가입 완료! 로그인해주세요.');
      router.push('/login');
    } catch {
      toast.error('회원가입에 실패했습니다. 이미 가입된 이메일일 수 있습니다.');
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
            30일 무료 체험으로
            <br />
            <span className="text-accent-400">지금 시작</span>하세요
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-200">
            신용카드 없이 모든 기능을 체험할 수 있습니다.
          </p>

          <div className="mt-8 space-y-3">
            {[
              '모든 기능 30일 무료',
              '설정 10분 안에 완료',
              '업종별 맞춤 자동 구성',
              '언제든 해지 가능',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-sm text-brand-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-400" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-brand-300">
          &copy; 2026 BizPilot
        </div>
      </div>

      {/* 우측: 회원가입 폼 */}
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
            <h1 className="text-2xl font-bold text-surface-900">회원가입</h1>
            <p className="mt-2 text-sm text-surface-500">무료 계정을 만들고 비즈니스를 성장시키세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-colors placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="홍길동"
              />
            </div>
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
                minLength={8}
                className="block w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-colors placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="8자 이상"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            >
              {isLoading ? '가입 중...' : '무료 회원가입'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
