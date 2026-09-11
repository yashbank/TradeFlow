'use server';

import { InvoiceService } from '@/services/InvoiceService';
import { AuthService } from '@/services/AuthService';
import { NotificationService } from '@/services/NotificationService';
import {
  CreateInvoiceSchema,
  RecordPaymentSchema,
  type CreateInvoiceInput,
  type RecordPaymentInput,
} from '@/lib/validations/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function createInvoiceAction(input: CreateInvoiceInput) {
  const parsed = CreateInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const invoice = await InvoiceService.create(parsed.data);
    revalidatePath('/invoices');
    return {
      success: true,
      data: invoice,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function sendInvoiceAction(invoiceId: string) {
  try {
    const invoice = await InvoiceService.send(invoiceId);
    const fullInvoice = await InvoiceService.getById(invoiceId);

    if (fullInvoice && fullInvoice.customer?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const publicUrl = `${baseUrl}/view/invoice/${fullInvoice.public_token}`;
      const { organization } = await AuthService.requireContext();

      await NotificationService.sendInvoiceEmail({
        customerEmail: fullInvoice.customer.email,
        customerName: `${fullInvoice.customer.first_name} ${fullInvoice.customer.last_name}`,
        businessName: organization?.name || 'TradeFlow Plumbing',
        invoiceNumber: fullInvoice.invoice_number,
        totalFormatted: formatCurrency(fullInvoice.total_cents, organization?.currency),
        dueDate: formatDate(fullInvoice.due_date),
        publicUrl,
      });
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return {
      success: true,
      data: invoice,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function voidInvoiceAction(invoiceId: string) {
  try {
    const invoice = await InvoiceService.void(invoiceId);
    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return {
      success: true,
      data: invoice,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function recordPaymentAction(invoiceId: string, input: RecordPaymentInput) {
  const parsed = RecordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const result = await InvoiceService.recordPayment(invoiceId, parsed.data);
    const fullInvoice = await InvoiceService.getById(invoiceId);

    if (fullInvoice && fullInvoice.customer?.email) {
      const { organization } = await AuthService.requireContext();
      await NotificationService.sendPaymentReceiptEmail({
        customerEmail: fullInvoice.customer.email,
        customerName: `${fullInvoice.customer.first_name} ${fullInvoice.customer.last_name}`,
        businessName: organization?.name || 'TradeFlow Plumbing',
        invoiceNumber: fullInvoice.invoice_number,
        amountPaidFormatted: formatCurrency(parsed.data.amount_cents, organization?.currency),
        balanceDueFormatted: formatCurrency(result.invoice.balance_due_cents, organization?.currency),
        paymentMethod: parsed.data.payment_method,
        referenceNumber: parsed.data.reference_number,
      });
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/dashboard');
    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  try {
    await InvoiceService.delete(invoiceId);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}
