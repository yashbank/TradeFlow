import { describe, it, expect } from 'vitest';
import { PdfService } from '@/services/pdf/PdfService';

describe('PDF Generation Test (test/unit/pdf.test.ts)', () => {
  const mockQuote: any = {
    id: 'q-1',
    quote_number: 'Q-1001',
    issue_date: '2026-09-10',
    expiry_date: '2026-10-10',
    subtotal_cents: 10000,
    discount_cents: 1000,
    tax_cents: 500,
    total_cents: 9500,
    status: 'draft',
    customer: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address_line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
    },
    items: [
      {
        id: 'i-1',
        description: 'Plumbing Repair',
        quantity: 2,
        unit_price_cents: 5000,
        total_cents: 10000,
      },
    ],
  };

  const mockOrg: any = {
    name: 'TradeFlow Plumbing',
    currency: 'USD',
    phone: '555-0100',
    email: 'info@tradeflow.test',
  };

  it('generates Quote PDF without error', async () => {
    const buffer = await PdfService.generateQuotePdf(mockQuote, mockOrg);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('generates Invoice PDF without error', async () => {
    const mockInvoice: any = {
      id: 'inv-1',
      invoice_number: 'INV-2001',
      issue_date: '2026-09-10',
      due_date: '2026-10-10',
      subtotal_cents: 10000,
      discount_cents: 0,
      tax_cents: 500,
      total_cents: 10500,
      amount_paid_cents: 0,
      balance_due_cents: 10500,
      status: 'sent',
      customer: mockQuote.customer,
      items: mockQuote.items,
    };

    const buffer = await PdfService.generateInvoicePdf(mockInvoice, mockOrg);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);
  });
});
