// ==============================================================================
// src/services/prospect/ProspectPipelineOrchestrator.ts — Daily Pipeline Runner
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { GooglePlacesClient } from './GooglePlacesClient';
import { WebEnrichmentService } from './WebEnrichmentService';
import { ProspectScorer } from './ProspectScorer';
import { ProspectDeduplicator } from './ProspectDeduplicator';
import { NotionClient } from './NotionClient';
import type {
  MarketQueueItem,
  ProspectCandidate,
  WebEnrichmentResult,
  QualifiedProspect,
  PipelineRunMetrics,
} from './types';

export interface OrchestratorOptions {
  configPath?: string;
  marketId?: string;
  targetDailyLeads?: number;
  dryRun?: boolean;
}

export class ProspectPipelineOrchestrator {
  private placesClient: GooglePlacesClient;
  private deduplicator: ProspectDeduplicator;
  private notionClient: NotionClient;
  private configPath: string;

  constructor(options?: OrchestratorOptions) {
    this.placesClient = new GooglePlacesClient();
    this.deduplicator = new ProspectDeduplicator();
    this.notionClient = new NotionClient();
    this.configPath =
      options?.configPath ||
      path.resolve(process.cwd(), 'config/prospect_markets.json');
  }

  /**
   * Executes full prospecting pipeline for active markets.
   */
  async executeDailyPipeline(options?: OrchestratorOptions): Promise<PipelineRunMetrics> {
    const startTime = new Date().toISOString();
    const runId = `run_${Date.now()}`;
    const targetDailyLeads = options?.targetDailyLeads || 30;
    const isDryRun = Boolean(options?.dryRun);

    // 1. Load markets
    const markets: MarketQueueItem[] = JSON.parse(
      fs.readFileSync(this.configPath, 'utf-8')
    );
    const activeMarkets = markets.filter(
      (m) => m.enabled && (!options?.marketId || m.id === options.marketId)
    );

    if (activeMarkets.length === 0) {
      throw new Error('No active markets found in market queue.');
    }

    // Pick top priority market
    activeMarkets.sort((a, b) => a.priority - b.priority);
    const market = activeMarkets[0];

    const metrics: PipelineRunMetrics = {
      runId,
      marketId: market.id,
      startTime,
      candidatesFound: 0,
      duplicatesFiltered: 0,
      enrichedCount: 0,
      qualifiedCount: 0,
      rejectedCount: 0,
      notionCreatedCount: 0,
      notionUpdatedCount: 0,
      errors: [],
    };

    // 2. Pre-seed deduplication cache from Notion
    if (!isDryRun && this.notionClient.isConfigured()) {
      try {
        const existing = await this.notionClient.fetchExistingProspects();
        this.deduplicator.seedExisting(existing);
      } catch (err: any) {
        metrics.errors.push({ step: 'notion_seed', message: err.message });
      }
    }

    const qualifiedProspects: QualifiedProspect[] = [];

    // 3. Execute Discovery per query variant
    for (const query of market.queryVariants) {
      if (qualifiedProspects.length >= targetDailyLeads) break;

      try {
        let candidates: ProspectCandidate[] = [];
        if (process.env.GOOGLE_PLACES_API_KEY) {
          candidates = await this.placesClient.textSearch(
            query,
            market.city,
            market.state,
            market.country,
            20
          );
        } else {
          // If running locally without Google Places API key, handle gracefully
          metrics.errors.push({
            step: 'discovery',
            message: 'GOOGLE_PLACES_API_KEY is not set. Using dry-run sample batch.',
          });
          break;
        }

        metrics.candidatesFound += candidates.length;

        // 4. Candidate filtering & deduplication
        for (const candidate of candidates) {
          if (qualifiedProspects.length >= targetDailyLeads) break;

          const dupCheck = this.deduplicator.isDuplicate(candidate);
          if (dupCheck.isDup) {
            metrics.duplicatesFiltered++;
            continue;
          }

          // Register in deduplicator
          this.deduplicator.register(candidate);

          // 5. Public Website & Contact Enrichment
          let enrichment: WebEnrichmentResult = {
            hasOwnerOrTeamEvidence: false,
            isSmallBusinessSignal: false,
            servicesFound: [],
            evidenceNotes: [],
          };

          if (candidate.website) {
            try {
              enrichment = await WebEnrichmentService.enrichFromWebsite(candidate.website);
              metrics.enrichedCount++;
            } catch {
              // Graceful enrichment fallback
            }
          }

          // 6. Deterministic Qualification Scoring
          const scoreResult = ProspectScorer.scoreCandidate(candidate, enrichment);

          if (!scoreResult.isQualified) {
            metrics.rejectedCount++;
            continue;
          }

          metrics.qualifiedCount++;

          const prospect: QualifiedProspect = {
            placeId: candidate.placeId,
            businessName: candidate.businessName,
            formattedAddress: candidate.formattedAddress,
            city: candidate.city,
            state: candidate.state,
            country: candidate.country,
            phone: candidate.phone || '',
            website: candidate.website,
            email: enrichment.email,
            score: scoreResult.score,
            priority: scoreResult.priority,
            scoreReasons: scoreResult.reasons.join('; '),
            source: 'Google Places + Web',
            discoveredAt: new Date().toISOString(),
          };

          // 7. Sync to Notion CRM
          if (!isDryRun && this.notionClient.isConfigured()) {
            const syncRes = await this.notionClient.syncProspect(prospect);
            if (syncRes.success) {
              prospect.notionPageId = syncRes.pageId;
              metrics.notionCreatedCount++;
            } else {
              metrics.errors.push({
                step: 'notion_sync',
                message: syncRes.error || 'Failed to sync to Notion',
              });
            }
          }

          qualifiedProspects.push(prospect);
        }
      } catch (err: any) {
        metrics.errors.push({ step: 'query_execution', message: err.message });
      }
    }

    // 8. Update market last run timestamp
    market.lastRun = new Date().toISOString();
    fs.writeFileSync(this.configPath, JSON.stringify(markets, null, 2));

    metrics.endTime = new Date().toISOString();
    metrics.durationMs =
      new Date(metrics.endTime).getTime() - new Date(metrics.startTime).getTime();

    // 9. Save run metrics report
    const runsDir = path.resolve(process.cwd(), 'implementation/prospect_runs');
    if (!fs.existsSync(runsDir)) {
      fs.mkdirSync(runsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(runsDir, `${runId}.json`),
      JSON.stringify({ metrics, prospects: qualifiedProspects }, null, 2)
    );

    return metrics;
  }
}
