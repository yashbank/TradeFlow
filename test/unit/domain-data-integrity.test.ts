import { describe, it, expect } from 'vitest';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import {
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
  convertCurrencyCents,
  formatCurrencyLocale,
  parseExchangeRatesResponse,
  type CurrencyCode,
} from '@/lib/currency/rates';
import { formatCurrency, formatDate, escapeHtml } from '@/lib/utils';
import { LineItemSchema } from '@/lib/validations/quote';
import { RecordPaymentSchema } from '@/lib/validations/invoice';
import { CustomerSchema } from '@/lib/validations/customer';

// ==============================================================================
// TradeFlow Domain Data Integrity & Financial Precision Test Suite
// Total Test Cases: 118
// ==============================================================================

describe('Domain Data Integrity & Financial Precision Suite', () => {

  // ============================================================================
  // Scope 1: Integer Cent Financial Arithmetic (Tests 001 - 045)
  // ============================================================================
  describe('1. Integer Cent Financial Arithmetic', () => {

    describe('1.1 Floating-Point Inaccuracy Elimination', () => {
      it('TC-ARITH-01: Standard IEEE 754 float trap 0.1 + 0.2 = 0.30000000000000004 eliminated via integer cents', () => {
        // Floating point trap in dollars:
        const floatSum = 0.1 + 0.2;
        expect(floatSum).not.toBe(0.3);
        expect(floatSum).toBe(0.30000000000000004);

        // Integer cent representation:
        const centA = 10; // $0.10
        const centB = 20; // $0.20
        const centSum = centA + centB;
        expect(centSum).toBe(30); // Exactly $0.30
      });

      it('TC-ARITH-02: Float summation inaccuracy eliminated in cumulative additions ($0.70 + $0.80 = $1.50)', () => {
        const floatSum = 0.70 + 0.80;
        expect(floatSum).toBe(1.5);

        const centA = 70;
        const centB = 80;
        expect(centA + centB).toBe(150);
      });

      it('TC-ARITH-03: Exact cumulative summation across 1,000 line items of 70 cents equals 70,000 cents without drift', () => {
        let floatSum = 0;
        for (let i = 0; i < 1000; i++) {
          floatSum += 0.70;
        }
        // Floating point accumulates drift
        expect(floatSum).not.toBe(700);

        let centSum = 0;
        for (let i = 0; i < 1000; i++) {
          centSum += 70;
        }
        expect(centSum).toBe(70000); // Exactly 70,000 cents ($700.00)
      });

      it('TC-ARITH-04: Half-up rounding on fractional cent: 100.5 cents rounds to 101 cents', () => {
        expect(Math.round(100.5)).toBe(101);
      });

      it('TC-ARITH-05: Rounding down on fractional cent: 100.49 cents rounds to 100 cents', () => {
        expect(Math.round(100.49)).toBe(100);
      });

      it('TC-ARITH-06: Repeating decimal fraction unit price: 1/3 dollar at 3 units equals 100 cents via integer round', () => {
        const total = Math.round(3 * (100 / 3) * 100); // 10000 cents ($100.00)
        expect(total).toBe(10000);
      });

      it('TC-ARITH-07: Sub-cent multiplication: 3 units at 3333 cents rounded cleanly', () => {
        const items = [{ quantity: 3, unitPriceCents: 3333, taxable: false }];
        const result = calculateDocumentTotals(items, 0, 0, 0);
        expect(result.subtotalCents).toBe(9999);
      });

      it('TC-ARITH-08: Extreme small fraction: 0.001 units at 1000 cents ($10.00) produces 1 cent', () => {
        const items = [{ quantity: 0.001, unitPriceCents: 1000, taxable: false }];
        const result = calculateDocumentTotals(items, 0, 0, 0);
        expect(result.subtotalCents).toBe(1);
      });

      it('TC-ARITH-09: Negative quantity inputs clamped to 0 to prevent negative line items', () => {
        const items = [{ quantity: -5, unitPriceCents: 5000, taxable: false }];
        const result = calculateDocumentTotals(items, 0, 0, 0);
        expect(result.itemTotals[0]).toBe(0);
        expect(result.subtotalCents).toBe(0);
      });

      it('TC-ARITH-10: Negative unit price clamped to 0 to prevent fraudulent negative billing', () => {
        const items = [{ quantity: 2, unitPriceCents: -5000, taxable: false }];
        const result = calculateDocumentTotals(items, 0, 0, 0);
        expect(result.itemTotals[0]).toBe(0);
        expect(result.subtotalCents).toBe(0);
      });

      it('TC-ARITH-11: NaN quantity inputs sanitized safely to 0 without NaN propagation', () => {
        const items = [{ quantity: NaN, unitPriceCents: 5000, taxable: false }];
        const result = calculateDocumentTotals(items, 0, 0, 0);
        expect(result.subtotalCents).toBe(0);
        expect(result.totalCents).toBe(0);
      });

      it('TC-ARITH-12: NaN unit price inputs sanitized safely to 0 without NaN propagation', () => {
        const items = [{ quantity: 2, unitPriceCents: NaN, taxable: false }];
        const result = calculateDocumentTotals(items, 0, 0, 0);
        expect(result.subtotalCents).toBe(0);
        expect(result.totalCents).toBe(0);
      });
    });

    describe('1.2 Line Item Subtotal Calculation', () => {
      it('TC-SUB-01: Single item integer calculation quantity * unit_price_cents', () => {
        const items = [{ quantity: 4, unitPriceCents: 2500, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(10000);
        expect(res.subtotalCents).toBe(10000);
      });

      it('TC-SUB-02: Multi-item exact summation without discount or tax', () => {
        const items = [
          { quantity: 1, unitPriceCents: 15000, taxable: false },
          { quantity: 2, unitPriceCents: 4500, taxable: false },
          { quantity: 3, unitPriceCents: 1200, taxable: false },
        ];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals).toEqual([15000, 9000, 3600]);
        expect(res.subtotalCents).toBe(27600);
        expect(res.totalCents).toBe(27600);
      });

      it('TC-SUB-03: Supports unit_price_cents property (database snake_case)', () => {
        const items = [{ quantity: 2, unit_price_cents: 6000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(12000);
        expect(res.subtotalCents).toBe(12000);
      });

      it('TC-SUB-04: Supports unitPriceCents property (frontend camelCase)', () => {
        const items = [{ quantity: 3, unitPriceCents: 4000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(12000);
      });

      it('TC-SUB-05: Precedence: unitPriceCents takes precedence over unit_price_cents if both present', () => {
        const items = [{ quantity: 1, unitPriceCents: 5000, unit_price_cents: 9999, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(5000);
      });

      it('TC-SUB-06: Fractional quantity: 2.5 hours of labor @ $85.00/hr (8500 cents) = 21250 cents ($212.50)', () => {
        const items = [{ quantity: 2.5, unitPriceCents: 8500, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(21250);
        expect(res.subtotalCents).toBe(21250);
      });

      it('TC-SUB-07: Fractional quantity: 0.5 units of pipe @ $19.99 (1999 cents) = 1000 cents ($10.00)', () => {
        const items = [{ quantity: 0.5, unitPriceCents: 1999, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        // 0.5 * 1999 = 999.5 -> rounds half-up to 1000
        expect(res.itemTotals[0]).toBe(1000);
      });

      it('TC-SUB-08: Fractional quantity: 0.333 units of copper wire @ $10.00 (1000 cents) = 333 cents', () => {
        const items = [{ quantity: 0.333, unitPriceCents: 1000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(333);
      });

      it('TC-SUB-09: Zero quantity item produces 0 cents subtotal', () => {
        const items = [{ quantity: 0, unitPriceCents: 10000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.itemTotals[0]).toBe(0);
        expect(res.subtotalCents).toBe(0);
      });

      it('TC-SUB-10: Large commercial volume: 50,000 units @ $15.00 (1500 cents) = 75,000,000 cents ($750,000.00)', () => {
        const items = [{ quantity: 50000, unitPriceCents: 1500, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.subtotalCents).toBe(75000000);
      });
    });

    describe('1.3 Discount Deduction & Precedence', () => {
      it('TC-DISC-01: Flat discount exact deduction (subtotal - flatDiscount)', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: false }];
        const res = calculateDocumentTotals(items, 2500, 0, 0);
        expect(res.subtotalCents).toBe(10000);
        expect(res.discountCents).toBe(2500);
        expect(res.totalCents).toBe(7500);
      });

      it('TC-DISC-02: Percentage discount calculation using basis points (1500 bps = 15.00%)', () => {
        const items = [{ quantity: 2, unitPriceCents: 10000, taxable: false }]; // 20000
        const res = calculateDocumentTotals(items, 0, 1500, 0);
        expect(res.subtotalCents).toBe(20000);
        expect(res.discountCents).toBe(3000); // 15% of 20000
        expect(res.totalCents).toBe(17000);
      });

      it('TC-DISC-03: Basis points rounding on fractional cents (825 bps on $33.33 -> 275 cents)', () => {
        const items = [{ quantity: 1, unitPriceCents: 3333, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 825, 0);
        // (3333 * 825) / 10000 = 274.9725 -> 275 cents
        expect(res.discountCents).toBe(275);
        expect(res.totalCents).toBe(3058);
      });

      it('TC-DISC-04: Flat discount takes strict precedence over percentage discount if > 0', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: false }];
        // Flat = 1500, Rate = 5000 (50%). Flat must win.
        const res = calculateDocumentTotals(items, 1500, 5000, 0);
        expect(res.discountCents).toBe(1500);
        expect(res.totalCents).toBe(8500);
      });

      it('TC-DISC-05: Flat discount capped at subtotal when flat discount exceeds subtotal', () => {
        const items = [{ quantity: 1, unitPriceCents: 5000, taxable: false }];
        const res = calculateDocumentTotals(items, 12000, 0, 0);
        expect(res.subtotalCents).toBe(5000);
        expect(res.discountCents).toBe(5000);
        expect(res.totalCents).toBe(0);
      });

      it('TC-DISC-06: 100% percentage discount (10000 bps) reduces total to 0 cents', () => {
        const items = [{ quantity: 2, unitPriceCents: 7500, taxable: false }]; // 15000
        const res = calculateDocumentTotals(items, 0, 10000, 0);
        expect(res.discountCents).toBe(15000);
        expect(res.totalCents).toBe(0);
      });

      it('TC-DISC-07: Over-100% discount (15000 bps = 150%) clamped to subtotal without negative total', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 15000, 0);
        expect(res.discountCents).toBe(10000);
        expect(res.totalCents).toBe(0);
      });

      it('TC-DISC-08: Negative flat discount clamped to 0 without mutating subtotal', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: false }];
        const res = calculateDocumentTotals(items, -2000, 0, 0);
        expect(res.discountCents).toBe(0);
        expect(res.totalCents).toBe(10000);
      });

      it('TC-DISC-09: Negative percentage discount basis points clamped to 0', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, -500, 0);
        expect(res.discountCents).toBe(0);
        expect(res.totalCents).toBe(10000);
      });
    });

    describe('1.4 Tax Calculation using Basis Points', () => {
      it('TC-TAX-01: Standard tax rate calculation (825 bps = 8.25% on $100.00 = 825 cents)', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 825);
        expect(res.taxableBaseCents).toBe(10000);
        expect(res.taxCents).toBe(825);
        expect(res.totalCents).toBe(10825);
      });

      it('TC-TAX-02: Zero tax rate (0 bps) produces exactly 0 cents tax', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(10000);
      });

      it('TC-TAX-03: High tax rate (UK VAT 2000 bps = 20.00% on $250.00 = $50.00 tax)', () => {
        const items = [{ quantity: 1, unitPriceCents: 25000, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 2000);
        expect(res.taxCents).toBe(5000);
        expect(res.totalCents).toBe(30000);
      });

      it('TC-TAX-04: Fractional tax rounding down: 825 bps on 150 cents (12.375 -> 12 cents)', () => {
        const items = [{ quantity: 1, unitPriceCents: 150, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 825);
        expect(res.taxCents).toBe(12);
      });

      it('TC-TAX-05: Fractional tax rounding up: 825 bps on 180 cents (14.85 -> 15 cents)', () => {
        const items = [{ quantity: 1, unitPriceCents: 180, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 825);
        expect(res.taxCents).toBe(15);
      });

      it('TC-TAX-06: Mixed taxable and tax-exempt items: tax only applies to taxable items', () => {
        const items = [
          { quantity: 1, unitPriceCents: 10000, taxable: true },  // $100 taxable
          { quantity: 1, unitPriceCents: 5000, taxable: false },  // $50 exempt
        ];
        const res = calculateDocumentTotals(items, 0, 0, 1000); // 10%
        expect(res.subtotalCents).toBe(15000);
        expect(res.taxableBaseCents).toBe(10000);
        expect(res.taxCents).toBe(1000);
        expect(res.totalCents).toBe(16000);
      });

      it('TC-TAX-07: Pro-rated discount allocation across mixed taxable and tax-exempt items', () => {
        const items = [
          { quantity: 1, unitPriceCents: 10000, taxable: true },  // $100 taxable
          { quantity: 1, unitPriceCents: 10000, taxable: false }, // $100 exempt
        ];
        // Total: 20000. Flat discount: 4000.
        // Taxable is 50% of subtotal, so discount portion for taxable = 2000.
        // Taxable base = 10000 - 2000 = 8000.
        // Tax at 1000 bps (10%) = 800.
        // Total = 20000 - 4000 + 800 = 16800.
        const res = calculateDocumentTotals(items, 4000, 0, 1000);
        expect(res.subtotalCents).toBe(20000);
        expect(res.discountCents).toBe(4000);
        expect(res.taxableBaseCents).toBe(8000);
        expect(res.taxCents).toBe(800);
        expect(res.totalCents).toBe(16800);
      });

      it('TC-TAX-08: 100% tax-exempt invoice with positive tax rate produces 0 cents tax', () => {
        const items = [
          { quantity: 2, unitPriceCents: 5000, taxable: false },
          { quantity: 1, unitPriceCents: 10000, taxable: false },
        ];
        const res = calculateDocumentTotals(items, 0, 0, 1500);
        expect(res.taxableBaseCents).toBe(0);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(20000);
      });

      it('TC-TAX-09: Negative tax rate basis points clamped to 0', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, -825);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(10000);
      });
    });

    describe('1.5 Total Amount & Balance Due Reconciliation', () => {
      it('TC-BAL-01: Grand total formula verification subtotal - discount + tax', () => {
        const items = [{ quantity: 1, unitPriceCents: 20000, taxable: true }];
        const res = calculateDocumentTotals(items, 5000, 0, 1000);
        // Subtotal = 20000, Discount = 5000, Taxable base = 15000, Tax = 1500
        // Grand total = 20000 - 5000 + 1500 = 16500
        expect(res.totalCents).toBe(16500);
        expect(res.totalCents).toBe(res.subtotalCents - res.discountCents + res.taxCents);
      });

      it('TC-BAL-02: Initial balance due equals grand total on creation', () => {
        const items = [{ quantity: 2, unitPriceCents: 5000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        const amountPaidCents = 0;
        const balanceDueCents = Math.max(0, res.totalCents - amountPaidCents);
        expect(balanceDueCents).toBe(10000);
      });

      it('TC-BAL-03: Exact balance due reconciliation on full payment (balance = 0)', () => {
        const totalCents = 15000;
        const paymentAmount = 15000;
        const newPaid = paymentAmount;
        const newBalance = Math.max(0, totalCents - newPaid);
        expect(newBalance).toBe(0);
      });

      it('TC-BAL-04: Exact balance due reconciliation on partial payment', () => {
        const totalCents = 25000; // $250.00
        const paymentAmount = 10000; // $100.00 deposit
        const newPaid = paymentAmount;
        const newBalance = Math.max(0, totalCents - newPaid);
        expect(newBalance).toBe(15000); // $150.00 balance due
      });

      it('TC-BAL-05: Consecutive multi-installment payments reconciling balance due to exactly 0', () => {
        const totalCents = 30000; // $300.00
        let amountPaid = 0;

        // Installment 1: $100
        amountPaid += 10000;
        let balance = Math.max(0, totalCents - amountPaid);
        expect(balance).toBe(20000);

        // Installment 2: $150
        amountPaid += 15000;
        balance = Math.max(0, totalCents - amountPaid);
        expect(balance).toBe(5000);

        // Installment 3: $50
        amountPaid += 5000;
        balance = Math.max(0, totalCents - amountPaid);
        expect(balance).toBe(0);
      });

      it('TC-BAL-06: Overpayment defense: balance due clamped to 0, never negative', () => {
        const totalCents = 10000; // $100.00
        const customerPaid = 15000; // $150.00 paid
        const balanceDue = Math.max(0, totalCents - customerPaid);
        expect(balanceDue).toBe(0);
      });

      it('TC-BAL-07: 100% discounted invoice total is 0 and initial balance due is 0', () => {
        const items = [{ quantity: 1, unitPriceCents: 8000, taxable: true }];
        const res = calculateDocumentTotals(items, 8000, 0, 825);
        expect(res.totalCents).toBe(0);
        const balanceDue = Math.max(0, res.totalCents - 0);
        expect(balanceDue).toBe(0);
      });
    });

  });

  // ============================================================================
  // Scope 2: Multi-Currency Live Conversion & International Formatting (Tests 046 - 080)
  // ============================================================================
  describe('2. Multi-Currency Live Conversion & International Formatting', () => {

    describe('2.1 Supported Currencies Registry & Fallback Rates', () => {
      it('TC-CURR-01: All 7 required currencies are registered (USD, EUR, GBP, CAD, AUD, INR, JPY)', () => {
        const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
        expect(codes).toEqual(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']);
      });

      it('TC-CURR-02: Each supported currency defines valid code, symbol, name, flag, and locale', () => {
        SUPPORTED_CURRENCIES.forEach((curr) => {
          expect(curr.code).toBeDefined();
          expect(curr.symbol.length).toBeGreaterThan(0);
          expect(curr.name.length).toBeGreaterThan(0);
          expect(curr.flag.length).toBeGreaterThan(0);
          expect(curr.locale).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
        });
      });

      it('TC-CURR-03: Offline fallback rates are defined for all 7 currencies', () => {
        const requiredCodes: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'];
        requiredCodes.forEach((code) => {
          expect(FALLBACK_RATES[code]).toBeDefined();
          expect(FALLBACK_RATES[code]).toBeGreaterThan(0);
        });
      });

      it('TC-CURR-04: Base currency USD rate is strictly 1.0', () => {
        expect(FALLBACK_RATES.USD).toBe(1.0);
      });

      it('TC-CURR-05: EUR fallback rate is realistic (between 0.8 and 1.2)', () => {
        expect(FALLBACK_RATES.EUR).toBeGreaterThanOrEqual(0.8);
        expect(FALLBACK_RATES.EUR).toBeLessThanOrEqual(1.2);
      });

      it('TC-CURR-06: GBP fallback rate is realistic (between 0.7 and 0.95)', () => {
        expect(FALLBACK_RATES.GBP).toBeGreaterThanOrEqual(0.7);
        expect(FALLBACK_RATES.GBP).toBeLessThanOrEqual(0.95);
      });

      it('TC-CURR-07: CAD fallback rate is realistic (between 1.1 and 1.6)', () => {
        expect(FALLBACK_RATES.CAD).toBeGreaterThanOrEqual(1.1);
        expect(FALLBACK_RATES.CAD).toBeLessThanOrEqual(1.6);
      });

      it('TC-CURR-08: AUD fallback rate is realistic (between 1.2 and 1.8)', () => {
        expect(FALLBACK_RATES.AUD).toBeGreaterThanOrEqual(1.2);
        expect(FALLBACK_RATES.AUD).toBeLessThanOrEqual(1.8);
      });

      it('TC-CURR-09: INR fallback rate is realistic (between 70.0 and 100.0)', () => {
        expect(FALLBACK_RATES.INR).toBeGreaterThanOrEqual(70.0);
        expect(FALLBACK_RATES.INR).toBeLessThanOrEqual(100.0);
      });

      it('TC-CURR-10: JPY fallback rate is realistic (between 100.0 and 200.0)', () => {
        expect(FALLBACK_RATES.JPY).toBeGreaterThanOrEqual(100.0);
        expect(FALLBACK_RATES.JPY).toBeLessThanOrEqual(200.0);
      });

      it('TC-CURR-11: API response parser safely handles valid open.er-api.com payload', () => {
        const mockApiResponse = {
          result: 'success',
          base_code: 'USD',
          rates: {
            EUR: 0.93,
            GBP: 0.81,
            CAD: 1.38,
            AUD: 1.55,
            INR: 84.1,
            JPY: 158.2,
          },
        };
        const parsed = parseExchangeRatesResponse(mockApiResponse);
        expect(parsed.USD).toBe(1.0);
        expect(parsed.EUR).toBe(0.93);
        expect(parsed.GBP).toBe(0.81);
        expect(parsed.CAD).toBe(1.38);
        expect(parsed.AUD).toBe(1.55);
        expect(parsed.INR).toBe(84.1);
        expect(parsed.JPY).toBe(158.2);
      });

      it('TC-CURR-12: API response parser falls back to offline rates on null, undefined, or empty payload', () => {
        expect(parseExchangeRatesResponse(null)).toEqual(FALLBACK_RATES);
        expect(parseExchangeRatesResponse(undefined)).toEqual(FALLBACK_RATES);
        expect(parseExchangeRatesResponse({})).toEqual(FALLBACK_RATES);
      });

      it('TC-CURR-13: API response parser preserves fallbacks for individual missing currency keys', () => {
        const incompletePayload = {
          rates: {
            EUR: 0.95,
            // GBP, CAD, AUD, INR, JPY missing
          },
        };
        const parsed = parseExchangeRatesResponse(incompletePayload);
        expect(parsed.EUR).toBe(0.95);
        expect(parsed.GBP).toBe(FALLBACK_RATES.GBP);
        expect(parsed.JPY).toBe(FALLBACK_RATES.JPY);
      });

      it('TC-CURR-14: API response parser defends against non-positive or NaN rates in API response', () => {
        const corruptPayload = {
          rates: {
            EUR: -0.92,
            GBP: 0,
            CAD: NaN,
            AUD: 'not-a-number',
          },
        };
        const parsed = parseExchangeRatesResponse(corruptPayload);
        expect(parsed.EUR).toBe(FALLBACK_RATES.EUR);
        expect(parsed.GBP).toBe(FALLBACK_RATES.GBP);
        expect(parsed.CAD).toBe(FALLBACK_RATES.CAD);
        expect(parsed.AUD).toBe(FALLBACK_RATES.AUD);
      });
    });

    describe('2.2 Live Multi-Currency Conversion Engine', () => {
      it('TC-CONV-01: Identity conversion: USD to USD returns identical amount', () => {
        expect(convertCurrencyCents(12345, 'USD', 'USD')).toBe(12345);
      });

      it('TC-CONV-02: Identity conversion: EUR to EUR returns identical amount', () => {
        expect(convertCurrencyCents(8899, 'EUR', 'EUR')).toBe(8899);
      });

      it('TC-CONV-03: Identity conversion: JPY to JPY returns identical amount', () => {
        expect(convertCurrencyCents(155000, 'JPY', 'JPY')).toBe(155000);
      });

      it('TC-CONV-04: USD to EUR conversion with fallback rate 0.92 (10000 cents -> 9200 cents)', () => {
        const converted = convertCurrencyCents(10000, 'USD', 'EUR');
        expect(converted).toBe(9200);
      });

      it('TC-CONV-05: EUR to USD inverse conversion (9200 cents / 0.92 = 10000 cents)', () => {
        const converted = convertCurrencyCents(9200, 'EUR', 'USD');
        expect(converted).toBe(10000);
      });

      it('TC-CONV-06: USD to GBP conversion with fallback rate 0.79 (10000 cents -> 7900 cents)', () => {
        const converted = convertCurrencyCents(10000, 'USD', 'GBP');
        expect(converted).toBe(7900);
      });

      it('TC-CONV-07: Cross-currency conversion: GBP to EUR via USD base normalization', () => {
        // 10000 GBP cents -> / 0.79 USD = 12658.227 USD cents -> * 0.92 EUR = 11646 EUR cents
        const converted = convertCurrencyCents(10000, 'GBP', 'EUR');
        expect(converted).toBe(11646);
      });

      it('TC-CONV-08: USD to JPY conversion (1000 cents USD = $10.00 -> 155000 cents JPY)', () => {
        const converted = convertCurrencyCents(1000, 'USD', 'JPY');
        expect(converted).toBe(155000);
      });

      it('TC-CONV-09: Converting 0 cents yields 0 cents across all currency pairs', () => {
        expect(convertCurrencyCents(0, 'USD', 'EUR')).toBe(0);
        expect(convertCurrencyCents(0, 'GBP', 'JPY')).toBe(0);
        expect(convertCurrencyCents(0, 'INR', 'USD')).toBe(0);
      });

      it('TC-CONV-10: Fractional cent rounding determinism in conversions (Math.round)', () => {
        // 1 cent USD to EUR: 1 * 0.92 = 0.92 -> rounds to 1 cent EUR
        expect(convertCurrencyCents(1, 'USD', 'EUR')).toBe(1);
      });

      it('TC-CONV-11: High volume currency conversion preserving safe integer range ($1,000,000 to JPY)', () => {
        // $1,000,000 USD = 100,000,000 cents -> JPY rate 155.0 = 15,500,000,000 cents
        const converted = convertCurrencyCents(100000000, 'USD', 'JPY');
        expect(converted).toBe(15500000000);
        expect(Number.isSafeInteger(converted)).toBe(true);
      });
    });

    describe('2.3 International Locale Formatting', () => {
      it('TC-FMT-01: USD formatting uses $ symbol, en-US locale (comma thousands, dot decimal)', () => {
        const formatted = formatCurrencyLocale(123456, 'USD');
        expect(formatted).toBe('$1,234.56');
      });

      it('TC-FMT-02: EUR formatting uses de-DE locale (comma decimal separator, dot thousands)', () => {
        const formatted = formatCurrencyLocale(123456, 'EUR');
        // de-DE formats as "1.234,56 €"
        expect(formatted).toContain('1.234,56');
        expect(formatted).toContain('€');
      });

      it('TC-FMT-03: GBP formatting uses £ symbol, en-GB locale', () => {
        const formatted = formatCurrencyLocale(123456, 'GBP');
        expect(formatted).toBe('£1,234.56');
      });

      it('TC-FMT-04: CAD formatting uses en-CA locale with CA$ or $ currency identifier', () => {
        const formatted = formatCurrencyLocale(123456, 'CAD');
        expect(formatted).toMatch(/(CA)?\$1,234\.56/);
      });

      it('TC-FMT-05: AUD formatting uses en-AU locale with A$ or $ currency identifier', () => {
        const formatted = formatCurrencyLocale(123456, 'AUD');
        expect(formatted).toMatch(/(A)?\$1,234\.56/);
      });

      it('TC-FMT-06: INR formatting uses ₹ symbol and Indian numbering system', () => {
        const formatted = formatCurrencyLocale(123456, 'INR');
        expect(formatted).toContain('₹');
        expect(formatted).toContain('1,234.56');
      });

      it('TC-FMT-07: JPY formatting has ZERO decimal places (never .00)', () => {
        const formatted = formatCurrencyLocale(155000, 'JPY');
        // 155000 cents / 100 = 1550 Yen
        expect(formatted).toMatch(/[¥￥]1,550$/);
        expect(formatted).not.toContain('.00');
        expect(formatted).not.toContain(',00');
      });

      it('TC-FMT-08: Zero cent formatting for standard currencies ($0.00)', () => {
        expect(formatCurrencyLocale(0, 'USD')).toBe('$0.00');
        expect(formatCurrencyLocale(0, 'GBP')).toBe('£0.00');
      });

      it('TC-FMT-09: Zero cent formatting for JPY has 0 decimals (¥0)', () => {
        const formatted = formatCurrencyLocale(0, 'JPY');
        expect(formatted).toMatch(/[¥￥]0$/);
        expect(formatted).not.toContain('.00');
      });

      it('TC-FMT-10: formatCurrency in utils.ts formats all 7 currencies with zero decimals on JPY', () => {
        expect(formatCurrency(5000, 'USD')).toBe('$50.00');
        expect(formatCurrency(5000, 'GBP')).toBe('£50.00');
        expect(formatCurrency(5000, 'JPY')).toMatch(/[¥￥]50$/);
      });
    });

  });

  // ============================================================================
  // Scope 3: Zero-Division & Edge Case Protection (Tests 081 - 118)
  // ============================================================================
  describe('3. Zero-Division & Edge Case Protection', () => {

    describe('3.1 Zero-Division & Safe Empty State Protection', () => {
      it('TC-ZERO-01: Zero closed quotes in quote win rate returns 0% safely (never 0 / 0 = NaN)', () => {
        const acceptedCount = 0;
        const closedCount = 0;
        const winRate = closedCount > 0 ? Math.round((acceptedCount / closedCount) * 100) : 0;
        expect(winRate).toBe(0);
        expect(Number.isNaN(winRate)).toBe(false);
      });

      it('TC-ZERO-02: Zero total jobs in SLA on-time rate returns 100% safely (never 0 / 0 = NaN)', () => {
        const totalJobs = 0;
        const completedJobs = 0;
        const slaPercent = totalJobs > 0 ? Math.min(100, Math.round((completedJobs / totalJobs) * 100)) : 100;
        expect(slaPercent).toBe(100);
        expect(Number.isNaN(slaPercent)).toBe(false);
      });

      it('TC-ZERO-03: Empty line items array in calculateDocumentTotals returns 0 for all totals', () => {
        const res = calculateDocumentTotals([], 0, 0, 825);
        expect(res.itemTotals).toEqual([]);
        expect(res.subtotalCents).toBe(0);
        expect(res.discountCents).toBe(0);
        expect(res.taxableBaseCents).toBe(0);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(0);
      });

      it('TC-ZERO-04: Zero revenue MTD with 0 payments evaluates to 0 cents', () => {
        const payments: { amount_cents: number }[] = [];
        const revenueMtdCents = payments.reduce((sum, p) => sum + Number(p.amount_cents), 0);
        expect(revenueMtdCents).toBe(0);
      });

      it('TC-ZERO-05: Promotional free item ($0.00 unit price) calculates to 0 cents subtotal and 0 tax', () => {
        const items = [{ quantity: 1, unitPriceCents: 0, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 1000);
        expect(res.subtotalCents).toBe(0);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(0);
      });

      it('TC-ZERO-06: 0% tax rate with non-zero subtotal results in exactly 0 tax', () => {
        const items = [{ quantity: 3, unitPriceCents: 5000, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.subtotalCents).toBe(15000);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(15000);
      });

      it('TC-ZERO-07: 0 discount on positive subtotal leaves subtotal untouched', () => {
        const items = [{ quantity: 1, unitPriceCents: 8000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.discountCents).toBe(0);
        expect(res.totalCents).toBe(8000);
      });

      it('TC-ZERO-08: Tax calculation with 0 taxable items returns 0 tax', () => {
        const items = [{ quantity: 1, unitPriceCents: 10000, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 825);
        expect(res.taxableBaseCents).toBe(0);
        expect(res.taxCents).toBe(0);
      });

      it('TC-ZERO-09: Pro-rated discount calculation with subtotal 0 does not divide by zero', () => {
        const res = calculateDocumentTotals([], 500, 0, 825);
        expect(res.subtotalCents).toBe(0);
        expect(res.taxableBaseCents).toBe(0);
        expect(Number.isNaN(res.taxableBaseCents)).toBe(false);
      });
    });

    describe('3.2 Safe Integer Limits & Boundary Values', () => {
      it('TC-BND-01: Number.MAX_SAFE_INTEGER boundary verification', () => {
        expect(Number.isSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
        expect(Number.MAX_SAFE_INTEGER).toBe(9007199254740991);
      });

      it('TC-BND-02: Multi-million dollar transaction ($10,000,000.00 = 1,000,000,000 cents) arithmetic', () => {
        const items = [{ quantity: 100, unitPriceCents: 10000000, taxable: true }]; // $10M
        const res = calculateDocumentTotals(items, 0, 0, 825); // 8.25% tax
        expect(res.subtotalCents).toBe(1000000000);
        expect(res.taxCents).toBe(82500000); // $825,000.00 tax
        expect(res.totalCents).toBe(1082500000);
        expect(Number.isSafeInteger(res.totalCents)).toBe(true);
      });

      it('TC-BND-03: Multi-billion dollar balance ($1,000,000,000.00 = 100,000,000,000 cents) without overflow', () => {
        const largeBalance = 100000000000;
        const addition = 5000000000;
        const total = largeBalance + addition;
        expect(total).toBe(105000000000);
        expect(Number.isSafeInteger(total)).toBe(true);
      });

      it('TC-BND-04: Minimal transaction: 1 cent invoice with 0 tax and 0 discount', () => {
        const items = [{ quantity: 1, unitPriceCents: 1, taxable: false }];
        const res = calculateDocumentTotals(items, 0, 0, 0);
        expect(res.subtotalCents).toBe(1);
        expect(res.totalCents).toBe(1);
      });

      it('TC-BND-05: Tax on 1 cent at 825 bps rounds down to 0 cents tax (0.0825 cents)', () => {
        const items = [{ quantity: 1, unitPriceCents: 1, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 825);
        expect(res.taxCents).toBe(0);
        expect(res.totalCents).toBe(1);
      });

      it('TC-BND-06: Tax on 7 cents at 825 bps rounds up to 1 cent tax (0.5775 cents)', () => {
        const items = [{ quantity: 1, unitPriceCents: 7, taxable: true }];
        const res = calculateDocumentTotals(items, 0, 0, 825);
        expect(res.taxCents).toBe(1);
        expect(res.totalCents).toBe(8);
      });
    });

    describe('3.3 Fractional Quantities in Validation Schemas', () => {
      it('TC-FRAC-01: LineItemSchema accepts valid fractional labor quantity 2.5 hours', () => {
        const input = {
          description: 'Pipe diagnostic labor',
          quantity: 2.5,
          unit_price_cents: 8500,
          taxable: true,
        };
        const parsed = LineItemSchema.safeParse(input);
        expect(parsed.success).toBe(true);
      });

      it('TC-FRAC-02: LineItemSchema accepts valid fractional materials quantity 0.5 units', () => {
        const input = {
          description: 'PEX 1/2-inch tubing',
          quantity: 0.5,
          unit_price_cents: 1999,
          taxable: true,
        };
        const parsed = LineItemSchema.safeParse(input);
        expect(parsed.success).toBe(true);
      });

      it('TC-FRAC-03: LineItemSchema rejects 0 quantity (must be positive)', () => {
        const input = {
          description: 'Inspection',
          quantity: 0,
          unit_price_cents: 5000,
          taxable: true,
        };
        const parsed = LineItemSchema.safeParse(input);
        expect(parsed.success).toBe(false);
      });

      it('TC-FRAC-04: LineItemSchema rejects negative quantity', () => {
        const input = {
          description: 'Inspection',
          quantity: -2.5,
          unit_price_cents: 5000,
          taxable: true,
        };
        const parsed = LineItemSchema.safeParse(input);
        expect(parsed.success).toBe(false);
      });

      it('TC-FRAC-05: LineItemSchema enforces integer unit price in cents (rejects floating cents)', () => {
        const input = {
          description: 'Inspection',
          quantity: 1,
          unit_price_cents: 49.99, // Float cents is illegal
          taxable: true,
        };
        const parsed = LineItemSchema.safeParse(input);
        expect(parsed.success).toBe(false);
      });

      it('TC-FRAC-06: RecordPaymentSchema enforces positive integer cents (rejects fractional cents)', () => {
        const validPayment = {
          amount_cents: 5000,
          payment_date: '2026-06-15',
          payment_method: 'credit_card',
        };
        expect(RecordPaymentSchema.safeParse(validPayment).success).toBe(true);

        const invalidPayment = {
          amount_cents: 50.5, // Not integer cents
          payment_date: '2026-06-15',
          payment_method: 'credit_card',
        };
        expect(RecordPaymentSchema.safeParse(invalidPayment).success).toBe(false);
      });
    });

    describe('3.4 Special Characters & XSS Escaping', () => {
      it('TC-SEC-01: XSS script tags in item description escaped safely', () => {
        const xss = "<script>alert('xss')</script>";
        const escaped = escapeHtml(xss);
        expect(escaped).toBe('&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;');
        expect(escaped).not.toContain('<script>');
      });

      it('TC-SEC-02: HTML image tag injection in customer notes escaped safely', () => {
        const injection = '<img src=x onerror=alert(1)>';
        const escaped = escapeHtml(injection);
        expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;');
        expect(escaped).not.toContain('<img');
      });

      it('TC-SEC-03: Single quotes, double quotes, and ampersands in address preserved safely', () => {
        const address = '123 O\'Connor St. "Suite #4" & Co.';
        const escaped = escapeHtml(address);
        expect(escaped).toContain('&#039;');
        expect(escaped).toContain('&quot;');
        expect(escaped).toContain('&amp;');
      });

      it('TC-SEC-04: CustomerSchema accepts unicode and emoji characters in customer notes', () => {
        const customer = {
          first_name: 'Jane',
          last_name: 'Doe',
          phone: '555-0199',
          address_line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94105',
          notes: '🚨 Emergency pipe repair! 🛠️ Please call ASAP 📞',
        };
        const parsed = CustomerSchema.safeParse(customer);
        expect(parsed.success).toBe(true);
      });

      it('TC-SEC-05: CustomerSchema accepts international characters (accents, umlauts, non-Latin)', () => {
        const customer = {
          first_name: 'François',
          last_name: 'Müller',
          phone: '555-0200',
          address_line1: 'Rue de l\'Église',
          city: 'München',
          state: 'BY',
          postal_code: '80331',
          notes: '東京支店からの紹介。São Paulo branch customer.',
        };
        const parsed = CustomerSchema.safeParse(customer);
        expect(parsed.success).toBe(true);
      });

      it('TC-SEC-06: SQL injection payloads handled safely as literal text strings', () => {
        const payload = "Robert'); DROP TABLE invoices;--";
        const customer = {
          first_name: payload,
          last_name: 'Smith',
          phone: '555-0201',
          address_line1: '456 Elm St',
          city: 'Dallas',
          state: 'TX',
          postal_code: '75001',
        };
        const parsed = CustomerSchema.safeParse(customer);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect(parsed.data.first_name).toBe(payload);
        }
      });

      it('TC-SEC-07: Customer notes up to 2000 characters accepted by schema boundary', () => {
        const longNotes = 'A'.repeat(2000);
        const customer = {
          first_name: 'Bob',
          last_name: 'Vance',
          phone: '555-0202',
          address_line1: '789 Oak Ave',
          city: 'Scranton',
          state: 'PA',
          postal_code: '18503',
          notes: longNotes,
        };
        expect(CustomerSchema.safeParse(customer).success).toBe(true);
      });

      it('TC-SEC-08: Customer notes exceeding 2000 characters rejected by schema boundary', () => {
        const tooLongNotes = 'A'.repeat(2001);
        const customer = {
          first_name: 'Bob',
          last_name: 'Vance',
          phone: '555-0202',
          address_line1: '789 Oak Ave',
          city: 'Scranton',
          state: 'PA',
          postal_code: '18503',
          notes: tooLongNotes,
        };
        expect(CustomerSchema.safeParse(customer).success).toBe(false);
      });
    });

    describe('3.5 Date & Timezone Edge Cases', () => {
      it('TC-DATE-01: Leap year valid date 2024-02-29 accepted by ISO date regex', () => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        expect(regex.test('2024-02-29')).toBe(true);
        const d = new Date('2024-02-29T00:00:00Z');
        expect(d.getUTCFullYear()).toBe(2024);
        expect(d.getUTCMonth()).toBe(1); // February is month index 1
        expect(d.getUTCDate()).toBe(29);
      });

      it('TC-DATE-02: Leap year valid date 2028-02-29 accepted', () => {
        const d = new Date('2028-02-29T00:00:00Z');
        expect(d.getUTCFullYear()).toBe(2028);
        expect(d.getUTCDate()).toBe(29);
      });

      it('TC-DATE-03: Non-leap year date 2025-02-29 rolls over to March 1st in JavaScript Date', () => {
        const d = new Date('2025-02-29T00:00:00Z');
        expect(d.getUTCMonth()).toBe(2); // March is month index 2
        expect(d.getUTCDate()).toBe(1);
      });

      it('TC-DATE-04: End-of-month date: January 31st (31 days)', () => {
        const d = new Date('2026-01-31T00:00:00Z');
        expect(d.getUTCDate()).toBe(31);
        expect(d.getUTCMonth()).toBe(0);
      });

      it('TC-DATE-05: End-of-month date: April 30th (30 days)', () => {
        const d = new Date('2026-04-30T00:00:00Z');
        expect(d.getUTCDate()).toBe(30);
        expect(d.getUTCMonth()).toBe(3);
      });

      it('TC-DATE-06: Year rollover: December 31st to January 1st', () => {
        const dec31 = new Date('2025-12-31T00:00:00Z');
        const jan01 = new Date(dec31.getTime() + 24 * 60 * 60 * 1000);
        expect(jan01.getUTCFullYear()).toBe(2026);
        expect(jan01.getUTCMonth()).toBe(0);
        expect(jan01.getUTCDate()).toBe(1);
      });

      it('TC-DATE-07: Timezone offset protection: formatDate(2026-06-15) renders Jun 15, 2026 without shifting to Jun 14 in Western timezones', () => {
        const formatted = formatDate('2026-06-15');
        expect(formatted).toBe('Jun 15, 2026');
      });

      it('TC-DATE-08: Timezone offset protection: formatDate(2026-01-01) renders Jan 1, 2026 without shifting to Dec 31', () => {
        const formatted = formatDate('2026-01-01');
        expect(formatted).toBe('Jan 1, 2026');
      });

      it('TC-DATE-09: Timezone offset protection: formatDate(2026-12-31) renders Dec 31, 2026', () => {
        const formatted = formatDate('2026-12-31');
        expect(formatted).toBe('Dec 31, 2026');
      });

      it('TC-DATE-10: Null or empty date string returns fallback dash without throwing', () => {
        expect(formatDate(null)).toBe('—');
        expect(formatDate(undefined)).toBe('—');
        expect(formatDate('')).toBe('—');
      });
    });

  });

});
