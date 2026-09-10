import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '@/services/BillingService';
import * as adminSupabase from '@/lib/supabase/admin';

describe('Stripe Webhook Processing (test/integration/webhooks.test.ts)', () => {
  let mockUpdate: any;
  let mockEq: any;
  let mockFrom: any;

  beforeEach(() => {
    mockEq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue({
      from: mockFrom,
    } as any);
  });

  it('TC-WH-01: Handles checkout.session.completed and activates subscription', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'org_12345',
          customer: 'cus_stripe_999',
          subscription: 'sub_stripe_888',
        },
      },
    } as any;

    const result = await BillingService.handleWebhookEvent(mockEvent);
    expect(result.processed).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        stripe_customer_id: 'cus_stripe_999',
        stripe_subscription_id: 'sub_stripe_888',
      })
    );
    expect(mockEq).toHaveBeenCalledWith('organization_id', 'org_12345');
  });

  it('TC-WH-02: Handles customer.subscription.deleted and cancels subscription', async () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_stripe_999',
        },
      },
    } as any;

    const result = await BillingService.handleWebhookEvent(mockEvent);
    expect(result.processed).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        cancel_at_period_end: false,
      })
    );
    expect(mockEq).toHaveBeenCalledWith('stripe_customer_id', 'cus_stripe_999');
  });

  it('TC-WH-03: Handles customer.subscription.updated status sync', async () => {
    const mockEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_stripe_999',
          status: 'past_due',
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: true,
        },
      },
    } as any;

    const result = await BillingService.handleWebhookEvent(mockEvent);
    expect(result.processed).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'past_due',
        cancel_at_period_end: true,
      })
    );
  });
});
