'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileCheck,
  Plus,
  ArrowUpRight,
  Phone,
  MapPin,
  Calendar,
  CalendarCheck2,
  Wrench,
  Sparkles,
} from 'lucide-react';
import type { UserProfile, Organization, UserRole } from '@/types/database';

interface DashboardClientViewProps {
  metrics?: any;
  activity?: any;
  isTechnician: boolean;
  myJobs?: any[];
  user: UserProfile;
  organization: Organization;
  role: UserRole;
}

export function DashboardClientView({
  metrics,
  activity,
  isTechnician,
  myJobs = [],
  user,
  organization,
}: DashboardClientViewProps) {
  const { t } = useTranslation();

  if (isTechnician) {
    const scheduledCount = myJobs.filter((j: any) => j.status === 'scheduled').length;
    const inProgressCount = myJobs.filter((j: any) => j.status === 'in_progress').length;
    const completedCount = myJobs.filter((j: any) => j.status === 'completed').length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
              {t('nav.schedule')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Welcome back, {user.full_name}. Here is your dispatch agenda for today.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" variant="outline" className="min-h-[44px]">
              {t('jobs.tab.all')}
            </Button>
          </Link>
        </div>

        {/* Technician KPI Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t('jobs.tab.scheduled')}
              </CardTitle>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                {scheduledCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Pending dispatch</p>
            </CardContent>
          </Card>

          <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t('jobs.tab.in_progress')}
              </CardTitle>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {inProgressCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Currently working</p>
            </CardContent>
          </Card>

          <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t('jobs.tab.completed')}
              </CardTitle>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <FileCheck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Jobs finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Jobs List */}
        <Card>
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Today&apos;s Dispatch Queue
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Click a job to open work order details and update status
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-zinc-800">
            {myJobs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-sm">
                No jobs currently assigned. Check back later or notify your dispatcher.
              </div>
            ) : (
              myJobs.map((job: any) => {
                const addressStr = job.city ? `${job.address_line1}, ${job.city}` : job.address_line1;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.address_line1}, ${job.city || ''} ${job.state || ''} ${job.postal_code || ''}`
                )}`;

                return (
                  <div key={job.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900 dark:text-zinc-100">
                            {job.job_number}
                          </span>
                          <span className="font-semibold text-sm text-slate-700 dark:text-zinc-300">
                            {job.title}
                          </span>
                          <Badge
                            variant={
                              job.status === 'completed'
                                ? 'success'
                                : job.status === 'in_progress'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                        {job.customer && (
                          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                            Customer: {job.customer.first_name} {job.customer.last_name}
                          </p>
                        )}
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" className="min-h-[44px]">
                          Open Work Order
                        </Button>
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-lg min-h-[36px]"
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
                        {addressStr}
                      </a>
                      {job.customer?.phone && (
                        <a
                          href={`tel:${job.customer.phone}`}
                          className="inline-flex items-center text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1.5 rounded-lg min-h-[36px]"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Call Customer
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Owner & Admin View
  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{t('dash.title')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Live
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{t('dash.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
          <Link href="/quotes/new">
            <Button size="sm" className="whitespace-nowrap min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              {t('dash.btn.new_quote')}
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" variant="secondary" className="whitespace-nowrap min-h-[44px]">
              <Calendar className="w-4 h-4 mr-1.5" />
              {t('dash.btn.schedule_job')}
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button size="sm" variant="outline" className="whitespace-nowrap min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              {t('dash.btn.new_invoice')}
            </Button>
          </Link>
          <Link href="/customers">
            <Button size="sm" variant="ghost" className="whitespace-nowrap min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              {t('dash.btn.add_customer')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t('dash.mtd_revenue')}
            </CardTitle>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-2xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              {formatCurrency(metrics.revenueMtdCents, metrics.currency as any)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                ↑ +12.4% MoM
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                {t('dash.collected_month')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t('dash.outstanding')}
            </CardTitle>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              {formatCurrency(metrics.outstandingReceivablesCents, metrics.currency as any)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                {metrics.openInvoicesCount ?? 0} Invoices
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                {t('dash.unpaid_invoices')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t('invoices.tab.overdue')}
            </CardTitle>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {metrics.overdueInvoicesCount}{' '}
              <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">
                ({formatCurrency(metrics.overdueInvoicesCents, metrics.currency as any)})
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                metrics.overdueInvoicesCount > 0
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}>
                {metrics.overdueInvoicesCount > 0 ? 'Requires Action' : 'Zero Overdue'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                Past due date
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-interactive card-hover-tactile rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t('dash.quote_win_rate')}
            </CardTitle>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl shadow-2xs">
              <FileCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-purple-700 dark:text-purple-400">
              {metrics.quoteWinRatePercentage}%
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {metrics.openQuotesCount} Approved
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                {t('dash.accepted_proposals')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Activity & Upcoming Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's & Upcoming Jobs */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800 p-4 sm:p-5">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t('jobs.title')}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Dispatch & field work pipeline</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex-1 divide-y divide-slate-100 dark:divide-zinc-800">
            {activity.recentJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                No upcoming jobs scheduled. Convert an accepted quote or schedule directly!
              </div>
            ) : (
              activity.recentJobs.map((job: any) => (
                <div key={job.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">
                        {job.title}
                      </span>
                      <Badge
                        variant={
                          job.status === 'completed'
                            ? 'success'
                            : job.status === 'in_progress'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        {job.city ? `${job.address_line1}, ${job.city}` : job.address_line1}
                      </span>
                    </div>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs min-h-[38px]">
                      Open
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Quotes Awaiting Customer Response */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800 p-4 sm:p-5">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t('quotes.title')}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Track customer approval velocity</p>
            </div>
            <Link
              href="/quotes"
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex-1 divide-y divide-slate-100 dark:divide-zinc-800">
            {activity.recentQuotes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                No quotes generated yet. Click &quot;+ New Quote&quot; to create your first one!
              </div>
            ) : (
              activity.recentQuotes.map((quote: any) => (
                <div key={quote.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                        {quote.quote_number}
                      </span>
                      <Badge
                        variant={
                          quote.status === 'accepted'
                            ? 'success'
                            : quote.status === 'sent'
                            ? 'default'
                            : quote.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {quote.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 truncate">
                      {quote.customer?.first_name} {quote.customer?.last_name} • Expires {formatDate(quote.expiry_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900 dark:text-zinc-100">
                      {formatCurrency(quote.total_cents, metrics.currency as any)}
                    </div>
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
