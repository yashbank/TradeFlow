import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobService } from '@/services/JobService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobDetailActions } from '@/components/jobs/JobDetailActions';
import { WorkflowPipelineTracker } from '@/components/common/WorkflowPipelineTracker';
import { LifecycleTraceabilityWidget } from '@/components/common/LifecycleTraceabilityWidget';
import { parseTechnicianData } from '@/lib/jobs/technicianData';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  DollarSign,
  PenTool,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const [job, teamMembers] = await Promise.all([
    JobService.getById(id),
    JobService.getTeamMembers().catch(() => []),
  ]);

  if (!job) {
    notFound();
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${job.address_line1}, ${job.city}, ${job.state} ${job.postal_code}`
  )}`;

  const techData = parseTechnicianData(job.internal_notes);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Jobs
        </Link>
        <JobDetailActions job={job} teamMembers={teamMembers} />
      </div>

      {/* End-to-End Lifecycle Pipeline Stepper */}
      <LifecycleTraceabilityWidget
        quote={(job as any).source_quote}
        job={job}
        invoice={(job as any).linked_invoice}
        currentStage="job"
      />

      {/* Completed Status Banner */}
      {job.status === 'completed' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Job Completed</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Finished on {formatDateTime(job.completed_at)}. Field additions and customer sign-off saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Job Information Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-100">{job.job_number}</h1>
                <Badge
                  variant={
                    job.status === 'completed'
                      ? 'success'
                      : job.status === 'in_progress'
                      ? 'default'
                      : job.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {job.status}
                </Badge>
              </div>
              <h2 className="text-base font-semibold text-slate-700 dark:text-zinc-300 mt-1">{job.title}</h2>
            </div>

            {/* Mobile 1-Tap Driving Directions */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors border border-blue-200 dark:border-blue-800 min-h-[44px]"
            >
              <Navigation className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              Get Directions
            </a>
          </div>

          {/* Schedule & Assignment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-lg border border-slate-200 dark:border-zinc-700/80">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block mb-1">
                Schedule Window
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400 dark:text-zinc-500" />
                {job.scheduled_start ? formatDateTime(job.scheduled_start) : 'Not scheduled yet'}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block mb-1">
                Assigned Technician
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 flex items-center">
                <User className="w-4 h-4 mr-1.5 text-slate-400 dark:text-zinc-500" />
                {job.assigned_to?.full_name || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Customer & Service Location */}
          <div className="border border-slate-200 dark:border-zinc-700/80 p-4 rounded-lg space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">
              Customer & Service Address
            </span>
            <p className="font-bold text-slate-900 dark:text-zinc-100 text-base">
              {job.customer?.first_name} {job.customer?.last_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-zinc-300">
              {job.customer?.phone && (
                <a href={`tel:${job.customer.phone}`} className="flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline min-h-[44px]">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-zinc-500" />
                  {job.customer.phone}
                </a>
              )}
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-zinc-500" />
                {job.address_line1}, {job.city}, {job.state} {job.postal_code}
              </span>
            </div>
          </div>

          {/* Agreed Scope & Work Description */}
          {job.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                Scope of Work (Agreed with Customer)
              </h3>
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>
          )}

          {/* TECHNICIAN SUBMISSIONS: Visible to Owner & Dispatcher */}
          {techData.summaryNotes && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Technician Field Work Summary
              </h3>
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-medium">
                {techData.summaryNotes}
              </div>
            </div>
          )}

          {/* Technician Field Billable Items & Labor Table */}
          {techData.billItems && techData.billItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Field Additions & Billables (Submitted by Technician)
                </h3>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Subtotal: ${(techData.billItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0)).toFixed(2)}
                </span>
              </div>
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {techData.billItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium text-slate-900 dark:text-zinc-100">
                          {item.description}
                          {item.taxable && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Taxable
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-zinc-300">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600 dark:text-zinc-300">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-zinc-100">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer Signature on Glass */}
          {(techData.customerSignature || techData.customerSignerName) && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Customer Sign-off on Glass (Signed On-Site)
              </h3>
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50/60 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    {techData.customerSignerName || 'Customer Verified'}
                  </p>
                  {techData.signedAt && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Signed at {formatDateTime(techData.signedAt)}
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Legally binding field sign-off
                  </p>
                </div>
                {techData.customerSignature && (
                  <div className="border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-xl p-2 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={techData.customerSignature}
                      alt="Customer Digital Signature"
                      className="max-h-[64px] object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legacy or raw field notes fallback */}
          {!techData.summaryNotes && job.internal_notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                Technician Field Notes
              </h3>
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs text-slate-700 dark:text-amber-200 whitespace-pre-wrap">
                {job.internal_notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
