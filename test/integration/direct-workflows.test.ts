import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from '@/services/CustomerService';
import { QuoteService } from '@/services/QuoteService';
import { JobService } from '@/services/JobService';
import { InvoiceService } from '@/services/InvoiceService';
import { AuthService } from '@/services/AuthService';

describe('Direct Plumbing Workflows & In-App Management (test/integration/direct-workflows.test.ts)', () => {
  const mockOrg = {
    id: 'org_direct_001',
    name: "Apex 24/7 Emergency Plumbing",
    currency: 'USD',
    tax_rate_basis_points: 850, // 8.5%
    invoice_terms: 'Due upon receipt',
  };

  const mockUser = {
    id: 'user_plumber_001',
    full_name: 'Frank Miller',
    email: 'frank@apexplumbing.com',
  };

  const mockTech = {
    id: 'user_tech_002',
    full_name: 'Sam Technician',
    email: 'sam@apexplumbing.com',
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

  it('WF-01: Direct Job Scheduling without prior quote conversion', async () => {
    let jobsDb: any[] = [];
    let customersDb: any[] = [
      {
        id: 'c1111111-1111-4111-a111-111111111111',
        organization_id: mockOrg.id,
        first_name: 'Alice',
        last_name: 'Walker',
        email: 'alice@example.com',
        phone: '415-555-0199',
        address_line1: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postal_code: '97477',
      },
    ];

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

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const target = table === 'customers' ? customersDb : jobsDb;
        return {
          select: vi.fn().mockImplementation(() => createQueryBuilder(target)),
          insert: vi.fn().mockImplementation((payload: any) => {
            const items = Array.isArray(payload) ? payload : [payload];
            const inserted = items.map((i) => ({
              ...i,
              id: i.id || `job_${jobsDb.length + 1}`,
              created_at: new Date().toISOString(),
            }));
            jobsDb.push(...inserted);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: inserted[0], error: null }),
              }),
            };
          }),
          update: vi.fn().mockImplementation((payload: any) => ({
            eq: vi.fn().mockImplementation((field: string, val: any) => {
              const idx = jobsDb.findIndex((r) => r[field] === val);
              if (idx >= 0) {
                jobsDb[idx] = { ...jobsDb[idx], ...payload };
              }
              return {
                eq: vi.fn().mockImplementation(() => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: jobsDb[idx], error: null }),
                  }),
                })),
                select: () => ({
                  single: () => Promise.resolve({ data: jobsDb[idx], error: null }),
                }),
              };
            }),
          })),
        };
      }),
      rpc: vi.fn().mockResolvedValue({ data: 'J-2026-0001', error: null }),
    };

    const serverSupabase = await import('@/lib/supabase/server');
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

    // 1. Direct Job Creation
    const job = await JobService.create({
      customer_id: 'c1111111-1111-4111-a111-111111111111',
      title: 'Emergency Pipe Leak Repair',
      description: 'Burst copper pipe in laundry room.',
      assigned_to_user_id: mockTech.id,
      scheduled_start: '2026-09-12T09:00:00Z',
      scheduled_end: '2026-09-12T11:00:00Z',
      address_line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postal_code: '97477',
      internal_notes: 'Turn off main street shutoff if leaking rapidly.',
    });

    expect(job).toBeDefined();
    expect(job.title).toBe('Emergency Pipe Leak Repair');
    expect(job.status).toBe('scheduled');
    expect(job.assigned_to_user_id).toBe(mockTech.id);
    expect(job.job_number).toBe('J-2026-0001');

    // 2. Technician starts job
    const inProgressJob = await JobService.updateStatus(job.id, 'in_progress');
    expect(inProgressJob.status).toBe('in_progress');
    expect(inProgressJob.started_at).toBeDefined();

    // 3. Technician finishes job
    const completedJob = await JobService.updateStatus(
      job.id,
      'completed',
      'Soldered new 3/4" copper pipe section. Water restored with zero leaks.'
    );
    expect(completedJob.status).toBe('completed');
    expect(completedJob.completed_at).toBeDefined();
    expect(completedJob.internal_notes).toContain('Soldered new');
  });

  it('WF-02: In-App Quote Approval with verbal/phone sign-off and decline', async () => {
    let quotesDb: any[] = [];
    let quoteItemsDb: any[] = [];
    let jobsDb: any[] = [];
    let customersDb: any[] = [
      {
        id: 'c1111111-1111-4111-a111-111111111111',
        organization_id: mockOrg.id,
        first_name: 'Alice',
        last_name: 'Walker',
        email: 'alice@example.com',
        phone: '415-555-0199',
      },
    ];

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

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        let target = quotesDb;
        if (table === 'quote_items') target = quoteItemsDb;
        if (table === 'jobs') target = jobsDb;
        if (table === 'customers') target = customersDb;

        return {
          select: vi.fn().mockImplementation(() => createQueryBuilder(target)),
          insert: vi.fn().mockImplementation((payload: any) => {
            const items = Array.isArray(payload) ? payload : [payload];
            const inserted = items.map((i) => ({
              ...i,
              id: i.id || `${table}_${target.length + 1}`,
              created_at: new Date().toISOString(),
            }));
            target.push(...inserted);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: inserted[0], error: null }),
              }),
            };
          }),
          update: vi.fn().mockImplementation((payload: any) => ({
            eq: vi.fn().mockImplementation((field: string, val: any) => {
              const idx = target.findIndex((r) => r[field] === val);
              if (idx >= 0) {
                target[idx] = { ...target[idx], ...payload };
              }
              return {
                eq: vi.fn().mockImplementation(() => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: target[idx], error: null }),
                  }),
                })),
                select: () => ({
                  single: () => Promise.resolve({ data: target[idx], error: null }),
                }),
              };
            }),
          })),
        };
      }),
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (fn === 'fn_next_sequence') return Promise.resolve({ data: 'Q-2026-0005', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
    };

    const serverSupabase = await import('@/lib/supabase/server');
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

    // 1. Create a draft quote
    const quote = await QuoteService.create({
      customer_id: 'c1111111-1111-4111-a111-111111111111',
      issue_date: '2026-09-11',
      expiry_date: '2026-10-11',
      discount_cents: 0,
      items: [
        {
          description: 'Water Heater Replacement 50-Gal Gas',
          quantity: 1,
          unit_price_cents: 165000,
          taxable: true,
        },
      ],
    });

    expect(quote.status).toBe('draft');

    // 2. Plumber receives verbal phone approval and approves in-app
    const approvedQuote = await QuoteService.acceptInternal(
      quote.id,
      'Alice Walker',
      'Verbal / Phone Approval'
    );

    expect(approvedQuote.status).toBe('accepted');
    expect(approvedQuote.accepted_at).toBeDefined();
    expect(approvedQuote.accepted_by_name).toBe('Alice Walker (Verbal / Phone Approval)');

    // 3. Convert accepted quote to active job
    const jobFromQuote = await QuoteService.convertToJob(quote.id);
    expect(jobFromQuote).toBeDefined();
    expect(jobFromQuote.source_quote_id).toBe(quote.id);

    // 4. Test in-app quote rejection for another quote
    const quote2 = await QuoteService.create({
      customer_id: 'c1111111-1111-4111-a111-111111111111',
      issue_date: '2026-09-11',
      expiry_date: '2026-10-11',
      discount_cents: 0,
      items: [{ description: 'Sewer replacement', quantity: 1, unit_price_cents: 800000, taxable: true }],
    });

    const rejectedQuote = await QuoteService.rejectInternal(
      quote2.id,
      'Budget mismatch / price too high'
    );

    expect(rejectedQuote.status).toBe('rejected');
    expect(rejectedQuote.rejected_at).toBeDefined();
    expect(rejectedQuote.rejection_reason).toBe('Budget mismatch / price too high');
  });

  it('WF-03: Direct Invoicing with live calculation and offline payment recording', async () => {
    let invoicesDb: any[] = [];
    let invoiceItemsDb: any[] = [];
    let paymentsDb: any[] = [];

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

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        let target = invoicesDb;
        if (table === 'invoice_items') target = invoiceItemsDb;
        if (table === 'payments') target = paymentsDb;

        return {
          select: vi.fn().mockImplementation(() => createQueryBuilder(target)),
          insert: vi.fn().mockImplementation((payload: any) => {
            const items = Array.isArray(payload) ? payload : [payload];
            const inserted = items.map((i) => ({
              ...i,
              id: i.id || `${table}_${target.length + 1}`,
              created_at: new Date().toISOString(),
            }));
            target.push(...inserted);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: inserted[0], error: null }),
              }),
            };
          }),
          update: vi.fn().mockImplementation((payload: any) => ({
            eq: vi.fn().mockImplementation((field: string, val: any) => {
              const idx = target.findIndex((r) => r[field] === val);
              if (idx >= 0) {
                target[idx] = { ...target[idx], ...payload };
              }
              return {
                eq: vi.fn().mockImplementation(() => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: target[idx], error: null }),
                  }),
                })),
                select: () => ({
                  single: () => Promise.resolve({ data: target[idx], error: null }),
                }),
              };
            }),
          })),
        };
      }),
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (fn === 'fn_next_sequence') return Promise.resolve({ data: 'INV-2026-0001', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
    };

    const serverSupabase = await import('@/lib/supabase/server');
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

    // 1. Direct Invoice Generation: $185.00 drain snaking + $25.00 parts - $10.00 discount
    const invoice = await InvoiceService.create({
      customer_id: 'c1111111-1111-4111-a111-111111111111',
      issue_date: '2026-09-11',
      due_date: '2026-09-25',
      discount_cents: 1000, // $10.00 discount
      items: [
        {
          description: 'Motorized Drain Snaking',
          quantity: 1,
          unit_price_cents: 18500, // $185.00
          taxable: false,
        },
        {
          description: 'PVC Cleanout Plug & Sealant',
          quantity: 1,
          unit_price_cents: 2500, // $25.00
          taxable: true,
        },
      ],
    });

    // Subtotal: 18500 + 2500 = 21000 ($210.00)
    // Discount: 1000 ($10.00)
    // Prorated discount on taxable base: 1000 * (2500 / 21000) = 119
    // Taxable base: 2500 - 119 = 2381; Tax: 2381 * 8.5% = 202.38 -> 202 cents ($2.02)
    // Total = 21000 - 1000 + 202 = 20202 cents ($202.02)
    expect(invoice.subtotal_cents).toBe(21000);
    expect(invoice.discount_cents).toBe(1000);
    expect(invoice.total_cents).toBe(20202);
    expect(invoice.balance_due_cents).toBe(20202);
    expect(invoice.status).toBe('draft');

    // 2. Send invoice
    const sentInvoice = await InvoiceService.send(invoice.id);
    expect(sentInvoice.status).toBe('sent');

    // 3. Record payment in full via check
    const paymentResult = await InvoiceService.recordPayment(invoice.id, {
      amount_cents: 20202,
      payment_date: '2026-09-11',
      payment_method: 'check',
      reference_number: 'CHK-9942',
      notes: 'Received paper check upon completion',
    });

    expect(paymentResult.invoice.status).toBe('paid');
    expect(paymentResult.invoice.amount_paid_cents).toBe(20202);
    expect(paymentResult.invoice.balance_due_cents).toBe(0);
  });
});
