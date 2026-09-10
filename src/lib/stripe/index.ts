import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key_123', {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});
