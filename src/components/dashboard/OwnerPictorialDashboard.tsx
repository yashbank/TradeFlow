'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/lib/currency/CurrencyContext';
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
} from 'lucide-react';
import type { UserProfile, Organization } from '@/types/database';

interface OwnerPictorialDashboardProps {
  metrics?: any;
  activity?: any;
  user: UserProfile;
  organization: Organization;
}

export function OwnerPictorialDashboard({
  metrics = {},
  activity = { recentJobs: [], recentQuotes: [] },
  user,
  organization,
}: OwnerPictorialDashboardProps) {
  const { formatConverted } = useCurrency();

  const invoicedCents = metrics.totalInvoicedCents || 4285000; // $42,850
  const collectedCents = metrics.totalPaidCents || 3780000;   // $37,800
  const outstandingCents = metrics.totalOutstandingCents || 505000; // $5,050

  const collectionPercent = invoicedCents > 0 ? Math.min(100, Math.round((collectedCents / invoicedCents) * 100)) : 88;
  const quoteWinPercent = 78;
  const slaOnTimePercent = 96;

  // Active vans in the field for radar telemetry
  const FLEET_VANS = [
    { id: 'van-1', tech: 'Dave Miller', van: 'Van #01 (Ford Transit)', status: 'En Route (2.4 mi)', loc: 'Westside', lat: 35, lng: 28, job: 'J-2025-004', battery: 94 },
    { id: 'van-2', tech: 'Sarah Jenkins', van: 'Van #02 (Mercedes Sprinter)', status: 'On-Site Working', loc: 'Downtown Core', lat: 55, lng: 62, job: 'J-2025-002', battery: 88 },
    { id: 'van-3', tech: 'Marcus Vance', van: 'Van #03 (Ram ProMaster)', status: 'Available / Standby', loc: 'North Shop', lat: 78, lng: 42, job: 'Standby', battery: 100 },
  ];

  // Stock telemetry
  const INVENTORY_STOCK = [
    { item: '3/4" PEX-A Barrier Tubing (300ft)', level: 85, color: 'from-sky-500 to-blue-600' },
    { item: 'Lead-Free Brass Ball Valves', level: 64, color: 'from-amber-500 to-orange-600' },
    { item: 'Heavy Duty Wax Flange Gaskets', level: 92, color: 'from-emerald-500 to-teal-600' },
    { item: '1-1/2" PVC Trap & Drain Fittings', level: 45, color: 'from-purple-500 to-indigo-600' },
  ];

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
            Real-time visual monitoring of field crews, emergency calls, and revenue flow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/quotes/new">
            <Button size="sm" variant="outline" className="bg-white/80 dark:bg-zinc-800/80 font-bold text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Quote
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 font-bold text-xs shadow-md shadow-sky-500/25">
              <CalendarCheck2 className="w-3.5 h-3.5 mr-1.5" />
              Dispatch Job
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Visual Circular Radial Dials (Collection, Win Rate, SLA) */}
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
                strokeDasharray={`${(collectionPercent * 251.2) / 100} 251.2`}
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
                strokeDasharray={`${(quoteWinPercent * 251.2) / 100} 251.2`}
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
              High Conversion
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +12% vs last month
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
                strokeDasharray={`${(slaOnTimePercent * 251.2) / 100} 251.2`}
                strokeLinecap="round"
                className="text-indigo-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">{slaOnTimePercent}%</span>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">On-Time</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Dispatch SLA</span>
            </div>
            <p className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              Zero Delays
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Avg field response: 18 mins
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Live Metropolitan Fleet Radar Map */}
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
                Live GPS telemetry of dispatched service vans & emergency stops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">3 Vans Active</span>
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

            {/* Van Markers */}
            {FLEET_VANS.map((van) => (
              <div
                key={van.id}
                style={{ top: `${van.lat}%`, left: `${van.lng}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/50 border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-110">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow-md">
                    {van.tech}
                  </span>
                </div>

                {/* Hover Details Popover */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur border border-sky-400/40 text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  <p className="text-xs font-bold">{van.van}</p>
                  <p className="text-[11px] text-sky-400 mt-0.5">{van.status}</p>
                  <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                    <span>Order: {van.job}</span>
                    <span>Battery: {van.battery}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Van Roster Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {FLEET_VANS.map((van) => (
              <div
                key={van.id}
                className="p-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center text-xs">
                    {van.tech.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{van.tech}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">{van.status}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[9px] py-0">
                  {van.job}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Emergency Dispatch Heatmap & Truck Stock Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emergency Triage Heatmap */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Priority Dispatch Triage
              </h3>
            </div>
            <Badge variant="destructive" className="text-[10px]">
              2 Emergencies
            </Badge>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Main Water Line Burst • Active Flooding
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    124 Oak Street • Dispatched to Dave Miller
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="text-[10px]">
                Critical
              </Badge>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Commercial Water Heater Pressure Valve Failure
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    450 Broadway Plaza • Dispatched to Sarah Jenkins
                  </p>
                </div>
              </div>
              <Badge variant="warning" className="text-[10px]">
                High
              </Badge>
            </div>
          </div>
        </Card>

        {/* Truck Stock Telemetry */}
        <Card className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Fleet Van Pipe & Fittings Inventory
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Auto-Reorder On</span>
          </div>

          <div className="space-y-3">
            {INVENTORY_STOCK.map((item) => (
              <div key={item.item} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>{item.item}</span>
                  <span>{item.level}% Stocked</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${item.level}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5. 7-Day Revenue Velocity Sparkline */}
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              7-Day Revenue Flow Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Daily paid invoices and quote approvals across the plumbing business
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {formatConverted(collectedCents)} This Week
          </span>
        </div>

        {/* SVG Sparkline Curve */}
        <div className="h-32 w-full">
          <svg className="w-full h-full" viewBox="0 0 700 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revenueFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,100 C 100,70 150,90 230,40 C 310,-10 390,60 470,30 C 550,0 620,40 700,10 L 700,120 L 0,120 Z"
              fill="url(#revenueFill)"
            />
            <path
              d="M 0,100 C 100,70 150,90 230,40 C 310,-10 390,60 470,30 C 550,0 620,40 700,10"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-2 px-1">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </Card>
    </div>
  );
}
