import React from 'react';
import Link from 'next/link';
import { JobService } from '@/services/JobService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CalendarCheck2, MapPin, ChevronRight, Clock, User } from 'lucide-react';
import type { JobStatus } from '@/types/database';

interface JobsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { status } = await searchParams;
  const validStatus = status as JobStatus | undefined;
  const { jobs, totalCount } = await JobService.list(validStatus);

  const filterTabs = [
    { label: 'All', value: '' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Active Jobs & Dispatch</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} active job records</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {filterTabs.map((tab) => {
          const isActive = (!status && tab.value === '') || status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/jobs?status=${tab.value}` : '/jobs'}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 gap-3">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">No jobs found in this category.</p>
              <p className="text-xs text-slate-400">Accept a quote or convert an accepted quote to spawn a job.</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block">
              <Card className="hover:border-blue-400 transition-colors">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{job.job_number}</span>
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

                    <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {job.address_line1}, {job.city}
                      </span>
                      {job.scheduled_start && (
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {formatDateTime(job.scheduled_start)}
                        </span>
                      )}
                      {job.assigned_to && (
                        <span className="flex items-center text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {job.assigned_to.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
