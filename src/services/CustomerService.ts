// ==============================================================================
// src/services/CustomerService.ts — Customer CRM Operations
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthService } from './AuthService';
import type { CustomerInput } from '@/lib/validations/customer';
import type { Customer } from '@/types/database';

export class CustomerService {
  /**
   * Retrieves customers for the active organization with optional search filter.
   */
  static async list(search?: string, limit = 50, offset = 0): Promise<{ customers: Customer[]; totalCount: number }> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term},address_line1.ilike.${term}`);
    }

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to list customers: ${error.message}`);
    }

    return {
      customers: (data || []) as Customer[],
      totalCount: count || 0,
    };
  }

  /**
   * Retrieves a single customer by ID, guaranteeing tenant isolation.
   */
  static async getById(customerId: string): Promise<Customer | null> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('organization_id', organization.id)
      .single();

    if (error || !data) return null;
    return data as Customer;
  }

  /**
   * Creates a new customer record.
   */
  static async create(input: CustomerInput): Promise<Customer> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customers')
      .insert({
        organization_id: organization.id,
        first_name: input.first_name,
        last_name: input.last_name,
        company_name: input.company_name || null,
        email: input.email || null,
        phone: input.phone,
        address_line1: input.address_line1,
        address_line2: input.address_line2 || null,
        city: input.city,
        state: input.state,
        postal_code: input.postal_code,
        country: input.country,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create customer: ${error?.message}`);
    }

    return data as Customer;
  }

  /**
   * Updates an existing customer record.
   */
  static async update(customerId: string, input: Partial<CustomerInput>): Promise<Customer> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customers')
      .update(input)
      .eq('id', customerId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update customer: ${error?.message}`);
    }

    return data as Customer;
  }

  /**
   * Retrieves count of linked entities (quotes, jobs, invoices) for a customer.
   */
  static async getLinkedEntityCounts(customerId: string): Promise<{ quotesCount: number; jobsCount: number; invoicesCount: number }> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const [quotesRes, jobsRes, invoicesRes] = await Promise.all([
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('customer_id', customerId).eq('organization_id', organization.id),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('customer_id', customerId).eq('organization_id', organization.id),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('customer_id', customerId).eq('organization_id', organization.id),
    ]);

    return {
      quotesCount: quotesRes.count || 0,
      jobsCount: jobsRes.count || 0,
      invoicesCount: invoicesRes.count || 0,
    };
  }

  /**
   * Deletes a customer record.
   * If forceCascade is false and linked records exist, throws a descriptive error.
   * If forceCascade is true, cleanly cascades all dependent transactions.
   */
  static async delete(customerId: string, forceCascade: boolean = false): Promise<void> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();
    const admin = createAdminClient();

    // Check linked records
    const counts = await this.getLinkedEntityCounts(customerId);
    const totalLinked = counts.quotesCount + counts.jobsCount + counts.invoicesCount;

    if (!forceCascade && totalLinked > 0) {
      throw new Error(
        `Cannot delete customer: Customer has ${counts.quotesCount} quote(s), ${counts.jobsCount} job(s), and ${counts.invoicesCount} invoice(s). Confirm cascading deletion to remove all associated records.`
      );
    }

    if (forceCascade && totalLinked > 0) {
      // 1. Get invoice IDs for this customer
      const { data: customerInvoices } = await admin
        .from('invoices')
        .select('id')
        .eq('customer_id', customerId)
        .eq('organization_id', organization.id);
      
      const invoiceIds = (customerInvoices || []).map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await admin.from('payments').delete().in('invoice_id', invoiceIds);
        await admin.from('invoice_items').delete().in('invoice_id', invoiceIds);
        await admin.from('invoices').delete().eq('customer_id', customerId).eq('organization_id', organization.id);
      }

      // 2. Delete jobs
      await admin.from('jobs').delete().eq('customer_id', customerId).eq('organization_id', organization.id);

      // 3. Delete quote items and quotes
      const { data: customerQuotes } = await admin
        .from('quotes')
        .select('id')
        .eq('customer_id', customerId)
        .eq('organization_id', organization.id);
      
      const quoteIds = (customerQuotes || []).map((q) => q.id);
      if (quoteIds.length > 0) {
        await admin.from('quote_items').delete().in('quote_id', quoteIds);
        await admin.from('quotes').delete().eq('customer_id', customerId).eq('organization_id', organization.id);
      }
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('organization_id', organization.id);

    if (error) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Retrieves full activity timeline for a customer (quotes, jobs, invoices).
   */
  static async getTimeline(customerId: string) {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const [quotesRes, jobsRes, invoicesRes] = await Promise.all([
      supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
    ]);

    return {
      quotes: quotesRes.data || [],
      jobs: jobsRes.data || [],
      invoices: invoicesRes.data || [],
    };
  }
}
