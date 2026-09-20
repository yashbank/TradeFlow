// ==============================================================================
// src/services/prospect/WebEnrichmentService.ts — Public Website Contact Discovery
// ==============================================================================

import type { WebEnrichmentResult } from './types';

export class WebEnrichmentService {
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static readonly IGNORED_EMAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', 'sentry.io'];

  /**
   * Enriches a prospect by inspecting their public website homepage and contact page.
   */
  static async enrichFromWebsite(websiteUrl?: string): Promise<WebEnrichmentResult> {
    const result: WebEnrichmentResult = {
      hasOwnerOrTeamEvidence: false,
      isSmallBusinessSignal: false,
      servicesFound: [],
      evidenceNotes: [],
    };

    if (!websiteUrl || !websiteUrl.startsWith('http')) {
      return result;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(websiteUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (TradeFlow Business Audit)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return result;
      }

      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      // 1. Email extraction (mailto + body regex)
      const mailtoMatches = Array.from(html.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi)).map(
        (m) => m[1]
      );
      const generalMatches = Array.from(html.matchAll(this.EMAIL_REGEX)).map((m) => m[0]);
      const allEmails = [...mailtoMatches, ...generalMatches]
        .map((e) => e.trim().toLowerCase())
        .filter((e) => !this.IGNORED_EMAIL_EXTENSIONS.some((ext) => e.endsWith(ext) || e.includes(ext)));

      if (allEmails.length > 0) {
        result.email = allEmails[0];
        result.evidenceNotes.push(`Public email discovered: ${result.email}`);
      }

      // 2. Small business & team size signals (1–10 technicians ICP)
      const smallTeamKeywords = [
        'family owned',
        'family-owned',
        'locally owned',
        'owner operated',
        'our master plumber',
        'small team',
        'our technicians',
        'our vans',
        'our trucks',
        'licensed & insured',
      ];

      for (const kw of smallTeamKeywords) {
        if (lowerHtml.includes(kw)) {
          result.isSmallBusinessSignal = true;
          result.evidenceNotes.push(`Small trade business signal: "${kw}"`);
          break;
        }
      }

      // 3. Owner / Team evidence
      if (
        lowerHtml.includes('about our founder') ||
        lowerHtml.includes('meet the owner') ||
        lowerHtml.includes('meet our team') ||
        lowerHtml.includes('owner:')
      ) {
        result.hasOwnerOrTeamEvidence = true;
      }

      // 4. Services detected
      const services = [
        { term: 'water heater', label: 'Water Heaters' },
        { term: 'drain cleaning', label: 'Drain Cleaning' },
        { term: 'leak detection', label: 'Leak Detection' },
        { term: 'pipe repair', label: 'Pipe Repair' },
        { term: 'emergency plumbing', label: 'Emergency Service' },
        { term: 'commercial plumbing', label: 'Commercial' },
        { term: 'residential plumbing', label: 'Residential' },
      ];

      for (const s of services) {
        if (lowerHtml.includes(s.term)) {
          result.servicesFound.push(s.label);
        }
      }
    } catch {
      // Polite fallback: website unreachable or timeout, gracefully return partial evidence
    }

    return result;
  }
}
