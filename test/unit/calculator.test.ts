import { describe, it, expect } from 'vitest';
import { calculateDocumentTotals } from '@/lib/finance/calculator';

describe('Financial Calculation Engine (test/unit/calculator.test.ts)', () => {
  it('TC-CALC-01: Standard multi-item calculation without discount or tax', () => {
    const items = [
      { quantity: 2, unitPriceCents: 5000, taxable: false },
      { quantity: 1.5, unitPriceCents: 10000, taxable: false },
    ];

    const result = calculateDocumentTotals(items, 0, 0, 0);
    expect(result.itemTotals).toEqual([10000, 15000]);
    expect(result.subtotalCents).toBe(25000); // $250.00
    expect(result.discountCents).toBe(0);
    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(25000);
  });

  it('TC-CALC-02: Decimal quantity precision with half-up rounding', () => {
    const items = [
      { quantity: 1.333, unitPriceCents: 10000, taxable: false },
    ];

    const result = calculateDocumentTotals(items, 0, 0, 0);
    expect(result.itemTotals[0]).toBe(13330);
    expect(result.subtotalCents).toBe(13330);
    expect(result.totalCents).toBe(13330);
  });

  it('TC-CALC-03: Flat discount application', () => {
    const items = [
      { quantity: 1, unitPriceCents: 10000, taxable: false },
    ];

    const result = calculateDocumentTotals(items, 2500, 0, 0);
    expect(result.subtotalCents).toBe(10000);
    expect(result.discountCents).toBe(2500);
    expect(result.totalCents).toBe(7500);
  });

  it('TC-CALC-04: Flat discount exceeding subtotal', () => {
    const items = [
      { quantity: 1, unitPriceCents: 5000, taxable: false },
    ];

    const result = calculateDocumentTotals(items, 10000, 0, 0);
    expect(result.subtotalCents).toBe(5000);
    expect(result.discountCents).toBe(5000); // clamped to subtotal
    expect(result.totalCents).toBe(0);
  });

  it('TC-CALC-05: Percentage discount using basis points (1500 bps = 15%)', () => {
    const items = [
      { quantity: 2, unitPriceCents: 10000, taxable: false }, // 20000 cents
    ];

    const result = calculateDocumentTotals(items, 0, 1500, 0);
    expect(result.subtotalCents).toBe(20000);
    expect(result.discountCents).toBe(3000); // 15% of 20000 = 3000
    expect(result.totalCents).toBe(17000);
  });

  it('TC-CALC-06: Tax calculation with mixed taxable & non-taxable items', () => {
    const items = [
      { quantity: 1, unitPriceCents: 10000, taxable: true },  // 10000 cents taxable
      { quantity: 1, unitPriceCents: 5000, taxable: false },  // 5000 cents exempt
    ];

    // 1000 bps = 10.00%
    const result = calculateDocumentTotals(items, 0, 0, 1000);
    expect(result.subtotalCents).toBe(15000);
    expect(result.taxableBaseCents).toBe(10000);
    expect(result.taxCents).toBe(1000); // 10% of 10000
    expect(result.totalCents).toBe(16000);
  });

  it('TC-CALC-07: Pro-rated discount across taxable items', () => {
    const items = [
      { quantity: 1, unitPriceCents: 10000, taxable: true },  // 10000 cents
      { quantity: 1, unitPriceCents: 10000, taxable: false }, // 10000 cents
    ];
    // Subtotal: 20000. Flat discount: 4000.
    // Half of subtotal is taxable, so discount portion for taxable = 2000.
    // Taxable base = 10000 - 2000 = 8000.
    // Tax at 1000 bps (10%) = 800.
    // Total = 20000 - 4000 + 800 = 16800.
    const result = calculateDocumentTotals(items, 4000, 0, 1000);
    expect(result.subtotalCents).toBe(20000);
    expect(result.discountCents).toBe(4000);
    expect(result.taxableBaseCents).toBe(8000);
    expect(result.taxCents).toBe(800);
    expect(result.totalCents).toBe(16800);
  });

  it('TC-CALC-08: Zero quantity or negative price defense', () => {
    const items = [
      { quantity: -1, unitPriceCents: -500, taxable: false },
    ];

    const result = calculateDocumentTotals(items, 0, 0, 0);
    expect(result.itemTotals[0]).toBe(0);
    expect(result.subtotalCents).toBe(0);
    expect(result.totalCents).toBe(0);
  });
});
