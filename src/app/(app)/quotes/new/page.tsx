import React from 'react';
import { CustomerService } from '@/services/CustomerService';
import { AuthService } from '@/services/AuthService';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';

interface NewQuotePageProps {
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const { customer_id } = await searchParams;
  const { organization } = await AuthService.requireRole(['owner', 'admin']);
  const { customers } = await CustomerService.list('', 100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">Create New Quote</h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400">Draft professional plumbing proposal with instant calculations.</p>
      <QuoteBuilder
        customers={customers}
        defaultCustomerId={customer_id}
        taxRateBasisPoints={organization.tax_rate_basis_points}
        currency={organization.currency}
      />
    </div>
  );
}
