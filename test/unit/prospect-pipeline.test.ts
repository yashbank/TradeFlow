// ==============================================================================
// test/unit/prospect-pipeline.test.ts — Prospect Automation Test Suite
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProspectDeduplicator } from '@/services/prospect/ProspectDeduplicator';
import { ProspectScorer } from '@/services/prospect/ProspectScorer';
import { WebEnrichmentService } from '@/services/prospect/WebEnrichmentService';
import { NotionClient } from '@/services/prospect/NotionClient';
import type { ProspectCandidate, WebEnrichmentResult } from '@/services/prospect/types';

describe('TradeFlow Prospect Automation Test Suite', () => {
  describe('Suite 1: Multi-Tier Deduplication Engine', () => {
    let deduplicator: ProspectDeduplicator;

    beforeEach(() => {
      deduplicator = new ProspectDeduplicator();
    });

    it('DEDUPE-1: Detects duplicate by exact Google Place ID', () => {
      const p1: ProspectCandidate = {
        placeId: 'ChIJ123_plumber_dallas',
        businessName: "Dave's Plumbing Co",
        formattedAddress: '100 Main St, Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        phone: '2145550100',
        website: 'https://davesplumbing.com',
      };

      expect(deduplicator.isDuplicate(p1).isDup).toBe(false);
      deduplicator.register(p1);

      const p2: ProspectCandidate = {
        placeId: 'ChIJ123_plumber_dallas',
        businessName: 'Another Name',
        formattedAddress: 'Different Address',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
      };

      const result = deduplicator.isDuplicate(p2);
      expect(result.isDup).toBe(true);
      expect(result.reason).toContain('ChIJ123_plumber_dallas');
    });

    it('DEDUPE-2: Detects duplicate by normalized website domain', () => {
      const p1: ProspectCandidate = {
        placeId: 'place_001',
        businessName: 'Texas Rapid Plumbers',
        formattedAddress: 'Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        website: 'https://www.texasrapidplumbers.com/contact-us',
      };

      deduplicator.register(p1);

      const p2: ProspectCandidate = {
        placeId: 'place_002',
        businessName: 'Texas Rapid Plumbing LLC',
        formattedAddress: 'Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        website: 'http://texasrapidplumbers.com?utm_source=google',
      };

      const result = deduplicator.isDuplicate(p2);
      expect(result.isDup).toBe(true);
      expect(result.reason).toContain('texasrapidplumbers.com');
    });

    it('DEDUPE-3: Detects duplicate by normalized phone number', () => {
      const p1: ProspectCandidate = {
        placeId: 'place_101',
        businessName: 'Lone Star Drain & Pipe',
        formattedAddress: 'Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        phone: '+1 (214) 555-0199',
      };

      deduplicator.register(p1);

      const p2: ProspectCandidate = {
        placeId: 'place_102',
        businessName: 'Lone Star Rooter',
        formattedAddress: 'Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        phone: '12145550199',
      };

      const result = deduplicator.isDuplicate(p2);
      expect(result.isDup).toBe(true);
      expect(result.reason).toContain('12145550199');
    });

    it('DEDUPE-4: Detects duplicate by normalized business name + city', () => {
      const p1: ProspectCandidate = {
        placeId: 'place_201',
        businessName: 'Miller Plumbing Services LLC',
        formattedAddress: 'Austin, TX',
        city: 'Austin',
        state: 'TX',
        country: 'US',
      };

      deduplicator.register(p1);

      const p2: ProspectCandidate = {
        placeId: 'place_202',
        businessName: 'Miller Plumbing Inc.',
        formattedAddress: 'Austin, TX',
        city: 'Austin',
        state: 'TX',
        country: 'US',
      };

      const result = deduplicator.isDuplicate(p2);
      expect(result.isDup).toBe(true);
      expect(result.reason).toContain('Duplicate Business Name & City');
    });

    it('DEDUPE-5: Correctly normalizes domains, removing protocol, www, and query params', () => {
      expect(deduplicator.normalizeDomain('https://www.exampleplumbing.co.uk/services')).toBe('exampleplumbing.co.uk');
      expect(deduplicator.normalizeDomain('http://plumbersydney.com.au/?ref=ad')).toBe('plumbersydney.com.au');
    });
  });

  describe('Suite 2: Deterministic Qualification Scoring Engine', () => {
    it('SCORE-1: Scores high-potential ICP candidate with P0 (9-10)', () => {
      const candidate: ProspectCandidate = {
        placeId: 'place_high',
        businessName: "Dave's Family Plumbing",
        formattedAddress: '123 Elm St, Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        phone: '2145550123',
        website: 'https://davesfamilyplumbing.com',
        types: ['plumber', 'point_of_interest'],
      };

      const enrichment: WebEnrichmentResult = {
        email: 'dave@davesfamilyplumbing.com',
        hasOwnerOrTeamEvidence: true,
        isSmallBusinessSignal: true,
        servicesFound: ['Water Heaters', 'Drain Cleaning', 'Leak Detection'],
        evidenceNotes: ['Family owned signal found'],
      };

      const result = ProspectScorer.scoreCandidate(candidate, enrichment);

      expect(result.score).toBeGreaterThanOrEqual(9);
      expect(result.priority).toBe('P0');
      expect(result.isQualified).toBe(true);
      expect(result.reasons.length).toBeGreaterThanOrEqual(5);
    });

    it('SCORE-2: Classifies medium prospect with P1 or P2', () => {
      const candidate: ProspectCandidate = {
        placeId: 'place_med',
        businessName: 'Quick Pipe Repairs',
        formattedAddress: 'Austin, TX',
        city: 'Austin',
        state: 'TX',
        country: 'US',
        phone: '5125550144',
      };

      const enrichment: WebEnrichmentResult = {
        hasOwnerOrTeamEvidence: false,
        isSmallBusinessSignal: false,
        servicesFound: [],
        evidenceNotes: [],
      };

      const result = ProspectScorer.scoreCandidate(candidate, enrichment);

      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(['P1', 'P2']).toContain(result.priority);
      expect(result.isQualified).toBe(true);
    });

    it('SCORE-3: Rejects irrelevant or non-plumbing business (<5)', () => {
      const candidate: ProspectCandidate = {
        placeId: 'place_low',
        businessName: 'National Construction Franchising Group',
        formattedAddress: 'Dallas, TX',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        types: ['general_contractor'],
      };

      const enrichment: WebEnrichmentResult = {
        hasOwnerOrTeamEvidence: false,
        isSmallBusinessSignal: false,
        servicesFound: [],
        evidenceNotes: [],
      };

      const result = ProspectScorer.scoreCandidate(candidate, enrichment);
      expect(result.score).toBeLessThan(5);
      expect(result.priority).toBe('REJECT');
      expect(result.isQualified).toBe(false);
    });
  });

  describe('Suite 3: Web Contact Discovery & Enrichment', () => {
    it('ENRICH-1: Gracefully handles missing or invalid URLs', async () => {
      const resEmpty = await WebEnrichmentService.enrichFromWebsite(undefined);
      expect(resEmpty.servicesFound).toEqual([]);
      expect(resEmpty.hasOwnerOrTeamEvidence).toBe(false);

      const resInvalid = await WebEnrichmentService.enrichFromWebsite('not-a-valid-url');
      expect(resInvalid.isSmallBusinessSignal).toBe(false);
    });
  });

  describe('Suite 4: Notion CRM Client Resilience', () => {
    it('NOTION-1: Reports unconfigured status when env vars are missing', () => {
      const client = new NotionClient('', '');
      expect(client.isConfigured()).toBe(false);
    });

    it('NOTION-2: Handles sync failure gracefully when unconfigured', async () => {
      const client = new NotionClient('', '');
      const res = await client.syncProspect({
        placeId: 'place_test',
        businessName: 'Test Plumber',
        formattedAddress: 'Address',
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        phone: '2145550000',
        score: 8,
        priority: 'P1',
        scoreReasons: 'Test reason',
        source: 'Google Places + Web',
        discoveredAt: new Date().toISOString(),
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('not configured');
    });
  });
});
