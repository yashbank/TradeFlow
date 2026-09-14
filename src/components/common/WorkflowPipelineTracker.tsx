'use client';

import React from 'react';
import { CheckCircle2, Clock, Circle, ArrowRight, FileText, CalendarCheck2, Receipt } from 'lucide-react';
import type { QuoteStatus, JobStatus, InvoiceStatus } from '@/types/database';

export type PipelineStage = 'quote' | 'job' | 'invoice';

interface WorkflowPipelineTrackerProps {
  currentStage: PipelineStage;
  quoteStatus?: QuoteStatus | string | null;
  jobStatus?: JobStatus | string | null;
  invoiceStatus?: InvoiceStatus | string | null;
  quoteId?: string;
  jobId?: string;
  invoiceId?: string;
}

export function WorkflowPipelineTracker({
  currentStage,
  quoteStatus,
  jobStatus,
  invoiceStatus,
  quoteId,
  jobId,
  invoiceId,
}: WorkflowPipelineTrackerProps) {
  const stages = [
    {
      id: 'quote',
      label: 'Quote Proposal',
      icon: FileText,
      status: quoteStatus || (jobId || invoiceId ? 'accepted' : 'draft'),
      isDone: quoteStatus === 'accepted' || !!jobId || !!invoiceId,
      isCurrent: currentStage === 'quote',
      link: quoteId ? `/quotes/${quoteId}` : undefined,
    },
    {
      id: 'job',
      label: 'Field Dispatch & Job',
      icon: CalendarCheck2,
      status: jobStatus || (invoiceId ? 'completed' : 'pending'),
      isDone: jobStatus === 'completed' || !!invoiceId,
      isCurrent: currentStage === 'job',
      link: jobId ? `/jobs/${jobId}` : undefined,
    },
    {
      id: 'invoice',
      label: 'Invoice & Payment',
      icon: Receipt,
      status: invoiceStatus || 'pending',
      isDone: invoiceStatus === 'paid',
      isCurrent: currentStage === 'invoice',
      link: invoiceId ? `/invoices/${invoiceId}` : undefined,
    },
  ];

  return (
    <div className="w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isPast = stage.isDone;
          const isCurrent = stage.isCurrent;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex items-center gap-3 min-w-0 shrink-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isPast
                      ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-xs shadow-sky-500/20 ring-2 ring-sky-500/30 ring-offset-2 dark:ring-offset-zinc-900'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Step {idx + 1}
                  </p>
                  <p
                    className={`text-xs font-bold truncate ${
                      isCurrent
                        ? 'text-sky-600 dark:text-sky-400'
                        : isPast
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {stage.label}
                  </p>
                  <span className="inline-block text-[10px] capitalize font-medium text-slate-500 dark:text-zinc-400">
                    {stage.status ? stage.status.replace('_', ' ') : 'Pending'}
                  </span>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <div className="hidden sm:flex items-center text-slate-300 dark:text-zinc-700 mx-2 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
