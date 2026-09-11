// ==============================================================================
// src/services/DataManagementService.ts — Workspace Data Management & Purge Logic
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthService } from './AuthService';

export type PurgeEntity = 'invoices' | 'jobs' | 'quotes' | 'customers' | 'all';

export interface WorkspaceStats {
  customersCount: number;
  quotesCount: number;
  jobsCount: number;
  invoicesCount: number;
  paymentsCount: number;
}

export class DataManagementService {
  /**
   * Retrieves live counts of workspace records for the active organization.
   */
  static async getStats(): Promise<WorkspaceStats> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const [customersRes, quotesRes, jobsRes, invoicesRes, paymentsRes] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
    ]);

    return {
      customersCount: customersRes.count || 0,
      quotesCount: quotesRes.count || 0,
      jobsCount: jobsRes.count || 0,
      invoicesCount: invoicesRes.count || 0,
      paymentsCount: paymentsRes.count || 0,
    };
  }

  /**
   * Purges invoices, invoice items, and recorded payments.
   */
  static async purgeInvoices(orgId: string): Promise<void> {
    const admin = createAdminClient();

    // 1. Delete payments
    await admin.from('payments').delete().eq('organization_id', orgId);

    // 2. Delete invoice items
    await admin.from('invoice_items').delete().eq('organization_id', orgId);

    // 3. Delete invoices
    const { error } = await admin.from('invoices').delete().eq('organization_id', orgId);
    if (error) throw new Error(`Failed to purge invoices: ${error.message}`);

    // 4. Reset invoice sequence
    await admin.from('sequences').upsert({
      organization_id: orgId,
      entity_type: 'invoice',
      last_val: 0,
    });
  }

  /**
   * Purges jobs and disconnects jobs from linked invoices.
   */
  static async purgeJobs(orgId: string): Promise<void> {
    const admin = createAdminClient();

    // 1. Nullify source_job_id on invoices
    await admin.from('invoices').update({ source_job_id: null }).eq('organization_id', orgId);

    // 2. Delete jobs
    const { error } = await admin.from('jobs').delete().eq('organization_id', orgId);
    if (error) throw new Error(`Failed to purge jobs: ${error.message}`);

    // 3. Reset job sequence
    await admin.from('sequences').upsert({
      organization_id: orgId,
      entity_type: 'job',
      last_val: 0,
    });
  }

  /**
   * Purges quotes, quote items, and disconnects quotes from linked jobs and invoices.
   */
  static async purgeQuotes(orgId: string): Promise<void> {
    const admin = createAdminClient();

    // 1. Nullify source_quote_id on jobs and invoices
    await admin.from('invoices').update({ source_quote_id: null }).eq('organization_id', orgId);
    await admin.from('jobs').update({ source_quote_id: null }).eq('organization_id', orgId);

    // 2. Delete quote items
    await admin.from('quote_items').delete().eq('organization_id', orgId);

    // 3. Delete quotes
    const { error } = await admin.from('quotes').delete().eq('organization_id', orgId);
    if (error) throw new Error(`Failed to purge quotes: ${error.message}`);

    // 4. Reset quote sequence
    await admin.from('sequences').upsert({
      organization_id: orgId,
      entity_type: 'quote',
      last_val: 0,
    });
  }

  /**
   * Purges customers. Cascades to invoices, jobs, and quotes to respect ON DELETE RESTRICT foreign keys.
   */
  static async purgeCustomers(orgId: string): Promise<void> {
    const admin = createAdminClient();

    // Cascading purge in reverse dependency order:
    await this.purgeInvoices(orgId);
    await this.purgeJobs(orgId);
    await this.purgeQuotes(orgId);

    // Delete customers
    const { error } = await admin.from('customers').delete().eq('organization_id', orgId);
    if (error) throw new Error(`Failed to purge customers: ${error.message}`);
  }

  /**
   * Complete Workspace Reset: Purges all transactional and customer data.
   * Keeps organization profile, memberships, and subscription completely intact.
   */
  static async purgeAll(orgId: string): Promise<void> {
    const admin = createAdminClient();

    // 1. Purge customers (which already cascades to invoices, jobs, and quotes)
    await this.purgeCustomers(orgId);

    // 2. Clean audit logs
    await admin.from('audit_logs').delete().eq('organization_id', orgId);

    // 3. Reset all sequences to 0
    await Promise.all([
      admin.from('sequences').upsert({ organization_id: orgId, entity_type: 'quote', last_val: 0 }),
      admin.from('sequences').upsert({ organization_id: orgId, entity_type: 'job', last_val: 0 }),
      admin.from('sequences').upsert({ organization_id: orgId, entity_type: 'invoice', last_val: 0 }),
    ]);
  }
}
