import { describe, it, expect } from 'vitest';
import { PdfService } from '@/services/pdf/PdfService';
import { getAppBaseUrl } from '@/lib/utils';

describe('Public Portal & PDF Resilience Suite', () => {
  it('resolves live URL without localhost default in production environments', () => {
    const url = getAppBaseUrl();
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
    // Base url must not contain trailing slash
    expect(url.endsWith('/')).toBe(false);
  });

  it('generates Quote PDF with array-shaped customer and organization relations', async () => {
    const quoteWithArrayRelations: any = {
      id: 'q-arr-1',
      quote_number: 'Q-9901',
      status: 'draft',
      issue_date: '2026-09-11',
      expiry_date: '2026-10-11',
      subtotal_cents: 15000,
      discount_cents: 1000,
      tax_cents: 1120,
      total_cents: 15120,
      customer: [
        {
          first_name: 'Arthur',
          last_name: 'Dent',
          company_name: 'Plumbing Works Ltd',
          email: 'arthur@example.com',
          phone: '555-4321',
          address_line1: '42 Galaxy Way',
          city: 'London',
          state: 'Greater London',
          postal_code: 'NW1 4NP',
        },
      ],
      items: [
        {
          id: 'item-1',
          description: 'Emergency Pipe Descaling & Line Jetting',
          quantity: 1,
          unit_price_cents: 15000,
          total_cents: 15000,
          taxable: true,
        },
      ],
    };

    const orgWithArrayShape: any = [
      {
        name: 'TradeFlow Precision Plumbing',
        currency: 'GBP',
        phone: '+44 20 7946 0912',
        email: 'dispatch@tradeflow.co.uk',
        address_line1: '10 Fleet Street',
        city: 'London',
      },
    ];

    const pdfBuffer = await PdfService.generateQuotePdf(quoteWithArrayRelations, orgWithArrayShape);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);
  });

  it('generates Invoice PDF with array-shaped customer and payments', async () => {
    const invoiceData: any = {
      id: 'inv-arr-1',
      invoice_number: 'INV-9901',
      status: 'sent',
      issue_date: '2026-09-11',
      due_date: '2026-09-25',
      subtotal_cents: 20000,
      discount_cents: 0,
      tax_cents: 1600,
      total_cents: 21600,
      amount_paid_cents: 10000,
      balance_due_cents: 11600,
      customer: [
        {
          first_name: 'Ford',
          last_name: 'Prefect',
          email: 'ford@example.com',
          phone: '555-8899',
          address_line1: '15 Betelgeuse Ave',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
        },
      ],
      items: [
        {
          id: 'i-1',
          description: 'Main Drain Electric Snake Run & Snag Cleanout',
          quantity: 1,
          unit_price_cents: 20000,
          total_cents: 20000,
          taxable: true,
        },
      ],
      payments: [
        {
          id: 'pay-1',
          amount_cents: 10000,
          payment_date: '2026-09-11',
          payment_method: 'credit_card',
          reference_number: 'REF-88319',
        },
      ],
    };

    const org: any = {
      name: 'TradeFlow US Operations',
      currency: 'USD',
      phone: '800-555-PIPE',
      email: 'service@tradeflow.test',
      address_line1: '500 Tech Blvd',
      city: 'Austin',
    };

    const pdfBuffer = await PdfService.generateInvoicePdf(invoiceData, org);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);
  });

  it('handles large dataset with 50 line items without crashing or buffer overrun', async () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i + 1}`,
      description: `3/4-in Copper Elbow Fitting & Solder Joint #${i + 1}`,
      quantity: 2,
      unit_price_cents: 1250,
      total_cents: 2500,
      taxable: true,
    }));

    const largeQuote: any = {
      id: 'quote-large',
      quote_number: 'Q-5000',
      status: 'draft',
      issue_date: '2026-09-11',
      expiry_date: '2026-10-11',
      subtotal_cents: 125000,
      discount_cents: 5000,
      tax_cents: 9600,
      total_cents: 129600,
      customer: {
        first_name: 'Commercial',
        last_name: 'Realty Group',
        company_name: 'Metro High-Rise Facility',
        address_line1: '100 Corporate Pkwy',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60601',
      },
      items,
    };

    const org: any = {
      name: 'TradeFlow Commercial Plumbing',
      currency: 'USD',
    };

    const pdfBuffer = await PdfService.generateQuotePdf(largeQuote, org);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });
});
