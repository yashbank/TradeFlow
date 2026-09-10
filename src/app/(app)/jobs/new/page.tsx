import React from 'react';
import { CustomerService } from '@/services/CustomerService';
import { AuthService } from '@/services/AuthService';
import { JobService } from '@/services/JobService';
import { JobScheduler } from '@/components/jobs/JobScheduler';

interface NewJobPageProps {
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const { customer_id } = await searchParams;
  await AuthService.requireRole(['owner', 'admin']);

  const [{ customers }, teamMembers, { jobs: scheduledJobs }] = await Promise.all([
    CustomerService.list('', 100),
    JobService.getTeamMembers(),
    JobService.list('scheduled', 10, 0),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Schedule New Job
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Directly dispatch and schedule a plumbing work order to field technicians.
        </p>
      </div>

      <JobScheduler
        customers={customers}
        teamMembers={teamMembers}
        defaultCustomerId={customer_id}
        scheduledJobs={scheduledJobs}
      />
    </div>
  );
}
