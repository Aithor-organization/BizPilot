import { AuthLayout } from '@/components/layout/auth-layout';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
