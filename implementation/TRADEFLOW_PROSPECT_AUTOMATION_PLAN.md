# TradeFlow Prospect Automation — Antigravity Implementation Plan

## Objective
Build a low-cost, repeatable prospect-finding pipeline that generates **30 qualified plumbing-business prospects/day** and writes them into the existing TradeFlow Notion CRM.

Scope = **prospecting + qualification + dedupe + Notion sync + daily report**.
Do NOT automate cold outreach in this phase.

## Source of Truth
First inspect:
- existing TradeFlow repo
- existing Notion CRM structure supplied by the user
- `/docs/*`
- `implementation/*`
- current `.env.example`
- current GTM plan

Do not redesign the Notion CRM if an equivalent structure already exists; adapt the automation to the current database properties.

---

# PHASE 0 — CONTEXT + PLAN AUDIT

### Primary model
Claude Sonnet 4.6 Thinking

### Agents
1. **Context Auditor** — inspect repo, current Notion CRM, docs, env structure and this plan.
2. **Integration Architect** — design the smallest reliable n8n/Google Places/website/Notion architecture.
3. **Compliance/Policy Auditor** — verify Google Places usage/storage constraints and prospecting-data handling.

### Required output
Create:
- `implementation/PROSPECT_AUTOMATION_CONTEXT.md`
- `implementation/PROSPECT_AUTOMATION_GAP_MATRIX.md`

The agents must update this plan only when actual project reality requires it.

### Gate
No implementation until the existing CRM fields and current project context are mapped.

---

# PHASE 1 — DATA MODEL + MARKET QUEUE

### Model
Gemini 3.1 Pro

Build a compact configuration model for:

### Market Queue
Each run needs:
- country
- state/province/region
- city/metro
- query variants
- enabled/disabled
- priority
- last run
- target daily leads

Start with the user’s selected markets but make the queue **global/configurable**, so new countries/cities can be added without code changes.

### Search query variants
Examples:
- plumber <city>
- plumbing contractor <city>
- plumbing services <city>
- emergency plumber <city>
- residential plumber <city>

Do not assume every query is required; deduplicate aggressively.

### Gate
Market rotation and query configuration are deterministic and editable without code.

---

# PHASE 2 — PROSPECT DISCOVERY

### Model
Gemini 3.8 Flash

Use **Google Places API (New)** through n8n HTTP Request nodes.

Use Text Search first to discover candidate places. It accepts text queries and requires an explicit field mask; field selection should be minimal to control response size/cost. Google states that Text Search returns at most 60 results across all pages, subject to change. citeturn165396search3turn165396search8

### Discovery fields
Request only fields necessary for identification and dedupe first, e.g.:
- place ID
- display name
- formatted address
- business status/type as needed

### Detail enrichment
Only for candidates that survive initial filtering, call Place Details for:
- phone
- website URI
- relevant business status/type

Place Details is intended for retrieving detailed information for a known place ID. citeturn165396search0turn165396search6

### Cost optimization
- Search in batches.
- Use narrow geographic queries.
- Never request `*` fields in production.
- Do not call Place Details for obvious duplicates or low-quality candidates.
- Maintain a run budget/maximum API calls.

Google requires field masks and states that narrower fields reduce unnecessary processing and billing. citeturn165396search1turn165396search8

### Gate
Pipeline can reliably produce candidates without exceeding configured daily limits.

---

# PHASE 3 — WEBSITE + CONTACT ENRICHMENT

### Model
Gemini 3.8 Flash

For candidates with a public website:
1. Fetch homepage.
2. Discover likely public pages/links: Contact, About, Team, Services.
3. Extract only publicly visible business contact signals.
4. Detect `mailto:` emails and public phone numbers.
5. Extract business/service descriptions useful for qualification.
6. Detect lightweight team-size signals only when explicitly/publicly visible.

### Rules
- Respect robots.txt, site terms and reasonable request rates.
- Do not bypass CAPTCHA, login, anti-bot controls or access restrictions.
- Do not scrape private/personal data.
- Do not use LinkedIn or other platforms by bypassing their access controls.
- Do not infer team size as fact when it is only a guess.

### Fallback
If no website/email is available, keep the prospect if phone/website/profile evidence is sufficient; do not fabricate missing data.

### Gate
Each enriched field must include a source URL or source type when practical.

---

# PHASE 4 — QUALIFICATION + PRIORITY SCORE

### Model
Gemini 3.8 Flash

Score every candidate from 0–10:

- +2 = estimated/verified 1–10 technicians OR clear small-team signal
- +2 = plumbing is a core service
- +2 = public owner/business contact is identifiable
- +2 = visible opportunity for quote/job/invoice workflow improvement
- +1 = multi-technician/team signal
- +1 = active website/social/business presence

Priority:
- 9–10 = P0
- 7–8 = P1
- 5–6 = P2
- <5 = reject/hold

### Important
- Store the **reason for the score**.
- Do not invent facts to increase score.
- Mark uncertain values as `unknown`.
- Make scoring deterministic where possible; use AI only for ambiguous classification.

### Gate
Same input should produce substantially the same score and reason.

---

# PHASE 5 — DEDUPLICATION + DATA QUALITY

### Model
Gemini 3.8 Flash

Deduplicate before Notion write using this order:
1. exact Google Place ID
2. normalized website/domain
3. normalized phone
4. business + city/address similarity

Never create duplicates just because the query or source differs.

Validate:
- business name present
- country/city present
- at least one contact/source field where possible
- source recorded
- score recorded
- status = `New` for new prospects

### Gate
Repeated daily runs do not flood Notion with duplicates.

---

# PHASE 6 — NOTION SYNC

### Model
Gemini 3.1 Pro

Use n8n's native Notion node where supported. n8n supports Notion database/data-source search and database-page create/get/update operations; HTTP Request may be used only where the native node cannot perform a required operation. citeturn750441view2

### Mapping
Map discovered data to the existing TradeFlow Notion properties, preserving the user's current naming/types.

Recommended values:
- Status = `New`
- Source = `Google Places` / `Website` / combined source
- Next Follow-up = blank until outreach
- Demo/Trial/Paid = false
- Score = calculated priority
- Notes = concise evidence/observation

### Gate
New qualified prospect appears correctly in the existing Notion database and repeated runs update/match instead of duplicate.

---

# PHASE 7 — DAILY ORCHESTRATION

### Model
Gemini 3.8 Flash

Create the n8n workflow:

`Schedule Trigger`
→ `Load next market`
→ `Generate query batch`
→ `Google Places Text Search`
→ `candidate filter`
→ `dedupe check`
→ `Place Details only for survivors`
→ `website enrichment`
→ `qualification/score`
→ `final dedupe`
→ `Notion create/update`
→ `daily metrics`
→ `run log`

### Daily target
**30 qualified prospects/day**.

Safety:
- configurable max candidates
- configurable API-call budget
- configurable run timeout
- retry with backoff
- failure branch
- partial-success handling
- no duplicate reruns

### Run output
Record:
- candidates found
- qualified
- rejected
- duplicates
- Notion created
- Notion updated
- API errors
- enrichment errors
- runtime
- estimated API usage/cost where available

---

# PHASE 8 — QA + FAILURE TESTING

### Model
Claude Sonnet 4.6 Thinking

Agents:
1. Workflow QA
2. Data Quality QA
3. Security/Secrets QA
4. Notion Sync QA

Test:
- duplicate business
- duplicate domain
- duplicate phone
- missing website
- missing phone
- invalid email
- empty Place Search result
- API rate limit
- API timeout
- Notion API error
- website timeout
- malformed website
- partial workflow failure
- repeated workflow execution
- disabled market
- daily quota reached

No secrets in Git, logs, reports or Notion notes.

---

# PHASE 9 — RELEASE CERTIFICATION

### Model
Claude Opus 4.6 Thinking

Use only for final certification, not routine coding.

Verify:
- 30 qualified prospects can be produced from the configured market queue.
- dedupe works.
- priority score works.
- Notion sync works.
- failures do not corrupt data.
- API usage limits are enforced.
- credentials are secure.
- Google Places policy constraints are respected.
- workflow can run unattended on schedule.

Create:
`implementation/PROSPECT_AUTOMATION_RELEASE.md`

Format:
```md
Status: PASS | BLOCKED
Implemented:
- ...
Verified:
- ...
Test results:
- ...
Remaining blockers:
- ...
Exact setup still required:
- ...
```

---

# IMPORTANT GOOGLE PLACES POLICY NOTE

Google's current Places API policy states that most Places content is subject to caching/storage restrictions; the `place_id` is explicitly exempt and can be stored. The implementation must therefore have the compliance agent verify exactly which returned fields may be retained in the Notion CRM versus refreshed on demand. citeturn435039search1turn435039search0

Do not build a bulk Google Places data warehouse. Use Place IDs for durable dedupe/reference, and store only data that the applicable Google terms permit for the intended use.

---

# MASTER ANTIGRAVITY PROMPT

Read `TRADEFLOW_PROSPECT_AUTOMATION_PLAN.md` completely before doing any implementation.

Use Antigravity's agentic workflow and create/use subagents automatically.

**First run PHASE 0.** The Context Auditor must inspect the actual repo, existing Notion CRM, environment structure, current GTM plan and this implementation plan. It must update the plan/context where project reality differs.

Then execute PHASES 1–9 in dependency order.

Run independent tasks in parallel when safe; do not parallelize tasks that mutate the same workflow/file/schema simultaneously.

Use the model allocation specified in each phase. Use cheaper/faster models for deterministic work and reserve high-reasoning models for architecture, policy, UI/context-sensitive review and release certification.

Do not ask me to implement routine pieces manually.
Do not build outreach automation in this phase.
Do not replace real integrations with mocks.
Do not fabricate lead data.
Do not bypass anti-bot/access controls.
Do not store secrets in source control.
Do not claim completion without executing tests and a real end-to-end workflow run.

At every phase:
`inspect → implement → test → fix → re-test → record evidence`

Keep reports extremely small. Maintain only:
- `implementation/PROSPECT_AUTOMATION_CONTEXT.md`
- `implementation/PROSPECT_AUTOMATION_GAP_MATRIX.md`
- `implementation/PROSPECT_AUTOMATION_RELEASE.md`

At the end, return only a **1–2 line summary** stating:
1. what this plan required
2. what was actually completed
3. any blocking item
