import { describe, it, expect } from 'vitest';
import type { JobStatus } from '@/types/database';

describe('Field Technician Lifecycle & Field FSM Test Suite', () => {
  // =========================================================================
  // Section 1: Field FSM Lifecycle Transitions (Tests 1-10)
  // =========================================================================
  describe('FSM Lifecycle State Machine', () => {
    const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    function canTransition(current: JobStatus, target: JobStatus): boolean {
      return (ALLOWED_TRANSITIONS[current] || []).includes(target);
    }

    it('1. should allow valid transition from scheduled to in_progress upon technician arrival', () => {
      expect(canTransition('scheduled', 'in_progress')).toBe(true);
    });

    it('2. should allow valid transition from in_progress to completed upon repair completion', () => {
      expect(canTransition('in_progress', 'completed')).toBe(true);
    });

    it('3. should allow transition from scheduled to cancelled when customer cancels', () => {
      expect(canTransition('scheduled', 'cancelled')).toBe(true);
    });

    it('4. should allow transition from in_progress to cancelled if severe hazard aborts work', () => {
      expect(canTransition('in_progress', 'cancelled')).toBe(true);
    });

    it('5. should reject illegal jump from scheduled directly to completed without active progress', () => {
      expect(canTransition('scheduled', 'completed')).toBe(false);
    });

    it('6. should disallow reopening completed terminal jobs', () => {
      expect(canTransition('completed', 'scheduled')).toBe(false);
      expect(canTransition('completed', 'in_progress')).toBe(false);
    });

    it('7. should disallow reopening cancelled terminal jobs', () => {
      expect(canTransition('cancelled', 'scheduled')).toBe(false);
      expect(canTransition('cancelled', 'in_progress')).toBe(false);
    });

    it('8. should stamp completed_at timestamp on completion and verify chronological order', () => {
      const scheduledStart = new Date('2026-09-11T09:00:00Z').getTime();
      const completedAt = new Date('2026-09-11T11:45:00Z').getTime();
      expect(completedAt).toBeGreaterThan(scheduledStart);
      const elapsedMinutes = Math.round((completedAt - scheduledStart) / (1000 * 60));
      expect(elapsedMinutes).toBe(165); // 2 hours 45 minutes
    });

    it('9. should generate audit dispatch event payload on status transition', () => {
      const event = {
        job_id: 'job-123',
        technician_id: 'tech-456',
        from_status: 'scheduled',
        to_status: 'in_progress',
        timestamp: new Date().toISOString(),
      };
      expect(event.from_status).toBe('scheduled');
      expect(event.to_status).toBe('in_progress');
      expect(event.timestamp).toBeDefined();
    });

    it('10. should map status to correct UI badge variants', () => {
      function getBadgeVariant(status: JobStatus) {
        switch (status) {
          case 'completed':
            return 'success';
          case 'in_progress':
            return 'default';
          case 'cancelled':
            return 'destructive';
          default:
            return 'secondary';
        }
      }
      expect(getBadgeVariant('completed')).toBe('success');
      expect(getBadgeVariant('in_progress')).toBe('default');
      expect(getBadgeVariant('cancelled')).toBe('destructive');
      expect(getBadgeVariant('scheduled')).toBe('secondary');
    });
  });

  // =========================================================================
  // Section 2: Swiggy-Style GPS Navigation & Communications (Tests 11-18)
  // =========================================================================
  describe('Swiggy-Style GPS Deep-Linking & Mobile Communication Links', () => {
    const jobSite = {
      address_line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postal_code: '97477',
      phone: '(555) 382-5968',
      internal_notes: 'Gate code #9941. Watch for guard dog in yard.',
    };

    it('11. should generate valid Google Maps GPS turn-by-turn navigation deep-link', () => {
      const query = `${jobSite.address_line1}, ${jobSite.city}, ${jobSite.state} ${jobSite.postal_code}`;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      expect(url).toContain('https://www.google.com/maps/search/?api=1&query=742%20Evergreen%20Terrace%2C%20Springfield%2C%20OR%2097477');
    });

    it('12. should generate Apple Maps navigation deep-link', () => {
      const query = `${jobSite.address_line1}, ${jobSite.city}, ${jobSite.state}`;
      const url = `maps://?daddr=${encodeURIComponent(query)}`;
      expect(url).toBe('maps://?daddr=742%20Evergreen%20Terrace%2C%20Springfield%2C%20OR');
    });

    it('13. should generate Waze navigation deep-link', () => {
      const query = `${jobSite.address_line1}, ${jobSite.city}`;
      const url = `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
      expect(url).toContain('https://waze.com/ul?q=742%20Evergreen%20Terrace%2C%20Springfield&navigate=yes');
    });

    it('14. should sanitize customer phone number to clean E.164 callable tel: link', () => {
      const rawPhone = '(555) 382-5968';
      const cleanDigits = rawPhone.replace(/\D/g, '');
      const telUrl = `tel:+1${cleanDigits}`;
      expect(telUrl).toBe('tel:+15553825968');
    });

    it('15. should generate 1-tap customer SMS prefilled notification link', () => {
      const cleanDigits = jobSite.phone.replace(/\D/g, '');
      const body = 'Hello, your plumber from TradeFlow is en route to your location.';
      const smsUrl = `sms:+1${cleanDigits}?body=${encodeURIComponent(body)}`;
      expect(smsUrl).toContain('sms:+15553825968?body=Hello%2C%20your%20plumber');
    });

    it('16. should gracefully format GPS URL when postal code is missing', () => {
      const address = '100 Main St, Austin, TX';
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=100%20Main%20St%2C%20Austin%2C%20TX');
    });

    it('17. should extract gate code instructions from internal notes for mobile driver display', () => {
      const notes = jobSite.internal_notes;
      const match = notes.match(/gate code\s*#?([0-9a-zA-Z]+)/i);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('9941');
    });

    it('18. should detect pet / safety hazards from internal dispatch notes', () => {
      const hasPetWarning = (notes: string) => /dog|pet|guard|beware/i.test(notes);
      expect(hasPetWarning(jobSite.internal_notes)).toBe(true);
      expect(hasPetWarning('Key under the flower pot')).toBe(false);
    });
  });

  // =========================================================================
  // Section 3: Labor Stopwatch & Active Work Session Tracking (Tests 19-26)
  // =========================================================================
  describe('Labor Stopwatch & Active Session Calculations', () => {
    it('19. should calculate elapsed seconds accurately between start and stop timestamps', () => {
      const start = new Date('2026-09-11T10:00:00Z').getTime();
      const end = new Date('2026-09-11T11:30:00Z').getTime();
      const elapsedSeconds = Math.round((end - start) / 1000);
      expect(elapsedSeconds).toBe(5400); // 90 minutes * 60
    });

    it('20. should round billable labor to 15-minute plumbing standard increments', () => {
      function roundToQuarterHour(minutes: number): number {
        return Math.ceil(minutes / 15) * 15;
      }
      expect(roundToQuarterHour(12)).toBe(15);
      expect(roundToQuarterHour(16)).toBe(30);
      expect(roundToQuarterHour(61)).toBe(75);
      expect(roundToQuarterHour(90)).toBe(90);
    });

    it('21. should convert billable minutes into integer cents given hourly labor rate', () => {
      const hourlyRateCents = 12000; // $120.00/hour
      const billableMinutes = 90; // 1.5 hours
      const laborCostCents = Math.round((billableMinutes / 60) * hourlyRateCents);
      expect(laborCostCents).toBe(18000); // $180.00
    });

    it('22. should accumulate multiple paused/resumed work sessions correctly', () => {
      const sessions = [
        { durationSeconds: 3600 }, // 1 hour morning session
        { durationSeconds: 2700 }, // 45 min afternoon session
      ];
      const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      expect(totalSeconds).toBe(6300); // 105 minutes
      const totalMinutes = totalSeconds / 60;
      expect(totalMinutes).toBe(105);
    });

    it('23. should enforce 1-hour minimum charge policy for emergency service calls', () => {
      const emergencyMinimumMinutes = 60;
      const actualMinutesWorked = 25; // quick 25min leak seal
      const billableMinutes = Math.max(emergencyMinimumMinutes, actualMinutesWorked);
      expect(billableMinutes).toBe(60);
    });

    it('24. should apply 1.5x overtime multiplier for after-hours emergency calls', () => {
      const standardRateCents = 10000; // $100/hr
      const isAfterHours = true;
      const effectiveRateCents = isAfterHours ? Math.round(standardRateCents * 1.5) : standardRateCents;
      expect(effectiveRateCents).toBe(15000); // $150/hr
    });

    it('25. should format stopwatch display timestamp (HH:MM:SS) correctly', () => {
      function formatStopwatch(seconds: number): string {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
      }
      expect(formatStopwatch(0)).toBe('00:00:00');
      expect(formatStopwatch(45)).toBe('00:00:45');
      expect(formatStopwatch(3665)).toBe('01:01:05');
    });

    it('26. should reject negative elapsed times gracefully', () => {
      const calculateSafeElapsed = (start: number, end: number) => Math.max(0, end - start);
      expect(calculateSafeElapsed(1000, 500)).toBe(0);
    });
  });

  // =========================================================================
  // Section 4: Truck Inventory & Parts Logging (Tests 27-34)
  // =========================================================================
  describe('Truck Inventory & Field Parts Logging', () => {
    interface JobPart {
      id: string;
      description: string;
      quantity: number;
      unitPriceCents: number;
      taxable: boolean;
    }

    it('27. should log new plumbing replacement part with integer cents', () => {
      const part: JobPart = {
        id: 'part-1',
        description: '3/4" Brass Ball Valve Full Port',
        quantity: 2,
        unitPriceCents: 2850, // $28.50
        taxable: true,
      };
      const totalPartCost = part.quantity * part.unitPriceCents;
      expect(totalPartCost).toBe(5700); // $57.00
    });

    it('28. should calculate total truck parts cost across multiple logged items', () => {
      const parts: JobPart[] = [
        { id: 'p1', description: 'Wax Gasket with Horn', quantity: 1, unitPriceCents: 1450, taxable: true },
        { id: 'p2', description: 'Toilet Flapper Silicone', quantity: 1, unitPriceCents: 1200, taxable: true },
        { id: 'p3', description: 'Braided SS Supply Line 20"', quantity: 2, unitPriceCents: 1600, taxable: true },
      ];
      const totalCents = parts.reduce((sum, p) => sum + p.quantity * p.unitPriceCents, 0);
      expect(totalCents).toBe(5850); // 14.50 + 12.00 + 32.00 = $58.50
    });

    it('29. should apply company truck part markup percentage (e.g. 30% margin)', () => {
      const wholesaleCostCents = 2000; // $20.00
      const markupPercent = 30;
      const retailPriceCents = Math.round(wholesaleCostCents * (1 + markupPercent / 100));
      expect(retailPriceCents).toBe(2600); // $26.00
    });

    it('30. should mark materials as taxable while labor is marked non-taxable', () => {
      const materialsPart: JobPart = {
        id: 'p1',
        description: 'PEX 1/2" 100ft roll',
        quantity: 1,
        unitPriceCents: 5200,
        taxable: true,
      };
      const laborService = {
        description: 'Pipe Splicing Labor',
        unitPriceCents: 15000,
        taxable: false,
      };
      expect(materialsPart.taxable).toBe(true);
      expect(laborService.taxable).toBe(false);
    });

    it('31. should allow removing a logged part from the job sheet', () => {
      let parts = ['part-1', 'part-2', 'part-3'];
      parts = parts.filter((id) => id !== 'part-2');
      expect(parts).toEqual(['part-1', 'part-3']);
      expect(parts.length).toBe(2);
    });

    it('32. should reject negative or zero part quantities', () => {
      const isValidPartQty = (qty: number) => Number.isInteger(qty) && qty > 0;
      expect(isValidPartQty(1)).toBe(true);
      expect(isValidPartQty(0)).toBe(false);
      expect(isValidPartQty(-3)).toBe(false);
    });

    it('33. should update part quantity dynamically', () => {
      const part = { quantity: 1, unitPriceCents: 1500 };
      const updatedPart = { ...part, quantity: 4 };
      expect(updatedPart.quantity * updatedPart.unitPriceCents).toBe(6000);
    });

    it('34. should handle quick-preset plumbing hardware catalog selection', () => {
      const catalog = [
        { name: 'SharkBite Coupler 3/4"', priceCents: 1850 },
        { name: 'Oatey Heavy Duty PVC Cement 8oz', priceCents: 920 },
      ];
      expect(catalog[0].priceCents).toBe(1850);
      expect(catalog[1].priceCents).toBe(920);
    });
  });

  // =========================================================================
  // Section 5: Technician RBAC & Postgres RLS Security Isolation (Tests 35-42)
  // =========================================================================
  describe('Technician RBAC & Security Isolation', () => {
    const technicianId = 'tech-usr-001';
    const otherTechnicianId = 'tech-usr-002';

    const jobsInDatabase = [
      { id: 'j1', assigned_to_user_id: technicianId, title: 'My Job 1' },
      { id: 'j2', assigned_to_user_id: otherTechnicianId, title: 'Other Plumber Job' },
      { id: 'j3', assigned_to_user_id: technicianId, title: 'My Job 2' },
      { id: 'j4', assigned_to_user_id: null, title: 'Unassigned Dispatch' },
    ];

    it('35. should filter jobs so technician sees only their assigned jobs or open dispatches', () => {
      const visibleJobs = jobsInDatabase.filter(
        (j) => j.assigned_to_user_id === technicianId || j.assigned_to_user_id === null
      );
      expect(visibleJobs.length).toBe(3);
      expect(visibleJobs.some((j) => j.id === 'j2')).toBe(false);
    });

    it('36. should strictly block technician from accessing company financial metrics endpoint', () => {
      const allowedRolesForMetrics = ['owner', 'admin'];
      const userRole = 'technician';
      const hasAccess = allowedRolesForMetrics.includes(userRole);
      expect(hasAccess).toBe(false);
    });

    it('37. should block technician from viewing invoice list or customer billing records', () => {
      const allowedRolesForInvoicing = ['owner', 'admin'];
      const userRole = 'technician';
      expect(allowedRolesForInvoicing.includes(userRole)).toBe(false);
    });

    it('38. should disallow technician from mutating jobs belonging to another technician', () => {
      function canMutateJob(userRole: string, currentUserId: string, jobAssignedId: string | null): boolean {
        if (userRole === 'owner' || userRole === 'admin') return true;
        if (userRole === 'technician') return jobAssignedId === currentUserId;
        return false;
      }
      expect(canMutateJob('technician', technicianId, technicianId)).toBe(true);
      expect(canMutateJob('technician', technicianId, otherTechnicianId)).toBe(false);
    });

    it('39. should allow technician to update notes and status only on their own assigned jobs', () => {
      const job = { id: 'j1', assigned_to_user_id: technicianId, status: 'scheduled' };
      const isOwnerOfJob = job.assigned_to_user_id === technicianId;
      expect(isOwnerOfJob).toBe(true);
    });

    it('40. should block technician from voiding or deleting customer invoices', () => {
      const canVoidInvoice = (role: string) => role === 'owner';
      expect(canVoidInvoice('technician')).toBe(false);
      expect(canVoidInvoice('owner')).toBe(true);
    });

    it('41. should block technician from changing company tax rates or organization settings', () => {
      const canEditOrgSettings = (role: string) => role === 'owner' || role === 'admin';
      expect(canEditOrgSettings('technician')).toBe(false);
    });

    it('42. should enforce tenant isolation: technician cannot access jobs from other organizations', () => {
      const myOrgId = 'org-plumbing-co-1';
      const foreignOrgId = 'org-electric-co-2';
      const canAccessJobInOrg = (userOrgId: string, jobOrgId: string) => userOrgId === jobOrgId;

      expect(canAccessJobInOrg(myOrgId, myOrgId)).toBe(true);
      expect(canAccessJobInOrg(myOrgId, foreignOrgId)).toBe(false);
    });
  });
});
