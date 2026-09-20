# TradeFlow Prospect Automation — Context & Architecture Audit
**Document:** `implementation/PROSPECT_AUTOMATION_CONTEXT.md`  
**Phase:** Phase 0 (Context + Plan Audit)  
**Target:** 30 Qualified Plumbing Prospects / Day synced to Notion CRM  

---

## 1. Project Source of Truth & Positioning Alignment

- **Target Persona (ICP):** Small plumbing contractors & service operators (1–10 technicians/trucks), owner-operated or family-run, primarily in the US, UK, and Australia.
- **Core Value Proposition:** Fast quote-to-invoice workflow at $39/month ("less than one service call-out").
- **Current Pipeline Goal:** 100 Qualified Contacts $\rightarrow$ 20 Replies $\rightarrow$ 10 Demos $\rightarrow$ 5 Trials $\rightarrow$ 1–3 Paying Customers ($39+ MRR).
- **Prospecting Scope:** Automated discovery $\rightarrow$ enrichment $\rightarrow$ deterministic ICP qualification $\rightarrow$ multi-key deduplication $\rightarrow$ Notion CRM ingestion. No cold outreach automation in this phase.

---

## 2. Notion CRM Database Specification

To seamlessly receive automated leads without altering any existing structures, the target Notion CRM database is defined with the following standard properties:

| Property Name | Notion Property Type | Purpose / Values |
| :--- | :--- | :--- |
| **Business Name** | `title` (Primary) | Official trade business name |
| **Status** | `select` | `New`, `Contacted`, `Replied`, `Demo Scheduled`, `Trial Started`, `Won`, `Disqualified` |
| **Priority** | `select` | `P0 (Hot 9-10)`, `P1 (Strong 7-8)`, `P2 (Moderate 5-6)`, `Reject (<5)` |
| **Score** | `number` | Deterministic qualification score (0 to 10) |
| **Score Reason** | `rich_text` | Audit trail of scoring triggers (e.g. `Small team signal (+2), Core plumbing (+2), Phone (+2)`) |
| **Phone** | `phone_number` | Direct business / dispatch phone |
| **Website** | `url` | Clean website URL |
| **Email** | `email` | Discovered public business contact email |
| **City** | `rich_text` | Metro / operational city |
| **Country** | `select` | `US`, `UK`, `AU`, `CA` |
| **Formatted Address** | `rich_text` | Full physical / dispatch address |
| **Google Place ID** | `rich_text` | Unique permanent identifier for deduplication |
| **Source** | `select` | `Google Places + Web` |
| **Discovered Date** | `date` | Timestamp of discovery |

---

## 3. Google Places API (New) Compliance & Legal Boundaries

1. **Permitted Retention:**
   - The `places.id` is explicitly exempt from caching restrictions and is stored permanently as a durable deduplication key.
   - Core identification fields (business name, national phone number, website URL, and formatted address) are retained in the Notion CRM as business contact records for B2B relationship management.
2. **Prohibited Storage:**
   - Ephemeral, user-generated, or proprietary Google content (photos, user ratings, individual reviews, dynamic open/close hours) is strictly **never cached or warehoused**.
3. **Cost & Rate Controls:**
   - Mandatory field masks applied to all requests (`X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.types,places.businessStatus`).
   - Place Details called **only for candidates that survive initial local filters**.
   - Hard quota caps enforced per execution run (max 50 discovery calls / day).

---

## 4. Dual-Mode Integration Architecture

To provide maximum flexibility and zero lock-in:
1. **Production TypeScript Engine (`src/services/prospect/` & `scripts/run_prospect_pipeline.ts`):**
   - Completely native, highly tested (Vitest), runnable via `npm run prospect` or GitHub Actions / cron.
   - Built with deterministic scoring, robots.txt-friendly public enrichment, and native Notion REST client.
2. **Exportable n8n Workflow (`implementation/n8n_tradeflow_prospect_pipeline.json`):**
   - Standard visual n8n workflow with native Schedule Trigger, HTTP Request nodes, Code/Function evaluation, and Notion integration nodes.
