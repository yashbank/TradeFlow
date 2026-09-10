'use client';

import React from 'react';
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
    />
  );
}
