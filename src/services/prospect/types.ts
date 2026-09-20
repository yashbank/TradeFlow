// ==============================================================================
// src/services/prospect/types.ts — Prospect Automation Type Definitions
// ==============================================================================

export interface MarketQueueItem {
  id: string;
  country: string;
  state: string;
  city: string;
  priority: number;
  enabled: boolean;
  targetDailyLeads: number;
  lastRun: string | null;
  queryVariants: string[];
}

export interface RawPlaceResult {
  id: string; // Google Place ID
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  types?: string[];
  businessStatus?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

export interface ProspectCandidate {
  placeId: string;
  businessName: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  website?: string;
  types?: string[];
  sourceQuery?: string;
}

export interface WebEnrichmentResult {
  email?: string;
  secondaryPhone?: string;
  hasOwnerOrTeamEvidence: boolean;
  detectedTeamSize?: number;
  isSmallBusinessSignal: boolean;
  servicesFound: string[];
  evidenceNotes: string[];
}

export interface ProspectScoreResult {
  score: number; // 0 to 10
  priority: 'P0' | 'P1' | 'P2' | 'REJECT';
  reasons: string[];
  isQualified: boolean;
}

export interface QualifiedProspect {
  placeId: string;
  businessName: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website?: string;
  email?: string;
  score: number;
  priority: 'P0' | 'P1' | 'P2' | 'REJECT';
  scoreReasons: string;
  source: string;
  discoveredAt: string;
  notionPageId?: string;
}

export interface PipelineRunMetrics {
  runId: string;
  marketId: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  candidatesFound: number;
  duplicatesFiltered: number;
  enrichedCount: number;
  qualifiedCount: number;
  rejectedCount: number;
  notionCreatedCount: number;
  notionUpdatedCount: number;
  errors: Array<{ step: string; message: string }>;
}
