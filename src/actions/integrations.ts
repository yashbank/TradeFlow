// ==============================================================================
// src/actions/integrations.ts — Server Actions for Tenant Integrations & BYOK
// ==============================================================================

'use server';

import { AuthService } from '@/services/AuthService';
import {
  TenantIntegrationService,
  type PrimaryTrade,
  type TenantIntegrations,
} from '@/services/TenantIntegrationService';
import { AIService } from '@/services/ai/AIService';
import { revalidatePath } from 'next/cache';

export async function getTenantIntegrationsAction(): Promise<{
  success: boolean;
  data?: TenantIntegrations;
  error?: string;
}> {
  try {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const data = await TenantIntegrationService.getIntegrations(organization.id);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve integrations.' };
  }
}

export async function updateTenantIntegrationsAction(updates: {
  primaryTrade?: PrimaryTrade;
  openaiApiKey?: string | null;
  resendApiKey?: string | null;
  resendFromEmail?: string | null;
  stripePublishableKey?: string | null;
  stripeSecretKey?: string | null;
  googlePlacesApiKey?: string | null;
  aiFeaturesEnabled?: boolean;
}): Promise<{
  success: boolean;
  data?: TenantIntegrations;
  error?: string;
}> {
  try {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const data = await TenantIntegrationService.updateIntegrations(updates, organization.id);
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/invoices/new');
    revalidatePath('/quotes/new');
    revalidatePath('/', 'layout');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update integrations.' };
  }
}

export async function testOpenAiKeyAction(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    await AuthService.requireRole(['owner', 'admin']);
    return await AIService.testOpenAiKey(apiKey);
  } catch (err: any) {
    return { valid: false, error: err.message || 'Authorization failed.' };
  }
}

export async function testResendKeyAction(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    await AuthService.requireRole(['owner', 'admin']);
    return await AIService.testResendKey(apiKey);
  } catch (err: any) {
    return { valid: false, error: err.message || 'Authorization failed.' };
  }
}
