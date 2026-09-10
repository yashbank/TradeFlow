'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck2,
  Receipt,
  Settings,
  LogOut,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { logoutUserAction } from '@/actions/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import type { Organization, UserProfile, UserRole } from '@/types/database';

interface AppShellProps {
  children: React.ReactNode;
  organization: Organization;
  user: UserProfile;
  role: UserRole;
}

export function AppShell({ children, organization, user, role }: AppShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isTechnician = role === 'technician';
  const navItems = isTechnician
    ? [
        { label: t('nav.schedule'), href: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.my_jobs'), href: '/jobs', icon: CalendarCheck2 },
        { label: t('nav.customers'), href: '/customers', icon: Users },
      ]
    : [
        { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.customers'), href: '/customers', icon: Users },
        { label: t('nav.quotes'), href: '/quotes', icon: FileText },
        { label: t('nav.jobs'), href: '/jobs', icon: CalendarCheck2 },
        { label: t('nav.invoices'), href: '/invoices', icon: Receipt },
        { label: t('nav.settings'), href: '/settings', icon: Settings },
      ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/70 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm min-h-screen p-4 sticky top-0 h-screen shadow-xs z-30">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 py-3.5 mb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/20 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-900 dark:text-zinc-100 truncate text-sm leading-tight">
              {organization.name}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium capitalize truncate">
                {role} {t('nav.workspace')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Global Controls & User Profile */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-3">
          {/* Quick theme & language controls in sidebar */}
          <div className="flex items-center justify-between gap-1.5 px-1">
            <ThemeToggle />
            <LanguageSelector />
          </div>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="truncate min-w-0 pr-2">
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">{user.email}</p>
            </div>
            <form action={logoutUserAction}>
              <button
                type="submit"
                title={t('nav.logout')}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs truncate max-w-[130px]">
            {organization.name}
          </span>
        </div>

        {/* Controls: Theme, Language, Logout */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageSelector />
          <form action={logoutUserAction}>
            <button
              type="submit"
              title={t('nav.logout')}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Navbar (Header Bar) */}
        <div className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              TradeFlow FSM
            </span>
            <span>•</span>
            <span className="capitalize">{role} Portal</span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>

        <main className="flex-1 pb-24 md:pb-12 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in-50 duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb ergonomic) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-slate-200 dark:border-zinc-800 flex justify-around items-center h-16 z-40 px-1 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full text-[11px] font-semibold transition-transform active:scale-90 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <div
                className={`p-1 rounded-lg mb-0.5 transition-colors ${
                  isActive ? 'bg-blue-50 dark:bg-blue-950/60' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
