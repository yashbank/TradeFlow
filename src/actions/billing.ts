'use server';

import { BillingService } from '@/services/BillingService';
import { redirect } from 'next/navigation';

export async function createCheckoutSessionAction() {
  const checkoutUrl = await BillingService.createCheckoutSession();
  redirect(checkoutUrl);
}

export async function createPortalSessionAction() {
  const portalUrl = await BillingService.createCustomerPortalSession();
  redirect(portalUrl);
}
