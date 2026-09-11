import React from 'react';
import { CustomerService } from '@/services/CustomerService';
import { AuthService } from '@/services/AuthService';
import { InvoiceBuilder } from '@/components/invoices/InvoiceBuilder';

import { JobService } from '@/services/JobService';
import { QuoteService } from '@/services/QuoteService';

interface NewInvoicePageProps {
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const { customer_id } = await searchParams;
  const { organization } = await AuthService.requireRole(['owner', 'admin']);

  const [{ customers }, completedJobsRes, acceptedQuotesRes] = await Promise.all([
    CustomerService.list('', 100),
    JobService.list('completed', '', 20, 0).catch(() => ({ jobs: [], totalCount: 0 })),
    QuoteService.list('accepted', '', 20, 0).catch(() => ({ quotes: [], totalCount: 0 })),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Create New Invoice
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Direct billing & quick invoice generation with live tax calculation.
        </p>
      </div>

      <InvoiceBuilder
        customers={customers}
        defaultCustomerId={customer_id}
        taxRateBasisPoints={organization.tax_rate_basis_points}
        currency={organization.currency}
        defaultTerms={organization.invoice_terms}
        completedJobs={completedJobsRes.jobs || []}
        acceptedQuotes={acceptedQuotesRes.quotes || []}
      />
    </div>
  );
}
