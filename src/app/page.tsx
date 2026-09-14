'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  Wrench, ArrowRight, CheckCircle2, Navigation, Clock, Receipt, Play, Check, Calculator, Star, PhoneCall, Zap, Smartphone, Target, XCircle, ChevronRight, Globe
} from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });
const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

export default function MarketingLandingPage() {
  const { t } = useTranslation();
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting)),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Simulator State
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

  // ROI Calculator State
  const [techCount, setTechCount] = useState<number>(5);
  const [jobsPerDay, setJobsPerDay] = useState<number>(3);
  const [hourlyRate, setHourlyRate] = useState<number>(125);
  const roiCalculations = useMemo(() => {
    const workingDaysPerMonth = 22;
    const totalJobsMonthly = techCount * jobsPerDay * workingDaysPerMonth;
    const hoursSavedMonthly = Math.round(totalJobsMonthly * 0.75);
    const monthlyRevenueGain = Math.round(hoursSavedMonthly * hourlyRate);
    const annualRevenueGain = monthlyRevenueGain * 12;
    return { totalJobsMonthly, hoursSavedMonthly, monthlyRevenueGain, annualRevenueGain };
  }, [techCount, jobsPerDay, hourlyRate]);

  return (
    <div className={`min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col ${inter.className}`}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <span className={`${sora.className} font-bold text-lg tracking-tight`}>TradeFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              <LanguageSelector />
              <CurrencySelector />
              <ThemeToggle />
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>
            <Link href="/login" className="text-sm font-semibold hover:text-sky-600 px-3 py-2">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-32 px-4 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 hero-gradient-mesh -z-10"></div>
          
          <div className="scroll-reveal max-w-4xl mx-auto space-y-6">
            <h1 className={`${sora.className} text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 leading-tight`}>
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-violet-500">Cinematic</span> OS for High-Velocity Trades
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto">
              Real-time dispatch, instant invoicing, and 15-minute stopwatch billing. Built for master plumbers, electricians, and HVAC professionals who demand luxury software.
            </p>
          </div>

          <div className="scroll-reveal scroll-reveal-delay-1 mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-base font-bold rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:scale-105 transition-transform shadow-2xl">
                Start 14-Day Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#simulator">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-300 dark:border-zinc-700 hover:scale-105 transition-transform">
                <Play className="w-5 h-5 mr-2 text-sky-500" /> Interactive Demo
              </Button>
            </a>
          </div>

          <div className="mt-20 w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
            {[
              { title: '2,500+', desc: 'Master Trades Using TradeFlow', icon: Globe },
              { title: '<8 Min', desc: 'Average Dispatch Time', icon: Zap },
              { title: '>98%', desc: 'Customer Satisfaction Score', icon: Star },
            ].map((stat, i) => (
              <div key={i} className={`scroll-reveal scroll-reveal-delay-${i+1} glass-panel p-6 rounded-2xl flex flex-col items-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800`}>
                <stat.icon className="w-8 h-8 text-sky-500 mb-3" />
                <h3 className={`${sora.className} text-3xl font-black`}>{stat.title}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROBLEM / SOLUTION STRIP */}
        <section className="py-24 bg-slate-50 dark:bg-zinc-900/50 border-y border-slate-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className={`${sora.className} text-3xl sm:text-4xl font-bold`}>Ditch the Paperwork. <span className="text-emerald-500">Embrace Velocity.</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { old: 'Phone tag & whiteboards', new: 'Live GPS Radar Dispatch', icon1: PhoneCall, icon2: Navigation },
                { old: 'Guessing billable hours', new: 'Quarter-hour Stopwatch', icon1: Clock, icon2: CheckCircle2 },
                { old: 'Chasing unpaid invoices', new: 'Instant Glass Sign-off & Pay', icon1: XCircle, icon2: Receipt },
              ].map((item, i) => (
                <div key={i} className={`scroll-reveal scroll-reveal-delay-${i+1} bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden`}>
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 opacity-50">
                      <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mt-1 shrink-0"><item.icon1 className="w-4 h-4 text-red-600 dark:text-red-400" /></div>
                      <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">The Old Way</p>
                        <p className="text-sm font-medium line-through">{item.old}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full mt-1 shrink-0"><item.icon2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">TradeFlow</p>
                        <p className="text-base font-bold">{item.new}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE SIMULATOR */}
        <section id="simulator" className="py-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-bold`}>Interactive Dispatch Simulator</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">Experience the 4 frictionless stages of a modern trade job in real-time.</p>
          </div>

          <div className="scroll-reveal glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-sky-500/20 bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {simulatorSteps.map((step, idx) => {
                const isActive = activeSimulatorStep === idx;
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveSimulatorStep(idx)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                      isActive ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-transparent shadow-lg scale-[1.02]' : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-sky-400'
                    }`}
                  >
                    <StepIcon className={`w-5 h-5 ${isActive ? 'text-sky-400 dark:text-sky-500' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">{step.badge}</span>
                      <span className="text-sm font-bold block truncate">{step.title.split(' ')[0]} {step.title.split(' ')[1]}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-8 transition-all duration-500 ease-in-out">
              <div className="flex-1 space-y-6 w-full relative min-h-[160px]">
                <div key={activeSimulatorStep} className="absolute inset-0 animate-in fade-in slide-in-from-right-4 duration-500">
                  <Badge className="bg-sky-500 text-white mb-4">{currentSim.badge}</Badge>
                  <h3 className={`${sora.className} text-2xl font-bold mb-6`}>{currentSim.title}</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Customer Details</p>
                      <p className="font-semibold">{currentSim.client}</p>
                      <p className="text-xs text-slate-500 mt-1">{currentSim.location || 'Site Verified'}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Live Telemetry</p>
                      <p className="font-semibold text-sky-600 dark:text-sky-400">{currentSim.tech || currentSim.labor || currentSim.amount || currentSim.eta}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{currentSim.vehicle || currentSim.parts || currentSim.settlement || currentSim.issue}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto flex flex-col items-center z-10 relative">
                <Button onClick={() => setActiveSimulatorStep((prev) => (prev + 1) % 4)} className="h-14 px-8 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold w-full md:w-auto shadow-xl shadow-sky-500/20 transition-transform active:scale-95">
                  {currentSim.actionPrompt} <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SHOWCASE */}
        <section className="py-24 overflow-hidden bg-white dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto px-4 space-y-32">
            {[
              { title: "Live GPS Fleet Telemetry", desc: "Monitor your entire fleet on a real-time radar. Dispatch the closest available van with 1-click, reducing fuel costs and response times by up to 40%.", imgClass: "from-sky-500 to-indigo-500", icon: Target },
              { title: "Quarter-Hour Stopwatch Billing", desc: "Never lose a billable minute. Technicians start a digital stopwatch upon arrival. Time is automatically rounded to the nearest quarter-hour and added to the invoice.", imgClass: "from-emerald-500 to-teal-500", icon: Clock, reverse: true },
              { title: "Sign-on-Glass & Instant Pay", desc: "Generate professional PDFs on site. Capture customer signatures on the iPad glass, and accept tap-to-pay or card payments before leaving the driveway.", imgClass: "from-violet-500 to-fuchsia-500", icon: Smartphone }
            ].map((feat, idx) => (
              <div key={idx} className={`scroll-reveal flex flex-col ${feat.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}>
                <div className="flex-1 space-y-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.imgClass} flex items-center justify-center text-white shadow-lg`}>
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h2 className={`${sora.className} text-3xl md:text-4xl font-bold leading-tight`}>{feat.title}</h2>
                  <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="flex-1 w-full">
                  <div className={`aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-tr ${feat.imgClass} p-1 shadow-2xl`}>
                    <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[22px] overflow-hidden flex items-center justify-center relative">
                       <div className="absolute inset-0 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm z-10 flex items-center justify-center">
                          <p className="font-mono text-sm font-bold opacity-50">Visual Dashboard Preview</p>
                       </div>
                       <div className="w-3/4 h-3/4 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-24 bg-slate-50 dark:bg-zinc-900/50 border-y border-slate-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className={`${sora.className} text-2xl font-bold mb-12 scroll-reveal`}>Trusted by the Top 1% of Service Businesses</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "John D.", role: "Owner, JD Plumbing", text: "TradeFlow completely changed how we bill. The stopwatch feature alone recovered $4,000 in lost time last month." },
                { name: "Sarah W.", role: "Dispatch Manager, HVAC Pro", text: "I can see exactly where all 12 vans are. Dispatching emergencies is now a 1-click process instead of 5 phone calls." },
                { name: "Mike R.", role: "Master Electrician", text: "Collecting payment on the spot via iPad has eliminated our accounts receivable problem entirely. We get paid the same day." }
              ].map((testimonial, i) => (
                <div key={i} className={`scroll-reveal scroll-reveal-delay-${i+1} bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm text-left`}>
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-slate-700 dark:text-zinc-300 mb-6 font-medium leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center font-bold text-sky-600 dark:text-sky-400">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section id="calculator" className="py-24 px-4 max-w-6xl mx-auto">
          <div className="scroll-reveal glass-panel-elevated p-8 md:p-12 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-white to-indigo-50/50 dark:from-zinc-900 dark:to-indigo-950/20 shadow-2xl">
            <div className="text-center mb-12">
              <h2 className={`${sora.className} text-3xl md:text-5xl font-bold mb-4`}>Calculate Your ROI</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">See how much revenue TradeFlow can help you recover by eliminating administrative friction.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm">Technicians</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{techCount} Techs</span>
                  </div>
                  <input type="range" min="1" max="50" value={techCount} onChange={(e) => setTechCount(Number(e.target.value))} className="w-full accent-sky-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm">Jobs Per Day (Per Tech)</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{jobsPerDay} Jobs</span>
                  </div>
                  <input type="range" min="1" max="10" value={jobsPerDay} onChange={(e) => setJobsPerDay(Number(e.target.value))} className="w-full accent-sky-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm">Hourly Billable Rate</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">${hourlyRate}/hr</span>
                  </div>
                  <input type="range" min="50" max="300" step="5" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full accent-sky-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Estimated Monthly Revenue Gain</p>
                  <p className={`${sora.className} text-4xl font-black text-emerald-500`}>${roiCalculations.monthlyRevenueGain.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 rounded-2xl text-center text-white shadow-xl">
                  <p className="text-xs font-bold uppercase text-white/80 tracking-wider mb-2">Projected Annual Growth</p>
                  <p className={`${sora.className} text-5xl font-black`}>+${roiCalculations.annualRevenueGain.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className={`${sora.className} text-3xl sm:text-5xl font-bold`}>Simple, Transparent Pricing</h2>
            <p className="text-slate-500 mt-4">No hidden fees. Scale your empire predictably.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '79', desc: '1-2 Techs', highlight: false },
              { name: 'Pro Fleet', price: '149', desc: '3-10 Techs', highlight: true },
              { name: 'Enterprise', price: '299', desc: 'Unlimited Techs', highlight: false }
            ].map((plan, i) => (
              <div key={i} className={`scroll-reveal scroll-reveal-delay-${i+1} p-8 rounded-3xl border flex flex-col transition-all duration-300 ${plan.highlight ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/10 shadow-2xl scale-105' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:border-sky-300'}`}>
                {plan.highlight && <div className="bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full self-start mb-4">Most Popular</div>}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={`${sora.className} text-4xl font-black`}>${plan.price}</span>
                  <span className="text-slate-500 text-sm">/mo</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400 mb-8 border-b border-slate-100 dark:border-zinc-800 pb-8">{plan.desc}</p>
                <div className="space-y-4 mb-8 flex-1">
                  {[1,2,3,4].map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium">Premium Feature {f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/signup">
                  <Button className={`w-full h-12 rounded-xl font-bold ${plan.highlight ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg' : 'bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-900 dark:text-zinc-100'}`}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-4 max-w-5xl mx-auto text-center scroll-reveal">
          <div className="bg-slate-900 dark:bg-zinc-900 p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-violet-500/20"></div>
            <div className="relative z-10 space-y-8">
              <h2 className={`${sora.className} text-4xl md:text-6xl font-black text-white`}>Ready to Modernize?</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">Join the elite field service companies transforming their dispatch operations today.</p>
              <Link href="/signup" className="inline-block">
                <Button size="lg" className="h-16 px-10 text-lg font-bold rounded-full bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_40px_rgba(14,165,233,0.4)] transition-all hover:scale-105">
                  Start Your 14-Day Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 dark:bg-zinc-800 flex items-center justify-center text-white">
              <Wrench className="w-3 h-3" />
            </div>
            <span className="font-bold text-sm">TradeFlow Enterprise &copy; 2026</span>
          </div>
          <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
            <LanguageSelector />
            <CurrencySelector />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
