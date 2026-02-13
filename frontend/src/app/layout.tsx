import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizPilot - SMB 올인원 비즈니스 운영 에이전트',
  description: 'AI 기반 SMB 올인원 비즈니스 운영 에이전트 플랫폼. 고객 응대, 예약, CRM, 견적서, 매출 리포트, 직원 관리까지.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '0.5rem',
                border: '1px solid #E7E5E4',
                boxShadow: '0 4px 6px -1px rgba(28, 25, 23, 0.06)',
                fontSize: '0.875rem',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
