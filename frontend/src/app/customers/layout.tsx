import { AuthLayout } from '@/components/layout/auth-layout';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
