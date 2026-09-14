'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  List,
  Kanban,
  CalendarCheck2,
  Clock,
  MapPin,
  User,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Play,
  Check,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { updateJobStatusAction } from '@/actions/jobs';
import { useToast } from '@/lib/toast/ToastContext';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import type { Job } from '@/types/database';

interface JobsViewContainerProps {
  jobs: Job[];
  listView?: React.ReactNode;
}

export function JobsViewContainer({ jobs, listView }: JobsViewContainerProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const toast = useToast();
  const { t } = useTranslation();

  async function handleQuickAdvance(jobId: string, nextStatus: 'in_progress' | 'completed') {
    setUpdatingId(jobId);
    const res = await updateJobStatusAction(jobId, nextStatus);
    setUpdatingId(null);
    if (res.success) {
      toast.success(
        'Job Status Advanced',
        nextStatus === 'in_progress' ? 'Job started and marked In Progress.' : 'Job marked as Completed.'
      );
    } else {
      toast.error('Status Update Failed', res.error || 'Could not advance status.');
    }
  }

  const scheduledJobs = jobs.filter((j) => j.status === 'scheduled');
  const inProgressJobs = jobs.filter((j) => j.status === 'in_progress');
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  return (
    <div className="space-y-4">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
          Showing {jobs.length} dispatch work orders
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Pipeline Board
          </button>
        </div>
      </div>

      {/* Kanban Pipeline View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Scheduled */}
          <div className="space-y-3 bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-2xl p-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Scheduled
              </span>
              <Badge variant="secondary" className="font-bold text-xs">
                {scheduledJobs.length}
              </Badge>
            </div>

            <div className="space-y-2.5">
              {scheduledJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                  No scheduled jobs
                </div>
              ) : (
                scheduledJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="p-3.5 bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs hover:border-sky-400 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-xs text-slate-900 dark:text-zinc-100 hover:text-sky-600 transition-colors line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{job.job_number}</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      {job.customer && (
                        <p className="font-medium text-slate-700 dark:text-zinc-300 truncate">
                          {job.customer.first_name} {job.customer.last_name}
                        </p>
                      )}
                      <p className="flex items-center min-w-0 truncate">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {job.city ? `${job.address_line1}, ${job.city}` : job.address_line1}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <Link href={`/jobs/${job.id}`} className="text-[11px] text-sky-600 font-bold hover:underline">
                        Details
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === job.id}
                        onClick={() => handleQuickAdvance(job.id, 'in_progress')}
                        className="h-7 text-[11px] px-2 font-semibold"
                      >
                        <Play className="w-3 h-3 mr-1 text-amber-500" />
                        Start Job
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                In Progress
              </span>
              <Badge variant="default" className="bg-amber-500 text-white font-bold text-xs">
                {inProgressJobs.length}
              </Badge>
            </div>

            <div className="space-y-2.5">
              {inProgressJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-amber-200/60 dark:border-zinc-800 rounded-xl">
                  No jobs currently in progress
                </div>
              ) : (
                inProgressJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="p-3.5 bg-white dark:bg-zinc-900/90 border border-amber-200 dark:border-amber-900/60 rounded-xl shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-xs text-slate-900 dark:text-zinc-100 hover:text-amber-600 transition-colors line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{job.job_number}</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      {job.customer && (
                        <p className="font-medium text-slate-700 dark:text-zinc-300 truncate">
                          {job.customer.first_name} {job.customer.last_name}
                        </p>
                      )}
                      <p className="flex items-center min-w-0 truncate">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {job.city ? `${job.address_line1}, ${job.city}` : job.address_line1}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <Link href={`/jobs/${job.id}`} className="text-[11px] text-amber-600 font-bold hover:underline">
                        Details
                      </Link>
                      <Button
                        size="sm"
                        variant="success"
                        disabled={updatingId === job.id}
                        onClick={() => handleQuickAdvance(job.id, 'completed')}
                        className="h-7 text-[11px] px-2 font-semibold"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Completed
              </span>
              <Badge variant="success" className="font-bold text-xs">
                {completedJobs.length}
              </Badge>
            </div>

            <div className="space-y-2.5">
              {completedJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-emerald-200/60 dark:border-zinc-800 rounded-xl">
                  No completed jobs
                </div>
              ) : (
                completedJobs.slice(0, 10).map((job) => (
                  <Card
                    key={job.id}
                    className="p-3.5 bg-white dark:bg-zinc-900/90 border border-emerald-100 dark:border-emerald-900/40 rounded-xl shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-xs text-slate-900 dark:text-zinc-100 hover:text-emerald-600 transition-colors line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {job.customer && (
                        <p className="truncate">
                          {job.customer.first_name} {job.customer.last_name}
                        </p>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{formatDate(job.completed_at || job.updated_at)}</span>
                      <Link href={`/jobs/${job.id}`} className="text-sky-600 font-bold hover:underline">
                        Invoice →
                      </Link>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      ) : listView ? (
        listView
      ) : (
        /* Standard Detailed List View */
        <div className="grid grid-cols-1 gap-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block">
              <Card className="glass-panel text-card-foreground hover:border-sky-400 dark:hover:border-sky-500 transition-all card-hover-tactile">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-base">{job.job_number}</span>
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
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 truncate">{job.title}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                      {job.customer && (
                        <span className="flex items-center text-slate-700 dark:text-zinc-300">
                          <User className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-zinc-500" />
                          {job.customer.first_name} {job.customer.last_name}
                        </span>
                      )}
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-zinc-500" />
                        {job.city ? `${job.address_line1}, ${job.city}` : job.address_line1}
                      </span>
                      {job.scheduled_start && (
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-zinc-500" />
                          {formatDate(job.scheduled_start)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-zinc-600 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
