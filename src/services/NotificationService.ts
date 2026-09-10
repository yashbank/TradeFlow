// ==============================================================================
// src/services/NotificationService.ts — Transactional Email Delivery via Resend & React Email
// ==============================================================================

import { resend } from '@/lib/resend';
import { render } from '@react-email/render';
import { QuoteSentEmail } from '@/emails/QuoteSentEmail';
import { QuoteAcceptedEmail } from '@/emails/QuoteAcceptedEmail';
import { InvoiceSentEmail } from '@/emails/InvoiceSentEmail';
import { PaymentReceiptEmail } from '@/emails/PaymentReceiptEmail';

export class NotificationService {
  private static readonly FROM_EMAIL = process.env.EMAIL_FROM || 'TradeFlow <notifications@tradeflow.app>';

  /**
   * Dispatches Quote Sent email to the homeowner with a direct link to the approval portal.
   */
  static async sendQuoteEmail(params: {
    customerEmail: string;
    customerName: string;
    businessName: string;
    quoteNumber: string;
    totalFormatted: string;
    publicUrl: string;
  }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy') || process.env.RESEND_API_KEY.includes('mock')) {
      console.log(`[Email Mock] Quote Email to ${params.customerEmail}: ${params.publicUrl}`);
      return { id: 'mock_quote_email_id' };
    }

    try {
      const emailHtml = await render(
        QuoteSentEmail({
          customerName: params.customerName,
          businessName: params.businessName,
          quoteNumber: params.quoteNumber,
          totalFormatted: params.totalFormatted,
          publicUrl: params.publicUrl,
        })
      );

      return await resend.emails.send({
        from: this.FROM_EMAIL,
        to: params.customerEmail,
        subject: `Quote ${params.quoteNumber} from ${params.businessName}`,
        html: emailHtml,
      });
    } catch (err: any) {
      console.error('Failed to send quote email via Resend:', err?.message);
      return null;
    }
  }

  /**
   * Dispatches Quote Accepted notification email to the plumbing business owner.
   */
  static async sendQuoteAcceptedNotice(params: {
    ownerEmail: string;
    customerName: string;
    businessName: string;
    quoteNumber: string;
    totalFormatted: string;
    signerName: string;
    jobConvertUrl: string;
  }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy') || process.env.RESEND_API_KEY.includes('mock')) {
      console.log(`[Email Mock] Quote Accepted notice to ${params.ownerEmail}`);
      return { id: 'mock_accepted_email_id' };
    }

    try {
      const emailHtml = await render(
        QuoteAcceptedEmail({
          customerName: params.customerName,
          businessName: params.businessName,
          quoteNumber: params.quoteNumber,
          totalFormatted: params.totalFormatted,
          signerName: params.signerName,
          jobConvertUrl: params.jobConvertUrl,
        })
      );

      return await resend.emails.send({
        from: this.FROM_EMAIL,
        to: params.ownerEmail,
        subject: `🎉 Quote ${params.quoteNumber} Approved by ${params.customerName}!`,
        html: emailHtml,
      });
    } catch (err: any) {
      console.error('Failed to send quote accepted email via Resend:', err?.message);
      return null;
    }
  }

  /**
   * Dispatches Invoice Sent email to the homeowner with payment instructions and portal link.
   */
  static async sendInvoiceEmail(params: {
    customerEmail: string;
    customerName: string;
    businessName: string;
    invoiceNumber: string;
    totalFormatted: string;
    dueDate: string;
    publicUrl: string;
  }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy') || process.env.RESEND_API_KEY.includes('mock')) {
      console.log(`[Email Mock] Invoice Email to ${params.customerEmail}: ${params.publicUrl}`);
      return { id: 'mock_invoice_email_id' };
    }

    try {
      const emailHtml = await render(
        InvoiceSentEmail({
          customerName: params.customerName,
          businessName: params.businessName,
          invoiceNumber: params.invoiceNumber,
          totalFormatted: params.totalFormatted,
          dueDate: params.dueDate,
          publicUrl: params.publicUrl,
        })
      );

      return await resend.emails.send({
        from: this.FROM_EMAIL,
        to: params.customerEmail,
        subject: `Invoice ${params.invoiceNumber} from ${params.businessName}`,
        html: emailHtml,
      });
    } catch (err: any) {
      console.error('Failed to send invoice email via Resend:', err?.message);
      return null;
    }
  }

  /**
   * Dispatches Payment Receipt email to the customer upon payment recording.
   */
  static async sendPaymentReceiptEmail(params: {
    customerEmail: string;
    customerName: string;
    businessName: string;
    invoiceNumber: string;
    amountPaidFormatted: string;
    balanceDueFormatted: string;
    paymentMethod: string;
    referenceNumber?: string | null;
  }) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy') || process.env.RESEND_API_KEY.includes('mock')) {
      console.log(`[Email Mock] Payment Receipt to ${params.customerEmail}: ${params.amountPaidFormatted}`);
      return { id: 'mock_receipt_email_id' };
    }

    try {
      const emailHtml = await render(
        PaymentReceiptEmail({
          customerName: params.customerName,
          businessName: params.businessName,
          invoiceNumber: params.invoiceNumber,
          amountPaidFormatted: params.amountPaidFormatted,
          balanceDueFormatted: params.balanceDueFormatted,
          paymentMethod: params.paymentMethod,
          referenceNumber: params.referenceNumber,
        })
      );

      return await resend.emails.send({
        from: this.FROM_EMAIL,
        to: params.customerEmail,
        subject: `Payment Receipt for ${params.invoiceNumber} - ${params.businessName}`,
        html: emailHtml,
      });
    } catch (err: any) {
      console.error('Failed to send payment receipt email via Resend:', err?.message);
      return null;
    }
  }
}
