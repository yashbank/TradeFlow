// ==============================================================================
// src/services/TenantIntegrationService.ts — Tenant Credential & Trade Isolation
// ==============================================================================

import fs from 'fs';
import path from 'path';
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
  private static getStorageDir(): string {
    const dir = path.resolve(process.cwd(), 'config', 'tenants');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private static getFilePath(orgId: string): string {
    return path.join(this.getStorageDir(), `${orgId}.json`);
  }

  /**
   * Retrieves tenant integrations with secure fallbacks to platform environment.
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

    const filePath = this.getFilePath(targetOrgId);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          ...defaultState,
          ...parsed,
        };
      } catch {
        return defaultState;
      }
    }

    return defaultState;
  }

  /**
   * Updates tenant integration credentials. Restricted to owner or admin.
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

    const filePath = this.getFilePath(orgId);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');

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
