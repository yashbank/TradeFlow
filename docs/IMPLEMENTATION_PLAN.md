# Implementation Plan: 8-Day Production MVP — TradeFlow
**Role:** Principal Product Engineer & Solution Architect  
**Methodology:** Iterative Test-Driven Development (TDD) + AI Coding Agent Sprint  
**Target:** Production-Grade Deployment on Vercel + Supabase in 8 Days  

---

## 1. Sprint Roadmap Overview

```
Day 1: Foundation, DB Schema, RLS, Auth & Multi-Tenant Onboarding
  |
Day 2: Customer CRM & Workspace Settings
  |
Day 3: Line Item Quote Builder & PDF Engine
  |
Day 4: Public Customer Quote Approval Portal & Email Dispatch
  |
Day 5: 1-Click Quote-to-Job Conversion & Field Dispatch
  |
Day 6: 1-Click Job-to-Invoice Conversion & Offline Payment Recording
  |
Day 7: Operational Dashboard KPIs & Stripe Subscription Billing
  |
Day 8: Full E2E Golden Path Verification, Security Audit & Production Launch
```

---

## 2. Detailed Phase & Module Breakdown

### Phase 1 (Day 1): Foundation, Schema, RLS, Auth & Onboarding
- **Module:** `M1-FOUNDATION`
- **Goal:** Establish zero-latency database connectivity, execute declarative migrations, enforce multi-tenant Row Level Security (RLS), and support user registration with automatic workspace creation.
- **Dependencies:** Supabase project provisioning.
- **Tasks:**
  1. Initialize Next.js 15 project with TypeScript (strict mode), Tailwind CSS, Lucide icons, and shadcn/ui.
  2. Configure Supabase Server and Browser clients using `@supabase/ssr`.
  3. Create migration `001_initial_schema.sql` containing all 13 tables, custom enum types, and foreign key cascades from `DB_SCHEMA.md`.
  4. Create migration `002_rls_policies.sql` enforcing RLS on 100% of tables with helper functions (`is_org_member`, `is_org_admin`).
  5. Create migration `003_sequences_and_triggers.sql` containing `fn_next_sequence` and `update_updated_at_column`.
  6. Implement authentication actions: `registerUserAction`, `loginUserAction`, `logoutUserAction`, `passwordResetAction`.
  7. Build initial responsive onboarding flow (`/signup`, `/login`, `/onboarding`).
- **Acceptance Criteria:**
  - A user can register with email/password; an organization is automatically created with the user as `owner`.
  - Supabase session cookies (`sb-*-auth-token`) are set with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
  - Database queries fail if attempted without a valid session context.
- **Tests:**
  - `test/unit/auth.test.ts`: Form validation, password complexity checking.
  - `test/integration/rls.test.ts`: Verify User A cannot access User B records; verify RLS blocks cross-tenant access.

---

### Phase 2 (Day 2): Customer CRM & Workspace Settings
- **Module:** `M2-CUSTOMER-CRM`
- **Goal:** Deliver a responsive customer directory with instant search, full CRUD, and organization profile configuration.
- **Dependencies:** `M1-FOUNDATION`.
- **Tasks:**
  1. Implement `CustomerService` and Server Actions (`getCustomersAction`, `createCustomerAction`, `updateCustomerAction`, `deleteCustomerAction`).
  2. Implement client search input with debounced server filtering (by name, phone, address).
  3. Build Customer List (`/customers`) and Customer Detail view (`/customers/[id]`) showing contact details, map link, and activity tabs.
  4. Build Workspace Settings page (`/settings`) allowing Owner to configure Business Name, Currency, Tax Rate (in basis points), Phone, and Address.
- **Acceptance Criteria:**
  - Fast search filters customer list in $< 100\text{ms}$.
  - Phone numbers are clickable via `tel:` links; addresses open native map navigation.
  - Customer email uniqueness enforced per organization.
- **Tests:**
  - `test/unit/validation.test.ts`: Zod customer payload validation.
  - `test/integration/customer.test.ts`: Customer CRUD within tenant isolation.

---

### Phase 3 (Day 3): Quote Builder & PDF Generation Engine
- **Module:** `M3-QUOTE-ENGINE`
- **Goal:** Enable rapid quote drafting with line-item calculations, gapless quote numbering (`Q-YYYY-XXXX`), and in-memory PDF generation.
- **Dependencies:** `M1-FOUNDATION`, `M2-CUSTOMER-CRM`.
- **Tasks:**
  1. Implement pure financial calculation engine `calculateDocumentTotals` in `src/lib/finance/calculator.ts`.
  2. Implement `QuoteService` and Server Actions (`createQuoteAction`, `updateQuoteAction`, `deleteQuoteAction`).
  3. Wire atomic sequence generator `fn_next_sequence(org_id, 'quote')`.
  4. Build interactive Quote Builder UI (`/quotes/new`, `/quotes/[id]/edit`) with dynamic line-item rows, taxable toggles, and live client calculation preview.
  5. Implement `@react-pdf/renderer` vector template (`src/services/pdf/QuotePdf.tsx`) and streaming route `GET /api/quotes/[id]/pdf`.
- **Acceptance Criteria:**
  - Quote numbers increment gaplessly (e.g. `Q-2026-0001`, `Q-2026-0002`).
  - Calculations match integer minor-unit math with zero decimal rounding anomalies.
  - PDF streams in $< 800\text{ms}$ with professional layout, logo, terms, and line items.
- **Tests:**
  - `test/unit/calculator.test.ts`: Full financial calculation test matrix (TC-CALC-01 through TC-CALC-08).
  - `test/integration/quote.test.ts`: Quote creation, line item insertion, and sequence monotonicity.

---

### Phase 4 (Day 4): Public Quote Approval Portal & Email Delivery
- **Module:** `M4-PUBLIC-PORTAL`
- **Goal:** Allow homeowners to review, accept, or decline quotes on mobile via secure tokens without logging in, and trigger Resend email notifications.
- **Dependencies:** `M3-QUOTE-ENGINE`.
- **Tasks:**
  1. Integrate Resend SDK and build `QuoteSentEmail` React Email template.
  2. Implement `sendQuoteAction`: transitions quote to `sent`, records `sent_at`, and dispatches email with public link.
  3. Build Public Quote View route `/view/quote/[token]` optimized for mobile viewports.
  4. Implement `respondToQuotePublicAction`: accepts customer typed name, validates 256-bit token, transitions state to `accepted` or `rejected`, logs IP and timestamp.
  5. Add copyable public quote link button with clipboard toast notification in the staff UI.
- **Acceptance Criteria:**
  - Homeowner can review quote on mobile phone, click "Approve", type full name, and confirm in $< 30\text{ seconds}$.
  - Approved quotes display green badge and lock line items from editing.
  - Rejection captures optional reason and updates owner dashboard.
- **Tests:**
  - `test/unit/state-machines.test.ts`: Quote state transitions (TC-FSM-01 to TC-FSM-05).
  - `tests/e2e/public-portal.spec.ts`: Playwright test verifying public quote approval on simulated mobile viewport.

---

### Phase 5 (Day 5): Job Scheduling & Mobile Field Dispatch
- **Module:** `M5-JOB-DISPATCH`
- **Goal:** Implement 1-click conversion from accepted quotes to scheduled jobs, technician assignment, and mobile execution views.
- **Dependencies:** `M4-PUBLIC-PORTAL`.
- **Tasks:**
  1. Implement `JobService` and atomic conversion action `convertQuoteToJobAction`.
  2. Implement job scheduling fields (`scheduled_start`, `scheduled_end`, `assigned_to_user_id`).
  3. Build Jobs List (`/jobs`) with filtering by status (`Scheduled`, `In Progress`, `Completed`, `Cancelled`) and date.
  4. Build Mobile Technician View (`/tech/today`) showing assigned jobs with 1-tap "Start Job" and "Complete Job" buttons.
  5. Enforce RBAC: Technicians can only view assigned jobs and update status/notes.
- **Acceptance Criteria:**
  - Clicking "Convert to Job" on an accepted quote generates job `J-YYYY-XXXX` in 1 click without duplicate typing.
  - Technician can start and complete a job on mobile, adding field notes upon completion.
- **Tests:**
  - `test/unit/state-machines.test.ts`: Job lifecycle transitions (TC-FSM-06 to TC-FSM-07).
  - `test/integration/jobs.test.ts`: Conversion idempotency and technician RBAC isolation.

---

### Phase 6 (Day 6): Invoicing & Offline Payment Recording
- **Module:** `M6-INVOICE-PAYMENTS`
- **Goal:** Implement 1-click conversion from completed jobs to invoices, PDF generation, public invoice portal, and recording offline payments.
- **Dependencies:** `M5-JOB-DISPATCH`.
- **Tasks:**
  1. Implement `InvoiceService` and conversion action `convertJobToInvoiceAction`.
  2. Implement `sendInvoiceAction` and `InvoiceSentEmail` template.
  3. Implement `recordPaymentAction` supporting methods (`credit_card`, `bank_transfer`, `cash`, `check`).
  4. Automatically recalculate `amount_paid_cents` and `balance_due_cents`; update status to `paid` when balance is 0.
  5. Build Invoice PDF generator route `GET /api/invoices/[id]/pdf` and Public Invoice View `/view/invoice/[token]`.
  6. Build Payment Modal in staff UI with instant balance updates and printable receipt view.
- **Acceptance Criteria:**
  - 1-click conversion creates draft invoice with line items from completed job.
  - Recording full payment marks invoice `paid`, stamps `paid_at`, and prevents further edits.
  - Partial payments decrement balance due correctly.
- **Tests:**
  - `test/unit/state-machines.test.ts`: Invoice transitions (TC-FSM-08 to TC-FSM-11).
  - `test/integration/payments.test.ts`: Multiple partial payments reconciling to zero balance.

---

### Phase 7 (Day 7): Operational Dashboard & Stripe Subscription Billing
- **Module:** `M7-DASHBOARD-BILLING`
- **Goal:** Render real-time business KPIs and integrate Stripe Checkout and Webhooks for the $39/month Starter Plan.
- **Dependencies:** `M6-INVOICE-PAYMENTS`.
- **Tasks:**
  1. Implement dashboard aggregation queries in `src/services/DashboardService.ts` (MTD Revenue, Outstanding Receivables, Overdue Invoices, Active Quotes, 30-Day Win Rate).
  2. Build Dashboard UI (`/dashboard`) with metric cards and "Today's Schedule" widget.
  3. Implement Stripe Checkout session creation action `createCheckoutSessionAction` and Customer Portal action `createPortalSessionAction`.
  4. Implement Route Handler `/api/webhooks/stripe` with raw body signature verification and idempotency handling.
  5. Build subscription paywall middleware restricting mutations if trial has expired without active subscription.
- **Acceptance Criteria:**
  - Dashboard KPIs recalculate immediately upon recording payments or accepting quotes.
  - Stripe webhook transitions organization subscription from `trialing` to `active` upon checkout completion.
  - Expired trials display upgrade banner and block new quote/job creations while allowing read access.
- **Tests:**
  - `test/integration/webhooks.test.ts`: Stripe webhook event processing (TC-WH-01 to TC-WH-04).
  - `test/integration/dashboard.test.ts`: Metric accuracy against known seed database state.

---

### Phase 8 (Day 8): End-to-End Verification, Security Audit & Production Launch
- **Module:** `M8-LAUNCH`
- **Goal:** Run complete end-to-end regression suites, verify security posture, deploy production infrastructure, and execute the launch smoke test.
- **Dependencies:** All previous modules (`M1` through `M7`).
- **Tasks:**
  1. Run full Playwright E2E suite (`tests/e2e/golden-path.spec.ts`, `tests/e2e/tenant-isolation.spec.ts`, `tests/e2e/public-portal.spec.ts`).
  2. Execute OWASP Top 10 security audit checklist and verify RLS policies across all tables.
  3. Configure production environment variables in Vercel.
  4. Link custom domain `app.tradeflow.com` and verify SSL certificates.
  5. Verify Stripe live mode webhooks and Resend production domain DNS records (SPF/DKIM/DMARC).
  6. Execute production smoke test: Register real test account, create customer, send quote to real phone/email, approve quote, convert to job, complete job, invoice, and record payment.
- **Acceptance Criteria:**
  - 100% of automated tests passing in CI.
  - Zero P0 or P1 security defects.
  - Production deployment live with $< 250\text{ms}$ TTFB.
  - Real-world quote-to-invoice golden path executed cleanly on mobile device.
