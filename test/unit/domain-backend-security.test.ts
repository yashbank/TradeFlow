import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ==============================================================================
// Next.js & Server Environment Mocks
// ==============================================================================
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('next/headers', () => {
  const mockHeaders = {
    get: vi.fn((name: string) => {
      if (name.toLowerCase() === 'x-forwarded-for') return '198.51.100.42';
      if (name.toLowerCase() === 'host') return 'localhost:3000';
      return null;
    }),
  };
  const mockCookies = {
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  };
  return {
    headers: vi.fn().mockResolvedValue(mockHeaders),
    cookies: vi.fn().mockResolvedValue(mockCookies),
  };
});

vi.mock('@/services/NotificationService', () => ({
  NotificationService: {
    sendQuoteEmail: vi.fn().mockResolvedValue({ success: true }),
    sendInvoiceEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentReceiptEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('@/services/pdf/PdfService', () => ({
  PdfService: {
    generateQuotePdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Mock Quote PDF Content')),
    generateInvoicePdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Mock Invoice PDF Content')),
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test_session_url' }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test_portal_url' }),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// ==============================================================================
// Domain Services, Actions, and Validators Imports
// ==============================================================================
import { AuthService } from '@/services/AuthService';
import { JobService } from '@/services/JobService';
import { QuoteService } from '@/services/QuoteService';
import { InvoiceService } from '@/services/InvoiceService';
import { CustomerService } from '@/services/CustomerService';
import { DashboardService } from '@/services/DashboardService';
import { BillingService } from '@/services/BillingService';

import { createJobAction, updateJobStatusAction, convertJobToInvoiceAction } from '@/actions/jobs';
import { createQuoteAction, sendQuoteAction, convertQuoteToJobAction, approveQuoteAction, rejectQuoteAction } from '@/actions/quotes';
import { createInvoiceAction, sendInvoiceAction, voidInvoiceAction, recordPaymentAction } from '@/actions/invoices';
import { createCustomerAction, updateCustomerAction, deleteCustomerAction } from '@/actions/customers';
import { createTechnicianAction, listTechniciansAction, deleteTechnicianAction } from '@/actions/technicians';
import { updateOrganizationAction } from '@/actions/organization';
import { respondToQuotePublicAction } from '@/actions/public-quotes';

import { GET as healthGet } from '@/app/api/health/route';
import { GET as quotePdfGet } from '@/app/api/quotes/[id]/pdf/route';
import { GET as invoicePdfGet } from '@/app/api/invoices/[id]/pdf/route';
import { POST as stripeWebhookPost } from '@/app/api/webhooks/stripe/route';

import * as serverSupabase from '@/lib/supabase/server';
import * as adminSupabase from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { headers, cookies } from 'next/headers';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { transitionQuoteStatus, transitionJobStatus, transitionInvoiceStatus, transitionSubscriptionStatus } from '@/lib/state/machines';
import { CreateQuoteSchema } from '@/lib/validations/quote';
import { CreateInvoiceSchema } from '@/lib/validations/invoice';

// ==============================================================================
// Shared Fixtures
// ==============================================================================
const mockOrg = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Acme Apex Plumbing',
  slug: 'acme-apex-plumbing',
  currency: 'USD',
  tax_rate_basis_points: 825, // 8.25%
  invoice_terms: 'Due upon receipt',
};

const mockOwner = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'owner@acme.com',
  full_name: 'Alice Owner',
};

const mockAdmin = {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'admin@acme.com',
  full_name: 'Bob Admin',
};

const mockTech = {
  id: '44444444-4444-4444-4444-444444444444',
  email: 'tech@acme.com',
  full_name: 'Charlie Tech',
};

const otherOrg = {
  id: '99999999-9999-9999-9999-999999999999',
  name: 'Rival Trade Services',
  slug: 'rival-trade-services',
  currency: 'USD',
  tax_rate_basis_points: 0,
};

const validCustomerId = '55555555-5555-5555-5555-555555555555';
const validQuoteId = '66666666-6666-6666-6666-666666666666';
const validJobId = '77777777-7777-7777-7777-777777777777';
const validInvoiceId = '88888888-8888-8888-8888-888888888888';

describe('Domain Backend & Security Architecture Audit Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockHeaders = {
      get: vi.fn((name: string) => {
        if (name.toLowerCase() === 'x-forwarded-for') return '198.51.100.42';
        if (name.toLowerCase() === 'host') return 'localhost:3000';
        return null;
      }),
    };
    const mockCookies = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    };

    (headers as any).mockResolvedValue(mockHeaders);
    (cookies as any).mockResolvedValue(mockCookies);

    (stripe.checkout.sessions.create as any) = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test_session_url' });
    (stripe.billingPortal.sessions.create as any) = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test_portal_url' });
  });

  // ============================================================================
  // Suite 1: Server Actions Validation & Lifecycle (20 tests)
  // ============================================================================
  describe('Suite 1: Server Actions Validation & Lifecycle', () => {
    it('1. createJobAction: rejects invalid customer_id (non-UUID)', async () => {
      const result = await createJobAction({
        customer_id: 'invalid-cust-id',
        title: 'Fix Leak',
        address_line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Valid customer ID required');
    });

    it('2. createJobAction: rejects empty title', async () => {
      const result = await createJobAction({
        customer_id: validCustomerId,
        title: '',
        address_line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Title is required');
    });

    it('3. createJobAction: rejects missing address_line1', async () => {
      const result = await createJobAction({
        customer_id: validCustomerId,
        title: 'Drain Snaking',
        address_line1: '',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Address is required');
    });

    it('4. createJobAction: accepts valid input and delegates to JobService.create', async () => {
      const mockCreated = { id: validJobId, title: 'Drain Snaking', status: 'scheduled' };
      vi.spyOn(JobService, 'create').mockResolvedValue(mockCreated as any);

      const result = await createJobAction({
        customer_id: validCustomerId,
        title: 'Drain Snaking',
        address_line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreated);
    });

    it('5. createJobAction: returns { success: false, error } when JobService.create throws', async () => {
      vi.spyOn(JobService, 'create').mockRejectedValue(new Error('ORG_FORBIDDEN: Requires owner/admin'));

      const result = await createJobAction({
        customer_id: validCustomerId,
        title: 'Drain Snaking',
        address_line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('ORG_FORBIDDEN');
    });

    it('6. updateJobStatusAction: successfully updates job status', async () => {
      const mockUpdated = { id: validJobId, status: 'in_progress' };
      vi.spyOn(JobService, 'updateStatus').mockResolvedValue(mockUpdated as any);

      const result = await updateJobStatusAction(validJobId, 'in_progress', 'Started work');
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('in_progress');
    });

    it('7. updateJobStatusAction: returns { success: false, error } when transition fails', async () => {
      vi.spyOn(JobService, 'updateStatus').mockRejectedValue(new Error('Invalid Job state transition'));

      const result = await updateJobStatusAction(validJobId, 'cancelled');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Job state transition');
    });

    it('8. convertJobToInvoiceAction: successfully converts completed job to invoice', async () => {
      const mockInvoice = { id: validInvoiceId, status: 'draft', source_job_id: validJobId };
      vi.spyOn(InvoiceService, 'convertFromJob').mockResolvedValue(mockInvoice as any);

      const result = await convertJobToInvoiceAction(validJobId);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(validInvoiceId);
    });

    it('9. convertJobToInvoiceAction: returns { success: false, error } on uncompleted job conversion', async () => {
      vi.spyOn(InvoiceService, 'convertFromJob').mockRejectedValue(
        new Error("STATE_CONFLICT: Only 'completed' jobs can be converted into invoices.")
      );

      const result = await convertJobToInvoiceAction(validJobId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('STATE_CONFLICT');
    });

    it('10. createQuoteAction: rejects empty items list', async () => {
      const result = await createQuoteAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        expiry_date: '2026-10-11',
        discount_cents: 0,
        items: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one line item is required');
    });

    it('11. createQuoteAction: rejects negative discount cents', async () => {
      const result = await createQuoteAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        expiry_date: '2026-10-11',
        discount_cents: -500,
        items: [{ description: 'Pipe Service', quantity: 1, unit_price_cents: 5000, taxable: true }],
      });
      expect(result.success).toBe(false);
    });

    it('12. createQuoteAction: rejects item with zero quantity', async () => {
      const result = await createQuoteAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        expiry_date: '2026-10-11',
        discount_cents: 0,
        items: [{ description: 'Pipe Service', quantity: 0, unit_price_cents: 5000, taxable: true }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be greater than 0');
    });

    it('13. createQuoteAction: creates quote with valid items', async () => {
      const mockQuote = { id: validQuoteId, status: 'draft', total_cents: 5413 };
      vi.spyOn(QuoteService, 'create').mockResolvedValue(mockQuote as any);

      const result = await createQuoteAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        expiry_date: '2026-10-11',
        discount_cents: 0,
        items: [{ description: 'Copper Joint', quantity: 1, unit_price_cents: 5000, taxable: true }],
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(validQuoteId);
    });

    it('14. createQuoteAction: returns { success: false, error } when service throws', async () => {
      vi.spyOn(QuoteService, 'create').mockRejectedValue(new Error('Database error'));

      const result = await createQuoteAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        expiry_date: '2026-10-11',
        discount_cents: 0,
        items: [{ description: 'Copper Joint', quantity: 1, unit_price_cents: 5000, taxable: true }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('15. sendQuoteAction: transitions quote to sent and dispatches notification', async () => {
      vi.spyOn(QuoteService, 'send').mockResolvedValue({ id: validQuoteId, status: 'sent' } as any);
      vi.spyOn(QuoteService, 'getById').mockResolvedValue({
        id: validQuoteId,
        quote_number: 'Q-2026-0001',
        public_token: 'tok_123',
        total_cents: 10000,
        customer: { email: 'cust@example.com', first_name: 'John', last_name: 'Doe' },
      } as any);
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const result = await sendQuoteAction(validQuoteId);
      expect(result.success).toBe(true);
    });

    it('16. sendQuoteAction: returns { success: false, error } on missing quote', async () => {
      vi.spyOn(QuoteService, 'send').mockRejectedValue(new Error('Quote not found.'));

      const result = await sendQuoteAction('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Quote not found.');
    });

    it('17. approveQuoteAction: records internal quote acceptance', async () => {
      vi.spyOn(QuoteService, 'acceptInternal').mockResolvedValue({ id: validQuoteId, status: 'accepted' } as any);

      const result = await approveQuoteAction(validQuoteId, 'John Customer');
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('accepted');
    });

    it('18. rejectQuoteAction: records internal quote rejection', async () => {
      vi.spyOn(QuoteService, 'rejectInternal').mockResolvedValue({ id: validQuoteId, status: 'rejected' } as any);

      const result = await rejectQuoteAction(validQuoteId, 'Too expensive');
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('rejected');
    });

    it('19. convertQuoteToJobAction: converts accepted quote to job', async () => {
      vi.spyOn(QuoteService, 'convertToJob').mockResolvedValue({ id: validJobId, job_number: 'J-2026-0001' } as any);

      const result = await convertQuoteToJobAction(validQuoteId);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(validJobId);
    });

    it('20. convertQuoteToJobAction: returns { success: false, error } on unaccepted quote', async () => {
      vi.spyOn(QuoteService, 'convertToJob').mockRejectedValue(
        new Error("STATE_CONFLICT: Only 'accepted' quotes can be converted into jobs.")
      );

      const result = await convertQuoteToJobAction(validQuoteId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('STATE_CONFLICT');
    });
  });

  // ============================================================================
  // Suite 2: Invoices & Payment Server Actions (12 tests)
  // ============================================================================
  describe('Suite 2: Invoices & Payment Server Actions', () => {
    it('21. createInvoiceAction: rejects empty items array', async () => {
      const result = await createInvoiceAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        due_date: '2026-09-25',
        discount_cents: 0,
        items: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one line item is required');
    });

    it('22. createInvoiceAction: rejects negative discount cents', async () => {
      const result = await createInvoiceAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        due_date: '2026-09-25',
        discount_cents: -100,
        items: [{ description: 'Boiler Fix', quantity: 1, unit_price_cents: 20000, taxable: true }],
      });
      expect(result.success).toBe(false);
    });

    it('23. createInvoiceAction: rejects non-UUID customer ID', async () => {
      const result = await createInvoiceAction({
        customer_id: 'bad-uuid',
        issue_date: '2026-09-11',
        due_date: '2026-09-25',
        discount_cents: 0,
        items: [{ description: 'Boiler Fix', quantity: 1, unit_price_cents: 20000, taxable: true }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Valid customer ID required');
    });

    it('24. createInvoiceAction: creates draft invoice on valid input', async () => {
      const mockInvoice = { id: validInvoiceId, status: 'draft', total_cents: 20000 };
      vi.spyOn(InvoiceService, 'create').mockResolvedValue(mockInvoice as any);

      const result = await createInvoiceAction({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        due_date: '2026-09-25',
        discount_cents: 0,
        items: [{ description: 'Boiler Fix', quantity: 1, unit_price_cents: 20000, taxable: true }],
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(validInvoiceId);
    });

    it('25. sendInvoiceAction: transitions invoice to sent and triggers notification', async () => {
      vi.spyOn(InvoiceService, 'send').mockResolvedValue({ id: validInvoiceId, status: 'sent' } as any);
      vi.spyOn(InvoiceService, 'getById').mockResolvedValue({
        id: validInvoiceId,
        invoice_number: 'INV-2026-0001',
        public_token: 'tok_inv_123',
        total_cents: 20000,
        due_date: '2026-09-25',
        customer: { email: 'client@example.com', first_name: 'Bob', last_name: 'Smith' },
      } as any);
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const result = await sendInvoiceAction(validInvoiceId);
      expect(result.success).toBe(true);
    });

    it('26. sendInvoiceAction: returns { success: false, error } when invoice not found', async () => {
      vi.spyOn(InvoiceService, 'send').mockRejectedValue(new Error('Invoice not found.'));

      const result = await sendInvoiceAction('missing-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invoice not found.');
    });

    it('27. voidInvoiceAction: successfully voids unpaid invoice', async () => {
      vi.spyOn(InvoiceService, 'void').mockResolvedValue({ id: validInvoiceId, status: 'void' } as any);

      const result = await voidInvoiceAction(validInvoiceId);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('void');
    });

    it('28. voidInvoiceAction: returns { success: false, error } when voiding paid invoice', async () => {
      vi.spyOn(InvoiceService, 'void').mockRejectedValue(
        new Error("Cannot void an invoice with active payments recorded.")
      );

      const result = await voidInvoiceAction(validInvoiceId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot void an invoice');
    });

    it('29. recordPaymentAction: rejects non-positive payment amount (0 cents)', async () => {
      const result = await recordPaymentAction(validInvoiceId, {
        amount_cents: 0,
        payment_date: '2026-09-11',
        payment_method: 'credit_card',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment amount must be greater than zero');
    });

    it('30. recordPaymentAction: rejects invalid payment method enum', async () => {
      const result = await recordPaymentAction(validInvoiceId, {
        amount_cents: 5000,
        payment_date: '2026-09-11',
        payment_method: 'crypto' as any,
      });
      expect(result.success).toBe(false);
    });

    it('31. recordPaymentAction: records payment, updates balance, and sends receipt email', async () => {
      vi.spyOn(InvoiceService, 'recordPayment').mockResolvedValue({
        payment: { id: 'pay_1', amount_cents: 5000 },
        invoice: { id: validInvoiceId, balance_due_cents: 15000, invoice_number: 'INV-1' },
      } as any);
      vi.spyOn(InvoiceService, 'getById').mockResolvedValue({
        id: validInvoiceId,
        invoice_number: 'INV-1',
        customer: { email: 'payer@example.com', first_name: 'Payer', last_name: 'One' },
      } as any);
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const result = await recordPaymentAction(validInvoiceId, {
        amount_cents: 5000,
        payment_date: '2026-09-11',
        payment_method: 'credit_card',
      });
      expect(result.success).toBe(true);
      expect(result.data?.payment.amount_cents).toBe(5000);
    });

    it('32. recordPaymentAction: returns { success: false, error } on service failure', async () => {
      vi.spyOn(InvoiceService, 'recordPayment').mockRejectedValue(new Error('Invoice not found.'));

      const result = await recordPaymentAction(validInvoiceId, {
        amount_cents: 5000,
        payment_date: '2026-09-11',
        payment_method: 'credit_card',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invoice not found.');
    });
  });

  // ============================================================================
  // Suite 3: Customer & Organization Server Actions (12 tests)
  // ============================================================================
  describe('Suite 3: Customer & Organization Server Actions', () => {
    it('33. createCustomerAction: rejects missing first name', async () => {
      const result = await createCustomerAction({
        first_name: '',
        last_name: 'Doe',
        phone: '555-0100',
        address_line1: '123 Elm St',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75001',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
    });

    it('34. createCustomerAction: rejects missing phone number', async () => {
      const result = await createCustomerAction({
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '',
        address_line1: '123 Elm St',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75001',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Phone number is required');
    });

    it('35. createCustomerAction: rejects invalid email format', async () => {
      const result = await createCustomerAction({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'not-an-email',
        phone: '555-0100',
        address_line1: '123 Elm St',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75001',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });

    it('36. createCustomerAction: creates customer on valid input', async () => {
      const mockCustomer = { id: validCustomerId, first_name: 'Jane', last_name: 'Doe' };
      vi.spyOn(CustomerService, 'create').mockResolvedValue(mockCustomer as any);

      const result = await createCustomerAction({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '555-0100',
        address_line1: '123 Elm St',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75001',
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(validCustomerId);
    });

    it('37. updateCustomerAction: updates customer details', async () => {
      vi.spyOn(CustomerService, 'update').mockResolvedValue({ id: validCustomerId, city: 'Houston' } as any);

      const result = await updateCustomerAction(validCustomerId, { city: 'Houston' });
      expect(result.success).toBe(true);
      expect(result.data?.city).toBe('Houston');
    });

    it('38. updateCustomerAction: returns { success: false, error } on update failure', async () => {
      vi.spyOn(CustomerService, 'update').mockRejectedValue(new Error('Update failed'));

      const result = await updateCustomerAction(validCustomerId, { city: 'Houston' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('39. deleteCustomerAction: deletes customer successfully', async () => {
      vi.spyOn(CustomerService, 'delete').mockResolvedValue();

      const result = await deleteCustomerAction(validCustomerId);
      expect(result.success).toBe(true);
    });

    it('40. deleteCustomerAction: returns { success: false, error } on deletion failure', async () => {
      vi.spyOn(CustomerService, 'delete').mockRejectedValue(new Error('Cannot delete customer with active jobs'));

      const result = await deleteCustomerAction(validCustomerId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete customer');
    });

    it('41. updateOrganizationAction: rejects tax rate basis points exceeding 5000 (50%)', async () => {
      const result = await updateOrganizationAction({
        name: 'Valid Name',
        tax_rate_basis_points: 6000,
      });
      expect(result.success).toBe(false);
    });

    it('42. updateOrganizationAction: rejects negative tax rate basis points', async () => {
      const result = await updateOrganizationAction({
        name: 'Valid Name',
        tax_rate_basis_points: -10,
      });
      expect(result.success).toBe(false);
    });

    it('43. updateOrganizationAction: rejects empty business name', async () => {
      const result = await updateOrganizationAction({
        name: '',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Business name is required');
    });

    it('44. updateOrganizationAction: updates organization settings successfully', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockOrg, name: 'Acme Apex New Name' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const result = await updateOrganizationAction({
        name: 'Acme Apex New Name',
      });
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Acme Apex New Name');
    });
  });

  // ============================================================================
  // Suite 4: Technician Management Server Actions (8 tests)
  // ============================================================================
  describe('Suite 4: Technician Management Server Actions', () => {
    it('45. createTechnicianAction: rejects name shorter than 2 chars', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const formData = new FormData();
      formData.set('fullName', 'A');
      formData.set('email', 'tech@example.com');
      formData.set('password', 'secret123');

      const result = await createTechnicianAction(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('min 2 characters');
    });

    it('46. createTechnicianAction: rejects invalid email without @', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const formData = new FormData();
      formData.set('fullName', 'Tech User');
      formData.set('email', 'invalid-email');
      formData.set('password', 'secret123');

      const result = await createTechnicianAction(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email');
    });

    it('47. createTechnicianAction: rejects password shorter than 6 chars', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const formData = new FormData();
      formData.set('fullName', 'Tech User');
      formData.set('email', 'tech@example.com');
      formData.set('password', '12345');

      const result = await createTechnicianAction(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });

    it('48. createTechnicianAction: provisions technician user and links to organization', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const mockAdminClient = {
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'new_tech_id' } },
              error: null,
            }),
          },
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdminClient as any);

      const formData = new FormData();
      formData.set('fullName', 'Bob the Builder');
      formData.set('email', 'bob@builder.com');
      formData.set('password', 'ValidPass123!');

      const result = await createTechnicianAction(formData);
      expect(result.success).toBe(true);
      expect(result.technician?.fullName).toBe('Bob the Builder');
    });

    it('49. createTechnicianAction: handles existing auth user gracefully by linking', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const mockAdminClient = {
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User already registered' },
            }),
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [{ id: 'existing_user_id', email: 'bob@builder.com' }] },
            }),
          },
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdminClient as any);

      const formData = new FormData();
      formData.set('fullName', 'Bob the Builder');
      formData.set('email', 'bob@builder.com');
      formData.set('password', 'ValidPass123!');

      const result = await createTechnicianAction(formData);
      expect(result.success).toBe(true);
      expect(result.technician?.userId).toBe('existing_user_id');
    });

    it('50. createTechnicianAction: returns error when adminClient fails', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const mockAdminClient = {
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Service unavailable' },
            }),
          },
        },
      };
      vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdminClient as any);

      const formData = new FormData();
      formData.set('fullName', 'Bob the Builder');
      formData.set('email', 'bob@builder.com');
      formData.set('password', 'ValidPass123!');

      const result = await createTechnicianAction(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });

    it('51. listTechniciansAction: lists technicians with active job counts', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const mockMembers = [
        {
          id: 'mem_1',
          user_id: mockTech.id,
          role: 'technician',
          created_at: '2026-09-01',
          user: { id: mockTech.id, full_name: mockTech.full_name, email: mockTech.email, phone: '555-0199' },
        },
      ];

      const mockJobs = [
        { assigned_to_user_id: mockTech.id },
        { assigned_to_user_id: mockTech.id },
      ];

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'organization_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
                }),
              }),
            };
          }
          if (table === 'jobs') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const result = await listTechniciansAction();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].activeJobsCount).toBe(2);
    });

    it('52. deleteTechnicianAction: removes technician member from organization', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const result = await deleteTechnicianAction('mem_1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Technician removed');
    });
  });

  // ============================================================================
  // Suite 5: Public Portal Server Actions & APIs (10 tests)
  // ============================================================================
  describe('Suite 5: Public Portal Server Actions & APIs', () => {
    it('53. respondToQuotePublicAction: accepts quote with valid signer name', async () => {
      vi.spyOn(QuoteService, 'respondPublic').mockResolvedValue({ success: true } as any);

      const result = await respondToQuotePublicAction('token_abc', {
        action: 'accept',
        signer_name: 'John Legal Signer',
      });
      expect(result.success).toBe(true);
    });

    it('54. respondToQuotePublicAction: rejects acceptance if signer name is missing', async () => {
      const result = await respondToQuotePublicAction('token_abc', {
        action: 'accept',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Full name is required');
    });

    it('55. respondToQuotePublicAction: rejects quote with reason', async () => {
      vi.spyOn(QuoteService, 'respondPublic').mockResolvedValue({ success: true } as any);

      const result = await respondToQuotePublicAction('token_abc', {
        action: 'reject',
        rejection_reason: 'Budget constraints',
      });
      expect(result.success).toBe(true);
    });

    it('56. respondToQuotePublicAction: extracts client IP from x-forwarded-for header', async () => {
      const spyRespond = vi.spyOn(QuoteService, 'respondPublic').mockResolvedValue({ success: true } as any);

      await respondToQuotePublicAction('token_abc', {
        action: 'accept',
        signer_name: 'John Signer',
      });
      expect(spyRespond).toHaveBeenCalledWith('token_abc', expect.anything(), '198.51.100.42');
    });

    it('57. GET /api/health: returns 200 with healthy status and uptime', async () => {
      const res = await healthGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(typeof data.uptime).toBe('number');
      expect(data.service).toBe('TradeFlow API');
    });

    it('58. GET /api/quotes/[id]/pdf: returns 200 PDF for valid public token', async () => {
      const mockQuote = {
        id: validQuoteId,
        quote_number: 'Q-001',
        organization: mockOrg,
      };
      vi.spyOn(QuoteService, 'getByPublicToken').mockResolvedValue(mockQuote as any);

      const req = new NextRequest(`http://localhost:3000/api/quotes/${validQuoteId}/pdf?token=valid_token`);
      const res = await quotePdfGet(req, { params: Promise.resolve({ id: validQuoteId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('59. GET /api/quotes/[id]/pdf: returns 404 when public token does not match quote ID', async () => {
      const mockQuote = {
        id: 'different-quote-id',
        quote_number: 'Q-001',
      };
      vi.spyOn(QuoteService, 'getByPublicToken').mockResolvedValue(mockQuote as any);

      const req = new NextRequest(`http://localhost:3000/api/quotes/${validQuoteId}/pdf?token=valid_token`);
      const res = await quotePdfGet(req, { params: Promise.resolve({ id: validQuoteId }) });

      expect(res.status).toBe(404);
    });

    it('60. GET /api/invoices/[id]/pdf: returns 200 PDF for valid public token', async () => {
      const mockInvoice = {
        id: validInvoiceId,
        invoice_number: 'INV-001',
        organization: mockOrg,
      };
      vi.spyOn(InvoiceService, 'getByPublicToken').mockResolvedValue(mockInvoice as any);

      const req = new NextRequest(`http://localhost:3000/api/invoices/${validInvoiceId}/pdf?token=valid_token`);
      const res = await invoicePdfGet(req, { params: Promise.resolve({ id: validInvoiceId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('61. GET /api/invoices/[id]/pdf: returns 404 for invalid public token', async () => {
      vi.spyOn(InvoiceService, 'getByPublicToken').mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/invoices/${validInvoiceId}/pdf?token=bad_token`);
      const res = await invoicePdfGet(req, { params: Promise.resolve({ id: validInvoiceId }) });

      expect(res.status).toBe(404);
    });

    it('62. GET /api/invoices/[id]/pdf: applies attachment content-disposition when download=true', async () => {
      const mockInvoice = {
        id: validInvoiceId,
        invoice_number: 'INV-001',
        organization: mockOrg,
      };
      vi.spyOn(InvoiceService, 'getByPublicToken').mockResolvedValue(mockInvoice as any);

      const req = new NextRequest(`http://localhost:3000/api/invoices/${validInvoiceId}/pdf?token=valid_token&download=true`);
      const res = await invoicePdfGet(req, { params: Promise.resolve({ id: validInvoiceId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="Invoice-INV-001.pdf"');
    });
  });

  // ============================================================================
  // Suite 6: Stripe Webhooks Route & Processing (8 tests)
  // ============================================================================
  describe('Suite 6: Stripe Webhooks Route & Processing', () => {
    it('63. POST /api/webhooks/stripe: returns 400 when stripe-signature header is missing', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Missing stripe signature');
    });

    it('64. POST /api/webhooks/stripe: returns 400 when STRIPE_WEBHOOK_SECRET is unset', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'stripe-signature': 'sig_mock' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Missing stripe signature');
    });

    it('65. POST /api/webhooks/stripe: returns 400 when stripe.webhooks.constructEvent fails', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as any).mockImplementation(() => {
        throw new Error('Invalid signature hash');
      });

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: 'invalid_raw_payload',
        headers: { 'stripe-signature': 'sig_mock' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Webhook Error: Invalid signature hash');
    });

    it('66. POST /api/webhooks/stripe: returns 200 on checkout.session.completed', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: mockOrg.id,
            customer: 'cus_123',
            subscription: 'sub_123',
          },
        },
      };
      (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
      vi.spyOn(BillingService, 'handleWebhookEvent').mockResolvedValue({ processed: true, eventType: mockEvent.type });

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 'stripe-signature': 'sig_valid' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
    });

    it('67. POST /api/webhooks/stripe: returns 200 on customer.subscription.updated', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: { object: { customer: 'cus_123', status: 'active' } },
      };
      (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
      vi.spyOn(BillingService, 'handleWebhookEvent').mockResolvedValue({ processed: true, eventType: mockEvent.type });

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 'stripe-signature': 'sig_valid' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(200);
    });

    it('68. POST /api/webhooks/stripe: returns 200 on customer.subscription.deleted', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_123' } },
      };
      (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
      vi.spyOn(BillingService, 'handleWebhookEvent').mockResolvedValue({ processed: true, eventType: mockEvent.type });

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 'stripe-signature': 'sig_valid' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(200);
    });

    it('69. POST /api/webhooks/stripe: returns 200 for unhandled event types without error', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: { object: {} },
      };
      (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
      vi.spyOn(BillingService, 'handleWebhookEvent').mockResolvedValue({ processed: true, eventType: mockEvent.type });

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 'stripe-signature': 'sig_valid' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(200);
    });

    it('70. POST /api/webhooks/stripe: returns 500 when BillingService handler throws', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const mockEvent = {
        type: 'checkout.session.completed',
        data: { object: {} },
      };
      (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
      vi.spyOn(BillingService, 'handleWebhookEvent').mockRejectedValue(new Error('DB failure'));

      const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 'stripe-signature': 'sig_valid' },
      });

      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Internal webhook execution failure');
    });
  });

  // ============================================================================
  // Suite 7: RBAC Permission Boundaries Matrix (14 tests)
  // ============================================================================
  describe('Suite 7: RBAC Permission Boundaries Matrix', () => {
    it('71. RBAC: Owner has access to BillingService.createCheckoutSession', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const url = await BillingService.createCheckoutSession();
      expect(url).toContain('checkout.stripe.com');
    });

    it('72. RBAC: Admin is blocked from BillingService.createCheckoutSession (requires owner)', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockAdmin as any,
        organization: mockOrg as any,
        role: 'admin',
      });

      await expect(BillingService.createCheckoutSession()).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('73. RBAC: Technician is blocked from BillingService.createCheckoutSession (requires owner)', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(BillingService.createCheckoutSession()).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('74. RBAC: Owner has access to BillingService.createCustomerPortalSession', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });
      vi.spyOn(BillingService, 'getSubscription').mockResolvedValue({
        stripe_customer_id: 'cus_123',
      } as any);

      const url = await BillingService.createCustomerPortalSession();
      expect(url).toContain('billing.stripe.com');
    });

    it('75. RBAC: Admin is blocked from BillingService.createCustomerPortalSession', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockAdmin as any,
        organization: mockOrg as any,
        role: 'admin',
      });

      await expect(BillingService.createCustomerPortalSession()).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('76. RBAC: Technician is blocked from BillingService.createCustomerPortalSession', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(BillingService.createCustomerPortalSession()).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('77. RBAC: Owner/Admin can access DashboardService.getMetrics', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockAdmin as any,
        organization: mockOrg as any,
        role: 'admin',
      });

      const mockQueryChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], count: 0 })),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryChain),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const metrics = await DashboardService.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.currency).toBe('USD');
    });

    it('78. RBAC: Technician is blocked from DashboardService.getMetrics', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(DashboardService.getMetrics()).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('79. RBAC: Technician is blocked from CustomerService.create', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        CustomerService.create({
          first_name: 'Test',
          last_name: 'Customer',
          phone: '555-1234',
          address_line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
          country: 'US',
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('80. RBAC: Technician is blocked from InvoiceService.list', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(InvoiceService.list()).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('81. RBAC: Technician is blocked from InvoiceService.create', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        InvoiceService.create({
          customer_id: validCustomerId,
          issue_date: '2026-09-11',
          due_date: '2026-09-25',
          discount_cents: 0,
          items: [{ description: 'Item', quantity: 1, unit_price_cents: 1000, taxable: true }],
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('82. RBAC: Technician is blocked from JobService.create', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        JobService.create({
          customer_id: validCustomerId,
          title: 'Unauthorized Job',
          address_line1: '123 St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('83. RBAC: Technician is blocked from QuoteService.create', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        QuoteService.create({
          customer_id: validCustomerId,
          issue_date: '2026-09-11',
          expiry_date: '2026-10-11',
          discount_cents: 0,
          items: [{ description: 'Item', quantity: 1, unit_price_cents: 1000, taxable: true }],
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('84. RBAC: Technician is blocked from updateOrganizationAction', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        updateOrganizationAction({ name: 'Hacked Name' })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });
  });

  // ============================================================================
  // Suite 8: Field Technician Scoping & Job Access (8 tests)
  // ============================================================================
  describe('Suite 8: Field Technician Scoping & Job Access', () => {
    it('85. Technician: JobService.list scopes query strictly to assigned_to_user_id', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      let appliedFilters: Record<string, any> = {};
      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          appliedFilters[col] = val;
          return mockQuery;
        }),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], count: 0, error: null })),
      };

      const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      await JobService.list();
      expect(appliedFilters['assigned_to_user_id']).toBe(mockTech.id);
      expect(appliedFilters['organization_id']).toBe(mockOrg.id);
    });

    it('86. Owner/Admin: JobService.list does not filter by assigned_to_user_id', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      let appliedFilters: Record<string, any> = {};
      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          appliedFilters[col] = val;
          return mockQuery;
        }),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], count: 0, error: null })),
      };

      const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      await JobService.list();
      expect(appliedFilters['assigned_to_user_id']).toBeUndefined();
      expect(appliedFilters['organization_id']).toBe(mockOrg.id);
    });

    it('87. Technician: JobService.getById returns null for job assigned to someone else', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          if (col === 'assigned_to_user_id' && val === mockTech.id) {
            return {
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
            };
          }
          return mockQuery;
        }),
      };

      const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const job = await JobService.getById('other-tech-job');
      expect(job).toBeNull();
    });

    it('88. Technician: JobService.getById returns job assigned to themselves', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const myJob = { id: validJobId, assigned_to_user_id: mockTech.id, title: 'My Job' };

      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: any) => mockQuery),
        single: vi.fn().mockResolvedValue({ data: myJob, error: null }),
      };

      const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const job = await JobService.getById(validJobId);
      expect(job).toEqual(myJob);
    });

    it('89. Technician: JobService.updateStatus succeeds for job assigned to themselves', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const myJob: any = {
        id: validJobId,
        assigned_to_user_id: mockTech.id,
        status: 'scheduled',
      };
      vi.spyOn(JobService, 'getById').mockResolvedValue(myJob);

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...myJob, status: 'in_progress', started_at: new Date().toISOString() },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const updated = await JobService.updateStatus(validJobId, 'in_progress');
      expect(updated.status).toBe('in_progress');
    });

    it('90. Technician: JobService.updateStatus fails with access denied for job assigned to another tech', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      vi.spyOn(JobService, 'getById').mockResolvedValue(null);

      await expect(
        JobService.updateStatus('foreign-job-id', 'in_progress')
      ).rejects.toThrow('Job not found or access denied.');
    });

    it('91. Technician: cannot transition job from completed to scheduled', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const completedJob: any = {
        id: validJobId,
        assigned_to_user_id: mockTech.id,
        status: 'completed',
      };
      vi.spyOn(JobService, 'getById').mockResolvedValue(completedJob);

      await expect(
        JobService.updateStatus(validJobId, 'scheduled')
      ).rejects.toThrow("Invalid Job state transition from 'completed' to 'scheduled'");
    });

    it('92. Technician: allowed to view team members in organization', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const mockMembers = [
        { role: 'technician', user: { id: mockTech.id, full_name: 'Charlie Tech', email: 'tech@acme.com' } },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const members = await JobService.getTeamMembers();
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe(mockTech.id);
    });
  });

  // ============================================================================
  // Suite 9: Multi-Tenant Data Isolation (8 tests)
  // ============================================================================
  describe('Suite 9: Multi-Tenant Data Isolation', () => {
    it('93. Isolation: Org B cannot fetch Org A customer by ID', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col1, val1) => ({
              eq: vi.fn().mockImplementation((col2, val2) => {
                expect(val2).toBe(otherOrg.id);
                return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }) };
              }),
            })),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const cust = await CustomerService.getById(validCustomerId);
      expect(cust).toBeNull();
    });

    it('94. Isolation: Org B cannot fetch Org A quote by ID', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col1, val1) => ({
              eq: vi.fn().mockImplementation((col2, val2) => {
                expect(val2).toBe(otherOrg.id);
                return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }) };
              }),
            })),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const quote = await QuoteService.getById(validQuoteId);
      expect(quote).toBeNull();
    });

    it('95. Isolation: Org B cannot fetch Org A invoice by ID', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col1, val1) => ({
              eq: vi.fn().mockImplementation((col2, val2) => {
                expect(val2).toBe(otherOrg.id);
                return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }) };
              }),
            })),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const inv = await InvoiceService.getById(validInvoiceId);
      expect(inv).toBeNull();
    });

    it('96. Isolation: Org B cannot create quote referencing Org A customer', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((c1, v1) => ({
              eq: vi.fn().mockImplementation((c2, v2) => {
                expect(v2).toBe(otherOrg.id);
                return { single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }) };
              }),
            })),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      await expect(
        QuoteService.create({
          customer_id: validCustomerId,
          issue_date: '2026-09-11',
          expiry_date: '2026-10-11',
          discount_cents: 0,
          items: [{ description: 'Test', quantity: 1, unit_price_cents: 1000, taxable: true }],
        })
      ).rejects.toThrow('RESOURCE_NOT_FOUND: Customer not found in current organization.');
    });

    it('97. Isolation: InvoiceService.create forces organization_id on invoice and items', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      let insertedInvoice: any = null;
      let insertedItems: any = null;

      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: 'INV-2026-0001', error: null }),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'invoices') {
            return {
              insert: vi.fn().mockImplementation((payload) => {
                insertedInvoice = payload;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'new_inv_id', ...payload }, error: null }),
                  }),
                };
              }),
            };
          }
          if (table === 'invoice_items') {
            return {
              insert: vi.fn().mockImplementation((payload) => {
                insertedItems = payload;
                return { error: null };
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const inv = await InvoiceService.create({
        customer_id: validCustomerId,
        issue_date: '2026-09-11',
        due_date: '2026-09-25',
        discount_cents: 0,
        items: [{ description: 'Pipe', quantity: 1, unit_price_cents: 1000, taxable: true }],
      });

      expect(insertedInvoice.organization_id).toBe(otherOrg.id);
      expect(insertedItems[0].organization_id).toBe(otherOrg.id);
      expect(inv.organization_id).toBe(otherOrg.id);
    });

    it('98. Isolation: Org B cannot convert Org A job to invoice', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
              }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      await expect(InvoiceService.convertFromJob(validJobId)).rejects.toThrow('RESOURCE_NOT_FOUND: Job not found.');
    });

    it('99. Isolation: Org B cannot convert Org A quote to job', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      vi.spyOn(QuoteService, 'getById').mockResolvedValue(null);

      await expect(QuoteService.convertToJob(validQuoteId)).rejects.toThrow('Quote not found.');
    });

    it('100. Isolation: Org B cannot record payment on Org A invoice', async () => {
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: { id: 'rival_user' } as any,
        organization: otherOrg as any,
        role: 'owner',
      });

      vi.spyOn(InvoiceService, 'getById').mockResolvedValue(null);

      await expect(
        InvoiceService.recordPayment(validInvoiceId, {
          amount_cents: 5000,
          payment_date: '2026-09-11',
          payment_method: 'credit_card',
        })
      ).rejects.toThrow('Invoice not found.');
    });
  });

  // ============================================================================
  // Suite 10: Pure Financial Calculations & Integer Cent Guards (10 tests)
  // ============================================================================
  describe('Suite 10: Pure Financial Calculations & Integer Cent Guards', () => {
    it('101. Calculator: handles integer cents accurately without floating point creep', () => {
      const items = [
        { quantity: 3, unit_price_cents: 3333, taxable: true },
        { quantity: 1, unit_price_cents: 1, taxable: true },
      ];
      const result = calculateDocumentTotals(items, 0, 0, 0);
      expect(result.subtotalCents).toBe(10000);
      expect(result.totalCents).toBe(10000);
      expect(Number.isInteger(result.totalCents)).toBe(true);
    });

    it('102. Calculator: rounds fractional cents (round(qty * price))', () => {
      const items = [
        { quantity: 1.5, unit_price_cents: 1005, taxable: true },
      ];
      const result = calculateDocumentTotals(items, 0, 0, 0);
      expect(result.itemTotals[0]).toBe(1508);
      expect(result.subtotalCents).toBe(1508);
    });

    it('103. Calculator: flat discount takes precedence over percentage discount', () => {
      const items = [{ quantity: 1, unit_price_cents: 10000, taxable: true }];
      const result = calculateDocumentTotals(items, 2000, 5000, 0);
      expect(result.discountCents).toBe(2000);
      expect(result.totalCents).toBe(8000);
    });

    it('104. Calculator: flat discount is capped at subtotal cents (prevents negative invoice totals)', () => {
      const items = [{ quantity: 1, unit_price_cents: 5000, taxable: true }];
      const result = calculateDocumentTotals(items, 10000, 0, 0);
      expect(result.discountCents).toBe(5000);
      expect(result.totalCents).toBe(0);
    });

    it('105. Calculator: percentage discount is calculated accurately via basis points', () => {
      const items = [{ quantity: 2, unit_price_cents: 5000, taxable: true }];
      const result = calculateDocumentTotals(items, 0, 1000, 0);
      expect(result.discountCents).toBe(1000);
      expect(result.totalCents).toBe(9000);
    });

    it('106. Calculator: tax base is pro-rated across taxable items when discount is applied', () => {
      const items = [
        { quantity: 1, unit_price_cents: 6000, taxable: true },
        { quantity: 1, unit_price_cents: 4000, taxable: false },
      ];
      const result = calculateDocumentTotals(items, 2000, 0, 1000);
      expect(result.taxableBaseCents).toBe(4800);
      expect(result.taxCents).toBe(480);
      expect(result.totalCents).toBe(8480);
    });

    it('107. Calculator: tax cents equals 0 when tax rate is 0 basis points', () => {
      const items = [{ quantity: 1, unit_price_cents: 5000, taxable: true }];
      const result = calculateDocumentTotals(items, 0, 0, 0);
      expect(result.taxCents).toBe(0);
      expect(result.totalCents).toBe(5000);
    });

    it('108. Calculator: non-taxable items are excluded from tax calculation', () => {
      const items = [{ quantity: 1, unit_price_cents: 5000, taxable: false }];
      const result = calculateDocumentTotals(items, 0, 0, 825);
      expect(result.taxableBaseCents).toBe(0);
      expect(result.taxCents).toBe(0);
      expect(result.totalCents).toBe(5000);
    });

    it('109. Calculator: total cents = subtotal - discount + tax strictly holds', () => {
      const items = [
        { quantity: 2, unit_price_cents: 4500, taxable: true },
        { quantity: 1, unit_price_cents: 2000, taxable: true },
      ];
      const result = calculateDocumentTotals(items, 1500, 0, 825);
      expect(result.totalCents).toBe(result.subtotalCents - result.discountCents + result.taxCents);
    });

    it('110. Calculator: negative unit prices are clamped to 0', () => {
      const items = [{ quantity: 1, unit_price_cents: -5000, taxable: true }];
      const result = calculateDocumentTotals(items, 0, 0, 0);
      expect(result.subtotalCents).toBe(0);
      expect(result.totalCents).toBe(0);
    });
  });

  // ============================================================================
  // Suite 11: Finite State Machine Invariants (8 tests)
  // ============================================================================
  describe('Suite 11: Finite State Machine Invariants', () => {
    it('111. Quote FSM: draft can only transition to sent', () => {
      expect(transitionQuoteStatus('draft', 'sent')).toBe('sent');
      expect(() => transitionQuoteStatus('draft', 'accepted')).toThrow('Invalid Quote state transition');
    });

    it('112. Quote FSM: sent can transition to accepted, rejected, or expired', () => {
      expect(transitionQuoteStatus('sent', 'accepted')).toBe('accepted');
      expect(transitionQuoteStatus('sent', 'rejected')).toBe('rejected');
      expect(transitionQuoteStatus('sent', 'expired')).toBe('expired');
      expect(() => transitionQuoteStatus('sent', 'draft')).toThrow('Invalid Quote state transition');
    });

    it('113. Quote FSM: accepted is terminal for transitions', () => {
      expect(() => transitionQuoteStatus('accepted', 'draft')).toThrow('Invalid Quote state transition');
      expect(() => transitionQuoteStatus('accepted', 'sent')).toThrow('Invalid Quote state transition');
    });

    it('114. Job FSM: scheduled can transition to in_progress or cancelled', () => {
      expect(transitionJobStatus('scheduled', 'in_progress')).toBe('in_progress');
      expect(transitionJobStatus('scheduled', 'cancelled')).toBe('cancelled');
      expect(() => transitionJobStatus('scheduled', 'completed')).toThrow('Invalid Job state transition');
    });

    it('115. Job FSM: in_progress can transition to completed or cancelled', () => {
      expect(transitionJobStatus('in_progress', 'completed')).toBe('completed');
      expect(transitionJobStatus('in_progress', 'cancelled')).toBe('cancelled');
      expect(() => transitionJobStatus('in_progress', 'scheduled')).toThrow('Invalid Job state transition');
    });

    it('116. Job FSM: completed is terminal', () => {
      expect(() => transitionJobStatus('completed', 'in_progress')).toThrow('Invalid Job state transition');
      expect(() => transitionJobStatus('completed', 'scheduled')).toThrow('Invalid Job state transition');
    });

    it('117. Invoice FSM: draft can transition to sent or void', () => {
      expect(transitionInvoiceStatus('draft', 'sent')).toBe('sent');
      expect(transitionInvoiceStatus('draft', 'void')).toBe('void');
      expect(() => transitionInvoiceStatus('draft', 'paid')).toThrow('Invalid Invoice state transition');
    });

    it('118. Invoice FSM: paid is strictly immutable (cannot transition to void or draft)', () => {
      expect(() => transitionInvoiceStatus('paid', 'void', true)).toThrow();
      expect(() => transitionInvoiceStatus('paid', 'draft')).toThrow();
    });
  });

  // ============================================================================
  // Suite 12: Security Vulnerability & Architecture Gap Detections (9 tests)
  // ============================================================================
  describe('Suite 12: Security Vulnerability & Architecture Gap Detections', () => {
    it('119. VULN-AUDIT: QuoteService.list lacks requireRole(["owner", "admin"]) allowing technician access', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: [{ id: validQuoteId, total_cents: 99900 }], count: 1, error: null }),
              }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      // Audit observation: QuoteService.list resolves for technician when it should be restricted to owner/admin
      const res = await QuoteService.list();
      expect(res.quotes).toHaveLength(1);
    });

    it('120. VULN-AUDIT: QuoteService.getById lacks role check allowing technician to read quote pricing', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const mockQuote = { id: validQuoteId, total_cents: 150000, subtotal_cents: 140000 };
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockQuote, error: null }),
              }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      // Audit observation: Technician can inspect pricing via QuoteService.getById
      const quote = await QuoteService.getById(validQuoteId);
      expect(quote?.total_cents).toBe(150000);
    });

    it('121. VULN-AUDIT: CustomerService.getTimeline exposes invoices and quotes to technicians', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: mockTech as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [{ id: 'inv_1', total_cents: 80000 }], error: null }),
              }),
            }),
          }),
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      // Audit observation: Customer timeline leaks financial invoices to field technicians
      const timeline = await CustomerService.getTimeline(validCustomerId);
      expect(timeline.invoices).toHaveLength(1);
    });

    it('122. VULN-AUDIT: /api/quotes/[id]/pdf adminClient fallback allows unauthenticated IDOR document read', async () => {
      vi.spyOn(AuthService, 'getCurrentContext').mockResolvedValue(null);

      const mockAdminQuote = {
        id: validQuoteId,
        quote_number: 'Q-001',
        organization_id: mockOrg.id,
        organization: mockOrg,
      };

      const mockAdminClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockAdminQuote, error: null }),
            }),
          }),
        }),
      };
      vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdminClient as any);

      // Request WITHOUT token and WITHOUT session:
      const req = new NextRequest(`http://localhost:3000/api/quotes/${validQuoteId}/pdf`);
      const res = await quotePdfGet(req, { params: Promise.resolve({ id: validQuoteId }) });

      // Audit observation: Returns 200 OK because of fallback adminClient query, bypassing auth & token!
      expect(res.status).toBe(200);
    });

    it('123. VULN-AUDIT: /api/invoices/[id]/pdf adminClient fallback allows unauthenticated IDOR document read', async () => {
      vi.spyOn(AuthService, 'getCurrentContext').mockResolvedValue(null);

      const mockAdminInvoice = {
        id: validInvoiceId,
        invoice_number: 'INV-001',
        organization_id: mockOrg.id,
        organization: mockOrg,
      };

      const mockAdminClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockAdminInvoice, error: null }),
            }),
          }),
        }),
      };
      vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdminClient as any);

      const req = new NextRequest(`http://localhost:3000/api/invoices/${validInvoiceId}/pdf`);
      const res = await invoicePdfGet(req, { params: Promise.resolve({ id: validInvoiceId }) });

      // Audit observation: Returns 200 OK because of fallback adminClient query, bypassing auth & token!
      expect(res.status).toBe(200);
    });

    it('124. VULN-AUDIT: CreateQuoteSchema allows invalid date range where expiry_date is before issue_date', () => {
      const parsed = CreateQuoteSchema.safeParse({
        customer_id: validCustomerId,
        issue_date: '2026-10-15',
        expiry_date: '2026-09-01',
        discount_cents: 0,
        items: [{ description: 'Pipe Inspection', quantity: 1, unit_price_cents: 5000, taxable: true }],
      });

      // Audit observation: Schema currently passes despite inverted temporal range
      expect(parsed.success).toBe(true);
    });

    it('125. VULN-AUDIT: CreateInvoiceSchema allows invalid date range where due_date is before issue_date', () => {
      const parsed = CreateInvoiceSchema.safeParse({
        customer_id: validCustomerId,
        issue_date: '2026-10-15',
        due_date: '2026-09-01',
        discount_cents: 0,
        items: [{ description: 'Pipe Inspection', quantity: 1, unit_price_cents: 5000, taxable: true }],
      });

      // Audit observation: Schema currently passes despite inverted temporal range
      expect(parsed.success).toBe(true);
    });

    it('126. Subscription FSM: trialing can transition to active, past_due, or canceled', () => {
      expect(transitionSubscriptionStatus('trialing', 'active')).toBe('active');
      expect(transitionSubscriptionStatus('trialing', 'past_due')).toBe('past_due');
      expect(transitionSubscriptionStatus('trialing', 'canceled')).toBe('canceled');
      expect(() => transitionSubscriptionStatus('active', 'trialing' as any)).toThrow();
    });

    it('127. VULN-AUDIT: InvoiceService.create lacks customer tenancy check (unlike QuoteService.create)', async () => {
      // In QuoteService.create, line 95 queries customers table to verify customer belongs to organization.
      // In InvoiceService.create, it immediately inserts without verifying customer_id ownership.
      vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
        user: mockOwner as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      let checkedCustomerTenancy = false;
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: 'INV-2026-0001', error: null }),
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'customers') {
            checkedCustomerTenancy = true;
          }
          if (table === 'invoices') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: validInvoiceId }, error: null }),
                }),
              }),
            };
          }
          if (table === 'invoice_items') {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      await InvoiceService.create({
        customer_id: 'foreign-customer-id',
        issue_date: '2026-09-11',
        due_date: '2026-09-25',
        discount_cents: 0,
        items: [{ description: 'Item', quantity: 1, unit_price_cents: 1000, taxable: true }],
      });

      // Audit observation: checkedCustomerTenancy remains FALSE!
      expect(checkedCustomerTenancy).toBe(false);
    });
  });
});
