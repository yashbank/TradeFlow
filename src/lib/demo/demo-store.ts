// ==============================================================================
// src/lib/demo/demo-store.ts — Zero-Setup In-Memory Demo Data Store
// ==============================================================================

import type { Customer, Quote, Job, Invoice, Payment, Organization, UserProfile, QuoteItem, InvoiceItem } from '@/types/database';

export const DEMO_USER: UserProfile = {
  id: 'demo-user-001',
  full_name: 'Dave Miller (Master Plumber)',
  email: 'demo@tradeflow.app',
  phone: '+1 (555) 019-2834',
  avatar_url: null,
  created_at: '2026-01-01T08:00:00Z',
  updated_at: '2026-01-01T08:00:00Z',
};

export const DEMO_ORGANIZATION: Organization = {
  id: 'demo-org-001',
  name: "Dave's Fast Plumbing & Heating",
  slug: 'daves-fast-plumbing',
  email: 'service@davesfastplumbing.com',
  phone: '+1 (555) 019-2834',
  address_line1: '742 Evergreen Terrace',
  address_line2: 'Suite 101',
  city: 'Springfield',
  state: 'IL',
  postal_code: '62704',
  country: 'US',
  currency: 'USD',
  timezone: 'America/Chicago',
  tax_rate_basis_points: 825, // 8.25%
  invoice_terms: 'Payment due within 14 days of job completion. Thank you for your business!',
  logo_url: null,
  created_at: '2026-01-01T08:00:00Z',
  updated_at: '2026-01-01T08:00:00Z',
};

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'demo-cust-001',
    organization_id: 'demo-org-001',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    company_name: 'Jenkins Real Estate',
    email: 'sarah.jenkins@example.com',
    phone: '+1 (555) 234-5678',
    address_line1: '104 Willow Creek Road',
    address_line2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62704',
    country: 'US',
    notes: 'Gate code #4412. Prefers calls before arrival.',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'demo-cust-002',
    organization_id: 'demo-org-001',
    first_name: 'Robert',
    last_name: 'Vance',
    company_name: 'Vance Refrigeration & Deli',
    email: 'bob.vance@vancerefrig.com',
    phone: '+1 (555) 987-6543',
    address_line1: '400 Industrial Blvd',
    address_line2: 'Loading Bay 2',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62703',
    country: 'US',
    notes: 'Commercial kitchen grease trap and heavy drain clearing.',
    created_at: '2026-08-20T14:30:00Z',
    updated_at: '2026-08-20T14:30:00Z',
  },
  {
    id: 'demo-cust-003',
    organization_id: 'demo-org-001',
    first_name: 'Maria',
    last_name: 'Gonzalez',
    company_name: null,
    email: 'maria.g@example.com',
    phone: '+1 (555) 345-6789',
    address_line1: '882 Birchwood Lane',
    address_line2: null,
    city: 'Springfield',
    state: 'IL',
    postal_code: '62702',
    country: 'US',
    notes: 'Main line pipe inspection requested.',
    created_at: '2026-09-01T09:15:00Z',
    updated_at: '2026-09-01T09:15:00Z',
  },
];

export const DEMO_QUOTES: (Quote & { items: QuoteItem[]; customer: Customer })[] = [
  {
    id: 'demo-quote-001',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-001',
    quote_number: 'Q-2026-0001',
    status: 'accepted',
    issue_date: '2026-09-05',
    expiry_date: '2026-10-05',
    subtotal_cents: 183500, // $1,835.00
    tax_cents: 15139,
    discount_cents: 0,
    total_cents: 198639, // $1,986.39
    notes: 'Full 50-gallon water heater replacement with expansion tank.',
    terms: 'Valid for 30 days',
    public_token: 'demo-quote-token-001',
    sent_at: '2026-09-05T09:30:00Z',
    accepted_at: '2026-09-06T11:20:00Z',
    accepted_by_name: 'Sarah Jenkins',
    accepted_ip: '127.0.0.1',
    rejected_at: null,
    rejection_reason: null,
    created_by: 'demo-user-001',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-06T11:20:00Z',
    customer: DEMO_CUSTOMERS[0],
    items: [
      {
        id: 'demo-qitem-001',
        organization_id: 'demo-org-001',
        quote_id: 'demo-quote-001',
        description: '50-Gal Rheem Commercial-Grade Water Heater',
        quantity: 1,
        unit_price_cents: 145000,
        total_cents: 145000,
        taxable: true,
        sort_order: 0,
        created_at: '2026-09-05T09:00:00Z',
      },
      {
        id: 'demo-qitem-002',
        organization_id: 'demo-org-001',
        quote_id: 'demo-quote-001',
        description: 'Master Plumber Installation & Code Compliance Labor',
        quantity: 3.5,
        unit_price_cents: 11000,
        total_cents: 38500,
        taxable: true,
        sort_order: 1,
        created_at: '2026-09-05T09:00:00Z',
      },
    ],
  },
  {
    id: 'demo-quote-002',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-002',
    quote_number: 'Q-2026-0002',
    status: 'sent',
    issue_date: '2026-09-08',
    expiry_date: '2026-10-08',
    subtotal_cents: 45000,
    tax_cents: 3713,
    discount_cents: 0,
    total_cents: 48713,
    notes: 'Hydro-jet commercial kitchen main drain stack.',
    terms: 'Payment due on completion',
    public_token: 'demo-quote-token-002',
    sent_at: '2026-09-08T14:05:00Z',
    accepted_at: null,
    accepted_by_name: null,
    accepted_ip: null,
    rejected_at: null,
    rejection_reason: null,
    created_by: 'demo-user-001',
    created_at: '2026-09-08T14:00:00Z',
    updated_at: '2026-09-08T14:00:00Z',
    customer: DEMO_CUSTOMERS[1],
    items: [
      {
        id: 'demo-qitem-003',
        organization_id: 'demo-org-001',
        quote_id: 'demo-quote-002',
        description: 'High-Pressure Hydro-Jetting Service (Commercial)',
        quantity: 1,
        unit_price_cents: 45000,
        total_cents: 45000,
        taxable: true,
        sort_order: 0,
        created_at: '2026-09-08T14:00:00Z',
      },
    ],
  },
];

export const DEMO_JOBS: (Job & { customer: Customer })[] = [
  {
    id: 'demo-job-001',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-001',
    source_quote_id: 'demo-quote-001',
    job_number: 'J-2026-0001',
    title: '50-Gal Rheem Water Heater Replacement',
    description: 'Replace leaking unit, install thermal expansion tank and new brass ball shutoff valve.',
    status: 'completed',
    scheduled_start: '2026-09-07T09:00:00Z',
    scheduled_end: '2026-09-07T13:00:00Z',
    assigned_to_user_id: 'demo-user-001',
    address_line1: '104 Willow Creek Road',
    address_line2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62704',
    internal_notes: 'System installed, pressure tested at 55 PSI. No leaks. Cleaned job site.',
    started_at: '2026-09-07T09:10:00Z',
    completed_at: '2026-09-07T12:45:00Z',
    created_by: 'demo-user-001',
    created_at: '2026-09-06T11:25:00Z',
    updated_at: '2026-09-07T12:45:00Z',
    customer: DEMO_CUSTOMERS[0],
  },
  {
    id: 'demo-job-002',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-002',
    source_quote_id: null,
    job_number: 'J-2026-0002',
    title: 'Emergency Commercial Grease Trap Snaking',
    description: 'Backing up into commercial wash basins. Urgent clearing required.',
    status: 'in_progress',
    scheduled_start: new Date().toISOString(),
    scheduled_end: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    assigned_to_user_id: 'demo-user-001',
    address_line1: '400 Industrial Blvd',
    address_line2: 'Loading Bay 2',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62703',
    internal_notes: null,
    started_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    completed_at: null,
    created_by: 'demo-user-001',
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    customer: DEMO_CUSTOMERS[1],
  },
  {
    id: 'demo-job-003',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-003',
    source_quote_id: null,
    job_number: 'J-2026-0003',
    title: 'Whole-Home Main Line Camera Inspection',
    description: 'Video pipeline diagnostics to locate root intrusion.',
    status: 'scheduled',
    scheduled_start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    assigned_to_user_id: 'demo-user-001',
    address_line1: '882 Birchwood Lane',
    address_line2: null,
    city: 'Springfield',
    state: 'IL',
    postal_code: '62702',
    internal_notes: null,
    started_at: null,
    completed_at: null,
    created_by: 'demo-user-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: DEMO_CUSTOMERS[2],
  },
];

export const DEMO_INVOICES: (Invoice & { items: InvoiceItem[]; payments: Payment[]; customer: Customer; job?: Job })[] = [
  {
    id: 'demo-inv-001',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-001',
    source_job_id: 'demo-job-001',
    source_quote_id: 'demo-quote-001',
    invoice_number: 'INV-2026-0001',
    status: 'paid',
    issue_date: '2026-09-07',
    due_date: '2026-09-21',
    subtotal_cents: 183500,
    tax_cents: 15139,
    discount_cents: 0,
    total_cents: 198639, // $1,986.39
    amount_paid_cents: 198639,
    balance_due_cents: 0,
    notes: 'Thank you for your business!',
    terms: 'Due on completion',
    public_token: 'demo-inv-token-001',
    sent_at: '2026-09-07T13:00:00Z',
    paid_at: '2026-09-07T13:30:00Z',
    voided_at: null,
    created_by: 'demo-user-001',
    created_at: '2026-09-07T13:00:00Z',
    updated_at: '2026-09-07T13:30:00Z',
    customer: DEMO_CUSTOMERS[0],
    job: DEMO_JOBS[0],
    items: [
      {
        id: 'demo-invitem-001',
        organization_id: 'demo-org-001',
        invoice_id: 'demo-inv-001',
        description: '50-Gal Rheem Commercial-Grade Water Heater',
        quantity: 1,
        unit_price_cents: 145000,
        total_cents: 145000,
        taxable: true,
        sort_order: 0,
        created_at: '2026-09-07T13:00:00Z',
      },
      {
        id: 'demo-invitem-002',
        organization_id: 'demo-org-001',
        invoice_id: 'demo-inv-001',
        description: 'Master Plumber Installation & Code Compliance Labor',
        quantity: 3.5,
        unit_price_cents: 11000,
        total_cents: 38500,
        taxable: true,
        sort_order: 1,
        created_at: '2026-09-07T13:00:00Z',
      },
    ],
    payments: [
      {
        id: 'demo-pay-001',
        organization_id: 'demo-org-001',
        invoice_id: 'demo-inv-001',
        amount_cents: 198639,
        payment_date: '2026-09-07',
        payment_method: 'credit_card',
        reference_number: 'TXN-991823',
        notes: 'Card terminal on-site',
        recorded_by: 'demo-user-001',
        created_at: '2026-09-07T13:30:00Z',
      },
    ],
  },
  {
    id: 'demo-inv-002',
    organization_id: 'demo-org-001',
    customer_id: 'demo-cust-002',
    source_job_id: null,
    source_quote_id: null,
    invoice_number: 'INV-2026-0002',
    status: 'sent',
    issue_date: '2026-09-08',
    due_date: '2026-09-22',
    subtotal_cents: 45000,
    tax_cents: 3713,
    discount_cents: 0,
    total_cents: 48713,
    amount_paid_cents: 0,
    balance_due_cents: 48713,
    notes: 'Commercial drain service',
    terms: 'Net 14',
    public_token: 'demo-inv-token-002',
    sent_at: '2026-09-08T15:00:00Z',
    paid_at: null,
    voided_at: null,
    created_by: 'demo-user-001',
    created_at: '2026-09-08T15:00:00Z',
    updated_at: '2026-09-08T15:00:00Z',
    customer: DEMO_CUSTOMERS[1],
    items: [
      {
        id: 'demo-invitem-003',
        organization_id: 'demo-org-001',
        invoice_id: 'demo-inv-002',
        description: 'High-Pressure Hydro-Jetting Service (Commercial)',
        quantity: 1,
        unit_price_cents: 45000,
        total_cents: 45000,
        taxable: true,
        sort_order: 0,
        created_at: '2026-09-08T15:00:00Z',
      },
    ],
    payments: [],
  },
];

// Interactive state store in memory
class DemoStoreClass {
  customers = [...DEMO_CUSTOMERS];
  quotes = [...DEMO_QUOTES];
  jobs = [...DEMO_JOBS];
  invoices = [...DEMO_INVOICES];

  addCustomer(c: Omit<Customer, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Customer {
    const newCustomer: Customer = {
      ...c,
      id: `demo-cust-${Date.now()}`,
      organization_id: 'demo-org-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    return newCustomer;
  }

  addQuote(quoteData: any, items: any[]): any {
    const cust = this.customers.find((c) => c.id === quoteData.customer_id) || this.customers[0];
    const newQuoteNumber = `Q-2026-${String(this.quotes.length + 1).padStart(4, '0')}`;
    const newQuote: any = {
      ...quoteData,
      id: `demo-quote-${Date.now()}`,
      organization_id: 'demo-org-001',
      quote_number: newQuoteNumber,
      status: 'draft',
      public_token: `demo-token-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: cust,
      items: items.map((it, idx) => ({
        ...it,
        id: `demo-qitem-${Date.now()}-${idx}`,
        organization_id: 'demo-org-001',
        total_cents: Number(it.quantity) * Number(it.unit_price_cents),
        sort_order: idx,
        created_at: new Date().toISOString(),
      })),
    };
    this.quotes.unshift(newQuote);
    return newQuote;
  }

  updateJobStatus(jobId: string, status: any, internalNotes?: string): Job {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error('Job not found');
    job.status = status;
    if (internalNotes) job.internal_notes = internalNotes;
    if (status === 'completed') job.completed_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();
    return job;
  }

  recordPayment(invoiceId: string, paymentData: any): any {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    const payment: Payment = {
      id: `demo-pay-${Date.now()}`,
      organization_id: 'demo-org-001',
      invoice_id: invoiceId,
      amount_cents: paymentData.amount_cents,
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      reference_number: paymentData.reference_number || null,
      notes: paymentData.notes || null,
      recorded_by: 'demo-user-001',
      created_at: new Date().toISOString(),
    };
    invoice.payments = invoice.payments || [];
    invoice.payments.push(payment);
    invoice.amount_paid_cents += paymentData.amount_cents;
    invoice.balance_due_cents = Math.max(0, invoice.total_cents - invoice.amount_paid_cents);
    if (invoice.balance_due_cents === 0) {
      invoice.status = 'paid';
    }
    invoice.updated_at = new Date().toISOString();
    return { invoice, payment };
  }
}

// Global singleton for Next.js dev server lifecycle
const globalForDemo = globalThis as unknown as { demoStore?: DemoStoreClass };
export const DemoStore = globalForDemo.demoStore ?? new DemoStoreClass();
if (process.env.NODE_ENV !== 'production') globalForDemo.demoStore = DemoStore;
