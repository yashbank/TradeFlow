// ==============================================================================
// src/services/DashboardService.ts — Real-time Operational KPIs
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { AuthService } from './AuthService';

export interface DashboardMetrics {
  revenueMtdCents: number;
  outstandingReceivablesCents: number;
  overdueInvoicesCount: number;
  overdueInvoicesCents: number;
  openQuotesCount: number;
  openQuotesTotalCents: number;
  upcomingJobsTodayCount: number;
  quoteWinRatePercentage: number;
  currency: string;
}

export class DashboardService {
  static async getMetrics(): Promise<DashboardMetrics> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel aggregate queries
    const [paymentsRes, outstandingRes, overdueRes, quotesRes, jobsRes, trailingQuotesRes] =
      await Promise.all([
        // 1. Revenue MTD
        supabase
          .from('payments')
          .select('amount_cents')
          .eq('organization_id', organization.id)
          .gte('payment_date', firstDayOfMonth),

        // 2. Outstanding Receivables
        supabase
          .from('invoices')
          .select('balance_due_cents')
          .eq('organization_id', organization.id)
          .in('status', ['sent', 'overdue']),

        // 3. Overdue Invoices
        supabase
          .from('invoices')
          .select('balance_due_cents')
          .eq('organization_id', organization.id)
          .eq('status', 'overdue'),

        // 4. Open Quotes
        supabase
          .from('quotes')
          .select('total_cents')
          .eq('organization_id', organization.id)
          .eq('status', 'sent'),

        // 5. Jobs Today
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('scheduled_start', `${todayStr}T00:00:00Z`)
          .lte('scheduled_start', `${todayStr}T23:59:59Z`),

        // 6. Trailing 30-Day Quotes for Win Rate
        supabase
          .from('quotes')
          .select('status')
          .eq('organization_id', organization.id)
          .gte('created_at', thirtyDaysAgo),
      ]);

    const revenueMtdCents = (paymentsRes.data || []).reduce(
      (sum, p) => sum + Number(p.amount_cents),
      0
    );

    const outstandingReceivablesCents = (outstandingRes.data || []).reduce(
      (sum, inv) => sum + Number(inv.balance_due_cents),
      0
    );

    const overdueInvoicesCount = overdueRes.data ? overdueRes.data.length : 0;
    const overdueInvoicesCents = (overdueRes.data || []).reduce(
      (sum, inv) => sum + Number(inv.balance_due_cents),
      0
    );

    const openQuotesCount = quotesRes.data ? quotesRes.data.length : 0;
    const openQuotesTotalCents = (quotesRes.data || []).reduce(
      (sum, q) => sum + Number(q.total_cents),
      0
    );

    const upcomingJobsTodayCount = jobsRes.count || 0;

    // Quote Win Rate calculation
    const trailingQuotes = trailingQuotesRes.data || [];
    const acceptedCount = trailingQuotes.filter((q) => q.status === 'accepted').length;
    const closedCount = trailingQuotes.filter((q) =>
      ['sent', 'accepted', 'rejected'].includes(q.status)
    ).length;

    const quoteWinRatePercentage =
      closedCount > 0 ? Math.round((acceptedCount / closedCount) * 100) : 0;

    return {
      revenueMtdCents,
      outstandingReceivablesCents,
      overdueInvoicesCount,
      overdueInvoicesCents,
      openQuotesCount,
      openQuotesTotalCents,
      upcomingJobsTodayCount,
      quoteWinRatePercentage,
      currency: organization.currency,
    };
  }

  static async getRecentActivity() {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const [jobsRes, quotesRes, invoicesRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, customer:customers(first_name, last_name)')
        .eq('organization_id', organization.id)
        .order('scheduled_start', { ascending: true, nullsFirst: false })
        .limit(5),
      supabase
        .from('quotes')
        .select('*, customer:customers(first_name, last_name)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('invoices')
        .select('*, customer:customers(first_name, last_name)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return {
      recentJobs: jobsRes.data || [],
      recentQuotes: quotesRes.data || [],
      recentInvoices: invoicesRes.data || [],
    };
  }
}
