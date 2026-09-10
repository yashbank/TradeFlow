import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { BillingService } from '@/services/BillingService';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret configuration.' },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    await BillingService.handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Stripe webhook handler error: ${err.message}`);
    return NextResponse.json({ error: 'Internal webhook execution failure.' }, { status: 500 });
  }
}
