import React from 'react';
import { AuthService } from '@/services/AuthService';
import { BillingService } from '@/services/BillingService';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const { organization } = await AuthService.requireRole(['owner', 'admin']);
  const subscription = await BillingService.getSubscription();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your plumbing company profile, defaults, and subscription.</p>
      </div>
      <SettingsForm organization={organization} subscription={subscription} />
    </div>
  );
}
