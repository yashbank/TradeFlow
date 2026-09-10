import React from 'react';
import Link from 'next/link';
import { DashboardService } from '@/services/DashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
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
} from 'lucide-react';

import { AuthService } from '@/services/AuthService';
import { JobService } from '@/services/JobService';

export default async function DashboardPage() {
  const context = await AuthService.getCurrentContext();
  const isTechnician = context?.role === 'technician';

  if (isTechnician) {
    const { jobs: myJobs } = await JobService.list();
    const scheduledCount = myJobs.filter((j: any) => j.status === 'scheduled').length;
    const inProgressCount = myJobs.filter((j: any) => j.status === 'in_progress').length;
    const completedCount = myJobs.filter((j: any) => j.status === 'completed').length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Field Schedule
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Welcome back, {context?.user.full_name}. Your assigned jobs and site dispatches.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" variant="outline" className="min-h-[44px]">
              View All Jobs
            </Button>
          </Link>
        </div>

        {/* Technician KPI Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Scheduled
              </CardTitle>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900">{scheduledCount}</div>
              <p className="text-xs text-slate-500 mt-1">Pending dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                In Progress
              </CardTitle>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-600">{inProgressCount}</div>
              <p className="text-xs text-slate-500 mt-1">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed
              </CardTitle>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
              <p className="text-xs text-slate-500 mt-1">Jobs finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Jobs List */}
        <Card>
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
            <CardTitle className="text-base font-semibold">Today&apos;s Dispatch Queue</CardTitle>
            <p className="text-xs text-slate-500">Click a job to open work order details and update status</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 divide-y divide-slate-100">
            {myJobs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No jobs currently assigned. Check back later or notify your dispatcher.
              </div>
            ) : (
              myJobs.map((job: any) => {
                const addressStr = `${job.address_line1}${job.city ? `, ${job.city}` : ''}`;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`;

                return (
                  <div key={job.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{job.title}</span>
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
                          <p className="text-xs text-slate-600 mt-0.5">
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
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded min-h-[36px]"
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        {addressStr}
                      </a>
                      {job.customer?.phone && (
                        <a
                          href={`tel:${job.customer.phone}`}
                          className="inline-flex items-center text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded min-h-[36px]"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Call Customer
                        </a>
                      )}
                      {job.scheduled_start && (
                        <span className="inline-flex items-center text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Start: {formatDate(job.scheduled_start)}
                        </span>
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

  const metrics = await DashboardService.getMetrics();
  const activity = await DashboardService.getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time plumbing operations & cash flow</p>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
          <Link href="/quotes/new">
            <Button size="sm" className="whitespace-nowrap min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              New Quote
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" variant="secondary" className="whitespace-nowrap min-h-[44px]">
              <Calendar className="w-4 h-4 mr-1.5" />
              Schedule Job
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button size="sm" variant="outline" className="whitespace-nowrap min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              New Invoice
            </Button>
          </Link>
          <Link href="/customers">
            <Button size="sm" variant="ghost" className="whitespace-nowrap min-h-[44px] text-slate-600">
              <Plus className="w-4 h-4 mr-1.5" />
              Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              MTD Revenue
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatCurrency(metrics.revenueMtdCents, metrics.currency as any)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Collected this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outstanding
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatCurrency(metrics.outstandingReceivablesCents, metrics.currency as any)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending customer payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue Invoices
            </CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">
              {metrics.overdueInvoicesCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({formatCurrency(metrics.overdueInvoicesCents, metrics.currency as any)})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quote Win Rate
            </CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-700">
              {metrics.quoteWinRatePercentage}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.openQuotesCount} active quote(s) awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Activity & Upcoming Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's & Upcoming Jobs */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4 sm:p-5">
            <div>
              <CardTitle className="text-base font-semibold">Today&apos;s &amp; Upcoming Jobs</CardTitle>
              <p className="text-xs text-slate-500">Dispatch & field work execution</p>
            </div>
            <Link href="/jobs" className="text-xs text-blue-600 font-medium hover:underline flex items-center">
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex-1 divide-y divide-slate-100">
            {activity.recentJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No upcoming jobs scheduled. Convert an accepted quote to get started!
              </div>
            ) : (
              activity.recentJobs.map((job: any) => (
                <div key={job.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{job.title}</span>
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
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        {job.city ? `${job.address_line1}, ${job.city}` : job.address_line1}
                      </span>
                    </div>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs h-9">
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
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4 sm:p-5">
            <div>
              <CardTitle className="text-base font-semibold">Recent Quotes</CardTitle>
              <p className="text-xs text-slate-500">Track customer approval velocity</p>
            </div>
            <Link href="/quotes" className="text-xs text-blue-600 font-medium hover:underline flex items-center">
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex-1 divide-y divide-slate-100">
            {activity.recentQuotes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No quotes generated yet. Click &quot;+ New Quote&quot; to create your first one!
              </div>
            ) : (
              activity.recentQuotes.map((quote: any) => (
                <div key={quote.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{quote.quote_number}</span>
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
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {quote.customer?.first_name} {quote.customer?.last_name} • Expires {formatDate(quote.expiry_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(quote.total_cents, metrics.currency as any)}
                    </div>
                    <Link href={`/quotes/${quote.id}`} className="text-xs text-blue-600 hover:underline">
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
