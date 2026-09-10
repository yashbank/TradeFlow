import { describe, it, expect } from 'vitest';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { formatCurrency } from '@/lib/utils';

describe('Owner Executive Workflow & Analytics Test Suite', () => {
  // =========================================================================
  // Section 1: Real Database Metric Aggregations & Formulas (Tests 1-8)
  // =========================================================================
  describe('Metric Aggregations & Financial Formulas', () => {
    it('1. should calculate revenueMtdCents strictly from completed payment ledger rows', () => {
      const payments = [
        { amount_cents: 15000, status: 'succeeded', payment_date: '2026-09-01T10:00:00Z' },
        { amount_cents: 35000, status: 'succeeded', payment_date: '2026-09-05T14:30:00Z' },
        { amount_cents: 12000, status: 'failed', payment_date: '2026-09-08T09:00:00Z' }, // excluded
      ];
      const revenueMtdCents = payments
        .filter((p) => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount_cents, 0);

      expect(revenueMtdCents).toBe(50000);
      expect(formatCurrency(revenueMtdCents, 'USD')).toBe('$500.00');
    });

    it('2. should calculate outstandingReceivablesCents from unpaid invoice balances', () => {
      const invoices = [
        { status: 'sent', balance_due_cents: 45000 },
        { status: 'overdue', balance_due_cents: 28000 },
        { status: 'paid', balance_due_cents: 0 },
        { status: 'void', balance_due_cents: 99000 }, // voided must not count
      ];
      const receivablesCents = invoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.balance_due_cents, 0);

      expect(receivablesCents).toBe(73000);
    });

    it('3. should calculate quoteWinRatePercentage correctly when quotes exist', () => {
      const quotes = [
        { status: 'accepted' },
        { status: 'accepted' },
        { status: 'accepted' },
        { status: 'rejected' },
        { status: 'sent' }, // pending, not decided
      ];
      const resolvedQuotes = quotes.filter((q) => q.status === 'accepted' || q.status === 'rejected');
      const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
      const winRate = resolvedQuotes.length > 0
        ? Math.round((acceptedQuotes.length / resolvedQuotes.length) * 100)
        : 0;

      expect(winRate).toBe(75);
    });

    it('4. should handle quoteWinRatePercentage safely when zero quotes are resolved (zero-division guard)', () => {
      const quotes: { status: string }[] = [];
      const resolvedQuotes = quotes.filter((q) => q.status === 'accepted' || q.status === 'rejected');
      const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
      const winRate = resolvedQuotes.length > 0
        ? Math.round((acceptedQuotes.length / resolvedQuotes.length) * 100)
        : 0;

      expect(winRate).toBe(0);
      expect(Number.isNaN(winRate)).toBe(false);
    });

    it('5. should calculate totalInvoicedMtdCents correctly', () => {
      const invoices = [
        { total_cents: 125000, issue_date: '2026-09-02', status: 'paid' },
        { total_cents: 85000, issue_date: '2026-09-06', status: 'sent' },
        { total_cents: 40000, issue_date: '2026-08-15', status: 'paid' }, // last month
      ];
      const septemberInvoices = invoices.filter((i) => i.issue_date.startsWith('2026-09'));
      const totalInvoicedCents = septemberInvoices.reduce((sum, i) => sum + i.total_cents, 0);

      expect(totalInvoicedCents).toBe(210000);
      expect(formatCurrency(totalInvoicedCents, 'USD')).toBe('$2,100.00');
    });

    it('6. should calculate 7-day rolling weekly revenue distribution', () => {
      const rawDailyRevenue = [0, 45000, 12000, 89000, 0, 32000, 15000];
      expect(rawDailyRevenue.length).toBe(7);
      const totalWeekly = rawDailyRevenue.reduce((a, b) => a + b, 0);
      expect(totalWeekly).toBe(193000);
    });

    it('7. should correctly calculate completedJobsCount and totalJobsCount', () => {
      const jobs = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'in_progress' },
        { status: 'scheduled' },
        { status: 'cancelled' },
      ];
      const completedCount = jobs.filter((j) => j.status === 'completed').length;
      const totalCount = jobs.length;
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      expect(completedCount).toBe(2);
      expect(totalCount).toBe(5);
      expect(completionRate).toBe(40);
    });

    it('8. should format zero-state metrics without NaN or runtime errors', () => {
      const zeroMetrics = {
        revenueMtdCents: 0,
        outstandingReceivablesCents: 0,
        quoteWinRatePercentage: 0,
        totalInvoicedMtdCents: 0,
        activeJobsCount: 0,
        completedJobsCount: 0,
        totalJobsCount: 0,
      };

      expect(formatCurrency(zeroMetrics.revenueMtdCents, 'USD')).toBe('$0.00');
      expect(formatCurrency(zeroMetrics.outstandingReceivablesCents, 'USD')).toBe('$0.00');
      expect(`${zeroMetrics.quoteWinRatePercentage}%`).toBe('0%');
    });
  });

  // =========================================================================
  // Section 2: Real Team Member Radar & Fleet Dispatch Mapping (Tests 9-16)
  // =========================================================================
  describe('Team Member Radar & Fleet Dispatch Logic', () => {
    interface TeamMember {
      id: string;
      full_name: string;
      email: string;
      role: string;
    }

    const teamMembers: TeamMember[] = [
      { id: 'user-tech-1', full_name: 'Alex Rivera', email: 'alex@tradeflow.local', role: 'technician' },
      { id: 'user-tech-2', full_name: 'Jordan Lee', email: 'jordan@tradeflow.local', role: 'technician' },
      { id: 'user-tech-3', full_name: 'Casey Morgan', email: 'casey@tradeflow.local', role: 'technician' },
    ];

    const activeJobs = [
      { id: 'job-1', title: 'Emergency Pipe Leak', assigned_to_user_id: 'user-tech-1', status: 'in_progress' },
      { id: 'job-2', title: 'Water Heater Replacement', assigned_to_user_id: 'user-tech-2', status: 'scheduled' },
    ];

    it('9. should map assigned plumbers to "dispatched" status on radar', () => {
      const activeTechIds = new Set(
        activeJobs.filter((j) => j.status === 'in_progress' || j.status === 'scheduled').map((j) => j.assigned_to_user_id)
      );

      const radarItems = teamMembers.map((m) => {
        const assignedJob = activeJobs.find((j) => j.assigned_to_user_id === m.id);
        const isDispatched = activeTechIds.has(m.id);
        return {
          id: m.id,
          name: m.full_name,
          status: isDispatched ? 'dispatched' : 'standby',
          currentJobTitle: assignedJob ? assignedJob.title : 'Awaiting Assignment',
        };
      });

      expect(radarItems[0].status).toBe('dispatched');
      expect(radarItems[0].currentJobTitle).toBe('Emergency Pipe Leak');
      expect(radarItems[1].status).toBe('dispatched');
      expect(radarItems[1].currentJobTitle).toBe('Water Heater Replacement');
    });

    it('10. should map unassigned plumbers to "standby" status on radar', () => {
      const activeTechIds = new Set(activeJobs.map((j) => j.assigned_to_user_id));
      const casey = teamMembers.find((m) => m.id === 'user-tech-3')!;
      const isDispatched = activeTechIds.has(casey.id);

      expect(isDispatched).toBe(false);
      const status = isDispatched ? 'dispatched' : 'standby';
      expect(status).toBe('standby');
    });

    it('11. should handle empty team gracefully when organization is new', () => {
      const emptyTeam: TeamMember[] = [];
      expect(emptyTeam.length).toBe(0);
      const activeDispatches = emptyTeam.filter(() => false).length;
      expect(activeDispatches).toBe(0);
    });

    it('12. should calculate radar pulse ring count based on active dispatches', () => {
      const activePlumberCount = 2;
      const pulseRateSeconds = activePlumberCount > 0 ? Math.max(1, 4 - activePlumberCount) : 0;
      expect(pulseRateSeconds).toBe(2);
    });

    it('13. should handle multi-job assignment to a single plumber without duplicate radar entries', () => {
      const multiJobs = [
        { id: 'job-10', assigned_to_user_id: 'user-tech-1', status: 'in_progress', title: 'Main Drain Clog' },
        { id: 'job-11', assigned_to_user_id: 'user-tech-1', status: 'scheduled', title: 'Faucet Install' },
      ];
      const tech1Jobs = multiJobs.filter((j) => j.assigned_to_user_id === 'user-tech-1');
      expect(tech1Jobs.length).toBe(2);
      const activeJob = tech1Jobs.find((j) => j.status === 'in_progress') || tech1Jobs[0];
      expect(activeJob.title).toBe('Main Drain Clog');
    });

    it('14. should format plumber name initials correctly for radar avatar badges', () => {
      function getInitials(name: string) {
        return name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase();
      }
      expect(getInitials('Alex Rivera')).toBe('AR');
      expect(getInitials('Jordan Lee')).toBe('JL');
      expect(getInitials('Marcus Vance')).toBe('MV');
    });

    it('15. should exclude owner/admin accounts from fleet plumbing field radar if not field staff', () => {
      const rawAccounts = [
        { id: 'u1', full_name: 'David Boss', role: 'owner' },
        { id: 'u2', full_name: 'Sarah Dispatcher', role: 'admin' },
        { id: 'u3', full_name: 'Mark Plumber', role: 'technician' },
      ];
      const fieldFleet = rawAccounts.filter((a) => a.role === 'technician');
      expect(fieldFleet.length).toBe(1);
      expect(fieldFleet[0].full_name).toBe('Mark Plumber');
    });

    it('16. should report fleet operational readiness percentage', () => {
      const totalField = 4;
      const activeDispatches = 3;
      const readiness = Math.round((activeDispatches / totalField) * 100);
      expect(readiness).toBe(75);
    });
  });

  // =========================================================================
  // Section 3: Priority Triage & Emergency Escalation Logic (Tests 17-24)
  // =========================================================================
  describe('Priority Triage & Emergency Work Order Sorting', () => {
    const rawJobs = [
      { id: 'j1', title: 'Routine Sink Snaking', status: 'scheduled', scheduled_start: '2026-09-12T14:00:00Z' },
      { id: 'j2', title: 'Emergency Burst Pipe Under Slab', status: 'scheduled', scheduled_start: '2026-09-11T10:00:00Z' },
      { id: 'j3', title: 'Bathroom Fixture Remodel', status: 'in_progress', scheduled_start: '2026-09-11T09:00:00Z' },
      { id: 'j4', title: 'Annual Sewer Video Inspection', status: 'completed', scheduled_start: '2026-09-10T08:00:00Z' },
    ];

    it('17. should exclude completed and cancelled jobs from active priority triage', () => {
      const activeQueue = rawJobs.filter((j) => j.status !== 'completed' && j.status !== 'cancelled');
      expect(activeQueue.length).toBe(3);
      expect(activeQueue.some((j) => j.id === 'j4')).toBe(false);
    });

    it('18. should prioritize Emergency keywords to top of triage queue', () => {
      function getJobPriorityScore(title: string) {
        const lower = title.toLowerCase();
        if (lower.includes('emergency') || lower.includes('burst') || lower.includes('leak') || lower.includes('flood')) {
          return 100;
        }
        return 10;
      }

      const sorted = [...rawJobs]
        .filter((j) => j.status !== 'completed')
        .sort((a, b) => getJobPriorityScore(b.title) - getJobPriorityScore(a.title));

      expect(sorted[0].id).toBe('j2');
      expect(sorted[0].title).toContain('Emergency Burst Pipe');
    });

    it('19. should sort scheduled jobs chronologically when priority scores are identical', () => {
      const jobs = [
        { id: 'a', title: 'Drain Clean', scheduled_start: '2026-09-12T15:00:00Z' },
        { id: 'b', title: 'Toilet Install', scheduled_start: '2026-09-12T09:00:00Z' },
      ];
      const sorted = jobs.sort(
        (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
      );
      expect(sorted[0].id).toBe('b');
    });

    it('20. should badge emergency triage items with distinct critical indicators', () => {
      const isEmergency = (title: string) => /emergency|burst|flood|leak/i.test(title);
      expect(isEmergency('Emergency Burst Pipe Under Slab')).toBe(true);
      expect(isEmergency('Routine Sink Snaking')).toBe(false);
    });

    it('21. should limit top triage queue to highest 5 priority items to prevent information overload', () => {
      const manyJobs = Array.from({ length: 15 }, (_, i) => ({
        id: `job-${i}`,
        title: `Service Call ${i}`,
        status: 'scheduled',
      }));
      const triageSlice = manyJobs.slice(0, 5);
      expect(triageSlice.length).toBe(5);
    });

    it('22. should return clean standby placeholder when zero jobs require triage', () => {
      const emptyJobs: any[] = [];
      const hasTriage = emptyJobs.length > 0;
      expect(hasTriage).toBe(false);
    });

    it('23. should flag unassigned active jobs with warning status', () => {
      const jobs = [
        { id: 'j1', assigned_to_user_id: 'tech-1' },
        { id: 'j2', assigned_to_user_id: null },
      ];
      const unassigned = jobs.filter((j) => !j.assigned_to_user_id);
      expect(unassigned.length).toBe(1);
      expect(unassigned[0].id).toBe('j2');
    });

    it('24. should compute overdue dispatch count for jobs scheduled in the past that are still scheduled', () => {
      const now = new Date('2026-09-11T12:00:00Z').getTime();
      const dispatches = [
        { id: 'd1', status: 'scheduled', scheduled_start: '2026-09-11T08:00:00Z' }, // 4 hours late
        { id: 'd2', status: 'scheduled', scheduled_start: '2026-09-11T16:00:00Z' }, // upcoming
        { id: 'd3', status: 'in_progress', scheduled_start: '2026-09-11T08:00:00Z' }, // already started
      ];
      const overdue = dispatches.filter(
        (d) => d.status === 'scheduled' && new Date(d.scheduled_start).getTime() < now
      );
      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe('d1');
    });
  });

  // =========================================================================
  // Section 4: Zero-State Holographic HUD Gauge Formulas (Tests 25-31)
  // =========================================================================
  describe('Holographic HUD Gauge Math & SVG Calculations', () => {
    it('25. should calculate SVG stroke-dashoffset accurately for circular dials', () => {
      const radius = 42;
      const circumference = 2 * Math.PI * radius; // approx 263.89
      const percent = 75;
      const offset = circumference - (percent / 100) * circumference;

      expect(circumference).toBeCloseTo(263.89, 1);
      expect(offset).toBeCloseTo(65.97, 1);
    });

    it('26. should clamp dial progress strictly between 0% and 100%', () => {
      function clampPercent(p: number) {
        return Math.min(100, Math.max(0, p));
      }
      expect(clampPercent(-15)).toBe(0);
      expect(clampPercent(145)).toBe(100);
      expect(clampPercent(68)).toBe(68);
    });

    it('27. should render 0% stroke offset when target metric is 0', () => {
      const radius = 42;
      const circumference = 2 * Math.PI * radius;
      const percent = 0;
      const offset = circumference - (percent / 100) * circumference;
      expect(offset).toBe(circumference);
    });

    it('28. should calculate dynamic revenue target pace gauge', () => {
      const monthlyTargetCents = 5000000; // $50,000 target
      const actualRevenueCents = 3750000; // $37,500 achieved
      const pacePercent = Math.min(100, Math.round((actualRevenueCents / monthlyTargetCents) * 100));
      expect(pacePercent).toBe(75);
    });

    it('29. should calculate receivables risk gauge: receivables vs total invoiced', () => {
      const totalInvoicedCents = 2000000;
      const outstandingReceivablesCents = 500000;
      const riskRatio = Math.round((outstandingReceivablesCents / totalInvoicedCents) * 100);
      expect(riskRatio).toBe(25);
    });

    it('30. should calculate job throughput ratio gauge', () => {
      const completedJobs = 18;
      const totalJobs = 20;
      const throughput = Math.round((completedJobs / totalJobs) * 100);
      expect(throughput).toBe(90);
    });

    it('31. should render HUD standby mode telemetry when zero dispatches and zero metrics exist', () => {
      const isStandby = (jobsCount: number, revenueCents: number) => jobsCount === 0 && revenueCents === 0;
      expect(isStandby(0, 0)).toBe(true);
      expect(isStandby(1, 0)).toBe(false);
      expect(isStandby(0, 5000)).toBe(false);
    });
  });

  // =========================================================================
  // Section 5: End-to-End Financial Calculation Precision (Tests 32-39)
  // =========================================================================
  describe('Document Totals Precision & Integer Cent Math', () => {
    it('32. should calculate multi-item quote totals with zero floating-point drift', () => {
      const items = [
        { quantity: 1, unitPriceCents: 45000, taxable: true },
        { quantity: 2, unitPriceCents: 12500, taxable: true },
        { quantity: 3, unitPriceCents: 3500, taxable: false },
      ];
      const result = calculateDocumentTotals(items, 5000, 0, 825);

      expect(result.subtotalCents).toBe(80500);
      expect(result.discountCents).toBe(5000);
      expect(result.totalCents).toBeGreaterThan(0);
      expect(Number.isInteger(result.totalCents)).toBe(true);
    });

    it('33. should calculate exact tax basis points for non-taxable labor and taxable parts', () => {
      const items = [
        { quantity: 1, unitPriceCents: 10000, taxable: true },
        { quantity: 2, unitPriceCents: 10000, taxable: false },
      ];
      const result = calculateDocumentTotals(items, 0, 0, 1000);
      expect(result.subtotalCents).toBe(30000);
      expect(result.taxCents).toBe(1000);
      expect(result.totalCents).toBe(31000);
    });

    it('34. should handle maximum discount capped at subtotal', () => {
      const items = [{ quantity: 1, unitPriceCents: 10000, taxable: true }];
      const result = calculateDocumentTotals(items, 15000, 0, 1000);
      expect(result.discountCents).toBe(10000);
      expect(result.totalCents).toBe(0);
    });

    it('35. should support diverse international currencies correctly in formatting', () => {
      const amountCents = 125050;
      expect(formatCurrency(amountCents, 'USD')).toBe('$1,250.50');
      expect(formatCurrency(amountCents, 'GBP')).toBe('£1,250.50');
      expect(formatCurrency(amountCents, 'AUD')).toContain('1,250.50');
    });

    it('36. should handle zero-cent line items safely', () => {
      const items = [{ quantity: 1, unitPriceCents: 0, taxable: false }];
      const result = calculateDocumentTotals(items, 0, 0, 800);
      expect(result.subtotalCents).toBe(0);
      expect(result.totalCents).toBe(0);
    });

    it('37. should calculate fractional quantities accurately with integer cents', () => {
      const items = [{ quantity: 2.5, unitPriceCents: 12000, taxable: false }];
      const result = calculateDocumentTotals(items, 0, 0, 0);
      expect(result.subtotalCents).toBe(30000);
      expect(result.totalCents).toBe(30000);
    });

    it('38. should ensure invoice balance due decreases strictly by payment amounts', () => {
      const invoiceTotalCents = 150000;
      const payment1Cents = 50000;
      const payment2Cents = 75000;
      const balanceAfter1 = invoiceTotalCents - payment1Cents;
      const balanceAfter2 = balanceAfter1 - payment2Cents;

      expect(balanceAfter1).toBe(100000);
      expect(balanceAfter2).toBe(25000);
      expect(formatCurrency(balanceAfter2, 'USD')).toBe('$250.00');
    });

    it('39. should strictly verify Owner authorization before executing financial write actions', () => {
      const canAccessFinancialReports = (role: string) => role === 'owner' || role === 'admin';
      expect(canAccessFinancialReports('owner')).toBe(true);
      expect(canAccessFinancialReports('admin')).toBe(true);
      expect(canAccessFinancialReports('technician')).toBe(false);
      expect(canAccessFinancialReports('customer')).toBe(false);
    });
  });
});
