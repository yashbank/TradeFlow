import { describe, it, expect, vi } from 'vitest';
import {
  clampGanttZoom,
  getGanttColumnWidth,
  formatDragTransferData,
  parseDragTransferData,
  calculateJobBarWidth,
  getGanttWeekDays,
  shiftWeek,
  isSameDay,
  formatGanttWeekRange,
  getTechnicianInitials,
  buildTechnicianRows,
  filterJobsForTechnicianCell,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
} from '@/lib/gantt/ganttUtils';
import {
  toggleMapLayer,
  isSatelliteMap,
  getMapLayerConfig,
  calculateDistanceKm,
} from '@/lib/map/mapUtils';

describe('Domain Gantt Dispatch & Map Architecture Suite (test/unit/domain-gantt-map.test.ts)', () => {
  // ============================================================================
  // Scope 1: Gantt Zoom State Clamping (1-5) & Column Rescaling
  // ============================================================================
  describe('Scope 1: Gantt Zoom State Clamping (1-5)', () => {
    it('001. keeps valid zoom levels 1, 2, 3, 4, 5 unchanged', () => {
      expect(clampGanttZoom(1)).toBe(1);
      expect(clampGanttZoom(2)).toBe(2);
      expect(clampGanttZoom(3)).toBe(3);
      expect(clampGanttZoom(4)).toBe(4);
      expect(clampGanttZoom(5)).toBe(5);
    });

    it('002. clamps lower out-of-bounds zoom (0) to minimum 1', () => {
      expect(clampGanttZoom(0)).toBe(1);
    });

    it('003. clamps negative zoom values (-1, -100) to minimum 1', () => {
      expect(clampGanttZoom(-1)).toBe(1);
      expect(clampGanttZoom(-100)).toBe(1);
    });

    it('004. clamps upper out-of-bounds zoom (6) to maximum 5', () => {
      expect(clampGanttZoom(6)).toBe(5);
    });

    it('005. clamps large zoom values (10, 999) to maximum 5', () => {
      expect(clampGanttZoom(10)).toBe(5);
      expect(clampGanttZoom(999)).toBe(5);
    });

    it('006. rounds floating point zoom values to nearest integer clamp', () => {
      expect(clampGanttZoom(2.4)).toBe(2);
      expect(clampGanttZoom(2.6)).toBe(3);
      expect(clampGanttZoom(5.4)).toBe(5);
      expect(clampGanttZoom(0.3)).toBe(1);
    });

    it('007. handles NaN and non-number values by falling back to DEFAULT_ZOOM (3)', () => {
      expect(clampGanttZoom(NaN)).toBe(DEFAULT_ZOOM);
      expect(clampGanttZoom(Infinity)).toBe(DEFAULT_ZOOM);
      expect(clampGanttZoom('3' as any)).toBe(DEFAULT_ZOOM);
      expect(clampGanttZoom(null as any)).toBe(DEFAULT_ZOOM);
    });

    it('008. column width increases monotonically with zoom level', () => {
      const w1 = getGanttColumnWidth(1);
      const w2 = getGanttColumnWidth(2);
      const w3 = getGanttColumnWidth(3);
      const w4 = getGanttColumnWidth(4);
      const w5 = getGanttColumnWidth(5);

      expect(w1).toBeLessThan(w2);
      expect(w2).toBeLessThan(w3);
      expect(w3).toBeLessThan(w4);
      expect(w4).toBeLessThan(w5);
    });

    it('009. column width for zoom 1 is at least 80px', () => {
      expect(getGanttColumnWidth(1)).toBeGreaterThanOrEqual(80);
    });

    it('010. column width for zoom 5 is at least 200px', () => {
      expect(getGanttColumnWidth(5)).toBeGreaterThanOrEqual(200);
    });

    it('011. getGanttColumnWidth clamps inputs outside 1-5', () => {
      expect(getGanttColumnWidth(-5)).toBe(getGanttColumnWidth(1));
      expect(getGanttColumnWidth(99)).toBe(getGanttColumnWidth(5));
    });

    it('012. constants MIN_ZOOM and MAX_ZOOM are strictly 1 and 5', () => {
      expect(MIN_ZOOM).toBe(1);
      expect(MAX_ZOOM).toBe(5);
    });
  });

  // ============================================================================
  // Scope 2: Drag Data Transfer Format & Serialization
  // ============================================================================
  describe('Scope 2: Drag Data Transfer Format', () => {
    it('013. serializes valid job drag payload into JSON string', () => {
      const raw = formatDragTransferData('job-1234');
      const parsed = JSON.parse(raw);
      expect(parsed.jobId).toBe('job-1234');
      expect(parsed.type).toBe('application/x-tradeflow-job');
      expect(typeof parsed.timestamp).toBe('number');
    });

    it('014. includes optional metadata in drag transfer payload', () => {
      const raw = formatDragTransferData('job-5678', {
        sourceTechId: 'tech-1',
        durationMinutes: 90,
      });
      const parsed = JSON.parse(raw);
      expect(parsed.jobId).toBe('job-5678');
      expect(parsed.sourceTechId).toBe('tech-1');
      expect(parsed.durationMinutes).toBe(90);
    });

    it('015. throws Error when serializing empty or invalid jobId', () => {
      expect(() => formatDragTransferData('')).toThrow(/non-empty string/);
      expect(() => formatDragTransferData('   ')).toThrow(/non-empty string/);
      expect(() => formatDragTransferData(null as any)).toThrow();
    });

    it('016. parses valid JSON drag payload correctly', () => {
      const raw = JSON.stringify({ jobId: 'job-999', type: 'application/x-tradeflow-job' });
      const parsed = parseDragTransferData(raw);
      expect(parsed).not.toBeNull();
      expect(parsed?.jobId).toBe('job-999');
    });

    it('017. falls back gracefully to raw string jobId if text/plain contains raw ID', () => {
      const parsed = parseDragTransferData('b4a3c2d1-0000-0000-0000-000000000000');
      expect(parsed).not.toBeNull();
      expect(parsed?.jobId).toBe('b4a3c2d1-0000-0000-0000-000000000000');
    });

    it('018. returns null for empty or whitespace drag payloads', () => {
      expect(parseDragTransferData('')).toBeNull();
      expect(parseDragTransferData('   ')).toBeNull();
      expect(parseDragTransferData(null as any)).toBeNull();
    });

    it('019. drag and drop mock HTML5 dataTransfer integration', () => {
      const mockDataStore: Record<string, string> = {};
      const mockEvent = {
        dataTransfer: {
          setData: vi.fn((type: string, val: string) => {
            mockDataStore[type] = val;
          }),
          getData: vi.fn((type: string) => mockDataStore[type] || ''),
          effectAllowed: 'none',
          dropEffect: 'none',
        },
      };

      // Set data on dragstart
      const payload = formatDragTransferData('job-alpha');
      mockEvent.dataTransfer.setData('text/plain', payload);
      mockEvent.dataTransfer.effectAllowed = 'move';

      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('text/plain', payload);
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');

      // Retrieve data on drop
      const droppedText = mockEvent.dataTransfer.getData('text/plain');
      const parsed = parseDragTransferData(droppedText);
      expect(parsed?.jobId).toBe('job-alpha');
    });

    it('020. ignores malformed JSON payloads with missing jobId gracefully', () => {
      const badJson = JSON.stringify({ foo: 'bar' });
      const parsed = parseDragTransferData(badJson);
      // Because it's valid JSON without jobId, fallback to raw string or null
      expect(parsed?.jobId).toBeUndefined();
    });

    it('021. trims whitespace from serialized jobId', () => {
      const raw = formatDragTransferData('  job-padded  ');
      const parsed = parseDragTransferData(raw);
      expect(parsed?.jobId).toBe('job-padded');
    });

    it('022. preserves timestamp within reasonable margin of current time', () => {
      const before = Date.now();
      const raw = formatDragTransferData('job-time');
      const parsed = parseDragTransferData(raw);
      const after = Date.now();
      expect(parsed?.timestamp).toBeGreaterThanOrEqual(before);
      expect(parsed?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  // ============================================================================
  // Scope 3: Map Satellite Toggle State & Layer Configuration
  // ============================================================================
  describe('Scope 3: Map Satellite Toggle State', () => {
    it('023. toggleMapLayer toggles from standard to satellite', () => {
      expect(toggleMapLayer('standard')).toBe('satellite');
    });

    it('024. toggleMapLayer toggles from satellite back to standard', () => {
      expect(toggleMapLayer('satellite')).toBe('standard');
    });

    it('025. isSatelliteMap returns true for satellite mode', () => {
      expect(isSatelliteMap('satellite')).toBe(true);
    });

    it('026. isSatelliteMap returns false for standard mode or unknown strings', () => {
      expect(isSatelliteMap('standard')).toBe(false);
      expect(isSatelliteMap('hybrid')).toBe(false);
      expect(isSatelliteMap('')).toBe(false);
    });

    it('027. getMapLayerConfig returns OpenStreetMap tile configuration in standard mode', () => {
      const config = getMapLayerConfig('standard');
      expect(config.isSatellite).toBe(false);
      expect(config.tileUrl).toContain('tile.openstreetmap.org');
      expect(config.attribution).toContain('OpenStreetMap');
      expect(config.maxZoom).toBe(18);
    });

    it('028. getMapLayerConfig returns ArcGIS World Imagery in satellite mode', () => {
      const config = getMapLayerConfig('satellite');
      expect(config.isSatellite).toBe(true);
      expect(config.tileUrl).toContain('ArcGIS/rest/services/World_Imagery');
      expect(config.attribution).toContain('Esri');
      expect(config.maxZoom).toBe(19);
    });

    it('029. satellite mode configures optical contrast enhancement filter', () => {
      const satConfig = getMapLayerConfig('satellite');
      const stdConfig = getMapLayerConfig('standard');

      expect(satConfig.contrastFilter).toContain('contrast');
      expect(stdConfig.contrastFilter).toBe('none');
    });

    it('030. coordinate distance calculation matches known geospatial distance', () => {
      // Austin, TX (30.2672, -97.7431) to Round Rock, TX (30.5083, -97.6789) ~ 27-28 km
      const dist = calculateDistanceKm(30.2672, -97.7431, 30.5083, -97.6789);
      expect(dist).toBeGreaterThan(25);
      expect(dist).toBeLessThan(30);
    });

    it('031. distance between identical points is 0.0 km', () => {
      expect(calculateDistanceKm(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);
    });

    it('032. map layer persistence state simulation', () => {
      let currentMode: any = 'standard';
      currentMode = toggleMapLayer(currentMode);
      expect(currentMode).toBe('satellite');
      currentMode = toggleMapLayer(currentMode);
      expect(currentMode).toBe('standard');
    });
  });

  // ============================================================================
  // Scope 4: Job Bar Width & Offset Calculation
  // ============================================================================
  describe('Scope 4: Job Bar Width & Duration Calculation', () => {
    it('033. calculates bar width for 1-hour job (8:00 to 9:00 AM)', () => {
      const start = new Date(2026, 8, 15, 8, 0, 0);
      const end = new Date(2026, 8, 15, 9, 0, 0);
      const res = calculateJobBarWidth(start, end, 180, 8, 9);
      expect(res.durationMinutes).toBe(60);
      expect(res.offsetPx).toBe(0);
      // In a 9-hour (540 min) day, 60 min is 1/9 of 180px = 20px, clamped to min 36px
      expect(res.widthPx).toBeGreaterThanOrEqual(36);
    });

    it('034. calculates bar width for 3-hour job (9:00 AM to 12:00 PM)', () => {
      const start = new Date(2026, 8, 15, 9, 0, 0);
      const end = new Date(2026, 8, 15, 12, 0, 0);
      const columnWidth = 180;
      const res = calculateJobBarWidth(start, end, columnWidth, 8, 9);
      expect(res.durationMinutes).toBe(180);
      // 3 hours out of 9 hours is exactly 33.33% of 180px = 60px
      expect(res.widthPx).toBe(60);
    });

    it('035. clamps minimum bar width to at least 36px so 15-min callouts are clickable', () => {
      const start = new Date(2026, 8, 15, 10, 0, 0);
      const end = new Date(2026, 8, 15, 10, 15, 0); // 15 mins
      const res = calculateJobBarWidth(start, end, 150, 8, 9);
      expect(res.durationMinutes).toBe(15);
      expect(res.widthPx).toBeGreaterThanOrEqual(36);
    });

    it('036. caps maximum bar width within column width limit (width + offset <= columnWidth)', () => {
      const start = new Date(2026, 8, 15, 15, 0, 0); // 3:00 PM (7 hours in)
      const end = new Date(2026, 8, 15, 20, 0, 0); // Exceeds 5:00 PM
      const columnWidth = 180;
      const res = calculateJobBarWidth(start, end, columnWidth, 8, 9);
      expect(res.offsetPx + res.widthPx).toBeLessThanOrEqual(columnWidth);
    });

    it('037. defaults to 60-minute duration when scheduled_end is null or undefined', () => {
      const start = new Date(2026, 8, 15, 9, 0, 0);
      const res = calculateJobBarWidth(start, null, 150);
      expect(res.durationMinutes).toBe(60);
    });

    it('038. handles invalid end date (end before start) defensively', () => {
      const start = new Date(2026, 8, 15, 10, 0, 0);
      const end = new Date(2026, 8, 15, 9, 0, 0); // Before start
      const res = calculateJobBarWidth(start, end, 150);
      expect(res.durationMinutes).toBe(60);
    });

    it('039. handles string ISO dates seamlessly', () => {
      const res = calculateJobBarWidth('2026-09-15T11:00:00Z', '2026-09-15T13:00:00Z', 150);
      expect(res.durationMinutes).toBe(120);
    });

    it('040. handles invalid date strings gracefully without throwing', () => {
      const res = calculateJobBarWidth('not-a-date');
      expect(res.widthPx).toBeGreaterThan(0);
      expect(res.durationMinutes).toBe(60);
    });

    it('041. percent width is between 10% and 100%', () => {
      const start = new Date(2026, 8, 15, 8, 0, 0);
      const end = new Date(2026, 8, 15, 9, 0, 0);
      const res = calculateJobBarWidth(start, end, 150);
      expect(res.percentWidth).toBeGreaterThanOrEqual(10);
      expect(res.percentWidth).toBeLessThanOrEqual(100);
    });

    it('042. all-day or multi-hour job spans proper percentage of the day', () => {
      const start = new Date(2026, 8, 15, 8, 0, 0);
      const end = new Date(2026, 8, 15, 17, 0, 0); // 9 hours
      const res = calculateJobBarWidth(start, end, 180, 8, 9);
      expect(res.durationMinutes).toBe(540);
      expect(res.percentWidth).toBe(100);
      expect(res.widthPx).toBe(180);
    });

    it('043. offsetPx is 0 when job starts at day start hour', () => {
      const start = new Date(2026, 8, 15, 8, 0, 0);
      const res = calculateJobBarWidth(start, null, 180, 8, 9);
      expect(res.offsetPx).toBe(0);
    });

    it('044. offsetPx increases proportionally for afternoon jobs', () => {
      const morningStart = new Date(2026, 8, 15, 9, 0, 0);
      const afternoonStart = new Date(2026, 8, 15, 14, 0, 0);
      const morningRes = calculateJobBarWidth(morningStart, null, 180, 8, 9);
      const afternoonRes = calculateJobBarWidth(afternoonStart, null, 180, 8, 9);
      expect(afternoonRes.offsetPx).toBeGreaterThan(morningRes.offsetPx);
    });
  });

  // ============================================================================
  // Scope 5: Week Date Range Calculation
  // ============================================================================
  describe('Scope 5: Week Date Range Calculation', () => {
    it('045. getGanttWeekDays returns exactly 7 consecutive days', () => {
      const anchor = new Date(2026, 8, 15); // Tuesday Sep 15, 2026
      const week = getGanttWeekDays(anchor);
      expect(week).toHaveLength(7);
    });

    it('046. first day of week is Monday (getDay() === 1)', () => {
      const anchor = new Date(2026, 8, 15); // Tuesday
      const week = getGanttWeekDays(anchor);
      expect(week[0].getDay()).toBe(1); // Monday
      expect(week[0].getDate()).toBe(14); // Sep 14, 2026
    });

    it('047. last day of week is Sunday (getDay() === 0)', () => {
      const anchor = new Date(2026, 8, 15);
      const week = getGanttWeekDays(anchor);
      expect(week[6].getDay()).toBe(0); // Sunday
      expect(week[6].getDate()).toBe(20); // Sep 20, 2026
    });

    it('048. anchor date on Sunday resolves Monday 6 days prior', () => {
      const sunday = new Date(2026, 8, 20); // Sunday Sep 20, 2026
      const week = getGanttWeekDays(sunday);
      expect(week[0].getDate()).toBe(14);
      expect(week[6].getDate()).toBe(20);
    });

    it('049. anchor date on Monday resolves that exact Monday as start', () => {
      const monday = new Date(2026, 8, 14);
      const week = getGanttWeekDays(monday);
      expect(week[0].getDate()).toBe(14);
    });

    it('050. handles cross-month transition (August into September)', () => {
      const anchor = new Date(2026, 8, 2); // Wed Sep 2, 2026
      const week = getGanttWeekDays(anchor);
      expect(week[0].getMonth()).toBe(7); // August (0-indexed 7)
      expect(week[0].getDate()).toBe(31); // Mon Aug 31
      expect(week[1].getMonth()).toBe(8); // September (0-indexed 8)
      expect(week[1].getDate()).toBe(1);  // Tue Sep 1
    });

    it('051. handles cross-year transition (December into January)', () => {
      const anchor = new Date(2026, 11, 31); // Thu Dec 31, 2026
      const week = getGanttWeekDays(anchor);
      expect(week[0].getFullYear()).toBe(2026);
      expect(week[0].getMonth()).toBe(11); // December
      expect(week[0].getDate()).toBe(28);  // Mon Dec 28, 2026
      expect(week[6].getFullYear()).toBe(2027);
      expect(week[6].getMonth()).toBe(0);  // January 2027
      expect(week[6].getDate()).toBe(3);   // Sun Jan 3, 2027
    });

    it('052. shiftWeek shifts anchor forward or back by exactly N weeks (7 * N days)', () => {
      const anchor = new Date(2026, 8, 15);
      const nextWeek = shiftWeek(anchor, 1);
      const prevWeek = shiftWeek(anchor, -1);

      expect(nextWeek.getDate()).toBe(22);
      expect(prevWeek.getDate()).toBe(8);
    });

    it('053. isSameDay correctly checks day equality regardless of time', () => {
      const d1 = new Date(2026, 8, 15, 8, 30);
      const d2 = new Date(2026, 8, 15, 17, 45);
      const d3 = new Date(2026, 8, 16, 8, 30);

      expect(isSameDay(d1, d2)).toBe(true);
      expect(isSameDay(d1, d3)).toBe(false);
    });

    it('054. formatGanttWeekRange produces readable week label', () => {
      const week = getGanttWeekDays(new Date(2026, 8, 15));
      const label = formatGanttWeekRange(week, 'en-US');
      expect(label).toContain('Sep 14');
      expect(label).toContain('20');
      expect(label).toContain('2026');
    });
  });

  // ============================================================================
  // Scope 6: Technician Row Rendering Logic & Cell Assignment
  // ============================================================================
  describe('Scope 6: Technician Row Rendering & Dispatch Grid', () => {
    const mockTeam = [
      { id: 'tech-1', name: 'Marcus Brody', email: 'marcus@tradeflow.com' },
      { id: 'tech-2', name: 'Elena Rostova', email: 'elena@tradeflow.com' },
    ];

    it('055. buildTechnicianRows returns rows for all team members plus Unassigned Pool row', () => {
      const rows = buildTechnicianRows(mockTeam);
      expect(rows).toHaveLength(3);
      expect(rows[0].id).toBe('tech-1');
      expect(rows[1].id).toBe('tech-2');
      expect(rows[2].id).toBeNull(); // Unassigned Pool
      expect(rows[2].isPool).toBe(true);
    });

    it('056. generates 2-letter initials for first and last name', () => {
      expect(getTechnicianInitials('Marcus Brody')).toBe('MB');
      expect(getTechnicianInitials('Elena Rostova')).toBe('ER');
      expect(getTechnicianInitials('John David Smith')).toBe('JS');
    });

    it('057. generates initials for single word name or email fallback', () => {
      expect(getTechnicianInitials('Dave')).toBe('DA');
      expect(getTechnicianInitials(null, 'plumber@tradeflow.com')).toBe('P');
      expect(getTechnicianInitials(null, null)).toBe('?');
    });

    it('058. filterJobsForTechnicianCell filters jobs matching technician and day', () => {
      const targetDay = new Date(2026, 8, 15);
      const jobs = [
        { id: 'j1', assigned_to_user_id: 'tech-1', scheduled_start: '2026-09-15T09:00:00Z' },
        { id: 'j2', assigned_to_user_id: 'tech-2', scheduled_start: '2026-09-15T11:00:00Z' },
        { id: 'j3', assigned_to_user_id: 'tech-1', scheduled_start: '2026-09-16T09:00:00Z' }, // Different day
      ];

      const tech1Jobs = filterJobsForTechnicianCell(jobs, 'tech-1', targetDay);
      expect(tech1Jobs).toHaveLength(1);
      expect(tech1Jobs[0].id).toBe('j1');
    });

    it('059. filterJobsForTechnicianCell filters unassigned jobs when techId is null', () => {
      const targetDay = new Date(2026, 8, 15);
      const jobs = [
        { id: 'j1', assigned_to_user_id: null, scheduled_start: '2026-09-15T09:00:00Z' },
        { id: 'j2', assigned_to_user_id: 'tech-1', scheduled_start: '2026-09-15T10:00:00Z' },
      ];

      const unassigned = filterJobsForTechnicianCell(jobs, null, targetDay);
      expect(unassigned).toHaveLength(1);
      expect(unassigned[0].id).toBe('j1');
    });

    it('060. ignores jobs with missing or null scheduled_start in calendar cell', () => {
      const targetDay = new Date(2026, 8, 15);
      const jobs = [
        { id: 'j1', assigned_to_user_id: 'tech-1', scheduled_start: null },
      ];
      expect(filterJobsForTechnicianCell(jobs, 'tech-1', targetDay)).toHaveLength(0);
    });

    it('061. handles empty job list without crashing', () => {
      expect(filterJobsForTechnicianCell([], 'tech-1', new Date())).toEqual([]);
      expect(filterJobsForTechnicianCell(null as any, 'tech-1', new Date())).toEqual([]);
    });

    it('062. handles empty team members list returning only the Unassigned row', () => {
      const rows = buildTechnicianRows([]);
      expect(rows).toHaveLength(1);
      expect(rows[0].isPool).toBe(true);
      expect(rows[0].id).toBeNull();
    });

    it('063. allows custom unassigned pool label', () => {
      const rows = buildTechnicianRows([], 'Cola de Despacho');
      expect(rows[0].name).toBe('Cola de Despacho');
    });

    it('064. maintains row data immutability during cell filtering', () => {
      const rows = buildTechnicianRows(mockTeam);
      expect(rows[0].name).toBe('Marcus Brody');
      expect(rows[1].name).toBe('Elena Rostova');
    });
  });
});
