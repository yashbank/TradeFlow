import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/InvoiceService';
import { AuthService } from '@/services/AuthService';
import { PdfService } from '@/services/pdf/PdfService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get('token');

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

  try {
    const pdfBuffer = await PdfService.generateInvoicePdf(invoice, organization);
    const filename = `Invoice-${invoice.invoice_number || 'document'}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Failed to generate Invoice PDF:', err);
    return new NextResponse('Error generating PDF.', { status: 500 });
  }
}
