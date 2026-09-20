import { resend as defaultResend } from '@/lib/resend';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { QuoteSentEmail } from '@/emails/QuoteSentEmail';
import { QuoteAcceptedEmail } from '@/emails/QuoteAcceptedEmail';
import { InvoiceSentEmail } from '@/emails/InvoiceSentEmail';
import { PaymentReceiptEmail } from '@/emails/PaymentReceiptEmail';
import { TenantIntegrationService } from './TenantIntegrationService';

export class NotificationService {
  private static async getClientAndSender(orgId?: string): Promise<{ client: Resend | null; fromEmail: string }> {
    const { apiKey, fromEmail } = await TenantIntegrationService.resolveResendCredentials(orgId);
    if (!apiKey || apiKey.includes('dummy') || apiKey.includes('mock')) {
      return { client: null, fromEmail };
    }
    return {
      client: new Resend(apiKey),
      fromEmail,
    };
  }

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
    orgId?: string;
  }) {
    const { client, fromEmail } = await this.getClientAndSender(params.orgId);
    if (!client) {
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

      return await client.emails.send({
        from: fromEmail,
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
    orgId?: string;
  }) {
    const { client, fromEmail } = await this.getClientAndSender(params.orgId);
    if (!client) {
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

      return await client.emails.send({
        from: fromEmail,
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
    orgId?: string;
  }) {
    const { client, fromEmail } = await this.getClientAndSender(params.orgId);
    if (!client) {
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

      return await client.emails.send({
        from: fromEmail,
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
    orgId?: string;
  }) {
    const { client, fromEmail } = await this.getClientAndSender(params.orgId);
    if (!client) {
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

      return await client.emails.send({
        from: fromEmail,
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
