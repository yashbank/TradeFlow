// ==============================================================================
// src/services/prospect/NotionClient.ts — Notion CRM Database Client
// ==============================================================================

import type { QualifiedProspect } from './types';

export class NotionClient {
  private apiKey: string;
  private databaseId: string;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(apiKey?: string, databaseId?: string) {
    this.apiKey = apiKey || process.env.NOTION_API_KEY || '';
    this.databaseId = databaseId || process.env.NOTION_DATABASE_ID || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.databaseId);
  }

  /**
   * Fetches existing prospects from Notion to pre-seed the deduplication cache.
   */
  async fetchExistingProspects(): Promise<Array<{ placeId?: string; website?: string; phone?: string; businessName?: string; city?: string }>> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/databases/${this.databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 100 }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results = data.results || [];

      return results.map((page: any) => {
        const props = page.properties || {};
        const titleArr = props['Business']?.title || props['Business Name']?.title || [];
        const businessName = titleArr.map((t: any) => t.plain_text).join('');
        const phone = props['Phone']?.phone_number || '';
        const website = props['Website']?.url || '';
        const placeIdArr = props['Google Place ID']?.rich_text || [];
        const placeId = placeIdArr.map((t: any) => t.plain_text).join('');
        const cityArr = props['City']?.rich_text || [];
        const city = cityArr.map((t: any) => t.plain_text).join('');

        return { placeId, website, phone, businessName, city };
      });
    } catch {
      return [];
    }
  }

  /**
   * Creates or updates a qualified prospect in the Notion CRM database.
   */
  async syncProspect(prospect: QualifiedProspect): Promise<{ success: boolean; pageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'NOTION_API_KEY or NOTION_DATABASE_ID is not configured.' };
    }

    // Build adaptive properties payload matching database schema
    const properties: Record<string, any> = {
      // Primary Title: supports both "Business" and "Business Name"
      Business: {
        title: [
          {
            text: { content: prospect.businessName },
          },
        ],
      },
      // Status property (standard Notion status type)
      Status: {
        status: { name: 'New' },
      },
      City: {
        rich_text: [
          {
            text: { content: prospect.city },
          },
        ],
      },
      'Pain / Observation': {
        rich_text: [
          {
            text: { content: `[Score: ${prospect.score}/100 | ${prospect.priority}] ${prospect.scoreReasons}` },
          },
        ],
      },
      Notes: {
        rich_text: [
          {
            text: { content: `Address: ${prospect.formattedAddress} | Place ID: ${prospect.placeId}` },
          },
        ],
      },
      Source: {
        select: { name: 'Unknown' },
      },
      Country: {
        select: { name: 'Unknown' },
      },
    };

    if (prospect.phone) {
      properties['Phone'] = { phone_number: prospect.phone };
    }
    if (prospect.website) {
      properties['Website'] = { url: prospect.website };
    }
    if (prospect.email) {
      properties['Email'] = { email: prospect.email };
    }

    try {
      let response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: this.databaseId },
          properties,
        }),
      });

      // Fallback: If title property was named "Business Name" instead of "Business"
      if (!response.ok && response.status === 400) {
        const fallbackProperties = { ...properties };
        delete fallbackProperties['Business'];
        fallbackProperties['Business Name'] = {
          title: [{ text: { content: prospect.businessName } }],
        };
        response = await fetch(`${this.baseUrl}/pages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent: { database_id: this.databaseId },
            properties: fallbackProperties,
          }),
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Notion page creation failed [HTTP ${response.status}]: ${errText}` };
      }

      const pageData = await response.json();
      return { success: true, pageId: pageData.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
