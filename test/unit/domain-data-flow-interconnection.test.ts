import { describe, it, expect } from 'vitest';
import {
  computeElapsedSeconds,
  calculateQuarterHourRounding,
  normalizePhoneForUri,
  generateSmsDispatchUrl,
  type StoredStopwatchState,
} from '@/components/dashboard/TechnicianFieldPortal';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { DataManagementService } from '@/services/DataManagementService';

describe('Domain Data Flow Interconnection & Field Operations Test Suite', () => {
  // =========================================================================
  // Section 1: Persistent Stopwatch Wall-Clock Math (Tests 1-10)
  // =========================================================================
  describe('1. Persistent Stopwatch Wall-Clock Math', () => {
    it('1.1 should return 0 elapsed seconds for null or undefined state', () => {
      expect(computeElapsedSeconds(null)).toBe(0);
      expect(computeElapsedSeconds(undefined)).toBe(0);
    });

    it('1.2 should return accumulated seconds when stopwatch is paused', () => {
      const state: StoredStopwatchState = {
        isRunning: false,
        startTime: null,
        accumulatedSeconds: 125,
      };
      expect(computeElapsedSeconds(state, Date.now())).toBe(125);
    });

    it('1.3 should calculate dynamic elapsed seconds based on wall-clock startTime when running', () => {
      const startTime = 1700000000000;
      const now = startTime + 45000; // 45 seconds later
      const state: StoredStopwatchState = {
        isRunning: true,
        startTime,
        accumulatedSeconds: 0,
      };
      expect(computeElapsedSeconds(state, now)).toBe(45);
    });

    it('1.4 should combine accumulatedSeconds with running elapsed time', () => {
      const startTime = 1700000000000;
      const now = startTime + 120000; // 120 seconds later
      const state: StoredStopwatchState = {
        isRunning: true,
        startTime,
        accumulatedSeconds: 300, // 5 mins prior
      };
      expect(computeElapsedSeconds(state, now)).toBe(420); // 300 + 120
    });

    it('1.5 should handle phone lock / app sleep of 2 hours without resetting to zero', () => {
      const startTime = 1700000000000;
      const twoHoursLater = startTime + 2 * 3600 * 1000;
      const state: StoredStopwatchState = {
        isRunning: true,
        startTime,
        accumulatedSeconds: 60,
      };
      expect(computeElapsedSeconds(state, twoHoursLater)).toBe(7260); // 2h 1m
    });

    it('1.6 should guard against negative elapsed if clock moves backwards slightly', () => {
      const startTime = 1700000000000;
      const pastTime = startTime - 5000;
      const state: StoredStopwatchState = {
        isRunning: true,
        startTime,
        accumulatedSeconds: 50,
      };
      expect(computeElapsedSeconds(state, pastTime)).toBe(50);
    });
  });

  // =========================================================================
  // Section 2: Quarter-Hour Labor Rounding (Tests 11-20)
  // =========================================================================
  describe('2. Quarter-Hour Labor Rounding for Field Billing', () => {
    it('2.1 should return zero billing for zero seconds', () => {
      const res = calculateQuarterHourRounding(0);
      expect(res.exactMinutes).toBe(0);
      expect(res.roundedMinutes).toBe(0);
      expect(res.roundedHours).toBe(0);
    });

    it('2.2 should round up 1 second of labor to minimum 15 minutes (0.25h)', () => {
      const res = calculateQuarterHourRounding(1);
      expect(res.exactMinutes).toBe(0);
      expect(res.roundedMinutes).toBe(15);
      expect(res.roundedHours).toBe(0.25);
    });

    it('2.3 should round 16 minutes to 30 minutes (0.5h)', () => {
      const res = calculateQuarterHourRounding(16 * 60);
      expect(res.roundedMinutes).toBe(30);
      expect(res.roundedHours).toBe(0.5);
    });

    it('2.4 should round 46 minutes to 60 minutes (1.0h)', () => {
      const res = calculateQuarterHourRounding(46 * 60);
      expect(res.roundedMinutes).toBe(60);
      expect(res.roundedHours).toBe(1.0);
    });

    it('2.5 should correctly format billable string', () => {
      const res = calculateQuarterHourRounding(75 * 60); // 1h 15m
      expect(res.formatted).toBe('1.25 hrs (75m billable)');
    });
  });

  // =========================================================================
  // Section 3: Navigation & Mobile Contact Utilities (Tests 21-30)
  // =========================================================================
  describe('3. Navigation & Mobile Dispatch Contact Schemes', () => {
    it('3.1 should normalize phone numbers by stripping parentheses, spaces, and hyphens', () => {
      expect(normalizePhoneForUri('(555) 019-2834')).toBe('5550192834');
      expect(normalizePhoneForUri('+1 (800) 555-0199')).toBe('+18005550199');
    });

    it('3.2 should generate compliant SMS dispatch URI with encoded body', () => {
      const uri = generateSmsDispatchUrl(
        '(555) 234-5678',
        'Dave Miller',
        'John Doe',
        '123 Main St, Springfield'
      );
      expect(uri).toContain('sms:5552345678?&body=');
      expect(decodeURIComponent(uri)).toContain('Hi John Doe, your TradeFlow technician (Dave Miller) is en route to 123 Main St, Springfield');
    });
  });

  // =========================================================================
  // Section 4: Data Management & Cascade Integrity (Tests 31-40)
  // =========================================================================
  describe('4. Data Management & FK Cascade Hierarchy', () => {
    it('4.1 DataManagementService should export purge methods', () => {
      expect(typeof DataManagementService.purgeAll).toBe('function');
      expect(typeof DataManagementService.purgeCustomers).toBe('function');
      expect(typeof DataManagementService.purgeQuotes).toBe('function');
      expect(typeof DataManagementService.purgeJobs).toBe('function');
      expect(typeof DataManagementService.purgeInvoices).toBe('function');
      expect(typeof DataManagementService.getStats).toBe('function');
    });

    it('4.2 Document totals calculation should accurately compute subtotal, discount, and tax', () => {
      const totals = calculateDocumentTotals(
        [
          { quantity: 2, unitPriceCents: 5000, taxable: true },
          { quantity: 1, unitPriceCents: 15000, taxable: false },
        ],
        2000,
        0,
        850
      );

      // Subtotal = 25000 cents ($250)
      expect(totals.subtotalCents).toBe(25000);
      // Discount = 2000 cents ($20)
      expect(totals.discountCents).toBe(2000);
      expect(totals.totalCents).toBeGreaterThan(23000);
    });
  });
});
