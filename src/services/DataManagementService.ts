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

  /**
   * Seeds demo data into the organization workspace:
   * - 10 realistic commercial & residential customers
   * - 25 quotes (draft, sent, accepted, rejected) with line items
   * - 100 jobs (scheduled, in_progress, completed, cancelled) with unassigned pool & assigned techs
   * - 50 invoices (draft, sent, paid, overdue) with line items
   * - 20 recorded payments for paid invoices
   * - 50 audit logs tracking historical operations
   */
  static async seedDemoData(orgId: string, actorUserId?: string): Promise<{
    customersCount: number;
    quotesCount: number;
    jobsCount: number;
    invoicesCount: number;
    paymentsCount: number;
    auditLogsCount: number;
  }> {
    const admin = createAdminClient();

    // 1. Reset existing data to avoid sequence conflicts and guarantee exact record counts
    await this.purgeAll(orgId);

    // 2. Fetch available team members / technicians in the organization
    const { data: teamMembers } = await admin
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId);

    const techIds = (teamMembers || []).map((m) => m.user_id);
    if (actorUserId && !techIds.includes(actorUserId)) {
      techIds.push(actorUserId);
    }

    // 3. Seed 10 Realistic Customers
    const customerTemplates = [
      {
        first_name: 'Sarah',
        last_name: 'Connor',
        company_name: 'Apex General Hospital',
        email: 'facilities@apexgeneral.org',
        phone: '+1 (312) 555-0101',
        address_line1: '1200 Healthcare Way, Suite 400',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60601',
        country: 'US' as const,
        notes: 'Commercial ICU plumbing priority. 24/7 security badge required at loading dock 3.',
      },
      {
        first_name: 'Michael',
        last_name: 'Vance',
        company_name: 'Skyline Highrise Tower',
        email: 'management@skylinetower.com',
        phone: '+1 (312) 555-0102',
        address_line1: '500 Michigan Ave, Floor 14',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60611',
        country: 'US' as const,
        notes: 'Commercial residential high-rise. Water shutoffs strictly between 10 AM - 2 PM.',
      },
      {
        first_name: 'Elena',
        last_name: 'Rostova',
        company_name: 'Oceanview Luxury Hotel',
        email: 'ops@oceanviewhotel.com',
        phone: '+1 (312) 555-0103',
        address_line1: '88 Lakefront Drive',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60602',
        country: 'US' as const,
        notes: 'Hospitality resort spa & 400 guest rooms. Kitchen grease traps & boiler loops.',
      },
      {
        first_name: 'Marcus',
        last_name: 'Holloway',
        company_name: 'Green Valley Academy',
        email: 'campus@greenvalley.edu',
        phone: '+1 (312) 555-0104',
        address_line1: '450 Education Blvd',
        city: 'Oak Park',
        state: 'IL',
        postal_code: '60301',
        country: 'US' as const,
        notes: 'K-12 campus restrooms, science lab emergency eye-wash, and cafeteria piping.',
      },
      {
        first_name: 'Jennifer',
        last_name: 'Walsh',
        company_name: 'Oak Ridge Residential Complex',
        email: 'jennifer@oakridgeapartments.com',
        phone: '+1 (312) 555-0105',
        address_line1: '720 Oak Ridge Way, Bldg B',
        city: 'Evanston',
        state: 'IL',
        postal_code: '60201',
        country: 'US' as const,
        notes: '120-unit garden apartments. Common riser water pressure regulators.',
      },
      {
        first_name: 'Domenico',
        last_name: 'Rossi',
        company_name: 'Metro Gourmet Diner',
        email: 'chef@metrogourmetdiner.com',
        phone: '+1 (312) 555-0106',
        address_line1: '310 South State Street',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60604',
        country: 'US' as const,
        notes: 'Heavy commercial kitchen plumbing. Hydro-jetting scheduled every quarter.',
      },
      {
        first_name: 'Amanda',
        last_name: 'Sterling',
        company_name: 'Summit Galleria Mall',
        email: 'property@summitgalleria.com',
        phone: '+1 (312) 555-0107',
        address_line1: '900 North Michigan Ave',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60611',
        country: 'US' as const,
        notes: 'Retail mall concourse public restrooms and backflow preventer inspection.',
      },
      {
        first_name: 'Robert',
        last_name: 'Chen',
        company_name: 'Sunset Condominiums HOA',
        email: 'board@sunsetcondoshoa.org',
        phone: '+1 (312) 555-0108',
        address_line1: '1400 Sunset Terrace',
        city: 'Skokie',
        state: 'IL',
        postal_code: '60076',
        country: 'US' as const,
        notes: 'Rooftop chiller drainage pumps and subterranean garage sump pump backup.',
      },
      {
        first_name: 'Patricia',
        last_name: 'O\'Connor',
        company_name: 'City Hall & Civic Center',
        email: 'publicworks@civiccenter.gov',
        phone: '+1 (312) 555-0109',
        address_line1: '121 North LaSalle St',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60602',
        country: 'US' as const,
        notes: 'Municipal government complex. Backflow certification & ADA sensor faucets.',
      },
      {
        first_name: 'Brian',
        last_name: 'Kowalski',
        company_name: 'Precision Automotive Center',
        email: 'service@precisionauto.net',
        phone: '+1 (312) 555-0110',
        address_line1: '2500 Industrial Parkway',
        city: 'Cicero',
        state: 'IL',
        postal_code: '60804',
        country: 'US' as const,
        notes: 'Oil/water separator basin pumpout and industrial pneumatic line drainage.',
      },
    ];

    const customerRowsToInsert = customerTemplates.map((c) => ({
      ...c,
      organization_id: orgId,
    }));

    const { data: insertedCustomers, error: custError } = await admin
      .from('customers')
      .insert(customerRowsToInsert)
      .select();

    if (custError || !insertedCustomers || insertedCustomers.length === 0) {
      throw new Error(`Failed to seed customers: ${custError?.message || 'Unknown error'}`);
    }

    const customers = insertedCustomers;

    // 4. Seed 25 Quotes
    const now = new Date();
    const year = now.getFullYear();
    const quoteRows = [];
    const quoteItemRows = [];

    const quoteServicePresets = [
      { desc: 'Commercial Backflow Preventer Testing & City Certification', qty: 1, price: 45000 },
      { desc: 'Hydro-Jet Main Sanitary Sewer Clearing & Camera Inspection', qty: 1, price: 78000 },
      { desc: 'Dual 100-Gallon Commercial Water Heater Replacement & Flue Reroute', qty: 1, price: 320000 },
      { desc: 'Copper Pipe Reroute & Ultrasonic Slab Leak Detection', qty: 1, price: 145000 },
      { desc: 'Grease Trap High-Pressure Jetting & Enzyme Treatment', qty: 1, price: 65000 },
      { desc: 'Subterranean Sump Pump Replacement & Dual Battery Backup', qty: 1, price: 120000 },
      { desc: 'Pressure Reducing Valve (PRV) Rebuild & Pressure Balancing', qty: 1, price: 55000 },
      { desc: 'ADA Restroom Automatic Sensor Faucet & Flush Valve Retrofit', qty: 4, price: 38000 },
    ];

    for (let i = 0; i < 25; i++) {
      const qNum = `QTE-${year}-${String(i + 1).padStart(4, '0')}`;
      const customer = customers[i % customers.length];
      const quoteId = crypto.randomUUID();

      // Status distribution: 5 draft, 5 sent, 12 accepted, 3 rejected
      let status: 'draft' | 'sent' | 'accepted' | 'rejected' = 'draft';
      if (i >= 5 && i < 10) status = 'sent';
      else if (i >= 10 && i < 22) status = 'accepted';
      else if (i >= 22) status = 'rejected';

      const preset1 = quoteServicePresets[i % quoteServicePresets.length];
      const preset2 = quoteServicePresets[(i + 3) % quoteServicePresets.length];

      const item1Total = preset1.qty * preset1.price;
      const item2Total = preset2.qty * preset2.price;
      const subtotalCents = item1Total + item2Total;
      const taxCents = Math.round((subtotalCents * 800) / 10000); // 8% tax
      const totalCents = subtotalCents + taxCents;

      quoteRows.push({
        id: quoteId,
        organization_id: orgId,
        customer_id: customer.id,
        quote_number: qNum,
        status,
        issue_date: new Date(now.getTime() - (25 - i) * 86400000).toISOString(),
        expiry_date: new Date(now.getTime() + 30 * 86400000).toISOString(),
        subtotal_cents: subtotalCents,
        discount_cents: 0,
        tax_cents: taxCents,
        total_cents: totalCents,
        notes: `Proposal for ${customer.company_name || customer.first_name}. All labor warrantied for 12 months.`,
        terms: 'Net 30. Payment upon completion. All permits included.',
        public_token: crypto.randomUUID(),
        created_by: actorUserId || null,
        accepted_at: status === 'accepted' ? new Date(now.getTime() - (20 - i) * 86400000).toISOString() : null,
        accepted_by_name: status === 'accepted' ? `${customer.first_name} ${customer.last_name}` : null,
        rejected_at: status === 'rejected' ? new Date().toISOString() : null,
        rejection_reason: status === 'rejected' ? 'Project deferred to next fiscal quarter' : null,
      });

      quoteItemRows.push(
        {
          id: crypto.randomUUID(),
          organization_id: orgId,
          quote_id: quoteId,
          description: preset1.desc,
          quantity: preset1.qty,
          unit_price_cents: preset1.price,
          taxable: true,
          total_cents: item1Total,
          sort_order: 0,
        },
        {
          id: crypto.randomUUID(),
          organization_id: orgId,
          quote_id: quoteId,
          description: preset2.desc,
          quantity: preset2.qty,
          unit_price_cents: preset2.price,
          taxable: true,
          total_cents: item2Total,
          sort_order: 1,
        }
      );
    }

    const { data: insertedQuotes, error: quotesError } = await admin
      .from('quotes')
      .insert(quoteRows)
      .select();

    if (quotesError || !insertedQuotes) {
      throw new Error(`Failed to seed quotes: ${quotesError?.message || 'Unknown error'}`);
    }

    await admin.from('quote_items').insert(quoteItemRows);

    // 5. Seed 100 Work Orders / Jobs
    // 20 scheduled, 20 in_progress, 50 completed, 10 cancelled
    // 15 pool jobs (assigned_to_user_id: null), 85 assigned
    const jobTitles = [
      'Emergency Main Water Line Rupture & Excavation',
      'Commercial Kitchen Grease Trap Hydro-Jetting',
      'Dual 100-Gallon Commercial Water Heater Replacement',
      'Hospital Wing Medical Gas & Sanitary Waste Line Audit',
      'Subterranean Garage Sump Pump Replacement & Dual Backup',
      'Whole-Building Backflow Preventer Certification',
      'Ultrasonic Acoustic Leak Detection & Slab Pipe Repair',
      'Cast Iron Sewer Stack Replacement & Cleanout Installation',
      'Commercial Restroom Touchless Sensor Flush Valve Retrofit',
      'Rooftop Chiller Condensate Drainage Pipe Jetting',
      'Emergency Boiler Recirculation Pump Replacement',
      'Fire Sprinkler Backflow RPZ Assembly Rebuild',
      'Restaurant Floor Drain Clearing & Bio-Enzyme Treatment',
      'School Chemistry Lab Acid-Resistant Piping Diagnostic',
      'Apartment Building Water Pressure Regulator Balancing',
      'Emergency Domestic Hot Water Tankless Manifold Repair',
      'Storm Water Detention Basin Flap Gate Servicing',
      'Copper Water Service Line Trenchless Pull & Tie-in',
      'Elevator Shaft Sump Pump Float Switch Replacement',
      'Commercial Ice Machine Water Filtration Line Installation',
    ];

    const jobRows = [];
    for (let i = 0; i < 100; i++) {
      const jNum = `ORD-${year}-${String(i + 1).padStart(4, '0')}`;
      const customer = customers[i % customers.length];
      const title = jobTitles[i % jobTitles.length];
      const jobId = crypto.randomUUID();

      // Status distribution: 20 scheduled, 20 in_progress, 50 completed, 10 cancelled
      let status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' = 'scheduled';
      if (i >= 20 && i < 40) status = 'in_progress';
      else if (i >= 40 && i < 90) status = 'completed';
      else if (i >= 90) status = 'cancelled';

      // 15 Unassigned Pool jobs (indices 5 to 19)
      const isPool = i >= 5 && i < 20;
      let assignedUserId: string | null = null;
      if (!isPool && techIds.length > 0) {
        assignedUserId = techIds[i % techIds.length];
      }

      const scheduledStart = new Date(now.getTime() + (i - 40) * 43200000); // spread across past and future
      const scheduledEnd = new Date(scheduledStart.getTime() + 7200000); // 2 hours later

      let startedAt: string | null = null;
      let completedAt: string | null = null;
      let internalNotes: string | null = `Standard dispatch for ${customer.company_name || customer.first_name}.`;

      if (status === 'in_progress') {
        startedAt = new Date(now.getTime() - 45 * 60000).toISOString();
        internalNotes = 'Technician on site. Water shutoff isolated. Diagnostic pressure tests active.';
      } else if (status === 'completed') {
        startedAt = new Date(scheduledStart.getTime()).toISOString();
        completedAt = new Date(scheduledEnd.getTime()).toISOString();
        internalNotes = 'Job completed smoothly. Tested at 65 PSI. Customer signed off on glass.';
      } else if (status === 'cancelled') {
        internalNotes = 'Cancelled by client prior to truck rollout.';
      }

      jobRows.push({
        id: jobId,
        organization_id: orgId,
        customer_id: customer.id,
        source_quote_id: i < 12 ? insertedQuotes[i].id : null,
        job_number: jNum,
        title,
        description: `Full plumbing field dispatch order. Service address: ${customer.address_line1}, ${customer.city}, ${customer.state}.`,
        status,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        assigned_to_user_id: assignedUserId,
        address_line1: customer.address_line1,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postal_code,
        internal_notes: internalNotes,
        started_at: startedAt,
        completed_at: completedAt,
        created_by: actorUserId || null,
      });
    }

    const { data: insertedJobs, error: jobsError } = await admin
      .from('jobs')
      .insert(jobRows)
      .select();

    if (jobsError || !insertedJobs) {
      throw new Error(`Failed to seed jobs: ${jobsError?.message || 'Unknown error'}`);
    }

    // 6. Seed 50 Invoices
    // 10 draft, 15 sent, 20 paid, 5 overdue
    const invoiceRows = [];
    const invoiceItemRows = [];
    const paymentRows = [];

    const invoiceServicePresets = [
      { desc: 'Commercial Mechanical Plumbing & Pipe Diagnostics', qty: 1, price: 65000 },
      { desc: 'Licensed Master Plumber Labor Rate (Quarter-Hour Billing)', qty: 3, price: 18500 },
      { desc: 'Heavy-Duty Brass Pressure Reducing Valve Assembly (1-1/2")', qty: 1, price: 42000 },
      { desc: 'High-Pressure Water Jetter Service Call & Rooter Snaking', qty: 1, price: 85000 },
      { desc: 'Digital Video Pipe Inspection & Recorded USB Footage', qty: 1, price: 35000 },
      { desc: 'Emergency After-Hours Priority Dispatch Surcharge', qty: 1, price: 25000 },
    ];

    for (let i = 0; i < 50; i++) {
      const invNum = `INV-${year}-${String(i + 1).padStart(4, '0')}`;
      const customer = customers[i % customers.length];
      const invoiceId = crypto.randomUUID();

      // Status distribution: 10 draft, 15 sent, 20 paid, 5 overdue
      let status: 'draft' | 'sent' | 'paid' | 'overdue' = 'draft';
      if (i >= 10 && i < 25) status = 'sent';
      else if (i >= 25 && i < 45) status = 'paid';
      else if (i >= 45) status = 'overdue';

      const itemA = invoiceServicePresets[i % invoiceServicePresets.length];
      const itemB = invoiceServicePresets[(i + 2) % invoiceServicePresets.length];

      const itemATotal = itemA.qty * itemA.price;
      const itemBTotal = itemB.qty * itemB.price;
      const subtotalCents = itemATotal + itemBTotal;
      const taxCents = Math.round((subtotalCents * 800) / 10000); // 8%
      const totalCents = subtotalCents + taxCents;

      let amountPaidCents = 0;
      let balanceDueCents = totalCents;
      let paidAt: string | null = null;
      let dueDate = new Date(now.getTime() + 15 * 86400000).toISOString();

      if (status === 'paid') {
        amountPaidCents = totalCents;
        balanceDueCents = 0;
        paidAt = new Date(now.getTime() - (45 - i) * 86400000).toISOString();
      } else if (status === 'overdue') {
        dueDate = new Date(now.getTime() - (15 + (i - 45) * 5) * 86400000).toISOString();
      }

      invoiceRows.push({
        id: invoiceId,
        organization_id: orgId,
        customer_id: customer.id,
        source_job_id: i < insertedJobs.length ? insertedJobs[i].id : null,
        source_quote_id: i < 12 ? insertedQuotes[i].id : null,
        invoice_number: invNum,
        status,
        issue_date: new Date(now.getTime() - (50 - i) * 86400000).toISOString(),
        due_date: dueDate,
        subtotal_cents: subtotalCents,
        discount_cents: 0,
        tax_cents: taxCents,
        total_cents: totalCents,
        amount_paid_cents: amountPaidCents,
        balance_due_cents: balanceDueCents,
        notes: `Invoice for plumbing services rendered to ${customer.company_name || customer.first_name}.`,
        terms: 'Payment due upon receipt. 1.5% interest per month on overdue balances.',
        public_token: crypto.randomUUID(),
        sent_at: status !== 'draft' ? new Date(now.getTime() - (50 - i) * 86400000).toISOString() : null,
        paid_at: paidAt,
        created_by: actorUserId || null,
      });

      invoiceItemRows.push(
        {
          id: crypto.randomUUID(),
          organization_id: orgId,
          invoice_id: invoiceId,
          description: itemA.desc,
          quantity: itemA.qty,
          unit_price_cents: itemA.price,
          taxable: true,
          total_cents: itemATotal,
          sort_order: 0,
        },
        {
          id: crypto.randomUUID(),
          organization_id: orgId,
          invoice_id: invoiceId,
          description: itemB.desc,
          quantity: itemB.qty,
          unit_price_cents: itemB.price,
          taxable: true,
          total_cents: itemBTotal,
          sort_order: 1,
        }
      );

      // Create Payment entry for paid invoices
      if (status === 'paid') {
        const paymentMethods: Array<'credit_card' | 'bank_transfer' | 'check'> = [
          'credit_card',
          'bank_transfer',
          'check',
        ];
        paymentRows.push({
          id: crypto.randomUUID(),
          organization_id: orgId,
          invoice_id: invoiceId,
          amount_cents: totalCents,
          payment_date: paidAt || new Date().toISOString(),
          payment_method: paymentMethods[i % paymentMethods.length],
          reference_number: `TXN-${year}-${String(1000 + i)}`,
          notes: `Automatic payment confirmation for invoice ${invNum}`,
          recorded_by: actorUserId || null,
        });
      }
    }

    const { error: invoicesError } = await admin.from('invoices').insert(invoiceRows);
    if (invoicesError) {
      throw new Error(`Failed to seed invoices: ${invoicesError.message}`);
    }

    await admin.from('invoice_items').insert(invoiceItemRows);

    if (paymentRows.length > 0) {
      await admin.from('payments').insert(paymentRows);
    }

    // 7. Seed 50 Audit Logs
    const auditLogRows = [];
    const auditActions = [
      'job.created',
      'job.dispatched',
      'job.started',
      'job.completed',
      'invoice.generated',
      'invoice.payment_recorded',
      'quote.created',
      'quote.approved',
      'customer.created',
    ];

    for (let i = 0; i < 50; i++) {
      const action = auditActions[i % auditActions.length];
      const entityType = action.split('.')[0];
      const entityId =
        entityType === 'job'
          ? insertedJobs[i % insertedJobs.length].id
          : entityType === 'invoice'
          ? invoiceRows[i % invoiceRows.length].id
          : entityType === 'quote'
          ? insertedQuotes[i % insertedQuotes.length].id
          : customers[i % customers.length].id;

      auditLogRows.push({
        id: crypto.randomUUID(),
        organization_id: orgId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        actor_id: actorUserId || null,
        changes_json: {
          event: action,
          timestamp: new Date(now.getTime() - (50 - i) * 3600000).toISOString(),
          details: `Telemetry log for ${action} on entity ${entityId.substring(0, 8)}`,
        },
        created_at: new Date(now.getTime() - (50 - i) * 3600000).toISOString(),
      });
    }

    await admin.from('audit_logs').insert(auditLogRows);

    // 8. Update Sequences so new additions start after seeded records
    await Promise.all([
      admin.from('sequences').upsert({ organization_id: orgId, entity_type: 'quote', last_val: 25 }),
      admin.from('sequences').upsert({ organization_id: orgId, entity_type: 'job', last_val: 100 }),
      admin.from('sequences').upsert({ organization_id: orgId, entity_type: 'invoice', last_val: 50 }),
    ]);

    return {
      customersCount: customers.length,
      quotesCount: 25,
      jobsCount: 100,
      invoicesCount: 50,
      paymentsCount: paymentRows.length,
      auditLogsCount: auditLogRows.length,
    };
  }
}

