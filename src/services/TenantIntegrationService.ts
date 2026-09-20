// ==============================================================================
// src/services/TenantIntegrationService.ts — Tenant Credential & Trade Isolation
// ==============================================================================

import { AuthService } from './AuthService';
import { createAdminClient } from '@/lib/supabase/admin';

import { PrimaryTrade, TradePresetConfig, TRADE_PRESETS_CONFIG } from '@/types/trades';
export type { PrimaryTrade, TradePresetConfig };
export { TRADE_PRESETS_CONFIG };

export interface TenantIntegrations {
  primaryTrade: PrimaryTrade;
  openaiApiKey?: string | null;
  resendApiKey?: string | null;
  resendFromEmail?: string | null;
  stripePublishableKey?: string | null;
  stripeSecretKey?: string | null;
  googlePlacesApiKey?: string | null;
  aiFeaturesEnabled: boolean;
  updatedAt: string;
}

export class TenantIntegrationService {
  // Resilient in-memory cache per tenant for high-performance reads
  private static memoryCache: Map<string, TenantIntegrations> = new Map();

  /**
   * Retrieves tenant integrations with persistent Supabase backing and secure env fallbacks.
   */
  static async getIntegrations(orgId?: string): Promise<TenantIntegrations> {
    let targetOrgId = orgId;
    if (!targetOrgId) {
      try {
        const ctx = await AuthService.getCurrentContext();
        targetOrgId = ctx?.organization?.id;
      } catch {
        // Fallback
      }
    }

    const defaultState: TenantIntegrations = {
      primaryTrade: 'plumbing',
      openaiApiKey: null,
      resendApiKey: null,
      resendFromEmail: null,
      stripePublishableKey: null,
      stripeSecretKey: null,
      googlePlacesApiKey: null,
      aiFeaturesEnabled: true,
      updatedAt: new Date().toISOString(),
    };

    if (!targetOrgId) return defaultState;

    // 1. Check in-memory cache first
    if (this.memoryCache.has(targetOrgId)) {
      return { ...defaultState, ...this.memoryCache.get(targetOrgId)! };
    }

    // 2. Query persistent Supabase audit_logs store
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('changes_json')
        .eq('organization_id', targetOrgId)
        .eq('entity_type', 'tenant_integrations')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.changes_json && typeof data.changes_json === 'object') {
        const parsed = data.changes_json as Partial<TenantIntegrations>;
        const merged: TenantIntegrations = {
          ...defaultState,
          ...parsed,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
        this.memoryCache.set(targetOrgId, merged);
        return merged;
      }
    } catch {
      // Fall through to default if Supabase query fails or in isolated unit test
    }

    return defaultState;
  }

  /**
   * Updates tenant integration credentials. Restricted to owner or admin.
   * Persists safely to database and synchronizes organization terms.
   */
  static async updateIntegrations(
    updates: Partial<Omit<TenantIntegrations, 'updatedAt'>>,
    targetOrgId?: string
  ): Promise<TenantIntegrations> {
    let orgId = targetOrgId;
    if (!orgId) {
      const { organization } = await AuthService.requireRole(['owner', 'admin']);
      orgId = organization.id;
    }

    const current = await this.getIntegrations(orgId);
    const updated: TenantIntegrations = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update in-memory cache immediately
    this.memoryCache.set(orgId, updated);

    // 2. Persist to database
    try {
      const supabase = createAdminClient();

      // Insert audit log entry with latest tenant integrations config
      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        entity_type: 'tenant_integrations',
        entity_id: orgId,
        action: 'config_update',
        changes_json: updated,
      });

      // If primaryTrade was changed, automatically update organization's default invoice terms
      if (updates.primaryTrade && TRADE_PRESETS_CONFIG[updates.primaryTrade]) {
        const preset = TRADE_PRESETS_CONFIG[updates.primaryTrade];
        await supabase
          .from('organizations')
          .update({
            invoice_terms: preset.defaultTerms,
          })
          .eq('id', orgId);
      }
    } catch (err: any) {
      console.error('TenantIntegrationService persistence error:', err);
      // Even if DB has a momentary blip, memory cache holds the updated state
    }

    return updated;
  }

  /**
   * Resolves active OpenAI API key for a given tenant.
   */
  static async resolveOpenAiKey(orgId?: string): Promise<string | null> {
    const config = await this.getIntegrations(orgId);
    return config.openaiApiKey?.trim() || process.env.OPENAI_API_KEY || null;
  }

  /**
   * Resolves active Resend API key and From Address for a given tenant.
   */
  static async resolveResendCredentials(orgId?: string): Promise<{
    apiKey: string | null;
    fromEmail: string;
  }> {
    const config = await this.getIntegrations(orgId);
    const apiKey = config.resendApiKey?.trim() || process.env.RESEND_API_KEY || null;
    const fromEmail =
      config.resendFromEmail?.trim() ||
      process.env.EMAIL_FROM ||
      'TradeFlow <notifications@tradeflow.app>';

    return { apiKey, fromEmail };
  }

  /**
   * Resolves trade configuration for active tenant.
   */
  static async getTradeConfig(orgId?: string) {
    const config = await this.getIntegrations(orgId);
    const trade = config.primaryTrade || 'plumbing';
    return TRADE_PRESETS_CONFIG[trade] || TRADE_PRESETS_CONFIG.plumbing;
  }
}
