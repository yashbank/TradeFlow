'use server';

import { QuoteService } from '@/services/QuoteService';
import { PublicQuoteRespondSchema, type PublicQuoteRespondInput } from '@/lib/validations/quote';
import { headers } from 'next/headers';

export async function respondToQuotePublicAction(token: string, input: PublicQuoteRespondInput) {
  const parsed = PublicQuoteRespondSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  try {
    const result = await QuoteService.respondPublic(token, parsed.data, ip);
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
