// ==============================================================================
// src/services/ai/AIService.ts — Tenant-Aware AI Scoping & Diagnostics Engine
// ==============================================================================

import { TenantIntegrationService, type PrimaryTrade, TRADE_PRESETS_CONFIG } from '../TenantIntegrationService';

export interface GeneratedLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  taxable: boolean;
}

export interface AIScopeResult {
  title: string;
  summary: string;
  items: GeneratedLineItem[];
  suggestedTerms: string;
  source: 'openai_live' | 'trade_engine_heuristic';
}

export class AIService {
  /**
   * Tests an OpenAI API key for validity and active quota.
   */
  static async testOpenAiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || !apiKey.trim().startsWith('sk-')) {
      return { valid: false, error: 'Invalid key format. OpenAI API keys must begin with "sk-".' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { valid: false, error: `Authentication failed (HTTP ${response.status}): ${errorText.slice(0, 120)}` };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Network connection to OpenAI failed.' };
    }
  }

  /**
   * Tests a Resend API key for validity.
   */
  static async testResendKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || !apiKey.trim().startsWith('re_')) {
      return { valid: false, error: 'Invalid key format. Resend API keys must begin with "re_".' };
    }

    try {
      const response = await fetch('https://api.resend.com/api-keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (!response.ok) {
        return { valid: false, error: `Resend authentication failed (HTTP ${response.status})` };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Network connection to Resend failed.' };
    }
  }

  /**
   * Generates structured quote scope and itemization using tenant's OpenAI key or trade heuristics.
   */
  static async generateQuoteScope(
    prompt: string,
    trade: PrimaryTrade = 'plumbing',
    orgId?: string
  ): Promise<AIScopeResult> {
    const apiKey = await TenantIntegrationService.resolveOpenAiKey(orgId);
    const tradeConfig = TRADE_PRESETS_CONFIG[trade] || TRADE_PRESETS_CONFIG.plumbing;

    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const systemPrompt = `You are a licensed master contractor and field estimator specializing in ${tradeConfig.title}.
Generate a structured JSON proposal for the homeowner request.
Respond ONLY with a valid JSON object matching this schema:
{
  "title": "Short job title",
  "summary": "1-2 sentence professional scope summary",
  "items": [
    { "description": "Specific task / part name", "quantity": 1, "unitPriceCents": 15000, "taxable": true }
  ],
  "suggestedTerms": "Professional warranty and payment terms"
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = JSON.parse(data.choices[0].message.content);
          return {
            title: content.title || `${tradeConfig.title} Service`,
            summary: content.summary || prompt,
            items: (content.items || []).map((i: any) => ({
              description: i.description || 'Service Line',
              quantity: Number(i.quantity) || 1,
              unitPriceCents: Math.round(Number(i.unitPriceCents) || 10000),
              taxable: Boolean(i.taxable ?? true),
            })),
            suggestedTerms: content.suggestedTerms || tradeConfig.defaultTerms,
            source: 'openai_live',
          };
        }
      } catch {
        // Fall through to heuristic trade engine
      }
    }

    // Heuristic Fallback Engine: matches prompt words against trade preset items
    const lower = prompt.toLowerCase();
    const matchedPresets = tradeConfig.invoicePresets.filter((p) =>
      lower.split(' ').some((w) => w.length > 3 && p.description.toLowerCase().includes(w))
    );

    const chosen = matchedPresets.length > 0 ? matchedPresets : tradeConfig.invoicePresets.slice(0, 2);

    return {
      title: `${tradeConfig.title} Scope: ${prompt.slice(0, 40)}...`,
      summary: `Standard field work order prepared for: ${prompt}`,
      items: chosen.map((p) => ({
        description: p.description,
        quantity: 1,
        unitPriceCents: Math.round(p.price * 100),
        taxable: p.taxable,
      })),
      suggestedTerms: tradeConfig.defaultTerms,
      source: 'trade_engine_heuristic',
    };
  }
}
