// ==============================================================================
// src/components/common/LifecycleTraceabilityWidget.tsx — End-to-End Pipeline Stepper
// ==============================================================================

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Wrench,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ExternalLink,
  Clock,
  ShieldCheck,
  CreditCard,
  Plus,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export interface TraceableQuote {
  id: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  accepted_at?: string | null;
  total_cents?: number;
}

export interface TraceableJob {
  id: string;
  job_number: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completed_at?: string | null;
  assigned_to_name?: string | null;
}

export interface TraceableInvoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  paid_at?: string | null;
  total_cents?: number;
  amount_paid_cents?: number;
}

interface LifecycleTraceabilityWidgetProps {
  quote?: TraceableQuote | null;
  job?: TraceableJob | null;
  invoice?: TraceableInvoice | null;
  currentStage: 'quote' | 'job' | 'invoice';
  compact?: boolean;
}

export function LifecycleTraceabilityWidget({
  quote,
  job,
  invoice,
  currentStage,
  compact = false,
}: LifecycleTraceabilityWidgetProps) {
  const isQuoteAccepted = quote?.status === 'accepted';
  const isJobCreated = Boolean(job);
  const isJobDone = job?.status === 'completed';
  const isInvoiceCreated = Boolean(invoice);
  const isInvoicePaid = invoice?.status === 'paid';

  // Compact row representation for List views
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
        {/* Quote pill */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
            isQuoteAccepted
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              : quote?.status === 'rejected'
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
          }`}
        >
          <FileText className="w-3 h-3" />
          {quote ? `${quote.quote_number}: ${quote.status.toUpperCase()}` : 'Quote'}
        </span>

        <ArrowRight className="w-3 h-3 text-slate-300 dark:text-zinc-600 shrink-0" />

        {/* Job pill */}
        {job ? (
          <Link
            href={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors hover:opacity-80 ${
              isJobDone
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
            }`}
          >
            <Wrench className="w-3 h-3" />
            {job.job_number} ({job.status.replace('_', ' ')})
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-slate-100/50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 border-dashed border-slate-300 dark:border-zinc-700">
            No Job Yet
          </span>
        )}

        <ArrowRight className="w-3 h-3 text-slate-300 dark:text-zinc-600 shrink-0" />

        {/* Invoice pill */}
        {invoice ? (
          <Link
            href={`/invoices/${invoice.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors hover:opacity-80 ${
              isInvoicePaid
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            <Receipt className="w-3 h-3" />
            {invoice.invoice_number} ({invoice.status.toUpperCase()})
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-slate-100/50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 border-dashed border-slate-300 dark:border-zinc-700">
            Pending Invoice
          </span>
        )}
      </div>
    );
  }

  // Full 4-Step Interactive Pipeline Stepper for Detail Views
  return (
    <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              End-to-End Service Traceability
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
            Quote → Job → Completion → Settlement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* STEP 1: Quote Stage */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              currentStage === 'quote'
                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/40 ring-1 ring-blue-500/20'
                : isQuoteAccepted
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                : 'bg-slate-50/40 dark:bg-zinc-800/20 border-slate-200 dark:border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">1. Quote</span>
                </div>
                <Badge
                  variant={
                    isQuoteAccepted
                      ? 'success'
                      : quote?.status === 'rejected'
                      ? 'destructive'
                      : quote?.status === 'sent'
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-[10px] py-0 font-bold"
                >
                  {quote?.status ? quote.status.toUpperCase() : 'PENDING'}
                </Badge>
              </div>

              {quote ? (
                <div className="space-y-1">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="font-black text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {quote.quote_number} <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {quote.total_cents ? formatCurrency(quote.total_cents) : '$0.00'}
                  </p>
                  {quote.accepted_at && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">No originating quote</p>
              )}
            </div>
          </div>

          {/* STEP 2: Work Order Dispatch */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              currentStage === 'job'
                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/40 ring-1 ring-blue-500/20'
                : isJobCreated
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                : 'bg-slate-50/40 dark:bg-zinc-800/20 border-slate-200 dark:border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">2. Work Order</span>
                </div>
                {job ? (
                  <Badge
                    variant={
                      job.status === 'completed'
                        ? 'success'
                        : job.status === 'in_progress'
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-[10px] py-0 font-bold"
                  >
                    {job.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">NOT CREATED</span>
                )}
              </div>

              {job ? (
                <div className="space-y-1">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-black text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    {job.job_number} <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Tech: {job.assigned_to_name || 'Unassigned pool'}
                  </p>
                </div>
              ) : isQuoteAccepted ? (
                <Link
                  href={`/jobs/new?quoteId=${quote?.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline mt-1"
                >
                  <Plus className="w-3 h-3" /> Create Work Order
                </Link>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Awaiting quote approval</p>
              )}
            </div>
          </div>

          {/* STEP 3: Field Execution & Completion */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              isJobDone
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                : job?.status === 'in_progress'
                ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500/30'
                : 'bg-slate-50/40 dark:bg-zinc-800/20 border-slate-200 dark:border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">3. Field Work</span>
                </div>
                <Badge
                  variant={isJobDone ? 'success' : job?.status === 'in_progress' ? 'default' : 'secondary'}
                  className="text-[10px] py-0 font-bold"
                >
                  {isJobDone ? 'DONE' : job?.status === 'in_progress' ? 'ON-SITE' : 'PENDING'}
                </Badge>
              </div>

              {isJobDone ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Work Completed ✓
                  </p>
                  {job?.completed_at && (
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {formatDateTime(job.completed_at)}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Scope & signatures verified
                  </p>
                </div>
              ) : job?.status === 'in_progress' ? (
                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                  Technician on-site repairing
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Awaiting job dispatch</p>
              )}
            </div>
          </div>

          {/* STEP 4: Invoice & Settlement */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              currentStage === 'invoice'
                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/40 ring-1 ring-blue-500/20'
                : isInvoicePaid
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                : isInvoiceCreated
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500/30'
                : 'bg-slate-50/40 dark:bg-zinc-800/20 border-slate-200 dark:border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">4. Invoice</span>
                </div>
                {invoice ? (
                  <Badge
                    variant={isInvoicePaid ? 'success' : invoice.status === 'sent' ? 'default' : 'secondary'}
                    className="text-[10px] py-0 font-bold"
                  >
                    {invoice.status.toUpperCase()}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">NOT BILLED</span>
                )}
              </div>

              {invoice ? (
                <div className="space-y-1">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-black text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {invoice.invoice_number} <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium">
                    {invoice.total_cents ? formatCurrency(invoice.total_cents) : '$0.00'}
                  </p>
                  {isInvoicePaid ? (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Paid in Full ✓
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      Balance Due: {formatCurrency((invoice.total_cents || 0) - (invoice.amount_paid_cents || 0))}
                    </p>
                  )}
                </div>
              ) : isJobDone ? (
                <Link
                  href={`/invoices/new?jobId=${job?.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                >
                  <Plus className="w-3 h-3" /> Generate Invoice
                </Link>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Billed after completion</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
