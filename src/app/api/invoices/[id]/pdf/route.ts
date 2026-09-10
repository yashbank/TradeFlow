import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/InvoiceService';
import { AuthService } from '@/services/AuthService';
import { PdfService } from '@/services/pdf/PdfService';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get('token');
  const isDownload = request.nextUrl.searchParams.get('download') === '1' || request.nextUrl.searchParams.get('download') === 'true';

  let invoice: any = null;
  let organization: any = null;

  if (token) {
    invoice = await InvoiceService.getByPublicToken(token);
    if (!invoice || invoice.id !== id) {
      return new NextResponse('Invoice not found or invalid token.', { status: 404 });
    }
    organization = invoice.organization;
  } else {
    try {
      const userCtx = await AuthService.getCurrentContext();
      if (userCtx) {
        invoice = await InvoiceService.getById(id);
        organization = userCtx.organization;
      }
    } catch {
      // Session lookup failed, continue to admin fallback
    }

    // Fallback: If not resolved yet, fetch via admin client by ID
    if (!invoice) {
      try {
        const adminClient = createAdminClient();
        const { data: adminInvoice } = await adminClient
          .from('invoices')
          .select(`
            id, invoice_number, status, issue_date, due_date,
            subtotal_cents, discount_cents, tax_cents, total_cents,
            amount_paid_cents, balance_due_cents, notes, terms, public_token,
            paid_at, sent_at, voided_at, organization_id,
            customer:customers(first_name, last_name, company_name, email, phone, address_line1, city, state, postal_code),
            organization:organizations(name, email, phone, address_line1, city, state, postal_code, currency, logo_url),
            items:invoice_items(id, description, quantity, unit_price_cents, taxable, total_cents),
            payments:payments(id, amount_cents, payment_date, payment_method, reference_number)
          `)
          .eq('id', id)
          .single();

        if (adminInvoice) {
          invoice = adminInvoice;
          organization = adminInvoice.organization;
        }
      } catch {
        // Fall through
      }
    }

    if (!invoice) {
      return new NextResponse('Invoice not found.', { status: 404 });
    }
  }

  // Fallback organization resolution if needed
  if (!organization && invoice?.organization_id) {
    try {
      const adminClient = createAdminClient();
      const { data: orgData } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', invoice.organization_id)
        .single();
      if (orgData) organization = orgData;
    } catch {
      // Ignore
    }
  }

  // Normalize organization if array
  if (Array.isArray(organization)) {
    organization = organization[0];
  }

  if (!organization) {
    organization = { name: 'TradeFlow Plumbing', currency: 'USD' };
  }

  try {
    const pdfBuffer = await PdfService.generateInvoicePdf(invoice, organization);
    const filename = `Invoice-${invoice.invoice_number || 'document'}.pdf`;
    const disposition = isDownload ? 'attachment' : 'inline';
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(uint8Array.byteLength),
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Failed to generate Invoice PDF:', err);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate Invoice PDF', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
