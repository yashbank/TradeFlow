import { AuthService } from '@/services/AuthService';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { TenantIntegrationService } from '@/services/TenantIntegrationService';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await AuthService.getCurrentContext();

  if (!context) {
    redirect('/login');
  }

  const tenantConfig = await TenantIntegrationService.getIntegrations(context.organization.id);

  return (
    <AppShell
      organization={context.organization}
      user={context.user}
      role={context.role}
      primaryTrade={tenantConfig.primaryTrade}
    >
      {children}
    </AppShell>
  );
}
