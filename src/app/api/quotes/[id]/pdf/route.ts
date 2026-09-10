import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/services/QuoteService';
import { AuthService } from '@/services/AuthService';
import { PdfService } from '@/services/pdf/PdfService';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get('token');

  let quote: any = null;
  let organization: any = null;

  if (token) {
    quote = await QuoteService.getByPublicToken(token);
    if (!quote || quote.id !== id) {
      return new NextResponse('Quote not found or invalid token.', { status: 404 });
    }
    organization = quote.organization;
  } else {
    const userCtx = await AuthService.getCurrentContext();
    if (!userCtx) {
      return new NextResponse('Unauthorized: Session required to access document.', { status: 401 });
    }
    quote = await QuoteService.getById(id);
    if (!quote) {
      return new NextResponse('Quote not found.', { status: 404 });
    }
    organization = userCtx.organization;
  }

  try {
    const pdfBuffer = await PdfService.generateQuotePdf(quote, organization);
    const filename = `Quote-${quote.quote_number || 'document'}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Failed to generate Quote PDF:', err);
    return new NextResponse('Error generating PDF.', { status: 500 });
  }
}
