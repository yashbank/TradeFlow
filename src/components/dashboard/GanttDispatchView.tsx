'use client';

/**
 * GanttDispatchView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly Gantt chart with HTML5 drag-and-drop rescheduling for field service
 * dispatch. Shows one row per technician and 7 day columns (Mon→Sun of the
 * current week). Each job is a coloured bar; dragging it to another day column
 * optimistically updates state then calls rescheduleJobAction.
 *
 * Requirements:
 *  - No external DnD library (pure HTML5 draggable API)
 *  - Visual ghost / drop-highlight on hover
 *  - Toast on success / rollback on error
 *  - Works on mobile (horizontal scroll)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/toast/ToastContext';
import { rescheduleJobAction } from '@/actions/jobs';
import type { Job } from '@/types/database';
import {
  CalendarDays,
  GripHorizontal,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
}

interface GanttDispatchViewProps {
  jobs: Job[];
  teamMembers: TeamMember[];
}

// ─── Colour palette for job bars ─────────────────────────────────────────────

const JOB_COLORS = [
  { bg: 'bg-sky-500',    border: 'border-sky-600',    text: 'text-white', ring: 'ring-sky-400'    },
  { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-white', ring: 'ring-violet-400' },
  { bg: 'bg-emerald-500',border: 'border-emerald-600',text: 'text-white', ring: 'ring-emerald-400'},
  { bg: 'bg-amber-500',  border: 'border-amber-600',  text: 'text-white', ring: 'ring-amber-400'  },
  { bg: 'bg-rose-500',   border: 'border-rose-600',   text: 'text-white', ring: 'ring-rose-400'   },
  { bg: 'bg-teal-500',   border: 'border-teal-600',   text: 'text-white', ring: 'ring-teal-400'   },
  { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white', ring: 'ring-indigo-400' },
  { bg: 'bg-pink-500',   border: 'border-pink-600',   text: 'text-white', ring: 'ring-pink-400'   },
];

function jobColor(index: number) {
  return JOB_COLORS[index % JOB_COLORS.length];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekDays(anchorDate: Date): Date[] {
  const day = anchorDate.getDay(); // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day; // shift to Mon
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayHeader(d: Date): { weekday: string; date: string } {
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/** Given a job's scheduled_start, return the Date or null */
function jobDate(job: Job): Date | null {
  if (!job.scheduled_start) return null;
  try {
    return new Date(job.scheduled_start);
  } catch {
    return null;
  }
}

/** Derive a new ISO string keeping the same time-of-day but on targetDay */
function rebuildIso(original: string | null, targetDay: Date): string {
  const now = new Date();
  const base = original ? new Date(original) : now;
  const out = new Date(targetDay);
  out.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), 0);
  return out.toISOString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GanttDispatchView({ jobs, teamMembers }: GanttDispatchViewProps) {
  const toast = useToast();

  // Current week anchor
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date());
  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

  // Optimistic local copy of jobs (so the board updates instantly on drop)
  const [localJobs, setLocalJobs] = useState<Job[]>(jobs);

  // Keep in sync when parent re-renders with fresh server data (e.g. after router.refresh)
  const prevJobsRef = React.useRef(jobs);
  if (prevJobsRef.current !== jobs) {
    prevJobsRef.current = jobs;
    setLocalJobs(jobs);
  }

  // DnD state
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ techId: string | null; dayIndex: number } | null>(null);

  // ── Week navigation ─────────────────────────────────────────────────────────

  function prevWeek() {
    setWeekAnchor((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() - 7);
      return n;
    });
  }

  function nextWeek() {
    setWeekAnchor((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + 7);
      return n;
    });
  }

  function goToday() {
    setWeekAnchor(new Date());
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, jobId: string) => {
      setDraggedJobId(jobId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', jobId);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedJobId(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, techId: string | null, dayIndex: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ techId, dayIndex });
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, techId: string | null, dayIndex: number) => {
      e.preventDefault();
      const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
      setDraggedJobId(null);
      setDropTarget(null);

      if (!jobId) return;

      const targetDay = weekDays[dayIndex];
      const job = localJobs.find((j) => j.id === jobId);
      if (!job) return;

      // Skip if dropped on same day it's already on
      const existingDate = jobDate(job);
      if (existingDate && isSameDay(existingDate, targetDay)) return;

      // ── Optimistic update ───────────────────────────────────────────────────
      const newStart = rebuildIso(job.scheduled_start, targetDay);
      const newEnd = job.scheduled_end
        ? (() => {
            // Preserve original duration
            const origStart = job.scheduled_start ? new Date(job.scheduled_start) : null;
            const origEnd = new Date(job.scheduled_end);
            const durationMs = origStart ? origEnd.getTime() - origStart.getTime() : 0;
            return new Date(new Date(newStart).getTime() + durationMs).toISOString();
          })()
        : null;

      const prevJobs = localJobs;
      setLocalJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, scheduled_start: newStart, scheduled_end: newEnd }
            : j
        )
      );

      const dayLabel = targetDay.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // ── Persist ─────────────────────────────────────────────────────────────
      const res = await rescheduleJobAction(jobId, newStart, newEnd);

      if (res.success) {
        toast.success(
          'Job Rescheduled',
          `"${job.title}" moved to ${dayLabel}` +
            (newStart ? ` at ${formatTime(newStart)}` : '')
        );
      } else {
        // Rollback
        setLocalJobs(prevJobs);
        toast.error('Reschedule Failed', res.error || 'Could not update schedule.');
      }
    },
    [draggedJobId, localJobs, weekDays, toast]
  );

  // ── Build rows: one per technician + one "Unassigned" row ──────────────────

  const rows: { id: string | null; name: string; initials: string }[] = [
    ...teamMembers.map((m) => ({
      id: m.id,
      name: m.full_name || m.email || 'Unknown',
      initials: (m.full_name || m.email || '?').charAt(0).toUpperCase(),
    })),
    { id: null, name: 'Unassigned', initials: '?' },
  ];

  // ── Assign a stable colour to each job by its index in the full list ───────
  const jobColorMap = useMemo(() => {
    const map = new Map<string, (typeof JOB_COLORS)[number]>();
    localJobs.forEach((j, i) => map.set(j.id, jobColor(i)));
    return map;
  }, [localJobs]);

  // ── Filter jobs that fall on each day ─────────────────────────────────────

  function jobsForCell(techId: string | null, dayIndex: number): Job[] {
    const day = weekDays[dayIndex];
    return localJobs.filter((j) => {
      const matchTech =
        techId === null ? !j.assigned_to_user_id : j.assigned_to_user_id === techId;
      const d = jobDate(j);
      const matchDay = d ? isSameDay(d, day) : false;
      return matchTech && matchDay;
    });
  }

  // Jobs with no date yet (unscheduled pool)
  const unscheduledJobs = localJobs.filter((j) => !j.scheduled_start);

  const today = new Date();

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Weekly Dispatch Gantt
          </h3>
          <Badge variant="secondary" className="text-[10px] font-bold">
            {localJobs.filter((j) => j.scheduled_start).length} scheduled
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={prevWeek} className="h-8 w-8 p-0">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={goToday} className="h-8 px-3 text-xs font-bold">
            Today
          </Button>
          <Button size="sm" variant="outline" onClick={nextWeek} className="h-8 w-8 p-0">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
        <GripHorizontal className="w-3.5 h-3.5" />
        Drag job bars between days to reschedule • Changes persist automatically
      </p>

      {/* ── Gantt Grid (horizontal scroll on mobile) ─────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="min-w-[700px]">
          {/* ── Header Row: day labels ─────────────────────────────────────── */}
          <div className="grid bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800"
            style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
            {/* Left label column header */}
            <div className="p-3 border-r border-slate-200 dark:border-zinc-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Technician
              </span>
            </div>

            {/* Day headers */}
            {weekDays.map((day, di) => {
              const { weekday, date } = formatDayHeader(day);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={di}
                  className={`p-3 text-center border-r border-slate-200 dark:border-zinc-800 last:border-r-0 ${
                    isToday
                      ? 'bg-sky-500/10 dark:bg-sky-500/15'
                      : ''
                  }`}
                >
                  <p className={`text-[11px] font-black uppercase tracking-wider ${
                    isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-zinc-400'
                  }`}>
                    {weekday}
                  </p>
                  <p className={`text-xs font-bold mt-0.5 ${
                    isToday ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-zinc-200'
                  }`}>
                    {date}
                  </p>
                  {isToday && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[9px] font-black uppercase">
                      Today
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Technician Rows ─────────────────────────────────────────────── */}
          {rows.map((row) => (
            <div
              key={row.id ?? '__unassigned__'}
              className="grid border-b border-slate-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-colors"
              style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}
            >
              {/* Technician label */}
              <div className="p-3 border-r border-slate-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  row.id
                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'
                }`}>
                  {row.initials}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate max-w-[80px]">
                  {row.name}
                </span>
              </div>

              {/* Day cells */}
              {weekDays.map((day, di) => {
                const cellJobs = jobsForCell(row.id, di);
                const isToday = isSameDay(day, today);
                const isDropTarget =
                  dropTarget?.techId === row.id && dropTarget?.dayIndex === di;

                return (
                  <div
                    key={di}
                    onDragOver={(e) => handleDragOver(e, row.id, di)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, row.id, di)}
                    className={`relative p-1.5 min-h-[64px] border-r border-slate-100 dark:border-zinc-800/50 last:border-r-0 transition-all ${
                      isToday ? 'bg-sky-500/5 dark:bg-sky-500/10' : ''
                    } ${
                      isDropTarget
                        ? 'ring-2 ring-inset ring-sky-500 bg-sky-500/10 dark:bg-sky-500/15'
                        : ''
                    }`}
                  >
                    {/* Drop zone ghost highlight */}
                    {isDropTarget && (
                      <div className="absolute inset-1 rounded-lg border-2 border-dashed border-sky-500/60 pointer-events-none animate-pulse" />
                    )}

                    {/* Job bars */}
                    <div className="flex flex-col gap-1 relative z-10">
                      {cellJobs.map((job) => {
                        const color = jobColorMap.get(job.id) ?? JOB_COLORS[0];
                        const isDragging = draggedJobId === job.id;

                        return (
                          <div
                            key={job.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, job.id)}
                            onDragEnd={handleDragEnd}
                            title={`${job.title}\n${job.scheduled_start ? formatTime(job.scheduled_start) : 'Time TBD'}\nDrag to reschedule`}
                            className={`
                              group relative flex items-center gap-1.5 px-2 py-1 rounded-lg
                              border cursor-grab active:cursor-grabbing select-none
                              transition-all duration-150 shadow-sm
                              ${color.bg} ${color.border} ${color.text}
                              ${isDragging ? 'opacity-40 scale-95 shadow-none' : 'hover:shadow-md hover:-translate-y-0.5'}
                            `}
                          >
                            {/* Drag handle icon */}
                            <GripHorizontal className="w-2.5 h-2.5 opacity-60 shrink-0" />

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold leading-tight truncate">
                                {job.title}
                              </p>
                              {job.scheduled_start && (
                                <p className="text-[9px] opacity-80 flex items-center gap-0.5 mt-0.5">
                                  <Clock className="w-2 h-2" />
                                  {formatTime(job.scheduled_start)}
                                </p>
                              )}
                            </div>

                            {/* Job number badge */}
                            <Link
                              href={`/jobs/${job.id}`}
                              draggable={false}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 text-[9px] font-black bg-white/20 hover:bg-white/30 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Open job details"
                            >
                              {job.job_number}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Unscheduled Jobs Pool ─────────────────────────────────────────────── */}
      {unscheduledJobs.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Unscheduled Jobs ({unscheduledJobs.length}) — drag a job above to place it on the calendar
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduledJobs.map((job, i) => {
              const color = jobColorMap.get(job.id) ?? jobColor(i);
              const isDragging = draggedJobId === job.id;
              return (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border
                    cursor-grab active:cursor-grabbing select-none
                    transition-all shadow-sm
                    ${color.bg} ${color.border} ${color.text}
                    ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:-translate-y-0.5'}
                  `}
                >
                  <GripHorizontal className="w-3 h-3 opacity-60" />
                  <div>
                    <p className="text-[11px] font-bold leading-tight">{job.title}</p>
                    <p className="text-[9px] opacity-80">
                      {job.customer
                        ? `${(job.customer as any).first_name ?? ''} ${(job.customer as any).last_name ?? ''}`.trim()
                        : job.job_number}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────────────────── */}
      {localJobs.length === 0 && (
        <div className="py-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">No jobs scheduled yet</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
            Create a job and assign a scheduled start time to see it on the Gantt chart.
          </p>
          <Link href="/jobs/new" className="mt-4 inline-block">
            <Button size="sm" variant="outline" className="text-xs">
              Dispatch New Job
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
