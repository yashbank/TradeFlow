'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/toast/ToastContext';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { updateJobStatusAction } from '@/actions/jobs';
import {
  Navigation,
  Phone,
  MapPin,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  Flame,
  Wrench,
  Check,
  Calendar,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import type { UserProfile, Organization } from '@/types/database';

interface TechnicianFieldPortalProps {
  myJobs?: any[];
  user: UserProfile;
  organization: Organization;
}

export function TechnicianFieldPortal({
  myJobs = [],
  user,
  organization,
}: TechnicianFieldPortalProps) {
  const toast = useToast();
  const { formatConverted } = useCurrency();

  // Swiggy/Zomato style duty toggle
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Active Job selection (default to first scheduled or in_progress job)
  const activeJobs = myJobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');
  const [selectedJobId, setSelectedJobId] = useState<string>(activeJobs[0]?.id || myJobs[0]?.id || '');

  const activeJob = myJobs.find((j) => j.id === selectedJobId) || activeJobs[0] || myJobs[0];

  // Field delivery states: 'scheduled' -> 'en_route' -> 'arrived' -> 'in_progress' -> 'completed'
  const [fieldState, setFieldState] = useState<'scheduled' | 'en_route' | 'arrived' | 'in_progress' | 'completed'>(
    activeJob?.status === 'in_progress' ? 'in_progress' : 'scheduled'
  );

  // Labor stopwatch timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Parts logged for this job
  const [loggedParts, setLoggedParts] = useState<{ name: string; priceCents: number; qty: number }[]>([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Quick Parts catalog
  const COMMON_PARTS = [
    { name: 'Wax Ring Toilet Gasket', priceCents: 1800 },
    { name: '3/4" Brass PEX Ball Valve', priceCents: 3200 },
    { name: 'PVC 1-1/2" P-Trap Kit', priceCents: 2400 },
    { name: '10ft PEX Water Line (Blue)', priceCents: 2800 },
    { name: 'Braided Steel Faucet Supply', priceCents: 1600 },
  ];

  function addPart(part: { name: string; priceCents: number }) {
    setLoggedParts((prev) => {
      const existing = prev.find((p) => p.name === part.name);
      if (existing) {
        return prev.map((p) => (p.name === part.name ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { ...part, qty: 1 }];
    });
    toast.success('Part Added', `${part.name} logged.`);
  }

  // Address and Navigation details
  const customer = activeJob?.customer;
  const customerAddress = customer
    ? `${customer.address_line1 || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.postal_code || ''}`.trim()
    : '742 Evergreen Terrace, Springfield, OR';

  const customerPhone = customer?.phone || '(555) 019-2834';
  const customerName = customer?.name || 'Homeowner';

  // Navigation URL for native GPS
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}`;

  async function handleEnRoute() {
    setFieldState('en_route');
    toast.info('En Route Dispatched', `Traveling to ${customerName}. Estimated arrival: 8 mins.`);
    if (activeJob?.id) {
      await updateJobStatusAction(activeJob.id, 'in_progress', 'Technician en route to location.');
    }
  }

  function handleArrived() {
    setFieldState('arrived');
    toast.success('Arrived on Site', `Checked in at ${customerAddress}.`);
  }

  function handleStartWork() {
    setFieldState('in_progress');
    setTimerRunning(true);
    toast.success('Work Started', 'Labor timer running. You are on the clock.');
  }

  async function handleCompleteJob() {
    if (!activeJob?.id) {
      toast.success('Job Marked Completed', 'Work order finished successfully.');
      setFieldState('completed');
      setTimerRunning(false);
      return;
    }

    setIsUpdating(true);
    const summaryNotes = `Technician: ${user.full_name}\nLabor Duration: ${formatStopwatch(timerSeconds)}\nParts Used: ${loggedParts.map((p) => `${p.qty}x ${p.name}`).join(', ') || 'None'}\nField Notes: ${completionNotes || 'Job completed smoothly.'}`;

    const res = await updateJobStatusAction(activeJob.id, 'completed', summaryNotes);
    setIsUpdating(false);

    if (res.success) {
      setFieldState('completed');
      setTimerRunning(false);
      toast.success('Job Complete!', `Work order ${activeJob.job_number || 'J-2025'} completed and synced with Dispatch.`);
    } else {
      toast.error('Error', res.error || 'Failed to update job status.');
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* 1. Swiggy/Zomato Delivery Partner Top Duty Card */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-sky-500/20 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              isOnDuty ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'bg-slate-400 dark:bg-zinc-700'
            }`}>
              <Wrench className="w-6 h-6" />
            </div>
            {isOnDuty && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                {user.full_name}
              </h2>
              <Badge variant={isOnDuty ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider">
                {isOnDuty ? '⚡ Ready for Dispatch' : 'Offline'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Field Technician • {organization.name}
            </p>
          </div>
        </div>

        {/* Duty Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsOnDuty(!isOnDuty);
              toast.info(isOnDuty ? 'Shift Paused' : 'Shift Active', isOnDuty ? 'You are marked offline.' : 'You are marked on duty for dispatch.');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 ${
              isOnDuty
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isOnDuty ? 'Online • Accepting Orders' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* 2. Swiggy/Zomato-Style Live Route Map Card */}
      <Card className="glass-panel-elevated overflow-hidden border border-sky-500/30">
        <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden select-none">
          {/* Stylized Vector Map Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

          {/* Road Polyline (SVG Route Map) */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Road lines */}
            <path d="M 0,200 Q 150,180 300,120 T 600,80 T 900,40" fill="none" stroke="#1e293b" strokeWidth="24" strokeLinecap="round" />
            <path d="M 0,200 Q 150,180 300,120 T 600,80 T 900,40" fill="none" stroke="#334155" strokeWidth="18" strokeLinecap="round" />
            {/* Active Route Polyline */}
            <path
              d="M 60,190 Q 180,170 320,115 T 620,75"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="6"
              strokeDasharray="8 6"
              strokeLinecap="round"
              className="animate-pulse"
            />
          </svg>

          {/* Van Position (Origin) */}
          <div className="absolute left-[60px] top-[170px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center animate-bounce">
            <div className="bg-sky-500 text-white p-2 rounded-2xl shadow-lg shadow-sky-500/50 border-2 border-white">
              <Navigation className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded-full mt-1 border border-sky-400/40">
              Your Van
            </span>
          </div>

          {/* Destination Marker (Client Site) */}
          <div className="absolute right-[18%] top-[60px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/50 border-2 border-white animate-pulse">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full animate-ping" />
            </div>
            <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2.5 py-0.5 rounded-full mt-1 border border-rose-400/40 whitespace-nowrap">
              {customerName}
            </span>
          </div>

          {/* Delivery ETA Pill Overlay */}
          <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-white/20 text-white px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-xs font-black tracking-tight flex items-center gap-1.5">
                <span>8 mins</span>
                <span className="text-slate-400">•</span>
                <span>2.4 mi</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">Fastest Route • Normal Traffic</p>
            </div>
          </div>

          {/* GPS Quick Action Overlay */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-sky-500/40 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Compass className="w-4 h-4 animate-spin" />
              Start GPS Navigation
            </a>
          </div>
        </div>

        {/* Customer Stop Card & Quick Contact */}
        <div className="p-5 bg-white/95 dark:bg-zinc-900/95 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Stop #1 of {myJobs.length || 1}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {activeJob?.job_number || 'J-2025-001'}
              </span>
              {activeJob?.title?.toLowerCase().includes('emergency') && (
                <Badge variant="destructive" className="text-[10px] py-0">
                  Emergency
                </Badge>
              )}
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 mt-0.5">
              {activeJob?.title || 'Emergency Leak Inspection & Pipe Repair'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              {customerAddress}
            </p>
          </div>

          {/* Quick Action Dial & Direction Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${customerPhone}`}
              className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Phone className="w-4 h-4" />
              Call Customer
            </a>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </a>
          </div>
        </div>
      </Card>

      {/* 3. Swiggy/Zomato Step-by-Step Delivery Action Stepper */}
      <Card className="glass-panel text-card-foreground">
        <CardHeader className="p-5 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500" />
            Field Dispatch Action Steps
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Action Step Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleEnRoute}
              className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                fieldState === 'en_route'
                  ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/30'
                  : 'bg-white/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>1. En Route</span>
                {fieldState === 'en_route' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-[11px] font-normal opacity-80">Drive to client location</p>
            </button>

            <button
              type="button"
              onClick={handleArrived}
              className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                fieldState === 'arrived'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30'
                  : 'bg-white/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>2. Arrived on Site</span>
                {fieldState === 'arrived' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-[11px] font-normal opacity-80">Check in at property</p>
            </button>

            <button
              type="button"
              onClick={handleStartWork}
              className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                fieldState === 'in_progress'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/30'
                  : 'bg-white/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>3. In Progress</span>
                {fieldState === 'in_progress' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-[11px] font-normal opacity-80">Labor stopwatch ticking</p>
            </button>

            <button
              type="button"
              onClick={handleCompleteJob}
              disabled={isUpdating}
              className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                fieldState === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>4. Complete Order</span>
                {fieldState === 'completed' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-[11px] font-normal opacity-80">Finish & notify dispatch</p>
            </button>
          </div>

          {/* Live Labor Timer & Parts Logger (when In Progress) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Stopwatch */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  On-Site Labor Stopwatch
                </span>
                {timerRunning && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Recording
                  </span>
                )}
              </div>

              <div className="my-3 text-center">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-sky-300">
                  {formatStopwatch(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    timerRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {timerRunning ? 'Pause Stopwatch' : 'Start Stopwatch'}
                </button>
                <button
                  type="button"
                  onClick={() => setTimerSeconds(0)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Parts Logger */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-800/40 space-y-2.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-indigo-500" />
                Quick-Add Truck Parts Used
              </span>

              <div className="flex flex-wrap gap-1.5">
                {COMMON_PARTS.map((part) => (
                  <button
                    key={part.name}
                    type="button"
                    onClick={() => addPart(part)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 shadow-2xs transition-all active:scale-95"
                  >
                    + {part.name} ({formatConverted(part.priceCents)})
                  </button>
                ))}
              </div>

              {loggedParts.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">Logged to Order:</p>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {loggedParts.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600 dark:text-zinc-400 text-[11px]">
                        <span>{p.qty}x {p.name}</span>
                        <span className="font-mono font-bold">{formatConverted(p.priceCents * p.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Completion Notes & Final Sign Off */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
              Technician Field Completion Notes & Work Summary
            </label>
            <textarea
              rows={2}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Replaced leaking wax gasket and flange bolts, cleared drain line, tested water pressure to 65 PSI. Customer verified zero leaks."
              className="w-full rounded-xl border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleCompleteJob}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 min-h-[42px] px-6"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isUpdating ? 'Completing Work Order...' : 'Submit & Complete Work Order'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Today's Assigned Stops Timeline */}
      <Card className="glass-panel text-card-foreground">
        <CardHeader className="p-5 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            Today&apos;s Dispatch Route ({myJobs.length} Stops)
          </CardTitle>
          <span className="text-xs text-slate-500">
            {myJobs.filter((j) => j.status === 'completed').length} / {myJobs.length} Completed
          </span>
        </CardHeader>

        <CardContent className="p-5">
          {myJobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No jobs assigned to your queue today. You are ready for incoming dispatches.
            </div>
          ) : (
            <div className="space-y-3">
              {myJobs.map((job, idx) => {
                const isCurrent = job.id === selectedJobId;
                const isDone = job.status === 'completed';

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setFieldState(job.status === 'completed' ? 'completed' : 'scheduled');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-sky-500/80 bg-sky-50/50 dark:bg-sky-950/40 shadow-xs'
                        : 'border-slate-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-800/40 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                      }`}>
                        {isDone ? <Check className="w-4 h-4" /> : `#${idx + 1}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            {job.title}
                          </h4>
                          <Badge variant={isDone ? 'success' : isCurrent ? 'default' : 'secondary'} className="text-[9px] py-0 px-1.5">
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {job.customer?.name} • {job.customer?.city || 'Springfield'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400">
                        {job.job_number}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
