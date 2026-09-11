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

  const [metrics, activity, jobsRes, teamMembers] = await Promise.all([
    isTechnician
      ? Promise.resolve(null)
      : DashboardService.getMetrics().catch(() => ({
          currency: context.organization.currency || 'USD',
          revenueMtdCents: 0,
          outstandingReceivablesCents: 0,
          totalInvoicedMtdCents: 0,
          openInvoicesCount: 0,
          overdueInvoicesCount: 0,
          overdueInvoicesCents: 0,
          openQuotesCount: 0,
          openQuotesTotalCents: 0,
          upcomingJobsTodayCount: 0,
          completedJobsCount: 0,
          totalJobsCount: 0,
          quoteWinRatePercentage: 0,
          weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
        })),
    isTechnician
      ? Promise.resolve({ recentJobs: [], recentQuotes: [] })
      : DashboardService.getRecentActivity().catch(() => ({ recentJobs: [], recentQuotes: [] })),
    JobService.list().catch(() => ({ jobs: [], totalCount: 0 })),
    isTechnician ? Promise.resolve([]) : JobService.getTeamMembers().catch(() => []),
  ]);

  return (
    <DashboardClientView
      isTechnician={isTechnician}
      myJobs={jobsRes.jobs || []}
      teamMembers={teamMembers}
      metrics={metrics}
      activity={activity}
      user={context.user}
      organization={context.organization}
      role={context.role}
    />
  );
}
