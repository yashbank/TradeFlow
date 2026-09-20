// ==============================================================================
// src/services/prospect/ProspectScorer.ts — Deterministic Qualification Scoring
// ==============================================================================

import type { ProspectCandidate, WebEnrichmentResult, ProspectScoreResult } from './types';

export class ProspectScorer {
  /**
   * Deterministically scores a candidate from 0 to 10 against TradeFlow's Plumbing ICP.
   */
  static scoreCandidate(
    candidate: ProspectCandidate,
    enrichment: WebEnrichmentResult
  ): ProspectScoreResult {
    let score = 0;
    const reasons: string[] = [];

    const lowerName = candidate.businessName.toLowerCase();
    const types = (candidate.types || []).map((t) => t.toLowerCase());

    // 1. Plumbing is a core service (+2)
    const isPlumbingCore =
      lowerName.includes('plumb') ||
      types.includes('plumber') ||
      types.includes('plumbing_service') ||
      enrichment.servicesFound.length > 0;

    if (isPlumbingCore) {
      score += 2;
      reasons.push('Core plumbing service verified (+2)');
    }

    // 2. Small team signal (1–10 technicians ICP) (+2)
    if (enrichment.isSmallBusinessSignal || (!lowerName.includes('group') && !lowerName.includes('franchise'))) {
      score += 2;
      reasons.push('Independent / small trade team signal (+2)');
    }

    // 3. Public owner or direct business contact identifiable (+2)
    if (candidate.phone || enrichment.email) {
      score += 2;
      const contactType = enrichment.email && candidate.phone ? 'Phone & Email' : candidate.phone ? 'Direct Phone' : 'Email';
      reasons.push(`Direct contact reachable via ${contactType} (+2)`);
    }

    // 4. Workflow improvement opportunity (+2)
    // Small trade contractors without complex custom portals benefit immediately from TradeFlow
    score += 2;
    reasons.push('High quote-to-invoice workflow improvement potential (+2)');

    // 5. Multi-technician / team signal (+1)
    if (enrichment.hasOwnerOrTeamEvidence || enrichment.servicesFound.length >= 3) {
      score += 1;
      reasons.push('Active team / multi-service dispatch evidence (+1)');
    }

    // 6. Active website / web presence (+1)
    if (candidate.website) {
      score += 1;
      reasons.push('Established public website (+1)');
    }

    // Ensure score is capped at 10
    score = Math.min(10, Math.max(0, score));

    // Priority classification
    let priority: 'P0' | 'P1' | 'P2' | 'REJECT';
    if (score >= 9) {
      priority = 'P0';
    } else if (score >= 7) {
      priority = 'P1';
    } else if (score >= 5) {
      priority = 'P2';
    } else {
      priority = 'REJECT';
    }

    return {
      score,
      priority,
      reasons,
      isQualified: score >= 5,
    };
  }
}
