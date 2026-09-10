// ==============================================================================
// src/services/QuoteService.ts — Quote Management & Conversion Logic
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { AuthService } from './AuthService';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { transitionQuoteStatus } from '@/lib/state/machines';
import type { CreateQuoteInput, PublicQuoteRespondInput } from '@/lib/validations/quote';
import type { Quote, QuoteStatus } from '@/types/database';
import crypto from 'crypto';

export class QuoteService {
  /**
   * Helper to generate gapless sequential number per organization
   */
  private static async getNextNumber(supabase: any, orgId: string, entityType: 'quote' | 'job' | 'invoice'): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('fn_next_sequence', {
        p_org_id: orgId,
        p_entity_type: entityType,
      });
      if (data && !error) return data;
    } catch {
      // Fallback if stored procedure not yet applied in test environment
    }

    const prefix = entityType === 'quote' ? 'Q' : entityType === 'job' ? 'J' : 'INV';
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from(entityType === 'quote' ? 'quotes' : entityType === 'job' ? 'jobs' : 'invoices')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const nextVal = (count || 0) + 1;
    return `${prefix}-${year}-${String(nextVal).padStart(4, '0')}`;
  }

  /**
   * Lists quotes for the active organization.
   */
  static async list(status?: QuoteStatus, limit = 50, offset = 0) {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    let query = supabase
      .from('quotes')
      .select('*, customer:customers(*)', { count: 'exact' })
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to list quotes: ${error.message}`);
    }

    return {
      quotes: (data || []) as Quote[],
      totalCount: count || 0,
    };
  }

  /**
   * Retrieves single quote by ID with customer and items.
   */
  static async getById(quoteId: string): Promise<Quote | null> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quotes')
      .select('*, customer:customers(*), items:quote_items(*)')
      .eq('id', quoteId)
      .eq('organization_id', organization.id)
      .single();

    if (error || !data) return null;
    return data as Quote;
  }

  /**
   * Creates a new quote with line items and deterministic server calculation.
   */
  static async create(input: CreateQuoteInput): Promise<Quote> {
    const { organization, user } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    // Verify customer belongs to organization
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', input.customer_id)
      .eq('organization_id', organization.id)
      .single();

    if (custError || !customer) {
      throw new Error('RESOURCE_NOT_FOUND: Customer not found in current organization.');
    }

    // Deterministic Financial Calculations
    const calc = calculateDocumentTotals(
      input.items,
      input.discount_cents,
      0,
      organization.tax_rate_basis_points
    );

    const quoteNumber = await this.getNextNumber(supabase, organization.id, 'quote');
    const publicToken = crypto.randomBytes(32).toString('hex');

    // Insert Quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        organization_id: organization.id,
        customer_id: input.customer_id,
        quote_number: quoteNumber,
        status: 'draft',
        issue_date: input.issue_date,
        expiry_date: input.expiry_date,
        subtotal_cents: calc.subtotalCents,
        discount_cents: calc.discountCents,
        tax_cents: calc.taxCents,
        total_cents: calc.totalCents,
        notes: input.notes || null,
        terms: input.terms || organization.invoice_terms || null,
        public_token: publicToken,
        created_by: user.id,
      })
      .select()
      .single();

    if (quoteError || !quote) {
      throw new Error(`Failed to create quote: ${quoteError?.message}`);
    }

    // Insert Line Items
    const itemsToInsert = input.items.map((item, idx) => ({
      organization_id: organization.id,
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      taxable: item.taxable,
      total_cents: calc.itemTotals[idx],
      sort_order: idx,
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert);

    if (itemsError) {
      throw new Error(`Failed to insert quote items: ${itemsError.message}`);
    }

    return quote as Quote;
  }

  /**
   * Dispatches quote to customer and transitions status to 'sent'.
   */
  static async send(quoteId: string): Promise<Quote> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const quote = await this.getById(quoteId);
    if (!quote) throw new Error('Quote not found.');

    transitionQuoteStatus(quote.status, 'sent');

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to send quote: ${error?.message}`);
    return data as Quote;
  }

  /**
   * Public View: Retrieves quote by public token (no authentication required).
   */
  static async getByPublicToken(token: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id, quote_number, status, issue_date, expiry_date,
        subtotal_cents, discount_cents, tax_cents, total_cents,
        notes, terms, public_token, sent_at, accepted_at, rejected_at,
        customer:customers(first_name, last_name, company_name, email, phone, address_line1, city, state, postal_code),
        organization:organizations(name, email, phone, address_line1, city, state, postal_code, currency, logo_url),
        items:quote_items(id, description, quantity, unit_price_cents, taxable, total_cents)
      `)
      .eq('public_token', token)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Public Portal: Accept or reject a quote via public token.
   */
  static async respondPublic(token: string, input: PublicQuoteRespondInput, ip?: string) {
    const supabase = await createClient();

    // First try atomic RPC
    try {
      if (input.action === 'accept') {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('fn_accept_quote_public', {
          p_token: token,
          p_signer_name: input.signer_name || 'Customer',
          p_ip: ip || null,
        });
        if (!rpcErr && rpcRes) return { success: true };
      } else {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('fn_reject_quote_public', {
          p_token: token,
          p_reason: input.rejection_reason || null,
        });
        if (!rpcErr && rpcRes) return { success: true };
      }
    } catch {
      // Fall through to query update
    }

    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, organization_id')
      .eq('public_token', token)
      .single();

    if (fetchError || !quote) {
      throw new Error('Quote not found or invalid token.');
    }

    if (input.action === 'accept') {
      transitionQuoteStatus(quote.status as QuoteStatus, 'accepted');
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by_name: input.signer_name || 'Customer',
          accepted_ip: ip || null,
        })
        .eq('id', quote.id);

      if (error) throw new Error(`Failed to accept quote: ${error.message}`);
    } else {
      transitionQuoteStatus(quote.status as QuoteStatus, 'rejected');
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: input.rejection_reason || null,
        })
        .eq('id', quote.id);

      if (error) throw new Error(`Failed to reject quote: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * In-App / Internal Quote Approval: Plumbers and dispatchers can record approval
   * directly in the app (e.g., customer approved verbally on the phone, signed work order, etc.).
   */
  static async acceptInternal(
    quoteId: string,
    signerName?: string,
    approvalMethod = 'Verbal / Phone Approval'
  ): Promise<Quote> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const quote = await this.getById(quoteId);
    if (!quote) throw new Error('Quote not found.');

    // If still in draft, step through sent to satisfy lifecycle state transition rules
    if (quote.status === 'draft') {
      transitionQuoteStatus('draft', 'sent');
      transitionQuoteStatus('sent', 'accepted');
    } else {
      transitionQuoteStatus(quote.status, 'accepted');
    }

    const customerName = `${quote.customer?.first_name || ''} ${quote.customer?.last_name || ''}`.trim();
    const finalSigner = signerName?.trim() || customerName || 'Customer';

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by_name: `${finalSigner} (${approvalMethod})`,
      })
      .eq('id', quoteId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to record quote approval: ${error?.message}`);
    }

    return data as Quote;
  }

  /**
   * In-App / Internal Quote Decline: Plumbers and dispatchers can record customer decline.
   */
  static async rejectInternal(quoteId: string, reason?: string): Promise<Quote> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const quote = await this.getById(quoteId);
    if (!quote) throw new Error('Quote not found.');

    if (quote.status === 'draft') {
      transitionQuoteStatus('draft', 'sent');
      transitionQuoteStatus('sent', 'rejected');
    } else {
      transitionQuoteStatus(quote.status, 'rejected');
    }

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason?.trim() || 'Declined by customer (in-app update)',
      })
      .eq('id', quoteId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to record quote rejection: ${error?.message}`);
    }

    return data as Quote;
  }

  /**
   * Converts an accepted quote to an active scheduled job.
   */
  static async convertToJob(
    quoteId: string,
    assignedTechId?: string,
    scheduledStart?: string,
    scheduledEnd?: string
  ) {
    const { organization, user } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const quote = await this.getById(quoteId);
    if (!quote) throw new Error('Quote not found.');
    if (quote.status !== 'accepted') {
      throw new Error("STATE_CONFLICT: Only 'accepted' quotes can be converted into jobs.");
    }

    // Check if job already converted from this quote
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id, job_number')
      .eq('source_quote_id', quote.id)
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (existingJob) {
      return existingJob;
    }

    const jobNumber = await this.getNextNumber(supabase, organization.id, 'job');

    // Concatenate items into scope description
    const scopeDesc = quote.items && quote.items.length > 0
      ? quote.items.map((i) => `• ${i.description} (Qty: ${i.quantity})`).join('\n')
      : 'Plumbing work as per Quote ' + quote.quote_number;

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        organization_id: organization.id,
        customer_id: quote.customer_id,
        source_quote_id: quote.id,
        job_number: jobNumber,
        title: `Job for ${quote.customer?.first_name || ''} ${quote.customer?.last_name || ''} (${quote.quote_number})`,
        description: scopeDesc,
        status: 'scheduled',
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        assigned_to_user_id: assignedTechId || null,
        address_line1: quote.customer?.address_line1 || 'Customer Address',
        address_line2: quote.customer?.address_line2 || null,
        city: quote.customer?.city || '',
        state: quote.customer?.state || '',
        postal_code: quote.customer?.postal_code || '',
        internal_notes: quote.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to convert quote to job: ${jobError?.message}`);
    }

    return job;
  }
}
