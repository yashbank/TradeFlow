'use server';

import { QuoteService } from '@/services/QuoteService';
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

      await NotificationService.sendQuoteEmail({
        customerEmail: fullQuote.customer.email,
        customerName: `${fullQuote.customer.first_name} ${fullQuote.customer.last_name}`,
        businessName: 'Dave’s Plumbing',
        quoteNumber: fullQuote.quote_number,
        totalFormatted: formatCurrency(fullQuote.total_cents),
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
