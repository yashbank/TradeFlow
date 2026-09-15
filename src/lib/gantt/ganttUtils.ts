// ==============================================================================
// src/lib/gantt/ganttUtils.ts — Pure Gantt Scheduling & Calculation Engine
// ==============================================================================

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
export const DEFAULT_ZOOM = 3;

/**
 * Clamps Gantt zoom level strictly between 1 and 5.
 */
export function clampGanttZoom(zoom: number, min: number = MIN_ZOOM, max: number = MAX_ZOOM): number {
  if (typeof zoom !== 'number' || isNaN(zoom) || !isFinite(zoom)) {
    return DEFAULT_ZOOM;
  }
  const rounded = Math.round(zoom);
  return Math.max(min, Math.min(max, rounded));
}

/**
 * Calculates day column width in pixels based on zoom level (1 = 90px, 5 = 220px).
 */
export function getGanttColumnWidth(zoom: number): number {
  const clamped = clampGanttZoom(zoom);
  const widths: Record<number, number> = {
    1: 90,
    2: 120,
    3: 150,
    4: 185,
    5: 220,
  };
  return widths[clamped] || 150;
}

/**
 * Serializes drag and drop transfer payload.
 */
export function formatDragTransferData(jobId: string, metadata?: Record<string, any>): string {
  if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
    throw new Error('jobId must be a non-empty string.');
  }
  return JSON.stringify({
    jobId: jobId.trim(),
    type: 'application/x-tradeflow-job',
    timestamp: Date.now(),
    ...(metadata || {}),
  });
}

/**
 * Parses drag and drop transfer payload safely, supporting both JSON and raw job ID strings.
 */
export function parseDragTransferData(raw: string): { jobId: string; [key: string]: any } | null {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && typeof parsed.jobId === 'string' && parsed.jobId.trim() !== '') {
      return parsed;
    }
  } catch {
    // Fallback: raw job ID string
    if (trimmed.length > 0) {
      return { jobId: trimmed };
    }
  }
  return null;
}

/**
 * Calculates job bar width, offset, and duration within a Gantt day column.
 */
export function calculateJobBarWidth(
  start: string | Date,
  end?: string | Date | null,
  columnWidth: number = 150,
  dayStartHour: number = 8,
  dayHours: number = 9
): {
  widthPx: number;
  offsetPx: number;
  durationMinutes: number;
  percentWidth: number;
} {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  if (!startDate || isNaN(startDate.getTime())) {
    return { widthPx: 40, offsetPx: 0, durationMinutes: 60, percentWidth: 10 };
  }

  let endDate: Date;
  if (!end) {
    // Default duration is 60 minutes if end is missing
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  } else {
    endDate = typeof end === 'string' ? new Date(end) : end;
    if (isNaN(endDate.getTime()) || endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }
  }

  const durationMs = Math.max(15 * 60 * 1000, endDate.getTime() - startDate.getTime());
  const durationMinutes = Math.round(durationMs / 60000);

  const totalDayMinutes = dayHours * 60;
  const startMinuteOfDay = (startDate.getHours() - dayStartHour) * 60 + startDate.getMinutes();
  const clampedStartMinutes = Math.max(0, Math.min(totalDayMinutes, startMinuteOfDay));

  const percentOffset = (clampedStartMinutes / totalDayMinutes) * 100;
  const percentWidth = Math.min(100 - percentOffset, Math.max(10, (durationMinutes / totalDayMinutes) * 100));

  const offsetPx = Math.round((clampedStartMinutes / totalDayMinutes) * columnWidth);
  const minWidthPx = 36; // Minimum clickable width for quick 15-min jobs
  const calculatedWidthPx = Math.round((durationMinutes / totalDayMinutes) * columnWidth);
  const widthPx = Math.max(minWidthPx, Math.min(columnWidth - offsetPx, calculatedWidthPx));

  return {
    widthPx,
    offsetPx,
    durationMinutes,
    percentWidth,
  };
}

/**
 * Computes 7 days of the week (Monday through Sunday) containing the anchorDate.
 */
export function getGanttWeekDays(anchorDate: Date): Date[] {
  const d = new Date(anchorDate);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

/**
 * Shifts anchor date by +/- N weeks.
 */
export function shiftWeek(anchorDate: Date, offsetWeeks: number): Date {
  const result = new Date(anchorDate);
  result.setDate(result.getDate() + offsetWeeks * 7);
  return result;
}

/**
 * Checks if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  if (!da || !db || isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Formats week range label e.g. "Sep 15 – Sep 21, 2026"
 */
export function formatGanttWeekRange(weekDays: Date[], locale: string = 'en-US'): string {
  if (!weekDays || weekDays.length === 0) return '';
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];

  const monthFirst = first.toLocaleDateString(locale, { month: 'short' });
  const monthLast = last.toLocaleDateString(locale, { month: 'short' });
  const yearFirst = first.getFullYear();
  const yearLast = last.getFullYear();

  if (yearFirst !== yearLast) {
    return `${monthFirst} ${first.getDate()}, ${yearFirst} – ${monthLast} ${last.getDate()}, ${yearLast}`;
  }
  if (monthFirst !== monthLast) {
    return `${monthFirst} ${first.getDate()} – ${monthLast} ${last.getDate()}, ${yearFirst}`;
  }
  return `${monthFirst} ${first.getDate()} – ${last.getDate()}, ${yearFirst}`;
}

/**
 * Extracts 1-2 letter initials for a technician.
 */
export function getTechnicianInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim()[0].toUpperCase();
  }
  return '?';
}

export interface TechnicianRow {
  id: string | null;
  name: string;
  initials: string;
  isPool: boolean;
}

/**
 * Builds list of technician rows: all registered team members plus the Unassigned Pool row.
 */
export function buildTechnicianRows(
  teamMembers: Array<{ id: string; name?: string; email?: string }>,
  unassignedLabel: string = 'Unassigned (Pool Queue)'
): TechnicianRow[] {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const rows: TechnicianRow[] = members.map((m) => ({
    id: m.id,
    name: m.name || m.email || 'Technician',
    initials: getTechnicianInitials(m.name, m.email),
    isPool: false,
  }));

  // Append the unassigned row at the bottom
  rows.push({
    id: null,
    name: unassignedLabel,
    initials: 'UP',
    isPool: true,
  });

  return rows;
}

/**
 * Filters jobs for a specific technician and calendar day cell.
 */
export function filterJobsForTechnicianCell(
  jobs: Array<any>,
  techId: string | null,
  targetDay: Date
): Array<any> {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  return safeJobs.filter((job) => {
    if (!job || !job.scheduled_start) return false;
    
    // Check technician assignment match
    const assignedMatch = techId === null
      ? !job.assigned_to_user_id
      : job.assigned_to_user_id === techId;

    if (!assignedMatch) return false;

    // Check calendar day match
    return isSameDay(new Date(job.scheduled_start), targetDay);
  });
}
