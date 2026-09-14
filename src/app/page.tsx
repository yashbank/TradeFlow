'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  FileText,
  CalendarCheck2,
  Receipt,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Zap,
  Navigation,
  Clock,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  ChevronRight,
  Play,
  Check,
  Calculator,
  Award,
  Building2,
  PhoneCall,
  Activity,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default function MarketingLandingPage() {
  const { t } = useTranslation();

  // 1. Interactive Dispatch Simulator State
  const [activeSimulatorStep, setActiveSimulatorStep] = useState<number>(0);

  const simulatorSteps = [
    {
      id: 0,
      badge: 'Step 1: Emergency Call',
      title: 'Incoming Dispatch Emergency',
      client: 'Apex General Hospital',
      location: '1200 Healthcare Way, Chicago IL',
      issue: 'Critical water main rupture in Basement ICU Wing',
      eta: '8 mins to location',
      icon: PhoneCall,
      actionPrompt: 'Dispatch Nearest Van',
    },
    {
      id: 1,
      badge: 'Step 2: Fleet Radar',
      title: 'Real-Time Geo-Routing',
      client: 'Apex General Hospital',
      tech: 'Dave Miller (Senior Master Plumber)',
      vehicle: 'Service Van #04 • GPS Tracked',
      status: 'En Route • ETA 6 mins • SMS Alert Sent',
      icon: Navigation,
      actionPrompt: 'Arrive at Service Site',
    },
    {
      id: 2,
      badge: 'Step 3: Field Execution',
      title: 'Stopwatch & Digital Sign-off',
      client: 'Apex General Hospital',
      labor: '01:45:00 (Rounded to 2.0h billable)',
      parts: '2x 1.5" Commercial Ball Valves, 1x PRV Seal Kit',
      signature: 'Signed on glass by Dr. S. Connor',
      icon: Clock,
      actionPrompt: 'Generate Instant Invoice',
    },
    {
      id: 3,
      badge: 'Step 4: Instant Settlement',
      title: 'Invoice Paid & Cash Deposited',
      client: 'Apex General Hospital',
      invoiceNumber: 'INV-2026-0001',
      amount: '$1,450.00',
      settlement: 'Paid on the spot via Tap-to-Pay / Card',
      icon: Receipt,
      actionPrompt: 'Reset Simulation',
    },
  ];

  const currentSim = simulatorSteps[activeSimulatorStep];

  // 2. Interactive ROI & Profit Calculator State
  const [techCount, setTechCount] = useState<number>(5);
  const [jobsPerDay, setJobsPerDay] = useState<number>(3);
  const [hourlyRate, setHourlyRate] = useState<number>(125);

  const roiCalculations = useMemo(() => {
    // Each job saves ~45 mins (0.75 hours) of paperwork, phone tag, manual invoicing, and billing errors
    const workingDaysPerMonth = 22;
    const totalJobsMonthly = techCount * jobsPerDay * workingDaysPerMonth;
    const hoursSavedMonthly = Math.round(totalJobsMonthly * 0.75);
    const monthlyRevenueGain = Math.round(hoursSavedMonthly * hourlyRate);
    const annualRevenueGain = monthlyRevenueGain * 12;

    return {
      totalJobsMonthly,
      hoursSavedMonthly,
      monthlyRevenueGain,
      annualRevenueGain,
    };
  }, [techCount, jobsPerDay, hourlyRate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* 1. Floating Sticky Luxury Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-zinc-100">
                  TradeFlow
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  Enterprise OS
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-zinc-400">
            <a href="#simulator" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              {t('landing.simulator_title')}
            </a>
            <a href="#storyline" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              {t('landing.storyline_title')}
            </a>
            <a href="#calculator" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              {t('landing.calc_title')}
            </a>
            <a href="#pricing" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              {t('landing.pricing_title')}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <CompactControlsBar />
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 px-3 py-2 min-h-[44px] flex items-center"
            >
              {t('auth.sign_in_btn')}
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-500/25 min-h-[44px] px-4 rounded-xl"
              >
                {t('landing.cta_primary')}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Luxury Hero Section */}
        <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-sky-400/15 via-indigo-500/15 to-purple-500/15 blur-3xl pointer-events-none rounded-full -z-10" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
            <span>{t('landing.badge')}</span>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-slate-950 dark:text-white">
              {t('landing.hero_title')}
            </h1>
            <p className="text-base sm:text-xl text-slate-600 dark:text-zinc-300 max-w-3xl mx-auto font-normal leading-relaxed">
              {t('landing.hero_subtitle')}
            </p>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link href="/signup" className="w-full sm:w-auto flex-1">
              <Button
                size="lg"
                className="w-full text-sm sm:text-base font-black shadow-xl shadow-sky-500/25 h-13 px-8 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl"
              >
                {t('landing.cta_primary')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#simulator" className="w-full sm:w-auto flex-1">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-13 px-8 text-sm sm:text-base font-bold rounded-2xl border-slate-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200"
              >
                <Play className="w-4 h-4 mr-2 text-sky-500 fill-sky-500" />
                {t('landing.cta_secondary')}
              </Button>
            </a>
          </div>

          {/* Social Proof & Trust Badges */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 ml-2">
                4.98 / 5.0 Rating
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('landing.trusted_by')}
            </p>
          </div>

          {/* Specialized Trade Capability Chips */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {[
              'Commercial Boiler Loops',
              'Backflow RPZ Certifications',
              'High-Pressure Hydro-Jetting',
              'Ultrasonic Slab Leak Detection',
              'Medical Gas Line Audits',
              'Dual-Tankless Water Heaters',
            ].map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/60 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-300 shadow-2xs backdrop-blur-xs"
              >
                🔧 {skill}
              </span>
            ))}
          </div>
        </section>

        {/* 3. Live Interactive Dispatch & Work Order Simulator */}
        <section id="simulator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20">
          <div className="text-center space-y-2 mb-10">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              Live Field Simulator
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100">
              {t('landing.simulator_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Experience the 4 frictionless stages of a modern trade job. Click through to watch real-time dispatching.
            </p>
          </div>

          {/* Simulator Container */}
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-sky-500/30 dark:border-sky-500/20 shadow-2xl bg-gradient-to-b from-white/90 to-slate-50/90 dark:from-zinc-900/90 dark:to-zinc-950/90 backdrop-blur-xl">
            {/* Step Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              {simulatorSteps.map((step, idx) => {
                const isActive = activeSimulatorStep === idx;
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveSimulatorStep(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all min-h-[44px] flex items-center gap-3 ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/20 scale-[1.02]'
                        : 'bg-white/60 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 hover:border-sky-400 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-zinc-700'}`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className={`text-[10px] uppercase font-bold tracking-wider block truncate ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                        {step.badge}
                      </span>
                      <span className="text-xs font-bold block truncate">
                        {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Simulation Preview Glass Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-500 text-white font-bold text-xs">
                    {currentSim.badge}
                  </Badge>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {currentSim.title}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Customer & Site</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">{currentSim.client}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{currentSim.location || 'Site Address Verified'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Live Telemetry</span>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block">
                      {currentSim.tech || currentSim.labor || currentSim.amount || currentSim.eta}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate block">
                      {currentSim.vehicle || currentSim.parts || currentSim.settlement || currentSim.issue}
                    </span>
                  </div>
                </div>

                {activeSimulatorStep === 2 && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Customer Glass Signature Captured: Verified by Dr. Sarah Connor</span>
                  </div>
                )}

                {activeSimulatorStep === 3 && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Reconciled: $1,450.00 directly credited to business operating account</span>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
                <Button
                  onClick={() => setActiveSimulatorStep((prev) => (prev + 1) % simulatorSteps.length)}
                  className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white font-black text-xs h-12 px-6 shadow-md shadow-sky-500/20 rounded-xl"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {currentSim.actionPrompt}
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
                <span className="text-[10px] text-slate-400">
                  Simulation Stage {activeSimulatorStep + 1} of 4
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. "The Journey of a Trade Dispatch" Storyline Section */}
        <section id="storyline" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center space-y-2 mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              End-to-End Velocity
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100">
              {t('landing.storyline_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
              {t('landing.storyline_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/20 hover:border-sky-500/40 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black">
                  <Navigation className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100">
                  {t('landing.step1_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {t('landing.step1_desc')}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Zero dispatch phone tag</span>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100">
                  {t('landing.step2_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {t('landing.step2_desc')}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Quarter-hour stopwatch accuracy</span>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100">
                  {t('landing.step3_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {t('landing.step3_desc')}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Immediate card & bank settlement</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Interactive ROI & Profit Calculator */}
        <section id="calculator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20">
          <div className="glass-panel-elevated p-6 sm:p-10 rounded-3xl border border-indigo-500/30 dark:border-indigo-500/20 shadow-2xl bg-gradient-to-br from-white/95 via-indigo-50/20 to-sky-50/20 dark:from-zinc-900/95 dark:to-zinc-950/95">
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                <Calculator className="w-3.5 h-3.5" />
                <span>{t('landing.calc_title')}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100">
                Calculate Your Real Enterprise Savings
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
                {t('landing.calc_subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Sliders Input Column */}
              <div className="space-y-6">
                {/* Slider 1: Technicians */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-zinc-300">{t('landing.calc_technicians')}</span>
                    <span className="text-sky-600 dark:text-sky-400 font-mono text-sm">{techCount} Techs</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={techCount}
                    onChange={(e) => setTechCount(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 solo tech</span>
                    <span>25 fleet</span>
                    <span>50 enterprise</span>
                  </div>
                </div>

                {/* Slider 2: Jobs per day */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-zinc-300">{t('landing.calc_jobs_per_day')}</span>
                    <span className="text-sky-600 dark:text-sky-400 font-mono text-sm">{jobsPerDay} Jobs / Day</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={jobsPerDay}
                    onChange={(e) => setJobsPerDay(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 job/day</span>
                    <span>5 jobs/day</span>
                    <span>10 jobs/day</span>
                  </div>
                </div>

                {/* Slider 3: Hourly Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-zinc-300">{t('landing.calc_hourly_rate')}</span>
                    <span className="text-sky-600 dark:text-sky-400 font-mono text-sm">${hourlyRate} / hr</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={300}
                    step={5}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>$50/hr</span>
                    <span>$150/hr</span>
                    <span>$300/hr</span>
                  </div>
                </div>
              </div>

              {/* Output Results Column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('landing.calc_hours_saved')}
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400 font-mono block">
                    {roiCalculations.hoursSavedMonthly} hrs
                  </span>
                  <p className="text-[11px] text-slate-400">Time reclaimed from billing friction & paper invoices</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('landing.calc_monthly_savings')}
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                    ${roiCalculations.monthlyRevenueGain.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-slate-400">Extra billable capacity generated every month</p>
                </div>

                <div className="sm:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border border-sky-500/30 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                    Projected Annual Growth
                  </span>
                  <span className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-zinc-100 font-mono block">
                    +${roiCalculations.annualRevenueGain.toLocaleString()} / year
                  </span>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Based on {roiCalculations.totalJobsMonthly} monthly work orders across {techCount} technician(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Transparent Pricing Matrix */}
        <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20">
          <div className="text-center space-y-2 mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
              Simple Scalability
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100">
              {t('landing.pricing_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
              {t('landing.pricing_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1: Starter */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-zinc-100">$79</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Perfect for independent master trades with 1–2 vans.
                </p>
                <div className="space-y-2 pt-2 text-xs text-slate-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Up to 2 field technicians</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited quotes & invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Quarter-hour labor stopwatch</span>
                  </div>
                </div>
              </div>
              <Link href="/signup">
                <Button variant="outline" className="w-full min-h-[44px] font-bold text-xs">
                  {t('landing.cta_primary')}
                </Button>
              </Link>
            </div>

            {/* Plan 2: Pro / Growth (Featured) */}
            <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border-2 border-sky-500 shadow-xl relative space-y-6 flex flex-col justify-between bg-gradient-to-b from-sky-500/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-sky-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                Most Popular
              </div>
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">Pro Fleet</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-zinc-100">$149</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  For growing plumbing contractors with 3–10 trucks.
                </p>
                <div className="space-y-2 pt-2 text-xs text-slate-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Up to 10 field technicians</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Live GPS Fleet Telemetry Radar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Customer Touch Sign-on-Glass</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Instant PDF generation & SMS link</span>
                  </div>
                </div>
              </div>
              <Link href="/signup">
                <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white min-h-[44px] font-black text-xs shadow-md shadow-sky-500/25">
                  {t('landing.cta_primary')}
                </Button>
              </Link>
            </div>

            {/* Plan 3: Enterprise */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Commercial Empire</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-zinc-100">$299</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  For multi-city mechanical & commercial plumbing operations.
                </p>
                <div className="space-y-2 pt-2 text-xs text-slate-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited field technicians</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom domain & multi-brand portals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Multi-currency & international tax rates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>24/7 dedicated dispatch engineer</span>
                  </div>
                </div>
              </div>
              <Link href="/signup">
                <Button variant="outline" className="w-full min-h-[44px] font-bold text-xs">
                  {t('landing.cta_primary')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Bottom Call-to-Action Banner */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white shadow-2xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              {t('landing.cta_footer_title')}
            </h2>
            <p className="text-sm sm:text-base text-sky-100 max-w-2xl mx-auto font-normal">
              {t('landing.cta_footer_subtitle')}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
              <Link href="/signup" className="w-full">
                <Button
                  size="lg"
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 font-black text-sm h-13 rounded-2xl shadow-lg"
                >
                  {t('landing.cta_start_trial')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-sky-200">
              14-day full access trial • No credit card required • Instant cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* 8. Luxury Footer */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md py-10 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-900 dark:text-zinc-100">TradeFlow Enterprise</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">© 2026 TradeFlow Inc. High-velocity field dispatch systems.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CompactControlsBar />
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
