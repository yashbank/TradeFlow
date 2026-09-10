import React from 'react';
import Link from 'next/link';
import { InvoiceService } from '@/services/InvoiceService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InvoiceStatus } from '@/types/database';

interface InvoicesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const { status } = await searchParams;
  const validStatus = status as InvoiceStatus | undefined;
  const { invoices, totalCount } = await InvoiceService.list(validStatus);

  const filterTabs = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Void', value: 'void' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            Invoices & Billing
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{totalCount} invoice records total</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm" className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        {filterTabs.map((tab) => {
          const isActive = (!status && tab.value === '') || status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/invoices?status=${tab.value}` : '/invoices'}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-3">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 dark:text-zinc-500 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">No invoices found.</p>
                <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1">
                  Directly generate a quick invoice or complete an active job.
                </p>
              </div>
              <Link href="/invoices/new">
                <Button size="sm" variant="outline" className="min-h-[44px]">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
              <Card className="card-hover-tactile hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-base">{inv.invoice_number}</span>
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'overdue'
                            ? 'destructive'
                            : inv.status === 'sent'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>

                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {inv.customer?.first_name} {inv.customer?.last_name}
                    </p>

                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      Issued {formatDate(inv.issue_date)} • Due {formatDate(inv.due_date)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 dark:text-zinc-100 block">
                        {formatCurrency(inv.total_cents)}
                      </span>
                      {inv.balance_due_cents > 0 ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block">
                          Due: {formatCurrency(inv.balance_due_cents)}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
                          Paid in Full
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-zinc-600 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
