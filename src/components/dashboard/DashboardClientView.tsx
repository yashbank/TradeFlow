'use client';

import React, { useState } from 'react';
import { TechnicianFieldPortal } from './TechnicianFieldPortal';
import { OwnerPictorialDashboard } from './OwnerPictorialDashboard';
import { ShieldCheck, Wrench, Sliders } from 'lucide-react';
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
  // Role simulator state: allows Owner/Admin to preview and test the Technician view live
  const [activeViewRole, setActiveViewRole] = useState<'owner' | 'technician'>(
    isTechnician ? 'technician' : 'owner'
  );

  return (
    <div className="space-y-6">
      {/* Role Simulator Switcher for Owners/Admins */}
      {!isTechnician && (
        <div className="glass-panel rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Role Preview Mode
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-cyan-950 text-sky-700 dark:text-cyan-300">
                  Live Switcher
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                Experience TradeFlow as an Owner with pictorial telemetry or as a Field Technician with Swiggy-style GPS navigation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveViewRole('owner')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeViewRole === 'owner'
                  ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-cyan-400 shadow-xs font-bold'
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
              Field Technician (Swiggy Map)
            </button>
          </div>
        </div>
      )}

      {/* Render selected view */}
      {activeViewRole === 'technician' || isTechnician ? (
        <TechnicianFieldPortal
          myJobs={myJobs}
          user={user}
          organization={organization}
        />
      ) : (
        <OwnerPictorialDashboard
          metrics={metrics}
          activity={activity}
          user={user}
          organization={organization}
        />
      )}
    </div>
  );
}
