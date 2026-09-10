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

  if (isTechnician) {
    const { jobs: myJobs } = await JobService.list();
    return (
      <DashboardClientView
        isTechnician={true}
        myJobs={myJobs}
        user={context.user}
        organization={context.organization}
        role={context.role}
      />
    );
  }

  const [metrics, activity] = await Promise.all([
    DashboardService.getMetrics(),
    DashboardService.getRecentActivity(),
  ]);

  return (
    <DashboardClientView
      isTechnician={false}
      metrics={metrics}
      activity={activity}
      user={context.user}
      organization={context.organization}
      role={context.role}
    />
  );
}
