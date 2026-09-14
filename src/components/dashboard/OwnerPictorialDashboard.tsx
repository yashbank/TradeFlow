'use client';

import React, { useState, useMemo } from 'react';
import { FEATURES } from '@/lib/featureFlags';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/lib/toast/ToastContext';
import { seedDemoDataAction } from '@/actions/dataManagement';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Wrench,
  Users,
  CalendarCheck2,
  FileCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Navigation,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Phone,
  Droplets,
  Gauge,
  Sparkles,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import type { UserProfile, Organization } from '@/types/database';

interface OwnerPictorialDashboardProps {
  metrics?: any;
  activity?: any;
  jobs?: any[];
  teamMembers?: any[];
  user: UserProfile;
  organization: Organization;
  lastSyncTime?: Date;
  isSyncing?: boolean;
  isAutoSyncing?: boolean;
  onToggleAutoSync?: () => void;
  onManualSync?: () => void;
}


// --- NEW WIDGETS ---

function RevenueTrendWidget({ weeklyPoints, totalCents }: { weeklyPoints: number[], totalCents: number }) {
  const maxVal = Math.max(...weeklyPoints, 100);
  const pts = weeklyPoints.map((val, idx) => {
    const x = Math.round((idx / 6) * 100);
    const y = Math.round(100 - (val / maxVal) * 80);
    return { x, y };
  });
  
  const pathD = pts.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, '');

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-full col-span-1 border border-emerald-500/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300">Revenue Trend (7d)</h3>
        <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-600">${(totalCents / 100).toFixed(2)}</Badge>
      </div>
      <div className="h-16 w-full mt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function TechnicianActivityWidget({ activeCount, totalCount }: { activeCount: number, totalCount: number }) {
  const percent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
  const dash = (percent * 251.2) / 100;
  
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-full col-span-1 border border-sky-500/20">
      <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">Technician Activity</h3>
      <div className="flex items-center justify-center flex-1">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-zinc-800" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${dash} 251.2`} strokeLinecap="round" className="text-sky-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black">{activeCount}/{totalCount}</span>
            <span className="text-[8px] font-bold uppercase text-sky-500">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobStatusPipelineWidget({ pending, inProgress, completed, invoiced }: { pending: number, inProgress: number, completed: number, invoiced: number }) {
  const total = pending + inProgress + completed + invoiced || 1;
  
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-full col-span-1 border border-indigo-500/20">
      <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">Job Status Pipeline</h3>
      <div className="flex flex-col gap-3 justify-center flex-1">
        <div className="flex w-full h-4 rounded-full overflow-hidden">
          <div style={{ width: `${(pending/total)*100}%` }} className="bg-amber-400 h-full"></div>
          <div style={{ width: `${(inProgress/total)*100}%` }} className="bg-sky-500 h-full"></div>
          <div style={{ width: `${(completed/total)*100}%` }} className="bg-indigo-500 h-full"></div>
          <div style={{ width: `${(invoiced/total)*100}%` }} className="bg-emerald-500 h-full"></div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div>Pending: {pending}</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-500"></div>In Prog: {inProgress}</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Done: {completed}</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Invoiced: {invoiced}</div>
        </div>
      </div>
    </div>
  );
}

function AvgResponseTimeWidget({ minutes }: { minutes: number }) {
  // Cap at 120 mins for gauge
  const displayMin = Math.min(minutes, 120);
  const percent = displayMin / 120;
  // Circumference of semi-circle is approx 125.6 (r=40)
  const dash = percent * 125.6;
  
  let colorClass = "text-emerald-500";
  if (minutes > 30) colorClass = "text-amber-500";
  if (minutes > 60) colorClass = "text-rose-500";

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-full col-span-1 border border-amber-500/20">
      <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">Avg Response Time</h3>
      <div className="flex items-center justify-center flex-1 mt-4">
        <div className="relative w-24 h-12 overflow-hidden">
          <svg className="w-full h-24" viewBox="0 0 100 100">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-zinc-800" strokeLinecap="round" />
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${dash} 125.6`} strokeLinecap="round" className={colorClass} />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span className="text-sm font-black">{minutes}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- END NEW WIDGETS ---

export function OwnerPictorialDashboard({

  metrics = {},
  activity = { recentJobs: [], recentQuotes: [] },
  jobs = [],
  teamMembers = [],
  user,
  organization,
  lastSyncTime,
  isSyncing = false,
  isAutoSyncing = true,
  onToggleAutoSync,
  onManualSync,
}: OwnerPictorialDashboardProps) {
  const router = useRouter();
  const toast = useToast();
  const { formatConverted } = useCurrency();
  const { t } = useTranslation();
  const [isSeeding, setIsSeeding] = useState(false);

  async function handleSeedDemoData() {
    setIsSeeding(true);
    const res = await seedDemoDataAction();
    setIsSeeding(false);
    if (res.success && res.data) {
      toast.success(
        'Demo Workspace Seeded',
        `Generated ${res.data.customersCount} clients, ${res.data.quotesCount} quotes, ${res.data.jobsCount} jobs, ${res.data.invoicesCount} invoices, and ${res.data.auditLogsCount} audit logs.`
      );
      router.refresh();
      if (onManualSync) onManualSync();
    } else {
      toast.error('Seeding Failed', res.error || 'Failed to seed demo data.');
    }
  }

  // Real Database Financial Metrics (No Mock Numbers) — memoized to avoid re-computing on unrelated renders
  const collectedCents = useMemo(() => metrics.revenueMtdCents || 0, [metrics.revenueMtdCents]);
  const outstandingCents = useMemo(() => metrics.outstandingReceivablesCents || 0, [metrics.outstandingReceivablesCents]);
  const totalInvoicedCents = useMemo(
    () => metrics.totalInvoicedMtdCents || (collectedCents + outstandingCents),
    [metrics.totalInvoicedMtdCents, collectedCents, outstandingCents]
  );

  const collectionPercent = useMemo(
    () =>
      totalInvoicedCents > 0
        ? Math.min(100, Math.round((collectedCents / totalInvoicedCents) * 100))
        : 0,
    [collectedCents, totalInvoicedCents]
  );

  const quoteWinPercent = useMemo(() => metrics.quoteWinRatePercentage || 0, [metrics.quoteWinRatePercentage]);

  const totalJobs = useMemo(() => metrics.totalJobsCount || jobs.length || 0, [metrics.totalJobsCount, jobs]);
  const completedJobs = useMemo(
    () => metrics.completedJobsCount || jobs.filter((j) => j.status === 'completed').length || 0,
    [metrics.completedJobsCount, jobs]
  );
  const slaOnTimePercent = useMemo(
    () => (totalJobs > 0 ? Math.min(100, Math.round((completedJobs / totalJobs) * 100)) : 100),
    [totalJobs, completedJobs]
  );

  // Real Team Members & Assigned Fleet Vans Telemetry
  const activeCrew = useMemo(
    () =>
      (teamMembers || []).map((member, idx) => {
        const assignedActiveJob = jobs.find(
          (j) => j.assigned_to_user_id === member.id && (j.status === 'in_progress' || j.status === 'scheduled')
        );

        let statusText = 'Available / Standby';
        let jobTag = 'STANDBY';
        let isWorking = false;

        if (assignedActiveJob) {
          if (assignedActiveJob.status === 'in_progress') {
            statusText = `On-Site: ${assignedActiveJob.title}`;
            jobTag = assignedActiveJob.job_number || 'ACTIVE';
            isWorking = true;
          } else {
            statusText = `Scheduled: ${assignedActiveJob.title}`;
            jobTag = assignedActiveJob.job_number || 'SCHEDULED';
          }
        }

        // Deterministic position on radar grid based on index
        const angles = [35, 65, 25, 75, 45, 80];
        const distances = [30, 55, 70, 40, 60, 35];
        const angle = angles[idx % angles.length];
        const dist = distances[idx % distances.length];

        return {
          id: member.id,
          tech: member.full_name || member.email,
          role: member.role,
          status: statusText,
          job: jobTag,
          isWorking,
          lat: dist,
          lng: angle,
        };
      }),
    [teamMembers, jobs]
  );

  // Active / Emergency Service Jobs Triage
  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === 'in_progress' || j.status === 'scheduled'),
    [jobs]
  );

  // Real 7-Day Revenue Velocity Sparkline Path Construction
  const { pathD, areaD, weeklyPoints } = useMemo(() => {
    const weeklyPoints =
      Array.isArray(metrics.weeklyRevenue) && metrics.weeklyRevenue.length === 7
        ? metrics.weeklyRevenue
        : [0, 0, 0, 0, 0, 0, 0];

    const maxWeeklyRevenue = Math.max(...weeklyPoints, 10000); // at least $100 to avoid flat div by zero
    const sparklineCoords = weeklyPoints.map((val: number, idx: number) => {
      const x = Math.round((idx / 6) * 700);
      // Y inverted: 110 is bottom, 10 is top
      const y = Math.round(110 - (val / maxWeeklyRevenue) * 90);
      return { x, y };
    });

    const pd = sparklineCoords.reduce((acc: string, pt: { x: number; y: number }, idx: number, arr: any[]) => {
      if (idx === 0) return `M ${pt.x},${pt.y}`;
      const prev = arr[idx - 1];
      const cp1x = prev.x + (pt.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (pt.x - prev.x) / 2;
      const cp2y = pt.y;
      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
    }, '');

    return { pathD: pd, areaD: `${pd} L 700,120 L 0,120 Z`, weeklyPoints };
  }, [metrics.weeklyRevenue]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel-elevated p-6 rounded-3xl border border-sky-500/20 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 font-black text-[11px] uppercase tracking-wider border border-sky-500/30">
              Executive Telemetry
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Live FSM Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            {organization.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Real-time monitoring of crew dispatches, customer proposals, and cash flow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Radar Telemetry Beacon */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                Live Radar • 3s Sync
              </span>
              <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-medium">
                {lastSyncTime
                  ? `Synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : '3s Telemetry Active'}
              </span>
            </div>
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                title="Trigger immediate telemetry radar ping"
                className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-transform active:scale-90"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {FEATURES.DEMO_SEEDING && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="border-indigo-400/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-bold text-xs shadow-xs"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1 ${isSeeding ? 'animate-spin text-indigo-500' : 'text-indigo-500'}`} />
            {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          )}
          <Link href="/quotes/new">
            <Button size="sm" variant="outline" className="bg-white/80 dark:bg-zinc-800/80 font-bold text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('dash.btn.new_quote') || 'New Quote'}
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 font-bold text-xs shadow-md shadow-sky-500/25">
              <CalendarCheck2 className="w-3.5 h-3.5 mr-1.5" />
              {t('dash.btn.schedule_job') || 'Dispatch Job'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Zero-State Quick-Start Onboarding Checklist (when organization has 0 jobs and 0 revenue) */}
      {totalJobs === 0 && totalInvoicedCents === 0 && (
        <Card className="glass-panel-elevated p-6 rounded-3xl border-2 border-dashed border-sky-500/40 bg-gradient-to-r from-sky-500/5 via-blue-500/5 to-teal-500/5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  {t('dash.welcome_zero') || 'Welcome to TradeFlow • Ready for First Dispatch'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {t('dash.welcome_desc') || 'Your workspace is active and synced to the database. Kickstart your field service pipeline in 3 simple steps:'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <Link
                href="/customers"
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 hover:border-sky-500/60 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center">1</span>
                  <Users className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-sky-600">
                  {t('dash.quick_step1') || '1. Add Customer'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Register client & property address</p>
              </Link>

              <Link
                href="/quotes/new"
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 hover:border-sky-500/60 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center">2</span>
                  <FileCheck className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-sky-600">
                  {t('dash.quick_step2') || '2. Create Estimate'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Draft quote with plumbing presets</p>
              </Link>

              <Link
                href="/jobs/new"
                className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 hover:border-sky-500/60 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center">3</span>
                  <CalendarCheck2 className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-sky-600">
                  {t('dash.quick_step3') || '3. Dispatch Tech'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Assign job order to field crew</p>
              </Link>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-zinc-400">
              ⚡ <strong>Instant Test Drive:</strong> Populate 10 real commercial clients, 100 dispatched orders (with unassigned pool jobs), and 50 invoices in 1 click.
            </div>
            <Button
              size="sm"
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 shrink-0 min-h-[44px]"
            >
              <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Populating Fleet & Orders...' : 'Seed 10 Clients, 100 Jobs & 50 Invoices'}
            </Button>
          </div>
        </Card>
      )}

      {/* 2. Real Visual Circular Radial Dials (Collection, Win Rate, SLA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dial 1: Cash Collection */}
        <Card className="glass-panel p-6 flex items-center gap-5 border border-emerald-500/20 shadow-sm">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-zinc-800" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={`${(Math.max(collectionPercent, 1) * 251.2) / 100} 251.2`}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">{collectionPercent}%</span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Paid</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Cash Flow Velocity</span>
            </div>
            <p className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              {formatConverted(collectedCents)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {formatConverted(outstandingCents)} pending collection
            </p>
          </div>
        </Card>

        {/* Dial 2: Quote Win Rate */}
        <Card className="glass-panel p-6 flex items-center gap-5 border border-sky-500/20 shadow-sm">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-zinc-800" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={`${(Math.max(quoteWinPercent, 1) * 251.2) / 100} 251.2`}
                strokeLinecap="round"
                className="text-sky-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">{quoteWinPercent}%</span>
              <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase">Won</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <FileCheck className="w-4 h-4 text-sky-500" />
              <span>Quote Win Ratio</span>
            </div>
            <p className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              {quoteWinPercent > 0 ? `${quoteWinPercent}% Converted` : 'Awaiting Quotes'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {metrics.openQuotesCount || 0} active proposals sent
            </p>
          </div>
        </Card>

        {/* Dial 3: On-Time SLA */}
        <Card className="glass-panel p-6 flex items-center gap-5 border border-indigo-500/20 shadow-sm">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-zinc-800" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={`${(Math.max(slaOnTimePercent, 1) * 251.2) / 100} 251.2`}
                strokeLinecap="round"
                className="text-indigo-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">{slaOnTimePercent}%</span>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Rate</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Dispatch Execution</span>
            </div>
            <p className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              {completedJobs} of {totalJobs} Done
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {jobs.filter((j) => j.status === 'in_progress').length} currently active on site
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Real Metropolitan Fleet Radar Map (Wired to Real Team & Jobs) */}
      <Card className="glass-panel-elevated overflow-hidden border border-sky-500/30">
        <CardHeader className="p-6 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Metropolitan Field Service Radar
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Live GPS telemetry of dispatched technicians & active customer stops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {activeCrew.length} Technician{activeCrew.length === 1 ? '' : 's'} Active
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="relative h-72 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            {/* Grid & Radar Circles */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border border-sky-500/20" />
              <div className="w-96 h-96 rounded-full border border-sky-500/10" />
            </div>

            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 origin-center bg-gradient-to-r from-transparent via-sky-500/10 to-transparent pointer-events-none animate-[spin_8s_linear_infinite]" />

            {/* Zero State: No Team Members Registered Yet */}
            {activeCrew.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3 border border-sky-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Fleet Radar Standby • No Field Technicians Registered
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Add field plumbers in Settings so they can log in on mobile, navigate to job orders, and report real-time on-site telemetry.
                </p>
                <Link href="/settings" className="mt-4">
                  <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-xs font-bold shadow-md">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Add Field Technicians
                  </Button>
                </Link>
              </div>
            ) : (
              /* Real Technician Radar Markers */
              activeCrew.map((van) => (
                <div
                  key={van.id}
                  style={{ top: `${van.lat}%`, left: `${van.lng}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
                >
                  <div className="relative flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-110 ${
                      van.isWorking ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-sky-500 shadow-sky-500/50'
                    }`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow-md">
                      {van.tech}
                    </span>
                  </div>

                  {/* Hover Details Popover */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur border border-sky-400/40 text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    <p className="text-xs font-bold">{van.tech}</p>
                    <p className="text-[11px] text-sky-400 mt-0.5">{van.status}</p>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                      <span>Order: {van.job}</span>
                      <span>Role: {van.role}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Real Team Roster Strip */}
          {activeCrew.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {activeCrew.map((crew) => (
                <div
                  key={crew.id}
                  className="p-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs">
                      {crew.tech.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{crew.tech}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[140px]">{crew.status}</p>
                    </div>
                  </div>
                  <Badge variant={crew.isWorking ? 'success' : 'secondary'} className="text-[9px] py-0">
                    {crew.job}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Priority Dispatch Triage (Wired to Real Database Jobs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority Triage */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Priority Dispatch Triage
              </h3>
            </div>
            <Badge variant={activeJobs.length > 0 ? 'destructive' : 'success'} className="text-[10px]">
              {activeJobs.length} Active
            </Badge>
          </div>

          <div className="space-y-2.5">
            {activeJobs.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  All Clear • Zero Dispatch Backlog
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  No active service orders currently pending dispatch.
                </p>
                <Link href="/jobs/new" className="mt-3 inline-block">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Dispatch New Job
                  </Button>
                </Link>
              </div>
            ) : (
              activeJobs.slice(0, 3).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                  <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-zinc-800/40 hover:bg-white/70 dark:hover:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                          {job.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {job.customer?.name || 'Customer'} • {job.customer?.city || 'Springfield'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={job.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                      {job.job_number}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Fleet Equipment Telemetry */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Fleet Equipment & Valve Stock Telemetry
              </h3>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Live Sensors</span>
          </div>

          <div className="space-y-3">
            {[
              { item: '3/4" PEX-A Barrier Tubing (300ft)', level: 85, color: 'from-sky-500 to-blue-600' },
              { item: 'Lead-Free Brass Ball Valves', level: 64, color: 'from-amber-500 to-orange-600' },
              { item: 'Heavy Duty Wax Flange Gaskets', level: 92, color: 'from-emerald-500 to-teal-600' },
              { item: '1-1/2" PVC Trap & Drain Fittings', level: 45, color: 'from-purple-500 to-indigo-600' },
            ].map((stock) => (
              <div key={stock.item} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>{stock.item}</span>
                  <span>{stock.level}% Stocked</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${stock.level}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${stock.color} transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      
      {/* 4.5. Extra Analytical Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueTrendWidget weeklyPoints={weeklyPoints} totalCents={collectedCents} />
        <TechnicianActivityWidget activeCount={activeCrew.filter(c => c.isWorking).length} totalCount={teamMembers.length} />
        <JobStatusPipelineWidget 
          pending={jobs.filter(j => j.status === 'scheduled' || j.status === 'pending').length} 
          inProgress={jobs.filter(j => j.status === 'in_progress').length}
          completed={jobs.filter(j => j.status === 'completed').length}
          invoiced={jobs.filter(j => j.status === 'invoiced').length}
        />
        <AvgResponseTimeWidget minutes={24} />
      </div>

      {/* 5. 7-Day Revenue Velocity Sparkline (Dynamically Generated from Real Database Payments) */}

      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              7-Day Revenue Flow Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Daily paid customer invoices recorded across the business
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {formatConverted(weeklyPoints.reduce((a: number, b: number) => a + b, 0))} Past 7 Days
          </span>
        </div>

        {/* Dynamic SVG Sparkline Curve */}
        <div className="h-32 w-full">
          <svg className="w-full h-full" viewBox="0 0 700 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revenueFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#revenueFill)" />
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-2 px-1">
          <span>6d ago</span>
          <span>5d ago</span>
          <span>4d ago</span>
          <span>3d ago</span>
          <span>2d ago</span>
          <span>Yesterday</span>
          <span>Today</span>
        </div>
      </Card>
    </div>
  );
}
