// ==============================================================================
// src/services/NotificationService.ts — Transactional Email Delivery via Resend
// ==============================================================================

import { resend } from '@/lib/resend';

export class NotificationService {
  private static readonly FROM_EMAIL = process.env.EMAIL_FROM || 'TradeFlow <notifications@tradeflow.app>';

  static async sendQuoteEmail(params: {
    customerEmail: string;
    customerName: string;
    businessName: string;
    quoteNumber: string;
    totalFormatted: string;
    publicUrl: string;
  }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy')) {
      console.log(`[Email Mock] Sent Quote Email to ${params.customerEmail}: ${params.publicUrl}`);
      return { id: 'mock_quote_email_id' };
    }

    try {
      return await resend.emails.send({
        from: this.FROM_EMAIL,
        to: params.customerEmail,
        subject: `Quote ${params.quoteNumber} from ${params.businessName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1e3a8a;">${params.businessName}</h2>
            <p>Dear ${params.customerName},</p>
            <p>We have prepared quote <strong>${params.quoteNumber}</strong> for you amounting to <strong>${params.totalFormatted}</strong>.</p>
            <p>You can review line items, warranty terms, and approve or decline the quote directly on your phone or computer by clicking below:</p>
            <p style="margin: 30px 0;">
              <a href="${params.publicUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Review & Approve Quote
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">If the button above does not work, copy and paste this link into your browser:<br/>${params.publicUrl}</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.error('Failed to send quote email via Resend:', err?.message);
      return null;
    }
  }

  static async sendInvoiceEmail(params: {
    customerEmail: string;
    customerName: string;
    businessName: string;
    invoiceNumber: string;
    totalFormatted: string;
    dueDate: string;
    publicUrl: string;
  }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy')) {
      console.log(`[Email Mock] Sent Invoice Email to ${params.customerEmail}: ${params.publicUrl}`);
      return { id: 'mock_invoice_email_id' };
    }

    try {
      return await resend.emails.send({
        from: this.FROM_EMAIL,
        to: params.customerEmail,
        subject: `Invoice ${params.invoiceNumber} from ${params.businessName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1e3a8a;">${params.businessName}</h2>
            <p>Dear ${params.customerName},</p>
            <p>Thank you for choosing ${params.businessName}. Your invoice <strong>${params.invoiceNumber}</strong> for <strong>${params.totalFormatted}</strong> is now ready.</p>
            <p>Payment Due Date: <strong>${params.dueDate}</strong></p>
            <p style="margin: 30px 0;">
              <a href="${params.publicUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Invoice & Payment Details
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">Link: ${params.publicUrl}</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.error('Failed to send invoice email via Resend:', err?.message);
      return null;
    }
  }
}
