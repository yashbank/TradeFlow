'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Navigation,
  Clock,
  FileText,
  Smartphone,
  Star,
  PhoneCall,
  Zap,
  Receipt,
  Play,
  Calculator,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Users,
  MapPin,
  CalendarCheck2,
  ChevronDown,
} from 'lucide-react';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';

const inter = Inter({ subsets: ['latin'] });
const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

export default function MarketingLandingPage() {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [controlsOpen, setControlsOpen] = useState(false);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setControlsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // IntersectionObserver for scroll-reveal effects
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in-view');
        });
      },
      { threshold: 0.12 }
    );

    document
      .querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .stagger-group > *')
      .forEach((el) => obs.observe(el));

    // Parallax ambient shift
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.35}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 1. Live Interactive Dispatch Command Simulator
  const [activeSimStep, setActiveSimStep] = useState<number>(0);
  const simulatorSteps = [
    {
      id: 0,
      badge: 'Step 1: Emergency Call',
      title: 'Incoming Dispatch Triage',
      client: 'Apex Commercial Plaza',
      location: '1200 Healthcare Way, Chicago IL',
      issue: 'Leaking 50-gallon water heater in utility room (Immediate Dispatch)',
      eta: '8 mins to location',
      icon: PhoneCall,
      actionPrompt: 'Auto-Route Nearest Van →',
    },
    {
      id: 1,
      badge: 'Step 2: Fleet Radar',
      title: 'Real-Time Geo-Routing & Telemetry',
      client: 'Apex Commercial Plaza',
      tech: 'Dave Miller (Master Plumber #04)',
      vehicle: 'Service Van #04 • GPS Tracked',
      status: 'En Route • 6 mins away • Live SMS Client Beacon',
      icon: Navigation,
      actionPrompt: 'Arrive On-Site & Start Stopwatch →',
    },
    {
      id: 2,
      badge: 'Step 3: Field Execution',
      title: 'Digital Stopwatch & Sign-Off on Glass',
      client: 'Apex Commercial Plaza',
      labor: '01:45:00 (Rounded to 2.0h billable)',
      parts: '1x Bradford White 50-Gal Heater, 2x Flex Lines',
      signature: 'Signed on glass by Building Director Dr. S. Connor',
      icon: Clock,
      actionPrompt: 'Generate Instant Invoice →',
    },
    {
      id: 3,
      badge: 'Step 4: Instant Settlement',
      title: 'Invoice Settled & Capital Deposited',
      client: 'Apex Commercial Plaza',
      invoiceNumber: 'INV-2026-0001',
      amount: '$847.50',
      settlement: 'Paid instantly via On-Site Card Tap / Stripe',
      icon: Receipt,
      actionPrompt: 'Restart Simulation ⟲',
    },
  ];
  const currentSim = simulatorSteps[activeSimStep];

  // 2. Interactive ROI Calculator
  const [vanCount, setVanCount] = useState<number>(6);
  const [jobsPerVanDay, setJobsPerVanDay] = useState<number>(3);
  const [hourlyRate, setHourlyRate] = useState<number>(135);

  const roiCalculations = useMemo(() => {
    const workingDaysMonth = 22;
    const monthlyJobs = vanCount * jobsPerVanDay * workingDaysMonth;
    const hoursSavedMonthly = Math.round(monthlyJobs * 0.75);
    const monthlyCashGain = Math.round(hoursSavedMonthly * hourlyRate);
    const annualCashGain = monthlyCashGain * 12;
    return { monthlyJobs, hoursSavedMonthly, monthlyCashGain, annualCashGain };
  }, [vanCount, jobsPerVanDay, hourlyRate]);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-sky-500/30 ${inter.className} overflow-x-hidden`}>
      {/* FLOATING LUXURY NAVBAR (Ultra-minimalist) */}
      <nav className="fixed top-0 w-full z-50 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <TradeFlowLogo variant="icon" size="sm" />
            </div>
            <span className={`${sora.className} font-black text-xl tracking-tight text-slate-900 dark:text-white`}>
              TradeFlow
            </span>
          </div>

          {/* Right: Corner Hover/Tap Menu Island */}
          <div
            ref={menuRef}
            className="relative group/corner"
            onMouseEnter={() => setControlsOpen(true)}
            onMouseLeave={() => setControlsOpen(false)}
          >
            {/* Resting Compact Trigger Pill */}
            <button
              type="button"
              onClick={() => setControlsOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-xs active:scale-95"
              aria-label="Toggle system controls"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="hidden sm:inline">Explore & Controls</span>
              <span className="sm:hidden">Menu</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${controlsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Emergent Flyout Menu */}
            <div
              className={`absolute right-0 top-full mt-2 transition-all duration-300 transform origin-top-right z-50 ${
                controlsOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none group-hover/corner:opacity-100 group-hover/corner:scale-100 group-hover/corner:translate-y-0 group-hover/corner:pointer-events-auto'
              }`}
            >
              <div className="p-3.5 rounded-2xl glass-panel-elevated border border-slate-200/80 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex flex-col gap-3 min-w-[250px]">
                {/* Direct Action CTAs */}
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 text-xs font-bold rounded-xl h-9">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/25 h-9">
                    <Link href="/signup">Start Trial</Link>
                  </Button>
                </div>

                {/* Preferences: Currency, Language, Theme */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Settings</span>
                  <CompactControlsBar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. HERO - $1M Cinematic Presentation */}
      <section className="relative min-h-[92svh] flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Ambient Gradient Mesh Orbs */}
        <div ref={heroRef} className="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40" style={{ transition: 'transform 0.1s ease-out' }}>
          <div className="absolute top-[15%] left-[20%] w-96 h-96 bg-sky-400/25 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
          <div className="absolute top-[25%] right-[20%] w-96 h-96 bg-indigo-500/25 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-[20%] left-[40%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center z-10 flex flex-col items-center">
          <h1 className={`${sora.className} text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 scroll-reveal leading-[1.08]`}>
            Dispatch Friction <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600">
              Eliminated In Seconds.
            </span>
          </h1>

          <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto scroll-reveal font-normal leading-relaxed">
            Automate routing, track live fleet radars, digitize signatures on glass, and secure instant card payments before the van leaves the customer driveway.
          </p>

          {/* Scroll-Revealed Storyline Tagline */}
          <div className="scroll-reveal mb-10 px-5 py-2 rounded-full border border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/40 backdrop-blur-md text-xs sm:text-sm font-bold inline-flex items-center gap-2.5 shadow-sm text-sky-700 dark:text-sky-300 transition-all duration-700">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            <span>TradeFlow — Same-Day Dispatch & Invoicing Engine</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 scroll-reveal w-full sm:w-auto relative z-20">
            <Button asChild size="lg" className="rounded-full h-14 px-8 text-base bg-sky-600 hover:bg-sky-500 text-white w-full sm:w-auto shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 group font-bold min-h-[52px] touch-manipulation">
              <Link href="/signup" className="flex items-center justify-center">
                Start 14-Day Free Trial <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-base w-full sm:w-auto border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 font-bold min-h-[52px] touch-manipulation">
              <a href="#simulator" className="flex items-center justify-center">
                <Play className="mr-2 w-4 h-4 text-sky-500 fill-sky-500" /> Test Drive Simulator
              </a>
            </Button>
          </div>

          {/* Floating Glass Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl stagger-group">
            {[
              { label: 'Target Market', value: 'Built for', desc: 'Plumbing & HVAC fleets' },
              { label: 'Dispatch Velocity', value: '<8 min', desc: 'Quote-to-dispatch target' },
              { label: 'On-Time Arrival', value: '99.4%', desc: 'SLA compliance target' },
              { label: 'Payments', value: 'Instant Billing', desc: 'Same-day card settlement' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm luxury-card-hover text-left"
              >
                <div className="text-2xl sm:text-3xl font-black tracking-tight mb-0.5 text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{stat.label}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE DISPATCH SIMULATOR */}
      <section id="simulator" className="py-24 relative border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Command Center</span>
            </div>
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-black tracking-tight mb-4`}>
              Experience The 4-Step Flow
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Click through each step to see how TradeFlow automates an entire service call from first ring to money in the bank.
            </p>
          </div>

          {/* Simulator Step Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-8 scroll-reveal">
            {simulatorSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeSimStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveSimStep(step.id)}
                  className={`p-3.5 rounded-2xl text-left transition-all border flex items-center gap-3 ${
                    isActive
                      ? 'bg-sky-500/15 border-sky-500/40 shadow-sm text-sky-700 dark:text-sky-300'
                      : 'bg-white/60 dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:border-sky-500/30'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 truncate">
                      {step.badge.split(':')[0]}
                    </p>
                    <p className="text-xs font-extrabold truncate">{step.badge.split(':')[1]}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Display Card */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-8 scroll-reveal">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <currentSim.icon className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-sky-600 dark:text-sky-400 border-sky-500/30 mb-1">
                    {currentSim.badge}
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {currentSim.title}
                  </h3>
                </div>
              </div>

              <Button
                onClick={() => setActiveSimStep((prev) => (prev + 1) % simulatorSteps.length)}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 h-10 px-4"
              >
                {currentSim.actionPrompt}
              </Button>
            </div>

            {/* Dynamic Step Content */}
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Client Profile</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">{currentSim.client}</div>
                  {currentSim.location && <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{currentSim.location}</div>}
                </div>

                {currentSim.issue && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">Reported Issue</div>
                    <div className="text-sm font-semibold">{currentSim.issue}</div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2">Target SLA: {currentSim.eta}</div>
                  </div>
                )}

                {currentSim.status && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">Live Fleet Telemetry</div>
                    <div className="text-sm font-semibold">{currentSim.status}</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">Assigned: {currentSim.tech}</div>
                  </div>
                )}

                {currentSim.labor && (
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-900 dark:text-sky-200 space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">Stopwatch & Sign-off</div>
                    <div className="text-xs font-semibold">⏱ Stopwatch Labor: {currentSim.labor}</div>
                    <div className="text-xs font-semibold">📦 Verified Materials: {currentSim.parts}</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">✍️ {currentSim.signature}</div>
                  </div>
                )}

                {currentSim.amount && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">Instant Cash Settlement</div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{currentSim.amount}</div>
                    <div className="text-xs font-semibold mt-1">{currentSim.settlement}</div>
                  </div>
                )}
              </div>

              {/* Graphic Visual Mockup on Right */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-inner flex flex-col justify-between min-h-[260px]">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    TradeFlow OS • Live State Machine
                  </span>
                  <span>Step {activeSimStep + 1} of 4</span>
                </div>

                <div className="my-6 text-center space-y-2">
                  <div className="inline-flex p-3 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 mb-2">
                    <currentSim.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold">{currentSim.title}</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Optimistic state transitions synchronized with Supabase database & PostgreSQL event streams.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                  <span>Latency: &lt;18ms</span>
                  <span>Encryption: AES-256</span>
                  <span>RLS Isolation: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STORYLINE CHANNELS & CORE FEATURES */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-black tracking-tight mb-4`}>
              Engineered For The Field. Loved By The Office.
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Every feature exists for one single purpose: eliminating non-billable hours so your trade business can scale profits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-group">
            {[
              {
                title: 'Live Fleet Radar & Dispatch',
                desc: 'See all service vans with real GPS telemetry, distance rings, and 1-click nearest technician routing.',
                icon: Navigation,
                badge: 'Zero Phone Tag',
              },
              {
                title: 'Stopwatch Proof-of-Work',
                desc: 'Field crew starts work with one tap. Auto-rounded billable hours, parts logging, and photo documentation.',
                icon: Clock,
                badge: '100% Billing Accuracy',
              },
              {
                title: 'Instant Card Settlement',
                desc: 'Generate branded PDF invoices on-site and collect payment before the truck drives off.',
                icon: Receipt,
                badge: 'Same-Day Cash Flow',
              },
              {
                title: 'Drag-and-Drop Gantt Board',
                desc: 'Organize weekly crew schedules across 7 days. Drop jobs between technicians with instant sync.',
                icon: CalendarCheck2,
                badge: 'Drag & Drop Dispatch',
              },
              {
                title: 'Public Customer Proposal Portal',
                desc: 'Send dynamic interactive estimates with 1-click digital client acceptance and deposit card collection.',
                icon: FileText,
                badge: '40% Win-Rate Lift',
              },
              {
                title: 'Multi-Role Privacy & Security',
                desc: 'Row-Level Security isolates office pricing from technicians. Dedicated mobile field views for crew members.',
                icon: ShieldCheck,
                badge: 'Enterprise Security',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-3xl bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 backdrop-blur-md shadow-sm luxury-card-hover scroll-reveal flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200 dark:border-zinc-700">
                        {feat.badge}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE ROI PROFIT CALCULATOR */}
      <section id="calculator" className="py-24 relative border-t border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive ROI Modeler</span>
            </div>
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-black tracking-tight mb-4`}>
              Calculate Your Cash Flow Lift
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Drag the sliders to see how eliminating dispatch delays translates directly to your annual bottom line.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-xl scroll-reveal">
            {/* Sliders on Left */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 dark:text-zinc-300">Fleet Service Vans:</span>
                  <span className="text-sky-600 dark:text-sky-400 text-sm font-black">{vanCount} Vans</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={vanCount}
                  onChange={(e) => setVanCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 dark:text-zinc-300">Jobs Per Van Per Day:</span>
                  <span className="text-sky-600 dark:text-sky-400 text-sm font-black">{jobsPerVanDay} Jobs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={jobsPerVanDay}
                  onChange={(e) => setJobsPerVanDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 dark:text-zinc-300">Billable Hourly Rate:</span>
                  <span className="text-sky-600 dark:text-sky-400 text-sm font-black">${hourlyRate}/hr</span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="250"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            </div>

            {/* Calculated Results Card on Right */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white flex flex-col justify-between shadow-lg">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Estimated Annual Profit Impact</div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
                  +${roiCalculations.annualCashGain.toLocaleString()}
                </div>
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Monthly Hours Reclaimed:</span>
                    <strong className="text-white">{roiCalculations.hoursSavedMonthly} hrs/mo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Cash Gain:</span>
                    <strong className="text-emerald-400">+${roiCalculations.monthlyCashGain.toLocaleString()}/mo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Jobs Capacity:</span>
                    <strong className="text-white">{roiCalculations.monthlyJobs} jobs/mo</strong>
                  </div>
                </div>
              </div>

              <Link href="/signup" className="mt-6">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg">
                  Capture This Revenue Today →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTRACTOR TESTIMONIALS */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 scroll-reveal">
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-black tracking-tight mb-4`}>
              &ldquo;We Cut 3 Hours Of Daily Chaos.&rdquo;
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Hear from field service owners who retired their whiteboard dispatch boards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-group">
            {[
              {
                quote: 'Before TradeFlow, technicians lost 45 minutes every morning waiting for printed job tickets. Now their daily route is on their phone before they finish coffee.',
                author: 'Marcus Vance',
                title: 'Owner, Apex Commercial Plumbing (14 Vans)',
              },
              {
                quote: 'Our outstanding receivables dropped from $82,000 to zero. Technicians take card payment on glass before driving away. Game changer.',
                author: 'Elena Gomez',
                title: 'Managing Director, Horizon HVAC & Mechanical',
              },
              {
                quote: 'The Gantt dispatch view is better than enterprise software costing $20k a year. Dragging jobs between crew members updates their phones instantly.',
                author: 'David Sterling',
                title: 'Founder, Sterling Flow Systems',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 backdrop-blur-md shadow-sm scroll-reveal flex flex-col justify-between"
              >
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{t.author}</div>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING */}
      <section id="pricing" className="py-24 relative border-t border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 scroll-reveal">
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-black tracking-tight mb-4`}>
              Simple, Predictable Pricing
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              No hidden setup fees. Unlimited quotes, jobs, and digital invoicing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-group max-w-5xl mx-auto items-stretch">
            {[
              {
                plan: 'Starter Plan',
                price: '$39',
                desc: 'Perfect for small local contractors & solo trades.',
                features: ['Up to 3 Technicians', 'Live Fleet Radar', 'Digital Invoices & Quotes', 'Stripe Instant Settlement'],
                cta: 'Start Free Trial',
                highlight: false,
              },
              {
                plan: 'Pro Fleet',
                price: '$99',
                desc: 'The complete command center for growing fleets.',
                features: ['Up to 15 Technicians', 'Weekly Gantt Drag & Drop', 'Automated Customer SMS Beacons', 'Stopwatch Work Orders', 'Priority 24/7 Support'],
                cta: 'Start 14-Day Pro Trial',
                highlight: true,
              },
              {
                plan: 'Enterprise OS',
                price: '$249',
                desc: 'For multi-location commercial contractors.',
                features: ['Unlimited Crew Members', 'Dedicated Account Manager', 'Custom ERP Integrations', 'Multi-Branch RLS Isolation', '99.99% SLA Guarantee'],
                cta: 'Contact Enterprise',
                highlight: false,
              },
            ].map((pkg, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl flex flex-col justify-between transition-all ${
                  pkg.highlight
                    ? 'bg-white dark:bg-zinc-900 border-2 border-sky-500 shadow-2xl shadow-sky-500/10 scale-105'
                    : 'bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.plan}</h3>
                    {pkg.highlight && (
                      <Badge className="bg-sky-600 text-white text-[10px] font-bold">Most Popular</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">{pkg.price}</span>
                    <span className="text-xs text-slate-400 font-bold">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">{pkg.desc}</p>

                  <div className="space-y-3 mb-8 border-t border-slate-100 dark:border-zinc-800 pt-6">
                    {pkg.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  asChild
                  className={`w-full font-bold text-xs rounded-xl h-11 min-h-[44px] touch-manipulation ${
                    pkg.highlight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <Link href="/signup">{pkg.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA BANNER & MINIMAL FOOTER */}
      <section className="py-20 relative bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center scroll-reveal">
          <h2 className={`${sora.className} text-3xl sm:text-5xl font-black tracking-tight mb-4`}>
            Ready To Make Your Field Operations Invisible?
          </h2>
          <p className="text-base text-slate-400 max-w-2xl mx-auto mb-8 font-normal">
            Join thousands of field technicians and owners who replaced chaotic whiteboards with TradeFlow.
          </p>
          <Button asChild size="lg" className="rounded-full h-14 px-10 text-base bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-2xl hover:scale-105 active:scale-95 transition-all min-h-[52px] touch-manipulation">
            <Link href="/signup">
              Start 14-Day Full Access Trial →
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <TradeFlowLogo variant="icon" size="sm" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">TradeFlow © 2026</span>
          </div>
          <CompactControlsBar />
        </div>
      </footer>

      <style jsx global>{`
        .scroll-reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .scroll-reveal-left { opacity: 0; transform: translateX(-40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .scroll-reveal-right { opacity: 0; transform: translateX(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .scroll-reveal-scale { opacity: 0; transform: scale(0.95); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .in-view { opacity: 1 !important; transform: none !important; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
