// ==============================================================================
// src/services/InvoiceService.ts — Invoicing & Offline Payment Reconciliation
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthService } from './AuthService';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { transitionInvoiceStatus } from '@/lib/state/machines';
import type { CreateInvoiceInput, RecordPaymentInput } from '@/lib/validations/invoice';
import type { Invoice, InvoiceStatus } from '@/types/database';
import crypto from 'crypto';

export class InvoiceService {
  /**
   * Helper to generate sequential invoice number
   */
  private static async getNextInvoiceNumber(supabase: any, orgId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('fn_next_sequence', {
        p_org_id: orgId,
        p_entity_type: 'invoice',
      });
      if (data && !error) return data;
    } catch {
      // Fallback
    }

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const nextVal = (count || 0) + 1;
    return `INV-${year}-${String(nextVal).padStart(4, '0')}`;
  }

  /**
   * Lists invoices for current organization.
   */
  static async list(status?: InvoiceStatus, search?: string, limit = 50, offset = 0) {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    let query = supabase
      .from('invoices')
      .select('*, customer:customers(*)', { count: 'exact' })
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      query = query.or(`invoice_number.ilike.${term},notes.ilike.${term}`);
    }

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to list invoices: ${error.message}`);
    }

    return {
      invoices: (data || []) as Invoice[],
      totalCount: count || 0,
    };
  }

  /**
   * Retrieves single invoice by ID with items and payments.
   */
  static async getById(invoiceId: string): Promise<Invoice | null> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*), payments(*)')
      .eq('id', invoiceId)
      .eq('organization_id', organization.id)
      .single();

    if (error || !data) return null;
    return data as Invoice;
  }

  /**
   * Creates a new draft invoice with line items.
   */
  static async create(input: CreateInvoiceInput): Promise<Invoice> {
    const { organization, user } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const calc = calculateDocumentTotals(
      input.items,
      input.discount_cents,
      0,
      organization.tax_rate_basis_points
    );

    const invoiceNumber = await this.getNextInvoiceNumber(supabase, organization.id);
    const publicToken = crypto.randomBytes(32).toString('hex');

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: organization.id,
        customer_id: input.customer_id,
        source_job_id: input.source_job_id || null,
        source_quote_id: input.source_quote_id || null,
        invoice_number: invoiceNumber,
        status: 'draft',
        issue_date: input.issue_date,
        due_date: input.due_date,
        subtotal_cents: calc.subtotalCents,
        discount_cents: calc.discountCents,
        tax_cents: calc.taxCents,
        total_cents: calc.totalCents,
        amount_paid_cents: 0,
        balance_due_cents: calc.totalCents,
        notes: input.notes || null,
        terms: input.terms || organization.invoice_terms || null,
        public_token: publicToken,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Failed to create invoice: ${invoiceError?.message}`);
    }

    // Insert Line Items
    const itemsToInsert = input.items.map((item, idx) => ({
      organization_id: organization.id,
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      taxable: item.taxable,
      total_cents: calc.itemTotals[idx],
      sort_order: idx,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      throw new Error(`Failed to insert invoice items: ${itemsError.message}`);
    }

    return invoice as Invoice;
  }

  /**
   * 1-Click Conversion: Converts a completed job into a draft invoice.
   */
  static async convertFromJob(jobId: string): Promise<Invoice> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    // Fetch Job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, customer:customers(*)')
      .eq('id', jobId)
      .eq('organization_id', organization.id)
      .single();

    if (jobError || !job) {
      throw new Error('RESOURCE_NOT_FOUND: Job not found.');
    }

    if (job.status !== 'completed') {
      throw new Error("STATE_CONFLICT: Only 'completed' jobs can be converted into invoices.");
    }

    // Idempotency: check if invoice already generated for this job
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('source_job_id', jobId)
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (existingInvoice) {
      return existingInvoice as Invoice;
    }

    // Build Line Items: pull from source quote if linked, otherwise default
    let lineItems = [
      {
        description: job.title || 'Plumbing Service Completed',
        quantity: 1,
        unitPriceCents: 15000, // $150 default service fee
        taxable: true,
      },
    ];

    let discountCents = 0;

    if (job.source_quote_id) {
      const { data: quoteItems } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', job.source_quote_id)
        .order('sort_order', { ascending: true });

      if (quoteItems && quoteItems.length > 0) {
        lineItems = quoteItems.map((q) => ({
          description: q.description,
          quantity: Number(q.quantity),
          unitPriceCents: Number(q.unit_price_cents),
          taxable: Boolean(q.taxable),
        }));
      }

      const { data: sourceQuote } = await supabase
        .from('quotes')
        .select('discount_cents')
        .eq('id', job.source_quote_id)
        .single();

      if (sourceQuote) {
        discountCents = Number(sourceQuote.discount_cents) || 0;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.create({
      customer_id: job.customer_id,
      source_job_id: job.id,
      source_quote_id: job.source_quote_id || null,
      issue_date: todayStr,
      due_date: dueDate,
      discount_cents: discountCents,
      notes: job.internal_notes || null,
      items: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
        taxable: item.taxable,
      })),
    });
  }

  /**
   * Dispatches invoice to customer and marks status as 'sent'.
   */
  static async send(invoiceId: string): Promise<Invoice> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const invoice = await this.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    transitionInvoiceStatus(invoice.status, 'sent');

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to send invoice: ${error?.message}`);
    return data as Invoice;
  }

  /**
   * Voids an invoice.
   */
  static async void(invoiceId: string): Promise<Invoice> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const invoice = await this.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    const hasPayments = invoice.amount_paid_cents > 0 || (invoice.payments && invoice.payments.length > 0);
    transitionInvoiceStatus(invoice.status, 'void', hasPayments);

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'void',
        voided_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to void invoice: ${error?.message}`);
    return data as Invoice;
  }

  /**
   * Records an offline payment against an invoice and reconciles balance.
   */
  static async recordPayment(invoiceId: string, input: RecordPaymentInput) {
    const { organization, user } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const invoice = await this.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.status === 'paid') {
      throw new Error("Cannot record payment against an already 'paid' invoice.");
    }

    if (invoice.status === 'void') {
      throw new Error("Cannot record payment against a 'void' invoice.");
    }

    // 1. Insert Payment Row
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: organization.id,
        invoice_id: invoiceId,
        amount_cents: input.amount_cents,
        payment_date: input.payment_date,
        payment_method: input.payment_method,
        reference_number: input.reference_number || null,
        notes: input.notes || null,
        recorded_by: user.id,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      throw new Error(`Failed to record payment: ${paymentError?.message}`);
    }

    // 2. Recompute Balance
    const newAmountPaidCents = Number(invoice.amount_paid_cents) + input.amount_cents;
    const newBalanceDueCents = Math.max(0, Number(invoice.total_cents) - newAmountPaidCents);
    const isPaidInFull = newBalanceDueCents === 0;

    const updatePayload: Record<string, any> = {
      amount_paid_cents: newAmountPaidCents,
      balance_due_cents: newBalanceDueCents,
    };

    if (isPaidInFull) {
      updatePayload.status = 'paid';
      updatePayload.paid_at = new Date().toISOString();
    }

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (updateError || !updatedInvoice) {
      throw new Error(`Failed to update invoice balance: ${updateError?.message}`);
    }

    // 3. Write Audit Log
    await supabase.from('audit_logs').insert({
      organization_id: organization.id,
      entity_type: 'invoice',
      entity_id: invoiceId,
      action: isPaidInFull ? 'payment_full' : 'payment_partial',
      actor_id: user.id,
      changes_json: {
        amount_cents: input.amount_cents,
        payment_method: input.payment_method,
        balance_due_cents: newBalanceDueCents,
      },
    });

    return {
      payment,
      invoice: updatedInvoice as Invoice,
    };
  }

  /**
   * Public View: Retrieves invoice by public token.
   */
  static async getByPublicToken(token: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, status, issue_date, due_date,
        subtotal_cents, discount_cents, tax_cents, total_cents,
        amount_paid_cents, balance_due_cents, notes, terms, public_token,
        sent_at, paid_at, voided_at,
        customer:customers(first_name, last_name, company_name, email, phone, address_line1, city, state, postal_code),
        organization:organizations(name, email, phone, address_line1, city, state, postal_code, currency, logo_url),
        items:invoice_items(id, description, quantity, unit_price_cents, taxable, total_cents),
        payments(id, amount_cents, payment_date, payment_method, reference_number)
      `)
      .eq('public_token', token)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Deletes a single invoice, its items, and recorded payments.
   */
  static async delete(invoiceId: string): Promise<void> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();
    const admin = createAdminClient();

    const existing = await this.getById(invoiceId);
    if (!existing) {
      throw new Error('Invoice not found.');
    }

    // Delete associated payments
    await admin
      .from('payments')
      .delete()
      .eq('invoice_id', invoiceId)
      .eq('organization_id', organization.id);

    // Delete associated invoice items
    await admin
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId)
      .eq('organization_id', organization.id);

    // Delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('organization_id', organization.id);

    if (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }
}
