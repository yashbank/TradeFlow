# Software Requirements Specification (SRS) — TradeFlow
**Standard:** IEEE 830-1998 Compatible  
**Version:** 1.0  
**Status:** Approved  
**Target Systems:** Modern Web Browsers (Mobile Safari, Mobile Chrome, Desktop Browsers)  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for TradeFlow MVP, a mobile-first SaaS designed for plumbing contractors and small plumbing businesses in the US, UK, and Australia. It provides engineers, QA, and automated coding agents with explicit, testable criteria for implementation.

### 1.2 Document Conventions
- **MUST / SHALL / REQUIRED:** Absolute requirements.
- **SHOULD / RECOMMENDED:** Strongly desired for MVP usability.
- **MAY / OPTIONAL:** Secondary or non-blocking enhancements.
- **Amounts:** All monetary values in storage and network payloads are non-negative 64-bit integers representing minor units (cents, pence). Floating-point currency representation is strictly prohibited.

### 1.3 Intended Audience
- Principal Engineers and AI Coding Agents implementing features.
- QA Engineers verifying compliance against test plans.
- Product Management validating business alignment against BRD.md.

### 1.4 Product Scope
TradeFlow facilitates the end-to-end operational workflow of a plumbing business:
$$\text{Customer Registration} \rightarrow \text{Quote Creation \& Delivery} \rightarrow \text{Customer Acceptance} \rightarrow \text{Job Execution} \rightarrow \text{Invoice Generation} \rightarrow \text{Payment Collection}$$
All core records are strictly partitioned under multi-tenant organization boundaries.

---

## 2. Overall Description

### 2.1 Product Perspective
TradeFlow operates as a hosted, cloud-native web application deployed on Vercel, backed by Supabase (PostgreSQL 16, Supabase Auth, Supabase Storage), Stripe for subscription management, and Resend for transactional email dispatch.

```
       [ Client Browser (Mobile / Desktop) ]
                         |
                HTTPS / TLS 1.3
                         v
            [ Next.js App on Vercel ]
            /          |           \
           v           v            v
    [Supabase Auth] [PostgreSQL 16] [Resend Email API]
                       |
                 [Stripe API]
```

### 2.2 User Classes and Characteristics
1. **Owner:** Full administrative authority, billing owner, primary dispatcher, and technician. Requires single-thumb mobile accessibility.
2. **Admin:** Office dispatcher and invoicing coordinator. Operates primarily on desktop/tablet during standard business hours.
3. **Technician:** Field operative. Uses mobile phones under challenging environmental conditions (sun glare, damp hands, intermittent mobile network connectivity).
4. **End Customer:** Property owner or tenant receiving quotes and invoices. Low familiarity with the system; requires immediate 1-tap approval without registration or login.

### 2.3 Operating Environment
- Client Browsers: iOS Safari (v16+), Android Chrome (v110+), Desktop Chrome, Firefox, Edge, Safari.
- Viewports: Optimized for mobile viewports ($375\text{px} \times 667\text{px}$ up to $428\text{px} \times 926\text{px}$) and responsive up to $2560\text{px}$ desktop displays.
- Server Environment: Node.js 20.x runtime on Vercel Serverless Edge/Node infrastructure.
- Database: Managed PostgreSQL 16 on Supabase with Row Level Security (RLS) enabled on all application tables.

### 2.4 Design and Implementation Constraints
- **Stack Mandate:** Next.js 15 (App Router), TypeScript 5.x (strict mode), Tailwind CSS, shadcn/ui, Supabase Client (`@supabase/ssr`), Stripe Node SDK, Resend SDK.
- **Build Timeline:** 8-Day solo engineer + AI agent completion target. No distributed microservices; modular monolith architecture only.
- **Zero Heavy Infrastructure:** Serverless architecture only; no dedicated Redis clusters, Kafka, or background worker fleets for MVP. Background operations handled via Next.js Route Handlers and Supabase Edge Functions where applicable.

---

## 3. External Interface Requirements

### 3.1 User Interfaces
- **UI-1:** The user interface must be mobile-first responsive, providing a bottom navigation bar on screens $< 768\text{px}$ and a collapsible sidebar on screens $\ge 768\text{px}$.
- **UI-2:** All form inputs must trigger appropriate virtual keyboards on mobile (e.g., `type="tel"` for phone numbers, `inputMode="decimal"` for numeric amounts, `type="email"` for emails).
- **UI-3:** Every mutation must display immediate optimistic or pending UI indicators (spinners, skeletons) and a toast notification upon completion or failure.

### 3.2 Software Interfaces
- **SI-AUTH (Supabase Auth):** Handles user registration, JWT issuance, cookie-based session management (`sb-access-token`, `sb-refresh-token`), and password reset flows.
- **SI-DB (Supabase PostgreSQL 16):** Persistent relational storage with RLS policies enforcing tenant isolation using `auth.uid()`.
- **SI-STRIPE (Stripe Billing API v2024-04-10+):** Manages Customer objects, Checkout Sessions for subscription creation, Customer Portal Sessions, and Webhook dispatching.
- **SI-EMAIL (Resend API):** Transactional email delivery for quote dispatch, invoice delivery, and customer notifications using React Email templates.

---

## 4. System Features & Functional Specifications

### 4.1 Authentication & Multi-Tenancy (FR-AUTH)
- **FR-AUTH-01:** System shall permit users to register with Email and Password. Password must be minimum 8 characters with at least one number and one symbol.
- **FR-AUTH-02:** Upon registration, the user must be prompted to initialize an Organization (Business Name, Country, Currency, Timezone). The creating user is automatically assigned the `owner` role.
- **FR-AUTH-03:** Every authenticated database query must resolve the user's active `organization_id`. Access to any record where `organization_id != active_organization_id` must be rejected at the database level via Postgres RLS.
- **FR-AUTH-04:** System shall support inviting team members via email with role designation (`admin`, `technician`).
- **FR-AUTH-05:** System shall support password recovery via email reset link with a 1-hour expiration token.

### 4.2 Customer CRM (FR-CUST)
- **FR-CUST-01:** System shall provide full CRUD for customer records.
- **FR-CUST-02:** Required customer attributes: `first_name`, `last_name`, `phone`, `address_line1`, `city`, `state`, `postal_code`, `country`. Optional: `company_name`, `email`, `address_line2`, `internal_notes`.
- **FR-CUST-03:** System shall enforce uniqueness of customer email per organization when email is supplied.
- **FR-CUST-04:** System shall provide instant search filtering over customer name, phone number, and address string.
- **FR-CUST-05:** Customer detail view shall aggregate linked Quotes, Jobs, and Invoices chronologically.
- **FR-CUST-06:** Customer record deletion shall be soft or restricted if linked to non-void invoices or active jobs.

### 4.3 Quote Management (FR-QUOT)
- **FR-QUOT-01:** System shall generate sequential, gapless quote numbers per organization using the format `Q-YYYY-XXXX` (e.g., `Q-2026-0001`).
- **FR-QUOT-02:** System shall allow adding, editing, reordering, and deleting line items. Each line item requires: `description`, `quantity` (numeric $\ge 0.01$), `unit_price_cents` (integer $\ge 0$), and `taxable` (boolean).
- **FR-QUOT-03:** Line item total must be calculated as:
  $$\text{item\_total} = \text{round}(\text{quantity} \times \text{unit\_price\_cents})$$
- **FR-QUOT-04:** Subtotal must be calculated as the exact sum of all line item totals:
  $$\text{subtotal\_cents} = \sum \text{item\_total}$$
- **FR-QUOT-05:** System shall support discount either as a flat amount (`discount_cents`) or percentage (`discount_rate_basis_points`, where $10\% = 1000$). Discount cannot exceed subtotal.
- **FR-QUOT-06:** Taxable base must be calculated as:
  $$\text{taxable\_base} = \sum_{\text{taxable items}} \text{item\_total} - \text{pro\_rated\_discount}$$
  Tax amount must be calculated using the organization default tax rate or an overridden rate:
  $$\text{tax\_cents} = \text{round}\left(\frac{\text{taxable\_base} \times \text{tax\_rate\_basis\_points}}{10000}\right)$$
- **FR-QUOT-07:** Grand total must equal:
  $$\text{total\_cents} = \text{subtotal\_cents} - \text{discount\_cents} + \text{tax\_cents}$$
- **FR-QUOT-08:** System shall generate a cryptographically secure 256-bit token (`public_token`) upon quote creation to allow unauthenticated customer portal access.
- **FR-QUOT-09:** System shall generate a server-rendered PDF document matching organization branding and line-item breakdown.
- **FR-QUOT-10:** System shall dispatch quote notification emails to customer with a direct link to the public quote approval portal.
- **FR-QUOT-11:** Customer portal shall allow the customer to accept or reject the quote. Acceptance requires capturing customer typed name, client IP address, and timestamp.
- **FR-QUOT-12:** Once accepted, quote state transitions to `accepted`, locking line items from modification.

### 4.4 Job Scheduling & Execution (FR-JOB)
- **FR-JOB-01:** System shall generate sequential job numbers per organization using format `J-YYYY-XXXX`.
- **FR-JOB-02:** System shall allow 1-click conversion from an `accepted` quote to a job. Conversion must duplicate quote line items into the job description/scope and link the `source_quote_id`.
- **FR-JOB-03:** Job attributes: `customer_id`, `job_number`, `title`, `description`, `address`, `assigned_to_user_id`, `scheduled_start`, `scheduled_end`, `status`, `internal_notes`.
- **FR-JOB-04:** Job status transitions:
  $$\text{Scheduled} \longleftrightarrow \text{In Progress} \longrightarrow \text{Completed} \quad (\text{or } \text{Cancelled})$$
- **FR-JOB-05:** Marking a job `In Progress` records `started_at` timestamp.
- **FR-JOB-06:** Marking a job `Completed` records `completed_at` timestamp and validates that scheduled end or completion time is set.
- **FR-JOB-07:** Technician role shall only be permitted to view jobs where `assigned_to_user_id == auth.uid()`. Technicians can modify only `status` and `internal_notes`.

### 4.5 Invoicing & Payments (FR-INV)
- **FR-INV-01:** System shall generate sequential invoice numbers per organization using format `INV-YYYY-XXXX`.
- **FR-INV-02:** System shall allow 1-click conversion from a `completed` job to an invoice. All quote line items and customer details are copied into the invoice.
- **FR-INV-03:** Invoice calculation engine must replicate the identical mathematical invariants defined in FR-QUOT-03 through FR-QUOT-07.
- **FR-INV-04:** Invoice statuses:
  - `Draft`: Initial state; freely editable.
  - `Sent`: Dispatched to customer; marks `sent_at` timestamp.
  - `Paid`: Automatically set when `amount_paid_cents >= total_cents`.
  - `Overdue`: Automatically evaluated when `status == 'Sent'` and `current_date > due_date`.
  - `Void`: Manually voided by Owner or Admin.
- **FR-INV-05:** An invoice in `Paid` status is strictly immutable. No line items, customer, or discount values may be modified.
- **FR-INV-06:** System shall provide offline payment recording against invoices:
  - Required fields: `amount_cents` ($> 0$), `payment_date`, `payment_method` (`credit_card`, `bank_transfer`, `cash`, `check`, `other`).
  - Optional: `reference_number`, `notes`.
- **FR-INV-07:** Each recorded payment creates a record in `payments`, recalculates `invoices.amount_paid_cents`, and updates `invoices.balance_due_cents`:
  $$\text{balance\_due\_cents} = \max(0, \text{total\_cents} - \text{amount\_paid\_cents})$$
- **FR-INV-08:** System shall generate a secure public view URL and downloadable PDF for invoices.

### 4.6 Operational Dashboard (FR-DASH)
- **FR-DASH-01:** System shall compute and display Month-to-Date (MTD) Collected Revenue:
  $$\text{Revenue}_{\text{MTD}} = \sum \text{payments.amount\_cents where payment\_date in current month}$$
- **FR-DASH-02:** System shall compute Total Outstanding Receivables:
  $$\text{Outstanding} = \sum \text{invoices.balance\_due\_cents where status in ('Sent', 'Overdue')}$$
- **FR-DASH-03:** System shall compute Overdue Invoice Count and Sum:
  $$\text{Overdue} = \sum \text{invoices.balance\_due\_cents where status = 'Overdue'}$$
- **FR-DASH-04:** System shall compute 30-day Quote Conversion Win Rate:
  $$\text{Win Rate} = \frac{|\text{Quotes Accepted in last 30d}|}{|\text{Quotes (Sent + Accepted + Rejected) in last 30d}|} \times 100$$
- **FR-DASH-05:** Metrics must be strictly scoped to the active `organization_id`. Technicians must not have permission to view financial KPI widgets.

### 4.7 Subscription Billing (FR-BILL)
- **FR-BILL-01:** Organization registration creates a `subscriptions` record with `status = 'trialing'` and `trial_end = NOW() + INTERVAL '14 days'`.
- **FR-BILL-02:** System shall provide a Stripe Checkout redirect for the $39/month Starter Plan.
- **FR-BILL-03:** System shall process Stripe Webhooks (`customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`) using raw payload signature verification.
- **FR-BILL-04:** When `status` is `canceled` or `past_due` beyond a 3-day grace period, mutating operations (creating customers, quotes, jobs, invoices) shall be blocked with HTTP 402 / UI banner. Read-only viewing and payment collection on existing invoices remains active.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-PERF-01:** Server response time (TTFB) for all authenticated Server Actions and Route Handlers must be $< 250\text{ms}$ at P95 under standard mobile 4G latency.
- **NFR-PERF-02:** PDF generation and streaming must complete in $< 1.2\text{s}$.
- **NFR-PERF-03:** Client bundle size for primary route payloads must not exceed $150\text{kB}$ gzipped.

### 5.2 Security & Multi-Tenant Isolation
- **NFR-SEC-01:** Row Level Security (RLS) must be enabled and enforced on 100% of tenant-scoped tables in PostgreSQL.
- **NFR-SEC-02:** Database bypass (`service_role` key) is strictly prohibited in user-facing request contexts. It is reserved exclusively for the Stripe webhook endpoint.
- **NFR-SEC-03:** Public portal access tokens for quotes and invoices must be generated with at least 256 bits of cryptographic entropy (`crypto.randomBytes(32)`).
- **NFR-SEC-04:** All external client inputs must be parsed and validated with strict Zod schemas before hitting business logic.
- **NFR-SEC-05:** Webhook endpoints must reject requests with invalid or missing `stripe-signature` headers.

### 5.3 Reliability & Availability
- **NFR-REL-01:** The system shall maintain an uptime of $\ge 99.9\%$ during core business operating hours ($06:00 - 20:00$ local tenant time).
- **NFR-REL-02:** All state transitions (Quote $\rightarrow$ Job, Job $\rightarrow$ Invoice, Invoice Payment) must execute inside ACID transactions or atomic database procedures.
