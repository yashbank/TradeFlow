# TRADEFLOW IMPLEMENTATION PLAN

## Goal
Take the current deployed TradeFlow MVP to production-certified, fully functional, secure, polished and launch-ready with minimal duplicated AI work.

## 0. CONTEXT AUDIT — MUST RUN FIRST
**Model: Claude Sonnet 4.6 (Thinking)**

Create a Context Auditor agent. It must read this plan, all `/docs/*`, existing `implementation/*`, source code, DB migrations, tests, current UI/deployment and accessible Jira tickets.

Create/update:
`implementation/IMPLEMENTATION_CONTEXT.md`

Record only compact facts: architecture, routes, existing functionality, DB/RLS, auth/roles, UI patterns, tests, gaps, Jira mapping and risks.

Then update this plan only when repository reality differs from it. Do not redesign working architecture or duplicate existing code.

**Gate:** no implementation work until the context baseline is complete.

## 1. DATA / AUTH / SECURITY
**Model: Gemini 3.1 Pro**

Verify and fix:
- real Supabase persistence
- auth/session/logout/protected routes
- workspace/role authorization
- Owner/Admin/Technician permissions
- RLS and tenant isolation
- server-side validation
- secure public quote tokens
- Stripe webhook verification
- secrets/env handling
- DB constraints/indexes/migrations
- direct URL/API authorization

**Gate:** no P0/P1 security or tenant-isolation issue.

## 2. CORE BUSINESS FLOW
**Model: Gemini 3.8 Flash**

Verify and fix the real golden path:
`Signup → Workspace → Customer → Quote → Send → Public View → Accept/Reject → Job → Schedule/Assign → Complete → Invoice → Payment`

Verify real persistence, state transitions, numbering, tax/discount totals, money calculations, dashboard metrics, settings and all CRUD/actions. Remove/fix any mock, dead or partial functionality.

**Gate:** complete flow works against real DB data.

## 3. UI / UX / VISUAL QA
**Model: Claude Sonnet 4.6 (Thinking)**

Use UI Auditor + browser/visual QA agents.

Inspect every important route on desktop + mobile. Preserve the existing TradeFlow design language and context; do not invent a new redesign.

Verify/fix: spacing, typography, hierarchy, navigation, forms, tables/cards, icons, responsive behavior, touch targets, loading/empty/error/success states, accessibility basics, dead buttons and broken links.

Use screenshots/artifacts for visual evidence where available.

**Gate:** no major unexplained UI/interaction defect.

## 4. INTEGRATIONS + E2E
**Model: Gemini 3.8 Flash**

Verify real:
- Stripe checkout/portal/webhooks
- Resend emails + React Email
- PDF generation/download
- analytics events from GTM requirements
- Vercel production env/redirects

Run E2E for:
`signup/login/logout → customer → quote → public acceptance → job → invoice → payment → billing`
plus role restrictions, PDF, email and mobile browser flows.

**Gate:** critical integrations work with configured production services.

## 5. FINAL RELEASE CERTIFICATION
**Model: Claude Opus 4.6 (Thinking)**

Use Release Auditor + Security Regression + Jira Acceptance + Production Smoke-Test agents.

Run:
```bash
npm run test
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```

Verify no P0/P1 blockers, runtime errors on critical routes, broken production actions, tenant leakage, role bypasses or failed integrations.

For every accessible Jira ticket:
`Ticket → Requirement → Implementation → Test Evidence → PASS/FAIL`

Create:
`implementation/RELEASE_CERTIFICATION.md`

**Release = PASS only with evidence.**

## Agent Operating Loop
For every phase:
`Discover → Verify → Implement → Test → Review → Fix → Re-test → Report`

Rules:
1. Inspect before editing.
2. Reuse existing working code.
3. Never replace real functionality with mocks.
4. Keep diffs scoped.
5. Every DB change includes migration + RLS/authorization check.
6. Every mutation has validation + loading/error/success behavior.
7. Test desktop + mobile for user-facing changes.
8. Verify Jira acceptance criteria when accessible; never invent them.
9. Use parallel agents only for independent tasks.
10. Do not repeatedly reread all docs; use `IMPLEMENTATION_CONTEXT.md` as the compact handoff.

## Compact Status Files
Maintain only:
- `implementation/IMPLEMENTATION_CONTEXT.md`
- `implementation/GAP_MATRIX.md`
- `implementation/PHASE_STATUS.md`
- `implementation/RELEASE_CERTIFICATION.md`

Status format:
```md
Phase:
Status: NOT_STARTED | RUNNING | BLOCKED | PASSED
Completed:
Found/Failed:
Changed:
Tests:
Jira:
Remaining:
Next:
```

## Definition of Done
- Real authentication and sessions work.
- Real user/workspace data persists in Supabase.
- RLS/tenant isolation verified.
- Roles/permissions enforced server-side.
- Customer → Quote → Job → Invoice → Payment works end-to-end.
- Public quote approval is secure.
- Stripe lifecycle works.
- Resend transactional emails work.
- PDFs work.
- Dashboard uses real data.
- Required analytics events fire.
- Mobile + desktop UX is production quality.
- Tests/typecheck/lint/build pass.
- Relevant Jira requirements are verified with evidence.
- Production deployment smoke test passes.
- No P0/P1 blockers remain.

## Token / Model Optimization
Use cheap/fast models for routine work and reserve reasoning models for high-risk decisions:
- **Gemini 3.8 Flash:** inspection, repetitive fixes, tests, routine E2E.
- **Gemini 3.1 Pro:** architecture, security, complex business logic.
- **Claude Sonnet 4.6 Thinking:** context audit + visual/UI reasoning.
- **Claude Opus 4.6 Thinking:** final release certification only.

Do not rerun a passed phase unless a later phase exposes a regression.

## MASTER ANTIGRAVITY COMMAND
Read and execute `TRADEFLOW_IMPLEMENTATION_PLAN.md`.

Start with **PHASE 0 only**. Build the Context Auditor and supporting agents using Antigravity's agentic/subagent workflow. Inspect the actual repo, current UI/deployment, docs, migrations, tests and accessible Jira requirements.

Do not assume this plan is perfect: reconcile it with the repository and update `IMPLEMENTATION_CONTEXT.md` and this plan when necessary without disturbing working context.

After PHASE 0 passes, execute PHASES 1–5 in order, using the specified models. Implement, test, fix and re-test; do not stop at analysis.

At every phase gate, update `implementation/PHASE_STATUS.md`. At completion, write `implementation/RELEASE_CERTIFICATION.md`.

Do not claim completion without running required verification and production smoke tests.

## FINAL RESPONSE FROM ANTIGRAVITY
Return only:
1. Overall status: PASS / BLOCKED
2. Phases passed
3. Remaining blockers
4. Production verification result
5. Release certification path
