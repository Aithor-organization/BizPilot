import { AuthLayout } from '@/components/layout/auth-layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
