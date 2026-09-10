// ==============================================================================
// src/services/BillingService.ts — Stripe Subscription & Webhook Processing
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthService } from './AuthService';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import type { Subscription } from '@/types/database';

export class BillingService {
  /**
   * Retrieves subscription status for active organization.
   */
  static async getSubscription(): Promise<Subscription | null> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    return data as Subscription | null;
  }

  /**
   * Creates a Stripe Checkout Session for the $39/mo Starter plan.
   */
  static async createCheckoutSession(): Promise<string> {
    const { organization, user } = await AuthService.requireRole(['owner']);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const priceId = process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly_39';

    // Gracefully handle Stripe Payment Link URLs if configured instead of a raw Price ID
    if (priceId.startsWith('http://') || priceId.startsWith('https://')) {
      return priceId;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: organization.id,
      metadata: {
        organization_id: organization.id,
        user_id: user.id,
      },
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/settings?billing=cancelled`,
    });

    if (!session.url) {
      throw new Error('Failed to generate Stripe checkout session URL.');
    }

    return session.url;
  }

  /**
   * Generates a Stripe Customer Portal session link for subscription management.
   */
  static async createCustomerPortalSession(): Promise<string> {
    const { organization } = await AuthService.requireRole(['owner']);
    const sub = await this.getSubscription();

    if (!sub || !sub.stripe_customer_id) {
      throw new Error('No active Stripe customer found for this organization.');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${baseUrl}/settings`,
    });

    return portalSession.url;
  }

  /**
   * Handles incoming verified Stripe Webhooks. Uses admin client since no user session exists.
   */
  static async handleWebhookEvent(event: Stripe.Event): Promise<{ processed: boolean; eventType: string }> {
    const supabase = createAdminClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id || session.metadata?.organization_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (orgId && customerId) {
          await supabase
            .from('subscriptions')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: 'active',
            })
            .eq('organization_id', orgId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';

        await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // Unhandled event types acknowledged
        break;
    }

    return { processed: true, eventType: event.type };
  }
}
