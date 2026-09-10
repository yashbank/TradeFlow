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
} from 'lucide-react';
import { logoutUserAction } from '@/actions/auth';
import type { Organization, UserProfile, UserRole } from '@/types/database';

interface AppShellProps {
  children: React.ReactNode;
  organization: Organization;
  user: UserProfile;
  role: UserRole;
}

export function AppShell({ children, organization, user, role }: AppShellProps) {
  const pathname = usePathname();

  const isTechnician = role === 'technician';
  const navItems = isTechnician
    ? [
        { label: 'Schedule', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Jobs', href: '/jobs', icon: CalendarCheck2 },
        { label: 'Customers', href: '/customers', icon: Users },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Quotes', href: '/quotes', icon: FileText },
        { label: 'Jobs', href: '/jobs', icon: CalendarCheck2 },
        { label: 'Invoices', href: '/invoices', icon: Receipt },
        { label: 'Settings', href: '/settings', icon: Settings },
      ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white min-h-screen p-4 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 px-2 py-4 mb-4 border-b border-slate-100">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-900 truncate leading-tight">{organization.name}</h1>
            <p className="text-xs text-slate-500 font-medium capitalize">{role} Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-2">
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <form action={logoutUserAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="bg-blue-600 text-white p-1.5 rounded-md">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{organization.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isTechnician && (
            <Link href="/settings" className="text-xs font-medium text-slate-600 p-2">
              Settings
            </Link>
          )}
          <form action={logoutUserAction}>
            <button type="submit" className="text-xs font-medium text-red-600 p-2">
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Thumb ergonomic) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-40 px-1 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full text-xs font-medium ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
