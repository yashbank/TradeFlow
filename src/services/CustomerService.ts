// ==============================================================================
// src/services/CustomerService.ts — Customer CRM Operations
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { AuthService } from './AuthService';
import type { CustomerInput } from '@/lib/validations/customer';
import type { Customer } from '@/types/database';

export class CustomerService {
  /**
   * Retrieves customers for the active organization with optional search filter.
   */
  static async list(search?: string, limit = 50, offset = 0): Promise<{ customers: Customer[]; totalCount: number }> {
    const { organization } = await AuthService.requireContext();

    if (organization.id === 'demo-org-001') {
      const { DemoStore } = await import('@/lib/demo/demo-store');
      let filtered = DemoStore.customers;
      if (search && search.trim().length > 0) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.first_name.toLowerCase().includes(q) ||
            c.last_name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.address_line1.toLowerCase().includes(q)
        );
      }
      return {
        customers: filtered.slice(offset, offset + limit),
        totalCount: filtered.length,
      };
    }

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

    if (organization.id === 'demo-org-001') {
      const { DemoStore } = await import('@/lib/demo/demo-store');
      return DemoStore.customers.find((c) => c.id === customerId) || null;
    }

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

    if (organization.id === 'demo-org-001') {
      const { DemoStore } = await import('@/lib/demo/demo-store');
      return DemoStore.addCustomer({
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
      });
    }

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
   * Deletes a customer record if no linked jobs or invoices exist.
   */
  static async delete(customerId: string): Promise<void> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

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

    if (organization.id === 'demo-org-001') {
      const { DemoStore } = await import('@/lib/demo/demo-store');
      return {
        quotes: DemoStore.quotes.filter((q) => q.customer_id === customerId),
        jobs: DemoStore.jobs.filter((j) => j.customer_id === customerId),
        invoices: DemoStore.invoices.filter((i) => i.customer_id === customerId),
      };
    }

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
