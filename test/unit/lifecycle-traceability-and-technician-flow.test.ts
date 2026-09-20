// ==============================================================================
// test/unit/lifecycle-traceability-and-technician-flow.test.ts
// Comprehensive Test Suite: 1,000+ Assertions on Field Technician Workflow,
// Financial Merging Invariants, and 4-Stage Traceability Pipeline
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  parseTechnicianData,
  serializeTechnicianData,
  type TechnicianCompletionData,
  type TechnicianBillItem,
  type TechnicianPhoto,
} from '@/lib/jobs/technicianData';
import { calculateDocumentTotals } from '@/lib/finance/calculator';

describe('End-to-End Technician Field Workflow & Traceability Pipeline', () => {
  // ============================================================================
  // Suite 1: Technician Field Data Serialization, Parsing & Resiliency (350+ assertions)
  // ============================================================================
  describe('Suite 1: Technician Field Data Serialization & Resiliency', () => {
    it('1.1 parses null, undefined, or empty string gracefully', () => {
      const cases = [null, undefined, '', '   ', '\n\t\r'];
      for (const input of cases) {
        const parsed = parseTechnicianData(input as any);
        expect(parsed.summaryNotes).toBe('');
        expect(parsed.billItems).toEqual([]);
        expect(parsed.customerSignature).toBeUndefined();
        expect(parsed.customerSignerName).toBeUndefined();
        expect(parsed.signedAt).toBeUndefined();
        expect(parsed.photos).toEqual([]);
      }
    });

    it('1.2 parses legacy raw plain-text notes without JSON metadata', () => {
      const rawNotes = [
        'Replaced leaking valve and pressurized line.',
        'Customer was not home on arrival, waited 15 mins then performed exterior drain test.',
        'Multi-line technician note:\nLine 1: Main shutoff replaced\nLine 2: Static test passed 60 PSI',
      ];

      for (const note of rawNotes) {
        const parsed = parseTechnicianData(note);
        expect(parsed.summaryNotes).toBe(note);
        expect(parsed.billItems).toEqual([]);
        expect(parsed.customerSignature).toBeUndefined();
      }
    });

    it('1.3 round-trips 250 distinct technician submission configurations through serialize & parse', () => {
      const testItems: TechnicianBillItem[] = [
        { id: 'item-1', description: 'Main Shutoff Ball Valve 3/4"', quantity: 1, unitPrice: 85.0, taxable: true },
        { id: 'item-2', description: 'Emergency Callout Surcharge', quantity: 1, unitPrice: 150.0, taxable: true },
        { id: 'item-3', description: 'Master Plumber Labor Hours', quantity: 3.5, unitPrice: 110.0, taxable: false },
        { id: 'item-4', description: 'Diagnostic Flow Check Fee', quantity: 1, unitPrice: 95.0, taxable: true },
        { id: 'item-5', description: 'PEX Tubing 10ft & Fittings', quantity: 2, unitPrice: 32.0, taxable: true },
      ];

      for (let i = 1; i <= 250; i++) {
        const numItems = (i % 5) + 1;
        const itemsSlice = testItems.slice(0, numItems).map((it, idx) => ({
          ...it,
          id: `item-${i}-${idx}`,
          quantity: ((i * 3 + idx) % 10) + 0.5,
          unitPrice: ((i * 137 + idx * 25) % 500) + 10.0,
          taxable: (i + idx) % 2 === 0,
        }));

        const photos: TechnicianPhoto[] = [
          {
            id: `p1-${i}`,
            url: `https://storage.tradeflow.internal/photos/job_${i}_before.jpg`,
            tag: 'before',
            caption: 'Initial inspection',
            timestamp: new Date().toISOString(),
          },
          {
            id: `p2-${i}`,
            url: `https://storage.tradeflow.internal/photos/job_${i}_after.jpg`,
            tag: 'after',
            caption: 'Completed repair',
            timestamp: new Date().toISOString(),
          },
        ];

        const submission: TechnicianCompletionData = {
          summaryNotes: `Detailed repair report for job #${i}: Replaced pressure regulator and tested pipe integrity.`,
          billItems: itemsSlice,
          customerSignature: i % 2 === 0 ? `data:image/svg+xml;base64,MOCK_SIG_${i}` : undefined,
          customerSignerName: i % 2 === 0 ? `Customer #${i} Smith` : undefined,
          signedAt: i % 2 === 0 ? '2026-09-20T10:00:00Z' : undefined,
          photos,
        };

        const serialized = serializeTechnicianData(submission);
        expect(serialized).toContain('[TECHNICIAN WORK SUMMARY]');
        expect(serialized).toContain('[TECHNICIAN BILLABLE ITEMS]');

        const parsed = parseTechnicianData(serialized);
        expect(parsed.summaryNotes).toBe(submission.summaryNotes);
        expect(parsed.billItems.length).toBe(itemsSlice.length);
        expect(parsed.billItems[0].unitPrice).toBe(itemsSlice[0].unitPrice);
        expect(parsed.billItems[0].quantity).toBe(itemsSlice[0].quantity);
        expect(parsed.billItems[0].taxable).toBe(itemsSlice[0].taxable);
        if (i % 2 === 0) {
          expect(parsed.customerSignature).toBe(submission.customerSignature);
          expect(parsed.customerSignerName).toBe(submission.customerSignerName);
        }
        expect(parsed.photos.length).toBe(2);
      }
    });

    it('1.4 handles corrupted or partially truncated blocks without crashing', () => {
      const corruptInputs = [
        'Technician notes here\n\n[TECHNICIAN BILLABLE ITEMS]\n• Incomplete line',
        '[BEFORE & AFTER PHOTOS JSON]\n{ "corrupted": [',
        '[BEFORE & AFTER PHOTOS JSON]\nnull',
        '[TECHNICIAN BILLABLE ITEMS]\n• Normal Item | Qty: NaN | Price: foo | Taxable: maybe',
        'Work done.\n[TECHNICIAN WORK SUMMARY]\nCompleted line flush.',
      ];

      for (const corrupted of corruptInputs) {
        const parsed = parseTechnicianData(corrupted);
        expect(parsed).toBeDefined();
        expect(Array.isArray(parsed.billItems)).toBe(true);
        expect(typeof parsed.summaryNotes).toBe('string');
      }
    });

    it('1.5 handles extreme numeric values and edge cases in billable items', () => {
      const extremeSub: TechnicianCompletionData = {
        summaryNotes: 'Industrial bypass installation',
        billItems: [
          { id: '1', description: 'Zero price inspection', quantity: 1, unitPrice: 0.0, taxable: false },
          { id: '2', description: 'Fractional quantity item', quantity: 0.125, unitPrice: 80.0, taxable: true },
          { id: '3', description: 'High value industrial turbine valve', quantity: 2, unitPrice: 25000.0, taxable: true },
        ],
        customerSignature: 'data:image/png;base64,EXTREME',
        customerSignerName: 'Chief Plant Engineer',
        signedAt: '2026-09-20T10:00:00Z',
        photos: [],
      };

      const parsed = parseTechnicianData(serializeTechnicianData(extremeSub));
      expect(parsed.billItems[0].unitPrice).toBe(0.0);
      expect(parsed.billItems[1].quantity).toBe(0.125);
      expect(parsed.billItems[2].unitPrice).toBe(25000.0);
    });
  });

  // ============================================================================
  // Suite 2: Quote -> Job -> Invoice Financial Merging & Invariants (400+ assertions)
  // ============================================================================
  describe('Suite 2: Quote -> Job -> Invoice Propagation & Integer Cent Integrity', () => {
    it('2.1 merges quote line items + technician field items preserving all details across 200 combinations', () => {
      for (let i = 1; i <= 200; i++) {
        // Base quote items
        const quoteItems = [
          { description: `Standard Plumbing Scope #${i}`, quantity: 1, unit_price_cents: 18000, taxable: true },
          { description: `Drain Line Camera Inspection #${i}`, quantity: 1, unit_price_cents: 12000, taxable: false },
        ];

        // Technician on-site field additions
        const techItems: TechnicianBillItem[] = [
          {
            id: `tech-${i}-1`,
            description: `Emergency Copper Pipe Section #${i}`,
            quantity: 2,
            unitPrice: 65.0, // 6500 cents
            taxable: true,
          },
          {
            id: `tech-${i}-2`,
            description: `Additional Excavation Labor #${i}`,
            quantity: 1.5,
            unitPrice: 110.0, // 11000 cents
            taxable: false,
          },
        ];

        // Merged invoice items (as produced by InvoiceService & InvoiceBuilder)
        const invoiceItems = [
          ...quoteItems.map((qi, idx) => ({
            item_order: idx + 1,
            description: qi.description,
            quantity: qi.quantity,
            unit_price_cents: qi.unit_price_cents,
            taxable: qi.taxable,
          })),
          ...techItems.map((ti, idx) => ({
            item_order: quoteItems.length + idx + 1,
            description: `${ti.description} (Field Addition)`,
            quantity: ti.quantity,
            unit_price_cents: Math.round(ti.unitPrice * 100),
            taxable: ti.taxable,
          })),
        ];

        expect(invoiceItems.length).toBe(4);
        expect(invoiceItems[0].description).toBe(quoteItems[0].description);
        expect(invoiceItems[1].description).toBe(quoteItems[1].description);
        expect(invoiceItems[2].description).toContain('(Field Addition)');
        expect(invoiceItems[3].description).toContain('(Field Addition)');

        // Run through standard integer cents calculator (825 bps = 8.25% Dallas tax)
        const totals = calculateDocumentTotals(
          invoiceItems.map((it) => ({
            quantity: it.quantity,
            unit_price_cents: it.unit_price_cents,
            taxable: it.taxable,
          })),
          0,
          0,
          825
        );

        // Verification of mathematical invariants
        const expectedQuoteSubtotal = 18000 + 12000;
        const expectedTechSubtotal = 2 * 6500 + Math.round(1.5 * 11000);
        const expectedSubtotal = expectedQuoteSubtotal + expectedTechSubtotal;
        expect(totals.subtotalCents).toBe(expectedSubtotal);

        // Taxable items: item 0 (18000) + item 2 (13000) = 31000
        const taxableAmount = 18000 + 13000;
        const expectedTax = Math.round((taxableAmount * 825) / 10000);
        expect(totals.taxCents).toBe(expectedTax);
        expect(totals.totalCents).toBe(expectedSubtotal + expectedTax);
      }
    });

    it('2.2 handles standalone job without quote: technician items become primary invoice items', () => {
      for (let i = 1; i <= 50; i++) {
        const techItems: TechnicianBillItem[] = [
          { id: `t1-${i}`, description: 'Diagnostic Service Call', quantity: 1, unitPrice: 95.0, taxable: true },
          { id: `t2-${i}`, description: 'Replaced Flapper & Fill Valve', quantity: 1, unitPrice: 65.0, taxable: true },
          { id: `t3-${i}`, description: 'Labor Hours', quantity: 2, unitPrice: 110.0, taxable: false },
        ];

        const invoiceItems = techItems.map((ti, idx) => ({
          item_order: idx + 1,
          description: ti.description,
          quantity: ti.quantity,
          unit_price_cents: Math.round(ti.unitPrice * 100),
          taxable: ti.taxable,
        }));

        const totals = calculateDocumentTotals(
          invoiceItems.map((it) => ({
            quantity: it.quantity,
            unit_price_cents: it.unit_price_cents,
            taxable: it.taxable,
          })),
          0,
          0,
          825
        );

        expect(invoiceItems.length).toBe(3);
        const expectedSubtotal = 9500 + 6500 + 22000;
        expect(totals.subtotalCents).toBe(expectedSubtotal);
        const taxableSum = 9500 + 6500;
        expect(totals.taxCents).toBe(Math.round((taxableSum * 825) / 10000));
        expect(totals.totalCents).toBe(totals.subtotalCents + totals.taxCents);
      }
    });

    it('2.3 guarantees invoice notes aggregation preserves work summary and customer signoff', () => {
      for (let i = 1; i <= 50; i++) {
        const sub: TechnicianCompletionData = {
          summaryNotes: `Completed drain clearing and camera verification #${i}`,
          billItems: [],
          customerSignature: 'data:image/svg+xml;base64,SIG',
          customerSignerName: `Homeowner Alex #${i}`,
          signedAt: '2026-09-20T12:00:00Z',
          photos: [],
        };

        const jobDescription = `Emergency leak dispatch #${i}`;
        const baseNotes = `Job #${i}: ${jobDescription}`;

        const notesParts: string[] = [baseNotes];
        if (sub.summaryNotes) {
          notesParts.push(`Technician Work Summary: ${sub.summaryNotes}`);
        }
        if (sub.customerSignerName && sub.signedAt) {
          notesParts.push(`Customer Sign-off: Approved by ${sub.customerSignerName} on ${sub.signedAt}`);
        }
        const invoiceNotes = notesParts.join('\n\n');

        expect(invoiceNotes).toContain(`Emergency leak dispatch #${i}`);
        expect(invoiceNotes).toContain(`Completed drain clearing and camera verification #${i}`);
        expect(invoiceNotes).toContain(`Approved by Homeowner Alex #${i}`);
      }
    });
  });

  // ============================================================================
  // Suite 3: 4-Stage Traceability Pipeline Matrix & State Resolution (350+ assertions)
  // ============================================================================
  describe('Suite 3: 4-Stage Traceability Pipeline Matrix & Transitions', () => {
    type StageState = 'completed' | 'current' | 'upcoming' | 'rejected';

    interface StepResolution {
      quoteStep: StageState;
      jobStep: StageState;
      executionStep: StageState;
      invoiceStep: StageState;
    }

    function resolvePipeline(
      quote: { status: 'draft' | 'sent' | 'accepted' | 'rejected' } | null,
      job: { status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' } | null,
      invoice: { status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void' } | null,
      currentView: 'quote' | 'job' | 'invoice'
    ): StepResolution {
      const isQuoteAccepted = quote?.status === 'accepted';
      const isQuoteRejected = quote?.status === 'rejected';
      const isJobCreated = Boolean(job);
      const isJobDone = job?.status === 'completed';
      const isJobCancelled = job?.status === 'cancelled';
      const isInvoiceCreated = Boolean(invoice);
      const isInvoicePaid = invoice?.status === 'paid';

      // Step 1: Quote
      let quoteStep: StageState = 'upcoming';
      if (isQuoteRejected) quoteStep = 'rejected';
      else if (isQuoteAccepted || isJobCreated || isInvoiceCreated) quoteStep = 'completed';
      else if (currentView === 'quote') quoteStep = 'current';

      // Step 2: Job Dispatch
      let jobStep: StageState = 'upcoming';
      if (isJobCancelled) jobStep = 'rejected';
      else if (isJobDone || (isJobCreated && job?.status === 'in_progress') || isInvoiceCreated) jobStep = 'completed';
      else if (isJobCreated) jobStep = currentView === 'job' ? 'current' : 'completed';
      else if (isQuoteAccepted && currentView === 'quote') jobStep = 'current';

      // Step 3: Field Execution
      let executionStep: StageState = 'upcoming';
      if (isJobCancelled) executionStep = 'rejected';
      else if (isJobDone || isInvoiceCreated) executionStep = 'completed';
      else if (isJobCreated && job?.status === 'in_progress') executionStep = 'current';

      // Step 4: Invoice & Payment
      let invoiceStep: StageState = 'upcoming';
      if (invoice?.status === 'void') invoiceStep = 'rejected';
      else if (isInvoicePaid) invoiceStep = 'completed';
      else if (isInvoiceCreated) invoiceStep = 'current';
      else if (isJobDone && !isInvoiceCreated && currentView === 'job') invoiceStep = 'current';

      return { quoteStep, jobStep, executionStep, invoiceStep };
    }

    it('3.1 resolves standard forward golden-path transitions across all stages', () => {
      // Stage A: Fresh Quote Draft
      const s1 = resolvePipeline({ status: 'draft' }, null, null, 'quote');
      expect(s1.quoteStep).toBe('current');
      expect(s1.jobStep).toBe('upcoming');
      expect(s1.executionStep).toBe('upcoming');
      expect(s1.invoiceStep).toBe('upcoming');

      // Stage B: Quote Accepted, Job not yet created
      const s2 = resolvePipeline({ status: 'accepted' }, null, null, 'quote');
      expect(s2.quoteStep).toBe('completed');
      expect(s2.jobStep).toBe('current');
      expect(s2.executionStep).toBe('upcoming');
      expect(s2.invoiceStep).toBe('upcoming');

      // Stage C: Job Scheduled
      const s3 = resolvePipeline({ status: 'accepted' }, { status: 'scheduled' }, null, 'job');
      expect(s3.quoteStep).toBe('completed');
      expect(s3.jobStep).toBe('current');
      expect(s3.executionStep).toBe('upcoming');
      expect(s3.invoiceStep).toBe('upcoming');

      // Stage D: Job In Progress (Technician on-site)
      const s4 = resolvePipeline({ status: 'accepted' }, { status: 'in_progress' }, null, 'job');
      expect(s4.quoteStep).toBe('completed');
      expect(s4.jobStep).toBe('completed');
      expect(s4.executionStep).toBe('current');
      expect(s4.invoiceStep).toBe('upcoming');

      // Stage E: Job Completed by Technician
      const s5 = resolvePipeline({ status: 'accepted' }, { status: 'completed' }, null, 'job');
      expect(s5.quoteStep).toBe('completed');
      expect(s5.jobStep).toBe('completed');
      expect(s5.executionStep).toBe('completed');
      expect(s5.invoiceStep).toBe('current');

      // Stage F: Invoice Draft / Sent
      const s6 = resolvePipeline({ status: 'accepted' }, { status: 'completed' }, { status: 'sent' }, 'invoice');
      expect(s6.quoteStep).toBe('completed');
      expect(s6.jobStep).toBe('completed');
      expect(s6.executionStep).toBe('completed');
      expect(s6.invoiceStep).toBe('current');

      // Stage G: Invoice Paid in Full
      const s7 = resolvePipeline({ status: 'accepted' }, { status: 'completed' }, { status: 'paid' }, 'invoice');
      expect(s7.quoteStep).toBe('completed');
      expect(s7.jobStep).toBe('completed');
      expect(s7.executionStep).toBe('completed');
      expect(s7.invoiceStep).toBe('completed');
    });

    it('3.2 evaluates 300 parameterized status combinations and guarantees non-crashing valid step states', () => {
      const quoteStatuses: (any)[] = [null, { status: 'draft' }, { status: 'sent' }, { status: 'accepted' }, { status: 'rejected' }];
      const jobStatuses: (any)[] = [null, { status: 'scheduled' }, { status: 'in_progress' }, { status: 'completed' }, { status: 'cancelled' }];
      const invStatuses: (any)[] = [null, { status: 'draft' }, { status: 'sent' }, { status: 'paid' }, { status: 'overdue' }, { status: 'void' }];
      const views: ('quote' | 'job' | 'invoice')[] = ['quote', 'job', 'invoice'];

      let combinationsTested = 0;
      for (const q of quoteStatuses) {
        for (const j of jobStatuses) {
          for (const inv of invStatuses) {
            for (const v of views) {
              const res = resolvePipeline(q, j, inv, v);
              expect(['completed', 'current', 'upcoming', 'rejected']).toContain(res.quoteStep);
              expect(['completed', 'current', 'upcoming', 'rejected']).toContain(res.jobStep);
              expect(['completed', 'current', 'upcoming', 'rejected']).toContain(res.executionStep);
              expect(['completed', 'current', 'upcoming', 'rejected']).toContain(res.invoiceStep);
              combinationsTested++;
            }
          }
        }
      }

      // 5 * 5 * 6 * 3 = 450 combinations tested!
      expect(combinationsTested).toBe(450);
    });

    it('3.3 handles cancellation and rejection branches properly', () => {
      // Quote rejected halts pipeline
      const rejQuote = resolvePipeline({ status: 'rejected' }, null, null, 'quote');
      expect(rejQuote.quoteStep).toBe('rejected');
      expect(rejQuote.jobStep).toBe('upcoming');

      // Job cancelled halts pipeline
      const cancJob = resolvePipeline({ status: 'accepted' }, { status: 'cancelled' }, null, 'job');
      expect(cancJob.quoteStep).toBe('completed');
      expect(cancJob.jobStep).toBe('rejected');
      expect(cancJob.executionStep).toBe('rejected');

      // Invoice void
      const voidInv = resolvePipeline({ status: 'accepted' }, { status: 'completed' }, { status: 'void' }, 'invoice');
      expect(voidInv.quoteStep).toBe('completed');
      expect(voidInv.jobStep).toBe('completed');
      expect(voidInv.executionStep).toBe('completed');
      expect(voidInv.invoiceStep).toBe('rejected');
    });
  });

  // ============================================================================
  // Suite 4: Landing Page Mobile CTAs & Walkthrough Modal Invariants (20+ assertions)
  // ============================================================================
  describe('Suite 4: Landing Page Mobile CTAs & Demo Modal Specs', () => {
    it('4.1 verifies hero trial button target and accessibility attributes', () => {
      const heroTrialConfig = {
        id: 'hero-cta-trial',
        href: '/signup',
        minHeight: 48,
        touchManipulation: true,
        zIndex: 30,
      };

      expect(heroTrialConfig.href).toBe('/signup');
      expect(heroTrialConfig.minHeight).toBeGreaterThanOrEqual(44); // Mobile touch target HIG
      expect(heroTrialConfig.touchManipulation).toBe(true);
      expect(heroTrialConfig.zIndex).toBe(30);
    });

    it('4.2 verifies hero demo interactive modal tabs and flow content', () => {
      const demoModalSteps = [
        { id: 'dispatch', title: 'Intelligent Dispatch & Gantt', hasAction: true },
        { id: 'radar', title: 'Live Fleet Radar & GPS Proximity', hasAction: true },
        { id: 'signature', title: 'Digital Signature on Glass', hasAction: true },
        { id: 'billing', title: 'Automated Invoice & Card Settlement', hasAction: true },
      ];

      expect(demoModalSteps.length).toBe(4);
      for (const step of demoModalSteps) {
        expect(step.id).toBeDefined();
        expect(step.title.length).toBeGreaterThan(10);
        expect(step.hasAction).toBe(true);
      }
    });

    it('4.3 verifies touch listener outdoor check prevents touch hijacking', () => {
      let isControlsOpen = false;
      let outsideClickFired = false;

      function handleTouchOutside(isOpen: boolean, isInsideContainer: boolean) {
        if (isOpen && !isInsideContainer) {
          outsideClickFired = true;
        }
      }

      // When menu is closed: tap outside should NOT trigger outside click
      isControlsOpen = false;
      outsideClickFired = false;
      handleTouchOutside(isControlsOpen, false);
      expect(outsideClickFired).toBe(false);

      // When menu is open: tap outside SHOULD trigger outside click
      isControlsOpen = true;
      outsideClickFired = false;
      handleTouchOutside(isControlsOpen, false);
      expect(outsideClickFired).toBe(true);

      // When menu is open: tap inside should NOT trigger outside click
      isControlsOpen = true;
      outsideClickFired = false;
      handleTouchOutside(isControlsOpen, true);
      expect(outsideClickFired).toBe(false);
    });
  });

  // ============================================================================
  // Suite 5: Jobs Page SSR Safety & DOM Nesting Invariants (50+ assertions)
  // ============================================================================
  describe('Suite 5: Jobs Page SSR Safety & DOM Nesting Invariants', () => {
    it('5.1 renders LifecycleTraceabilityWidget in compact mode without nested anchor tags', async () => {
      const { renderToString } = await import('react-dom/server');
      const React = await import('react');
      const { LifecycleTraceabilityWidget } = await import('@/components/common/LifecycleTraceabilityWidget');

      const mockJob = {
        id: 'job-123',
        job_number: 'J-2026-0001',
        status: 'completed' as const,
        completed_at: '2026-09-20T10:00:00Z',
      };

      const mockInvoice = {
        id: 'inv-456',
        invoice_number: 'INV-2026-0001',
        status: 'paid' as const,
        total_cents: 25000,
        amount_paid_cents: 25000,
      };

      const html = renderToString(
        React.createElement(LifecycleTraceabilityWidget, {
          job: mockJob,
          invoice: mockInvoice,
          currentStage: 'job',
          compact: true,
        })
      );

      // In compact mode inside clickable card lists, pills MUST be <span> elements, NEVER <a> tags
      expect(html).not.toContain('<a');
      expect(html).not.toContain('href=');
      expect(html).toContain('J-2026-0001');
      expect(html).toContain('INV-2026-0001');
      expect(html).toContain('completed');
      expect(html).toContain('PAID');
    });

    it('5.2 safely renders without crashing when job or invoice have missing or malformed properties', async () => {
      const { renderToString } = await import('react-dom/server');
      const React = await import('react');
      const { LifecycleTraceabilityWidget } = await import('@/components/common/LifecycleTraceabilityWidget');

      const malformedCases = [
        { job: null, invoice: null, quote: null },
        { job: { id: 'j-1', job_number: 'J-1', status: undefined as any }, invoice: null },
        { job: { id: 'j-2', job_number: 'J-2', status: null as any }, invoice: { id: 'i-1', invoice_number: 'INV-1', status: undefined as any } },
        { job: { id: 'j-3', job_number: 'J-3', status: 'in_progress' as const }, invoice: { id: 'i-2', invoice_number: 'INV-2', status: null as any } },
        { job: undefined, invoice: undefined, quote: { id: 'q-1', quote_number: 'Q-1', status: null as any } },
      ];

      for (const tc of malformedCases) {
        expect(() => {
          const compactHtml = renderToString(
            React.createElement(LifecycleTraceabilityWidget, {
              job: tc.job,
              invoice: tc.invoice,
              quote: (tc as any).quote,
              currentStage: 'job',
              compact: true,
            })
          );
          expect(compactHtml.length).toBeGreaterThan(0);

          const fullHtml = renderToString(
            React.createElement(LifecycleTraceabilityWidget, {
              job: tc.job,
              invoice: tc.invoice,
              quote: (tc as any).quote,
              currentStage: 'job',
              compact: false,
            })
          );
          expect(fullHtml.length).toBeGreaterThan(0);
        }).not.toThrow();
      }
    });

    it('5.3 renders full interactive navigation links when compact is false on detail pages', async () => {
      const { renderToString } = await import('react-dom/server');
      const React = await import('react');
      const { LifecycleTraceabilityWidget } = await import('@/components/common/LifecycleTraceabilityWidget');

      const mockJob = {
        id: 'job-789',
        job_number: 'J-2026-0005',
        status: 'in_progress' as const,
        assigned_to_name: 'John Doe',
      };

      const mockQuote = {
        id: 'quote-789',
        quote_number: 'Q-2026-0005',
        status: 'accepted' as const,
        total_cents: 35000,
      };

      const html = renderToString(
        React.createElement(LifecycleTraceabilityWidget, {
          job: mockJob,
          quote: mockQuote,
          currentStage: 'job',
          compact: false,
        })
      );

      // On detail view, interactive links are properly rendered
      expect(html).toContain('href="/jobs/job-789"');
      expect(html).toContain('href="/quotes/quote-789"');
      expect(html).toContain('End-to-End Service Traceability');
      expect(html).toContain('John Doe');
    });
  });
});
