// ==============================================================================
// test/unit/tenant-integrations-and-byok.test.ts
// Unit & Integration Tests for Multi-Tenant BYOK Credentials & Trade Presets
// ==============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TenantIntegrationService,
  TRADE_PRESETS_CONFIG,
  type PrimaryTrade,
} from '../../src/services/TenantIntegrationService';
import { AIService } from '../../src/services/ai/AIService';

describe('Tenant Integration & BYOK Credentials Suite', () => {
  const testOrgId = 'org-test-byok-tenant-01';

  beforeEach(async () => {
    // Reset to default
    await TenantIntegrationService.updateIntegrations(
      {
        primaryTrade: 'plumbing',
        openaiApiKey: null,
        resendApiKey: null,
        resendFromEmail: null,
        aiFeaturesEnabled: true,
      },
      testOrgId
    );
  });

  afterEach(async () => {
    // Clean up
    await TenantIntegrationService.updateIntegrations(
      {
        primaryTrade: 'plumbing',
        openaiApiKey: null,
        resendApiKey: null,
        resendFromEmail: null,
      },
      testOrgId
    );
  });

  it('provides complete trade presets across all 5 trades', () => {
    const trades: PrimaryTrade[] = ['plumbing', 'hvac', 'electrical', 'roofing', 'general'];
    for (const trade of trades) {
      const config = TRADE_PRESETS_CONFIG[trade];
      expect(config).toBeDefined();
      expect(config.title).toBeTruthy();
      expect(config.defaultTerms).toBeTruthy();
      expect(config.invoicePresets.length).toBeGreaterThanOrEqual(5);

      for (const preset of config.invoicePresets) {
        expect(preset.description).toBeTruthy();
        expect(preset.price).toBeGreaterThan(0);
        expect(typeof preset.taxable).toBe('boolean');
      }
    }
  });

  it('resolves OpenAI API key with fallback to platform environment', async () => {
    // When tenant has no key, falls back to process.env.OPENAI_API_KEY
    const fallback = await TenantIntegrationService.resolveOpenAiKey(testOrgId);
    expect(fallback).toBe(process.env.OPENAI_API_KEY || null);

    // When tenant sets their own custom key
    await TenantIntegrationService.updateIntegrations(
      { openaiApiKey: 'sk-custom-tenant-key-12345' },
      testOrgId
    );
    const custom = await TenantIntegrationService.resolveOpenAiKey(testOrgId);
    expect(custom).toBe('sk-custom-tenant-key-12345');
  });

  it('resolves Resend credentials and custom sender email per tenant', async () => {
    // Default
    const defaultCreds = await TenantIntegrationService.resolveResendCredentials(testOrgId);
    expect(defaultCreds.fromEmail).toBeTruthy();

    // Tenant custom domain
    await TenantIntegrationService.updateIntegrations(
      {
        resendApiKey: 're_custom_tenant_key_67890',
        resendFromEmail: 'Apex Pro Plumbing <billing@apexproplumbing.com>',
      },
      testOrgId
    );

    const customCreds = await TenantIntegrationService.resolveResendCredentials(testOrgId);
    expect(customCreds.apiKey).toBe('re_custom_tenant_key_67890');
    expect(customCreds.fromEmail).toBe('Apex Pro Plumbing <billing@apexproplumbing.com>');
  });

  it('validates OpenAI key format in AIService.testOpenAiKey', async () => {
    const invalidPrefix = await AIService.testOpenAiKey('invalid-key-no-prefix');
    expect(invalidPrefix.valid).toBe(false);
    expect(invalidPrefix.error).toContain('sk-');

    const empty = await AIService.testOpenAiKey('');
    expect(empty.valid).toBe(false);
  });

  it('validates Resend key format in AIService.testResendKey', async () => {
    const invalidPrefix = await AIService.testResendKey('invalid_resend_key');
    expect(invalidPrefix.valid).toBe(false);
    expect(invalidPrefix.error).toContain('re_');

    const empty = await AIService.testResendKey('');
    expect(empty.valid).toBe(false);
  });

  it('generates structured quote scope via trade heuristics when OpenAI is offline', async () => {
    const result = await AIService.generateQuoteScope('emergency pipe burst in utility room', 'plumbing', testOrgId);
    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].description).toBeTruthy();
    expect(result.items[0].unitPriceCents).toBeGreaterThan(0);
    expect(result.suggestedTerms).toContain('Payment due');
  });

  it('customizes generated scope according to selected trade preset', async () => {
    const hvacScope = await AIService.generateQuoteScope('tune up compressor and ductwork', 'hvac', testOrgId);
    expect(hvacScope.title).toContain('HVAC');
    expect(hvacScope.items.length).toBeGreaterThan(0);

    const electricalScope = await AIService.generateQuoteScope('panel breaker replacement', 'electrical', testOrgId);
    expect(electricalScope.title).toContain('Electrical');
    expect(electricalScope.items.length).toBeGreaterThan(0);
  });
});
