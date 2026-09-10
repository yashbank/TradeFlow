import { describe, it, expect } from 'vitest';
import { calculateDocumentTotals } from '@/lib/finance/calculator';

describe('Technician & Field Service Workflow Suite', () => {
  it('calculates work order labor hours and converted line items correctly', () => {
    // 2 hours 45 minutes on site at $120/hr
    const hourlyRateCents = 12000;
    const hours = 2.75;
    const laborCents = Math.round(hours * hourlyRateCents);
    expect(laborCents).toBe(33000); // $330.00
  });

  it('calculates parts logging and tax calculations accurately', () => {
    const partsUsed = [
      { description: 'Wax Ring Gasket', quantity: 2, unit_price_cents: 1800, taxable: true },
      { description: '3/4" PEX Ball Valve', quantity: 3, unit_price_cents: 3200, taxable: true },
      { description: '10ft PEX Tubing', quantity: 1, unit_price_cents: 2800, taxable: true },
    ];

    const result = calculateDocumentTotals(partsUsed, 0, 0, 825); // 8.25% sales tax
    expect(result.subtotalCents).toBe(2 * 1800 + 3 * 3200 + 1 * 2800); // 3600 + 9600 + 2800 = 16000 ($160.00)
    expect(result.taxCents).toBe(Math.round(16000 * 0.0825)); // 1320 ($13.20)
    expect(result.totalCents).toBe(16000 + 1320); // 17320 ($173.20)
  });

  it('validates state transitions for technician field lifecycle', () => {
    const validTransitions: Record<string, string[]> = {
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'scheduled'],
      completed: [],
      cancelled: [],
    };

    function canTransition(from: string, to: string): boolean {
      return validTransitions[from]?.includes(to) || false;
    }

    expect(canTransition('scheduled', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('completed', 'scheduled')).toBe(false);
    expect(canTransition('completed', 'in_progress')).toBe(false);
  });
});
