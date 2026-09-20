# TradeFlow Prospect Automation — Gap Matrix
**Document:** `implementation/PROSPECT_AUTOMATION_GAP_MATRIX.md`  
**Phase:** Phase 0 (Context + Plan Audit)  

---

| Requirement / Module | Current Project State | Identified Gap | Resolution & Deliverable |
| :--- | :--- | :--- | :--- |
| **Market Queue Model** | No market queue exists in repo | No deterministic way to rotate cities / regions | `config/prospect_markets.json` with multi-market rotation, priorities & query variants. |
| **Google Places (New) Discovery** | No Places API integration | Need cost-efficient Text Search (New) with minimal field masks | `src/services/prospect/GooglePlacesClient.ts` with strict field masking & batch budgeting. |
| **Website & Contact Enrichment** | No web contact discovery service | Need polite, robots.txt-friendly public scraper for emails & team signals | `src/services/prospect/WebEnrichmentService.ts` with regex mailto/phone & small-team keywords. |
| **ICP Scoring Algorithm** | No qualification engine | Need deterministic 0–10 score with audit trail reason | `src/services/prospect/ProspectScorer.ts` enforcing ICP rules (P0/P1/P2 tiers). |
| **Deduplication Engine** | No prospecting dedupe | Risk of duplicating leads across multiple runs | `src/services/prospect/ProspectDeduplicator.ts` with 4-level key cascade (Place ID, domain, phone, name+city). |
| **Notion CRM Ingestion** | No Notion API client in codebase | Need reliable Notion database query & page creation | `src/services/prospect/NotionClient.ts` + `implementation/n8n_tradeflow_prospect_pipeline.json`. |
| **Daily Orchestration** | No automated pipeline runner | Need a single runner script that hits 30 qualified leads/day target | `scripts/run_prospect_pipeline.ts` with CLI flags (`--dry-run`, `--market`, `--limit`). |
| **Testing & Verification** | No tests for prospecting | Need unit tests verifying dedupe, scoring, enrichment, and error handling | `test/unit/prospect-pipeline.test.ts` integrated into `npm run test`. |
| **Release Certification** | No release audit doc | Need verified certification artifact | `implementation/PROSPECT_AUTOMATION_RELEASE.md`. |
