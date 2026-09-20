import React from 'react';
import { CustomerService } from '@/services/CustomerService';
import { AuthService } from '@/services/AuthService';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';
import { TenantIntegrationService } from '@/services/TenantIntegrationService';
import { TRADE_PRESETS_CONFIG } from '@/types/trades';

interface NewQuotePageProps {
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const { customer_id } = await searchParams;
  const { organization } = await AuthService.requireRole(['owner', 'admin']);
  const { customers } = await CustomerService.list('', 100);
  const tenantConfig = await TenantIntegrationService.getIntegrations(organization.id);
  const tradeConfig = TRADE_PRESETS_CONFIG[tenantConfig.primaryTrade] || TRADE_PRESETS_CONFIG.plumbing;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">Create New Quote</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Draft professional {tradeConfig.title.toLowerCase()} proposal with instant calculations.
          </p>
        </div>
        <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold">
          {tradeConfig.badge}
        </div>
      </div>
      <QuoteBuilder
        customers={customers}
        defaultCustomerId={customer_id}
        taxRateBasisPoints={organization.tax_rate_basis_points}
        currency={organization.currency}
        primaryTrade={tenantConfig.primaryTrade}
        defaultTerms={tradeConfig.defaultTerms}
      />
    </div>
  );
}
