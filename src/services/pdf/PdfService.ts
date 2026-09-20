// ==============================================================================
// src/services/pdf/PdfService.ts — Vector PDF Generation Service
// ==============================================================================

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
// Explicitly import standard fonts so Next.js serverless NFT bundler includes them in Vercel functions
// @ts-ignore
import 'pdfkit/standard-fonts/Helvetica';
// @ts-ignore
import 'pdfkit/standard-fonts/HelveticaBold';
import { QuotePdfDocument } from './QuotePdf';
import { InvoicePdfDocument } from './InvoicePdf';
import type { Quote, Invoice } from '@/types/database';

export class PdfService {
  /**
   * Generates in-memory binary PDF buffer for a Quote.
   */
  static async generateQuotePdf(quote: Quote, organization: any): Promise<Buffer> {
    const doc = React.createElement(QuotePdfDocument, { quote, organization });
    return await renderToBuffer(doc as any);
  }

  /**
   * Generates in-memory binary PDF buffer for an Invoice.
   */
  static async generateInvoicePdf(invoice: Invoice, organization: any): Promise<Buffer> {
    const doc = React.createElement(InvoicePdfDocument, { invoice, organization });
    return await renderToBuffer(doc as any);
  }
}
