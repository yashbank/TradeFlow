import React from 'react';
import { DashboardService } from '@/services/DashboardService';
import { AuthService } from '@/services/AuthService';
import { JobService } from '@/services/JobService';
import { DashboardClientView } from '@/components/dashboard/DashboardClientView';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const context = await AuthService.getCurrentContext();
  if (!context) {
    redirect('/login');
  }

  const isTechnician = context.role === 'technician';

  const [metrics, activity, jobsRes] = await Promise.all([
    DashboardService.getMetrics().catch(() => ({
      currency: context.organization.currency || 'USD',
      revenueMtdCents: 0,
      outstandingReceivablesCents: 0,
      openInvoicesCount: 0,
      overdueInvoicesCount: 0,
      overdueInvoicesCents: 0,
      openQuotesCount: 0,
      quoteWinRatePercentage: 0,
    })),
    DashboardService.getRecentActivity().catch(() => []),
    JobService.list().catch(() => ({ jobs: [], totalCount: 0 })),
  ]);

  return (
    <DashboardClientView
      isTechnician={isTechnician}
      myJobs={jobsRes.jobs || []}
      metrics={metrics}
      activity={activity}
      user={context.user}
      organization={context.organization}
      role={context.role}
    />
  );
}
