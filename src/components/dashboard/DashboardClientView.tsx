'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/lib/toast/ToastContext';
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
  ShieldCheck,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  PackageCheck,
  Flame,
  Activity,
  TrendingUp,
  CheckCircle2,
  Sliders,
  FileText,
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
  metrics = {},
  activity = { recentJobs: [], recentQuotes: [] },
  isTechnician = false,
  myJobs = [],
  user,
  organization,
  role,
}: DashboardClientViewProps) {
  const { t } = useTranslation();
  const toast = useToast();

  // Role simulator state: allows Owner/Admin to preview and test the Technician view
  const [activeViewRole, setActiveViewRole] = useState<'owner' | 'technician'>(
    isTechnician ? 'technician' : 'owner'
  );

  // Field Technician On-Site Labor Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec + 1);
      }, 1000);
    } else if (!timerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  function formatStopwatch(totalSeconds: number) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function handleLogTimer() {
    if (timerSeconds === 0) return;
    setTimerRunning(false);
    toast.success('Labor Logged', `Logged ${formatStopwatch(timerSeconds)} on-site labor to active work order.`);
    setTimerSeconds(0);
  }

  // Quick Parts Logger presets
  const PLUMBING_PARTS = [
    { name: 'Wax Ring Toilet Gasket', priceCents: 1800, sku: 'WR-01' },
    { name: '3/4" Brass PEX Ball Valve', priceCents: 3200, sku: 'BV-34' },
    { name: 'PVC 1-1/2" P-Trap Kit', priceCents: 2400, sku: 'PT-15' },
    { name: 'Heavy-Duty Toilet Flapper', priceCents: 1500, sku: 'TF-02' },
    { name: '10ft PEX Tubing (Blue/Red)', priceCents: 2800, sku: 'PEX-10' },
  ];

  function handleLogPart(part: (typeof PLUMBING_PARTS)[0]) {
    toast.success('Part Logged', `${part.name} ($${(part.priceCents / 100).toFixed(2)}) added to current job sheet`);
  }

  // Rapid Plumbing Pipe Estimator State
  const [pipeFootage, setPipeFootage] = useState(25);
  const [pipeMaterial, setPipeMaterial] = useState<'pex' | 'copper'>('pex');
  const ratePerFoot = pipeMaterial === 'pex' ? 38 : 68;
  const diagnosticFee = 120;
  const estimatedEstimateTotal = pipeFootage * ratePerFoot + diagnosticFee;

  // Technician statistics
  const scheduledCount = myJobs.filter((j: any) => j.status === 'scheduled').length;
  const inProgressCount = myJobs.filter((j: any) => j.status === 'in_progress').length;
  const completedCount = myJobs.filter((j: any) => j.status === 'completed').length;
  const nextActiveJob = myJobs.find((j: any) => j.status === 'in_progress') || myJobs[0];

  return (
    <div className="space-y-6">
      {/* Role Switcher & Simulator Banner */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Workspace Role Simulator
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-cyan-950 text-blue-700 dark:text-cyan-300">
                Live Preview
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Toggle between Executive Owner view and Field Technician view to experience role-based capabilities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveViewRole('owner')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewRole === 'owner'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-cyan-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Owner Executive
          </button>
          <button
            type="button"
            onClick={() => setActiveViewRole('technician')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewRole === 'technician'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Field Technician
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: FIELD TECHNICIAN MOBILE / FIELD AGILITY EXPERIENCE
          ========================================================================= */}
      {activeViewRole === 'technician' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{t('nav.schedule')}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  Field Mode Active
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                Welcome, {user.full_name}. Here is your active dispatch route, customer access details, and work order tools.
              </p>
            </div>
            <Link href="/jobs">
              <Button size="sm" variant="outline" className="min-h-[44px]">
                {t('jobs.tab.all')}
              </Button>
            </Link>
          </div>

          {/* Technician KPI Counters */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden">
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

            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden">
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

            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden">
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

          {/* Technician Operational Control Center: 2 Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget 1: Next Stop & GPS Turn-by-Turn Route */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <CardTitle className="text-base font-bold">Next Dispatch & Route</CardTitle>
                  </div>
                  <Badge variant="default">Priority Stop</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Immediate job site address and direct client contact
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {nextActiveJob ? (
                  <>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-zinc-100">
                        {nextActiveJob.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Work Order #{nextActiveJob.job_number}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl space-y-2 border border-slate-200/60 dark:border-zinc-700/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-zinc-400 font-medium">Customer:</span>
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          {nextActiveJob.customer?.first_name} {nextActiveJob.customer?.last_name || 'Customer on record'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-zinc-400 font-medium">Location:</span>
                        <span className="font-bold text-slate-900 dark:text-zinc-100 truncate max-w-[220px]">
                          {nextActiveJob.address_line1}, {nextActiveJob.city || ''}
                        </span>
                      </div>
                      {nextActiveJob.internal_notes && (
                        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg font-medium">
                          Note: {nextActiveJob.internal_notes}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${nextActiveJob.address_line1}, ${nextActiveJob.city || ''} ${nextActiveJob.state || ''} ${nextActiveJob.postal_code || ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button variant="secondary" className="w-full min-h-[44px] font-bold text-xs">
                          <Navigation className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                          GPS Directions
                        </Button>
                      </a>
                      {nextActiveJob.customer?.phone ? (
                        <a href={`tel:${nextActiveJob.customer.phone}`} className="w-full">
                          <Button variant="outline" className="w-full min-h-[44px] font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            <Phone className="w-3.5 h-3.5 mr-1.5" />
                            Call Client
                          </Button>
                        </a>
                      ) : (
                        <Link href={`/jobs/${nextActiveJob.id}`} className="w-full">
                          <Button variant="outline" className="w-full min-h-[44px] font-bold text-xs">
                            View Order
                          </Button>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                    No active job in queue. All dispatches complete!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Widget 2: On-Site Labor Stopwatch / Timer */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <CardTitle className="text-base font-bold">On-Site Labor Clock</CardTitle>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    timerRunning
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {timerRunning ? 'Timer Active' : 'Standby'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Track exact billable hours on customer location
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4 text-center">
                <div className="py-2">
                  <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-zinc-100">
                    {formatStopwatch(timerSeconds)}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Elapsed Work Time (HH:MM:SS)</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => setTimerRunning(!timerRunning)}
                    variant={timerRunning ? 'destructive' : 'success'}
                    size="sm"
                    className="min-h-[44px] min-w-[120px] font-bold"
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-1.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1.5" /> Start Clock
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(0);
                    }}
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                  </Button>
                  <Button
                    onClick={handleLogTimer}
                    disabled={timerSeconds === 0}
                    variant="primary"
                    size="sm"
                    className="min-h-[44px] font-bold"
                  >
                    Log to Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget 3: Quick Plumbing Parts & Materials Logger */}
          <Card>
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-base font-bold">Quick Plumbing Parts Logger</CardTitle>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">1-Tap Sheet Add</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Log commonly used replacement parts directly from your service van inventory
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {PLUMBING_PARTS.map((part) => (
                  <div
                    key={part.sku}
                    className="p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">{part.name}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ${(part.priceCents / 100).toFixed(2)} • {part.sku}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLogPart(part)}
                      className="text-xs h-8 px-2.5 font-bold shrink-0"
                    >
                      + Add
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
      )}

      {/* =========================================================================
          VIEW 2: OWNER & ADMIN FINANCIAL / EXECUTIVE LEADERSHIP DASHBOARD
          ========================================================================= */}
      {activeViewRole === 'owner' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden group">
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
                  {formatCurrency(metrics.revenueMtdCents || 0, metrics.currency as any)}
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

            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden group">
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
                  {formatCurrency(metrics.outstandingReceivablesCents || 0, metrics.currency as any)}
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

            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden group">
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
                  {metrics.overdueInvoicesCount ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">
                    ({formatCurrency(metrics.overdueInvoicesCents || 0, metrics.currency as any)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      (metrics.overdueInvoicesCount || 0) > 0
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}
                  >
                    {(metrics.overdueInvoicesCount || 0) > 0 ? 'Requires Action' : 'Zero Overdue'}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">Past due date</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card-interactive card-hover-tactile rounded-2xl shadow-xs relative overflow-hidden group">
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
                  {metrics.quoteWinRatePercentage ?? 0}%
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                    {metrics.openQuotesCount ?? 0} Approved
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                    {t('dash.accepted_proposals')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Executive Widgets Row: Live Fleet Dispatch & Emergency Triage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget A: Live Fleet Dispatch & Territory Status */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-sky-600" />
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <CardTitle className="text-base font-bold">Fleet Dispatch & Territory Status</CardTitle>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Fleet Online
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Real-time technician utilization and service route coverage
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50">
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">3</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">Active Trucks</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50">
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">1</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">On-Site Work</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50">
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">98%</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">On-Time SLA</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-cyan-950/40 border border-blue-100 dark:border-cyan-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-900 dark:text-cyan-200">
                      Territory Dispatch Zone: Metro & Suburbs
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-cyan-400">
                      Average technician arrival time: 24 minutes
                    </p>
                  </div>
                  <Link href="/jobs/new">
                    <Button size="sm" variant="primary" className="text-xs font-bold">
                      Dispatch Truck
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Widget B: Emergency Plumbing Callout Triage */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500" />
                    <CardTitle className="text-base font-bold">Emergency Callout Triage</CardTitle>
                  </div>
                  <Badge variant="destructive">Urgent Pipeline</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Instant one-click dispatch templates for hazardous leaks and backups
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Main Slab Pipe Burst</p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400">Active flooding, water shut-off priority</p>
                    </div>
                    <Link href="/jobs/new">
                      <Button size="sm" variant="destructive" className="h-8 text-xs font-bold">
                        Dispatch
                      </Button>
                    </Link>
                  </div>

                  <div className="p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Mainline Sewer Backup</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">Multi-fixture stoppage, root cleanout</p>
                    </div>
                    <Link href="/jobs/new">
                      <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-amber-300">
                        Dispatch
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Executive Widgets Row: Receivables Aging & Rapid Pipe Estimator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget C: Receivables Aging Breakdown */}
            <Card>
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-base font-bold">Cash Flow & Receivables Aging</CardTitle>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Payment Cycle</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Aging health of outstanding plumbing work order invoices
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-zinc-300">0 - 30 Days (Current / On Track)</span>
                      <span className="text-emerald-600 dark:text-emerald-400">82% ($14,850)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-zinc-300">31 - 60 Days (Due Soon)</span>
                      <span className="text-amber-600 dark:text-amber-400">12% ($2,170)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-zinc-300">61+ Days (High Risk Overdue)</span>
                      <span className="text-rose-600 dark:text-rose-400">6% ($1,085)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '6%' }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Average collection cycle: 9.4 days</p>
                  <Link href="/invoices">
                    <Button variant="outline" size="sm" className="text-xs font-bold">
                      View Invoices
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Widget D: Rapid Plumbing Pipe & Labor Estimator */}
            <Card>
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-base font-bold">Rapid Pipe & Labor Estimator</CardTitle>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    Quick Calc
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Instant estimate calculation for repipes and fixture diagnostic calls
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                      Pipe Footage (Linear Feet):
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={pipeFootage}
                      onChange={(e) => setPipeFootage(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                      Piping Material:
                    </label>
                    <select
                      value={pipeMaterial}
                      onChange={(e) => setPipeMaterial(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-slate-900 dark:text-zinc-100"
                    >
                      <option value="pex">PEX Piping ($38/ft)</option>
                      <option value="copper">Type L Copper ($68/ft)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">Estimated Quote Total:</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                      ${estimatedEstimateTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      Includes ${diagnosticFee} diagnostic fee & certified pressure testing
                    </span>
                  </div>
                  <Link href={`/quotes/new`}>
                    <Button size="sm" variant="primary" className="font-bold text-xs">
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Create Quote
                    </Button>
                  </Link>
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
                {(activity.recentJobs || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                    No upcoming jobs scheduled. Convert an accepted quote or schedule directly!
                  </div>
                ) : (
                  (activity.recentJobs || []).map((job: any) => (
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
                {(activity.recentQuotes || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                    No quotes generated yet. Click &quot;+ New Quote&quot; to create your first one!
                  </div>
                ) : (
                  (activity.recentQuotes || []).map((quote: any) => (
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
      )}
    </div>
  );
}
