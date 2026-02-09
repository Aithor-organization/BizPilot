import { AuthLayout } from '@/components/layout/auth-layout';

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
