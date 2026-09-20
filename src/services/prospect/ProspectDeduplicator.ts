// ==============================================================================
// src/services/prospect/ProspectDeduplicator.ts — Multi-Tier Deduplication Engine
// ==============================================================================

import type { ProspectCandidate, QualifiedProspect } from './types';

export class ProspectDeduplicator {
  private seenPlaceIds = new Set<string>();
  private seenDomains = new Set<string>();
  private seenPhones = new Set<string>();
  private seenNameCities = new Set<string>();

  /**
   * Initializes deduplicator with existing keys (e.g. from previous runs or Notion DB).
   */
  seedExisting(prospects: Array<{ placeId?: string; website?: string; phone?: string; businessName?: string; city?: string }>) {
    for (const p of prospects) {
      if (p.placeId) this.seenPlaceIds.add(p.placeId.trim());
      if (p.website) {
        const domain = this.normalizeDomain(p.website);
        if (domain) this.seenDomains.add(domain);
      }
      if (p.phone) {
        const phone = this.normalizePhone(p.phone);
        if (phone) this.seenPhones.add(phone);
      }
      if (p.businessName && p.city) {
        this.seenNameCities.add(this.normalizeNameCity(p.businessName, p.city));
      }
    }
  }

  /**
   * Evaluates if a candidate is a duplicate across any of the 4 deduplication tiers.
   */
  isDuplicate(candidate: ProspectCandidate | QualifiedProspect): { isDup: boolean; reason?: string } {
    // Tier 1: Exact Google Place ID
    if (candidate.placeId && this.seenPlaceIds.has(candidate.placeId.trim())) {
      return { isDup: true, reason: `Duplicate Place ID: ${candidate.placeId}` };
    }

    // Tier 2: Normalized Website Domain
    if (candidate.website) {
      const domain = this.normalizeDomain(candidate.website);
      if (domain && this.seenDomains.has(domain)) {
        return { isDup: true, reason: `Duplicate Website Domain: ${domain}` };
      }
    }

    // Tier 3: Normalized Phone
    if (candidate.phone) {
      const phone = this.normalizePhone(candidate.phone);
      if (phone && this.seenPhones.has(phone)) {
        return { isDup: true, reason: `Duplicate Phone Number: ${phone}` };
      }
    }

    // Tier 4: Business Name + City Match
    if (candidate.businessName && candidate.city) {
      const nameCity = this.normalizeNameCity(candidate.businessName, candidate.city);
      if (this.seenNameCities.has(nameCity)) {
        return { isDup: true, reason: `Duplicate Business Name & City: ${nameCity}` };
      }
    }

    return { isDup: false };
  }

  /**
   * Registers a unique candidate into the deduplication cache.
   */
  register(candidate: ProspectCandidate | QualifiedProspect) {
    if (candidate.placeId) this.seenPlaceIds.add(candidate.placeId.trim());
    if (candidate.website) {
      const domain = this.normalizeDomain(candidate.website);
      if (domain) this.seenDomains.add(domain);
    }
    if (candidate.phone) {
      const phone = this.normalizePhone(candidate.phone);
      if (phone) this.seenPhones.add(phone);
    }
    if (candidate.businessName && candidate.city) {
      this.seenNameCities.add(this.normalizeNameCity(candidate.businessName, candidate.city));
    }
  }

  normalizeDomain(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '').toLowerCase().trim();
    } catch {
      return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0].toLowerCase().trim();
    }
  }

  normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  normalizeNameCity(name: string, city: string): string {
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/(llc|inc|co|ltd|plumbing|services|corp)/g, '');
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}_${cleanCity}`;
  }
}
