import React from 'react';
import { AuthService } from '@/services/AuthService';
import { BillingService } from '@/services/BillingService';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { TenantIntegrationsCard } from '@/components/settings/TenantIntegrationsCard';

export default async function SettingsPage() {
  const { organization } = await AuthService.requireRole(['owner', 'admin']);
  const subscription = await BillingService.getSubscription();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Workspace Settings & Integrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Manage your trade profile, custom API keys (OpenAI, Resend, Stripe), and subscription.
        </p>
      </div>

      {/* 1. Client Customization & BYOK Integrations */}
      <TenantIntegrationsCard />

      {/* 2. Company Profile & Team Management */}
      <SettingsForm organization={organization} subscription={subscription} />
    </div>
  );
}
