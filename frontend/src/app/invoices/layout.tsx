import { AuthLayout } from '@/components/layout/auth-layout';

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
