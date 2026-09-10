import { AuthService } from '@/services/AuthService';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await AuthService.getCurrentContext();

  if (!context) {
    redirect('/login');
  }

  return (
    <AppShell
      organization={context.organization}
      user={context.user}
      role={context.role}
    >
      {children}
    </AppShell>
  );
}
