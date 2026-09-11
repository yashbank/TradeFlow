'use server';

import { QuoteService } from '@/services/QuoteService';
import { AuthService } from '@/services/AuthService';
import { NotificationService } from '@/services/NotificationService';
import { CreateQuoteSchema, type CreateQuoteInput } from '@/lib/validations/quote';
import { formatCurrency } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function createQuoteAction(input: CreateQuoteInput) {
  const parsed = CreateQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const quote = await QuoteService.create(parsed.data);
    revalidatePath('/quotes');
    return {
      success: true,
      data: quote,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function sendQuoteAction(quoteId: string) {
  try {
    const quote = await QuoteService.send(quoteId);
    const fullQuote = await QuoteService.getById(quoteId);

    if (fullQuote && fullQuote.customer?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const publicUrl = `${baseUrl}/view/quote/${fullQuote.public_token}`;
      const { organization } = await AuthService.requireContext();

      await NotificationService.sendQuoteEmail({
        customerEmail: fullQuote.customer.email,
        customerName: `${fullQuote.customer.first_name} ${fullQuote.customer.last_name}`,
        businessName: organization?.name || 'TradeFlow Plumbing',
        quoteNumber: fullQuote.quote_number,
        totalFormatted: formatCurrency(fullQuote.total_cents, organization?.currency),
        publicUrl,
      });
    }

    revalidatePath('/quotes');
    revalidatePath(`/quotes/${quoteId}`);
    return {
      success: true,
      data: quote,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function convertQuoteToJobAction(
  quoteId: string,
  assignedTechId?: string,
  scheduledStart?: string,
  scheduledEnd?: string
) {
  try {
    const job = await QuoteService.convertToJob(
      quoteId,
      assignedTechId,
      scheduledStart,
      scheduledEnd
    );
    revalidatePath('/quotes');
    revalidatePath('/jobs');
    return {
      success: true,
      data: job,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function approveQuoteAction(
  quoteId: string,
  signerName?: string,
  approvalMethod = 'Verbal / Phone Approval'
) {
  try {
    const quote = await QuoteService.acceptInternal(quoteId, signerName, approvalMethod);
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${quoteId}`);
    return {
      success: true,
      data: quote,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function rejectQuoteAction(quoteId: string, reason?: string) {
  try {
    const quote = await QuoteService.rejectInternal(quoteId, reason);
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${quoteId}`);
    return {
      success: true,
      data: quote,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function updateQuoteAction(quoteId: string, input: CreateQuoteInput, resend = false) {
  const parsed = CreateQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const quote = await QuoteService.update(quoteId, parsed.data);

    if (resend) {
      await sendQuoteAction(quoteId);
    }

    revalidatePath('/quotes');
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data: quote,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function deleteQuoteAction(quoteId: string) {
  try {
    await QuoteService.delete(quoteId);
    revalidatePath('/quotes');
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
