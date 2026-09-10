'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TechnicianFieldPortal } from './TechnicianFieldPortal';
import { OwnerPictorialDashboard } from './OwnerPictorialDashboard';
import type { UserProfile, Organization, UserRole } from '@/types/database';

interface DashboardClientViewProps {
  metrics?: any;
  activity?: any;
  isTechnician: boolean;
  myJobs?: any[];
  teamMembers?: any[];
  user: UserProfile;
  organization: Organization;
  role: UserRole;
}

export function DashboardClientView({
  metrics = {},
  activity = { recentJobs: [], recentQuotes: [] },
  isTechnician = false,
  myJobs = [],
  teamMembers = [],
  user,
  organization,
  role,
}: DashboardClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(true);

  // 3-second live auto-refresh polling (only when tab is visible to prevent unnecessary load)
  useEffect(() => {
    if (!isAutoSyncing) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        startTransition(() => {
          router.refresh();
          setLastSyncTime(new Date());
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [router, isAutoSyncing]);

  const handleManualSync = () => {
    startTransition(() => {
      router.refresh();
      setLastSyncTime(new Date());
    });
  };

  // If user is a field technician, directly render the technician field portal
  if (isTechnician) {
    return (
      <TechnicianFieldPortal
        myJobs={myJobs}
        user={user}
        organization={organization}
      />
    );
  }

  // Owner/Admin role: render the high-aesthetic executive pictorial dashboard with real data
  return (
    <OwnerPictorialDashboard
      metrics={metrics}
      activity={activity}
      jobs={myJobs}
      teamMembers={teamMembers}
      user={user}
      organization={organization}
      lastSyncTime={lastSyncTime}
      isSyncing={isPending}
      isAutoSyncing={isAutoSyncing}
      onToggleAutoSync={() => setIsAutoSyncing((prev) => !prev)}
      onManualSync={handleManualSync}
    />
  );
}

