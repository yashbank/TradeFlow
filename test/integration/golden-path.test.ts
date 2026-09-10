import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from '@/services/CustomerService';
import { QuoteService } from '@/services/QuoteService';
import { JobService } from '@/services/JobService';
import { InvoiceService } from '@/services/InvoiceService';
import { DashboardService } from '@/services/DashboardService';
import { AuthService } from '@/services/AuthService';
import * as serverSupabase from '@/lib/supabase/server';
import * as adminSupabase from '@/lib/supabase/admin';

describe('End-to-End Critical Golden Path (test/integration/golden-path.test.ts)', () => {
  const mockOrg = {
    id: 'org_gold_001',
    name: "Dave's Fast Plumbing",
    currency: 'USD',
    tax_rate_basis_points: 825, // 8.25%
    invoice_terms: 'Due on completion',
  };

  const mockUser = {
    id: 'user_dave_001',
    full_name: 'Dave Miller',
    email: 'dave@davesplumbing.com',
  };

  beforeEach(() => {
    vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
      user: mockUser as any,
      organization: mockOrg as any,
      role: 'owner',
    });

    vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
      user: mockUser as any,
      organization: mockOrg as any,
      role: 'owner',
    });
  });

  it('Executes complete lifecycle: Customer -> Quote -> Accept -> Job -> Invoice -> Payment -> Dashboard', async () => {
    // In-memory mock database state for this tenant
    let customersDb: any[] = [];
    let quotesDb: any[] = [];
    let quoteItemsDb: any[] = [];
    let jobsDb: any[] = [];
    let invoicesDb: any[] = [];
    let invoiceItemsDb: any[] = [];
    let paymentsDb: any[] = [];

    const getTableDb = (table: string) => {
      if (table === 'customers') return customersDb;
      if (table === 'quotes') return quotesDb;
      if (table === 'quote_items') return quoteItemsDb;
      if (table === 'jobs') return jobsDb;
      if (table === 'invoices') return invoicesDb;
      if (table === 'invoice_items') return invoiceItemsDb;
      return paymentsDb;
    };

    const createQueryBuilder = (currentData: any[]) => {
      const builder: any = {
        data: currentData,
        eq: vi.fn().mockImplementation((f: string, v: any) => {
          const nextData = currentData.filter((r) => r[f] === v);
          return createQueryBuilder(nextData);
        }),
        order: vi.fn().mockImplementation(() => createQueryBuilder(currentData)),
        range: vi.fn().mockImplementation((start: number, end: number) =>
          Promise.resolve({ data: currentData.slice(start, end + 1), count: currentData.length, error: null })
        ),
        in: vi.fn().mockImplementation((f: string, vals: any[]) => {
          const nextData = currentData.filter((r) => vals.includes(r[f]));
          return createQueryBuilder(nextData);
        }),
        gte: vi.fn().mockImplementation((f: string, v: any) => {
          const nextData = currentData.filter((r) => r[f] >= v);
          const b: any = createQueryBuilder(nextData);
          b.lte = vi.fn().mockResolvedValue({ count: nextData.length, data: nextData });
          return b;
        }),
        single: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: currentData[0] || null, error: null })
        ),
        maybeSingle: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: currentData[0] || null, error: null })
        ),
        then: (resolve: any) => resolve({ data: currentData, count: currentData.length, error: null }),
      };
      return builder;
    };

    // Mock Supabase Server Client
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const target = getTableDb(table);

        return {
          select: vi.fn().mockImplementation((cols?: string, opts?: any) => createQueryBuilder(target)),
          insert: vi.fn().mockImplementation((payload: any) => {
            const items = Array.isArray(payload) ? payload : [payload];
            const inserted = items.map((item) => ({
              id: item.id || `id_${Math.random().toString(36).substring(2, 9)}`,
              created_at: new Date().toISOString(),
              ...item,
            }));
            target.push(...inserted);

            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: inserted[0], error: null }),
              }),
            };
          }),
          update: vi.fn().mockImplementation((updates: any) => {
            let lastItem: any = null;
            const chain: any = {
              eq: vi.fn().mockImplementation((field: string, val: any) => {
                const idx = target.findIndex((r) => r[field] === val);
                if (idx !== -1) {
                  target[idx] = { ...target[idx], ...updates };
                  lastItem = target[idx];
                }
                return chain;
              }),
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() =>
                  Promise.resolve({ data: lastItem, error: null })
                ),
              }),
            };
            return chain;
          }),
        };
      }),
      rpc: vi.fn().mockImplementation((fn: string, args: any) => {
        if (fn === 'fn_next_sequence') {
          const type = args.p_entity_type;
          const prefix = type === 'quote' ? 'Q' : type === 'job' ? 'J' : 'INV';
          return Promise.resolve({ data: `${prefix}-2026-0001`, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);
    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockSupabase as any);

    // 1. Add Customer
    const customer = await CustomerService.create({
      first_name: 'Sarah',
      last_name: 'Jenkins',
      phone: '5550192834',
      address_line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      postal_code: '62704',
      country: 'US',
    });

    expect(customer.id).toBeDefined();
    expect(customer.first_name).toBe('Sarah');

    // 2. Create Quote with line items (Water Heater $1,450.00, Labor 3.5 hrs @ $110.00 = $385.00)
    // Subtotal: 183500 cents. Tax (8.25%): 15139 cents. Total: 198639 cents ($1,986.39)
    const quote = await QuoteService.create({
      customer_id: customer.id,
      issue_date: '2026-09-10',
      expiry_date: '2026-10-10',
      discount_cents: 0,
      items: [
        { description: '50-Gal Rheem Water Heater', quantity: 1, unit_price_cents: 145000, taxable: true },
        { description: 'Plumbing Labor', quantity: 3.5, unit_price_cents: 11000, taxable: true },
      ],
    });

    expect(quote.quote_number).toBe('Q-2026-0001');
    expect(quote.status).toBe('draft');
    expect(quote.subtotal_cents).toBe(183500);
    expect(quote.tax_cents).toBe(15139);
    expect(quote.total_cents).toBe(198639);
    expect(quote.public_token).toBeDefined();

    // 3. Send Quote
    const sentQuote = await QuoteService.send(quote.id);
    expect(sentQuote.status).toBe('sent');

    // 4. Customer accepts via public token
    const acceptRes = await QuoteService.respondPublic(quote.public_token, {
      action: 'accept',
      signer_name: 'Sarah Jenkins',
    });
    expect(acceptRes.success).toBe(true);

    // 5. Convert Quote to Job
    const job = await QuoteService.convertToJob(quote.id);
    expect(job.job_number).toBe('J-2026-0001');
    expect(job.status).toBe('scheduled');
    expect(job.customer_id).toBe(customer.id);

    // 6. Start and Complete Job
    const startedJob = await JobService.updateStatus(job.id, 'in_progress');
    expect(startedJob.status).toBe('in_progress');

    const completedJob = await JobService.updateStatus(
      job.id,
      'completed',
      'Installation complete, pressure normal.'
    );
    expect(completedJob.status).toBe('completed');

    // 7. Convert Completed Job to Invoice
    const invoice = await InvoiceService.convertFromJob(job.id);
    expect(invoice.invoice_number).toBe('INV-2026-0001');
    expect(invoice.status).toBe('draft');
    expect(invoice.total_cents).toBe(198639);
    expect(invoice.balance_due_cents).toBe(198639);
    expect(invoice.amount_paid_cents).toBe(0);

    // 8. Send Invoice
    const sentInvoice = await InvoiceService.send(invoice.id);
    expect(sentInvoice.status).toBe('sent');

    // 9. Record Full Offline Payment ($1,986.39 via Credit Card)
    const paymentRes = await InvoiceService.recordPayment(invoice.id, {
      amount_cents: 198639,
      payment_date: '2026-09-10',
      payment_method: 'credit_card',
      reference_number: 'TXN-991823',
    });

    expect(paymentRes.payment.amount_cents).toBe(198639);
    expect(paymentRes.invoice.status).toBe('paid');
    expect(paymentRes.invoice.balance_due_cents).toBe(0);
    expect(paymentRes.invoice.amount_paid_cents).toBe(198639);

    // 10. Dashboard Reflects Revenue & Win Rate
    const metrics = await DashboardService.getMetrics();
    expect(metrics.revenueMtdCents).toBe(198639);
    expect(metrics.outstandingReceivablesCents).toBe(0);
    expect(metrics.quoteWinRatePercentage).toBe(100);
  });
});
