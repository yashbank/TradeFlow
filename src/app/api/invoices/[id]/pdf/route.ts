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
    const userCtx = await AuthService.getCurrentContext();
    if (!userCtx) {
      return new NextResponse('Unauthorized: Session required to access document.', { status: 401 });
    }
    invoice = await InvoiceService.getById(id);
    if (!invoice) {
      return new NextResponse('Invoice not found.', { status: 404 });
    }
    organization = userCtx.organization;
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
