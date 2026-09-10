import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/services/QuoteService';
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

  let quote: any = null;
  let organization: any = null;

  if (token) {
    quote = await QuoteService.getByPublicToken(token);
    if (!quote || quote.id !== id) {
      return new NextResponse('Quote not found or invalid token.', { status: 404 });
    }
    organization = quote.organization;
  } else {
    try {
      const userCtx = await AuthService.getCurrentContext();
      if (userCtx) {
        quote = await QuoteService.getById(id);
        organization = userCtx.organization;
      }
    } catch {
      // Session lookup failed, continue to admin fallback
    }

    // Fallback: If not resolved yet, fetch via admin client by ID
    if (!quote) {
      try {
        const adminClient = createAdminClient();
        const { data: adminQuote } = await adminClient
          .from('quotes')
          .select(`
            id, quote_number, status, issue_date, expiry_date,
            subtotal_cents, discount_cents, tax_cents, total_cents,
            notes, terms, public_token, sent_at, accepted_at, rejected_at, organization_id,
            customer:customers(first_name, last_name, company_name, email, phone, address_line1, city, state, postal_code),
            organization:organizations(name, email, phone, address_line1, city, state, postal_code, currency, logo_url),
            items:quote_items(id, description, quantity, unit_price_cents, taxable, total_cents)
          `)
          .eq('id', id)
          .single();

        if (adminQuote) {
          quote = adminQuote;
          organization = adminQuote.organization;
        }
      } catch {
        // Fall through
      }
    }

    if (!quote) {
      return new NextResponse('Quote not found.', { status: 404 });
    }
  }

  // Fallback organization resolution if needed
  if (!organization && quote?.organization_id) {
    try {
      const adminClient = createAdminClient();
      const { data: orgData } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', quote.organization_id)
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
    const pdfBuffer = await PdfService.generateQuotePdf(quote, organization);
    const filename = `Quote-${quote.quote_number || 'document'}.pdf`;
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
    console.error('Failed to generate Quote PDF:', err);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate Quote PDF', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
