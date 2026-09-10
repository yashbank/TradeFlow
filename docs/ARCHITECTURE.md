# System Architecture Document — TradeFlow
**Version:** 1.0  
**Pattern:** Modular Monolith on Managed Cloud & Serverless Infrastructure  
**Target:** 8-Day Production Build  

---

## 1. Architectural Style & Tenets

TradeFlow is architected as a **cloud-native, multi-tenant modular monolith**. For an 8-day engineering sprint executed by a solo developer and AI coding agents, microservices introduce unacceptable distributed systems overhead (network latency, RPC contracts, eventual consistency bugs, dual writes, separate CI/CD pipelines, and multi-service deployment failures).

Instead, TradeFlow enforces modular domain isolation inside a single, type-safe Next.js codebase, delegating infrastructure complexity to world-class managed providers:

```
+-----------------------------------------------------------------------------------------+
|                                    TRADEFLOW RUNTIME                                    |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                        Next.js 15 App Router on Vercel                          |   |
|   |   +-------------------+  +--------------------+  +--------------------------+   |   |
|   |   |  Server Actions   |  |   Route Handlers   |  | React Server Components  |   |   |
|   |   +---------+---------+  +---------+----------+  +------------+-------------+   |   |
|   |             |                      |                          |                 |   |
|   |             +----------------------+--------------------------+                 |   |
|   |                                    |                                            |   |
|   |                         [Domain Services Layer]                                 |   |
|   |                         (Strict Module Boundaries)                              |   |
|   +------------------------------------+--------------------------------------------+   |
|                                        |                                                |
+----------------------------------------|------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
+------------------------------------+   +------------------------------------+
|        Supabase Managed Cloud      |   |       External SaaS Services       |
|  - PostgreSQL 16 (RLS Enforced)    |   |  - Stripe (Billing / SCA)          |
|  - Supabase Auth (JWT & Cookies)   |   |  - Resend (Transactional Email)    |
|  - Supabase Storage (Logos/Assets) |   |                                    |
+------------------------------------+   +------------------------------------+
```

### Core Architecture Tenets:
1. **Multi-Tenancy by Default:** Every record belongs to an `organization_id`. PostgreSQL Row Level Security (RLS) is the non-negotiable security foundation.
2. **Zero Floating-Point Math:** All currency values are strictly stored and computed as 64-bit integer cents.
3. **No Duplicate Entry:** Pipeline progression ($\text{Quote} \rightarrow \text{Job} \rightarrow \text{Invoice}$) performs deep data cloning to eradicate repetitive typing for trade operators.
4. **Serverless & Managed:** Zero VMs to patch, zero Docker containers to orchestrate, zero Kubernetes clusters to configure.
5. **Mobile Ergonomics First:** UI is architected around thumb-friendly 44px tap targets and immediate offline-friendly responsive layouts.

---

## 2. C4 Model Architectural Diagrams

### 2.1 Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram - TradeFlow MVP

    Person(plumber, "Plumbing Owner / Tech", "Creates quotes, executes jobs, sends invoices, records payments via mobile/desktop web.")
    Person(customer, "Property Owner / Client", "Reviews quotes and invoices, accepts/declines quotes via mobile web portal.")

    System(tradeflow, "TradeFlow SaaS", "Enables trade businesses to manage CRM, quotes, jobs, invoices, and receive payments.")

    System_Ext(stripe, "Stripe Billing", "Processes SaaS subscription checkouts and manages customer subscription lifecycles.")
    System_Ext(resend, "Resend Email", "Delivers transactional notifications (quote delivery, invoice delivery, receipts).")
    System_Ext(supabase, "Supabase Managed Platform", "Provides managed PostgreSQL 16, User Authentication, and File Storage.")

    Rel(plumber, tradeflow, "Manages customers, quotes, jobs, and invoices", "HTTPS / Mobile Web")
    Rel(customer, tradeflow, "Reviews and approves quotes, views invoices", "HTTPS / Mobile Web")

    Rel(tradeflow, supabase, "Authenticates users, queries & stores relational data via RLS", "Postgres Wire / HTTPS")
    Rel(tradeflow, stripe, "Creates checkout sessions, listens to subscription webhooks", "HTTPS / JSON API")
    Rel(tradeflow, resend, "Dispatches transactional emails with PDF links", "HTTPS / REST API")
```

---

### 2.2 Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram - TradeFlow Architecture

    Person(user, "Plumbing Staff / Customer", "Web browser on smartphone, tablet, or desktop")

    Container_Boundary(c1, "TradeFlow Application Boundary") {
        Container(nextjs, "Next.js 15 Web Application", "Next.js App Router, React 19, TypeScript", "Serves UI, processes Server Actions, handles API webhooks, renders PDFs.")
        ContainerDb(postgres, "PostgreSQL 16 Database", "Supabase Managed Postgres with RLS", "Stores tenant organizations, customer CRM, quotes, jobs, invoices, payments.")
        Container(auth, "Supabase Auth", "GoTrue Auth Engine", "Issues JWTs, handles session cookies, verifies passwords.")
        Container(storage, "Supabase Storage", "S3-compatible bucket", "Stores business branding logos and PDF file artifacts.")
    }

    System_Ext(stripe_api, "Stripe API", "SaaS Subscriptions & Webhooks")
    System_Ext(resend_api, "Resend API", "Transactional Email Dispatch")

    Rel(user, nextjs, "Interacts via responsive browser", "HTTPS / TLS 1.3")
    Rel(nextjs, auth, "Authenticates sessions via SSR cookies", "HTTPS / REST")
    Rel(nextjs, postgres, "Reads/writes tenant data under RLS", "Supabase Client / Postgres Wire")
    Rel(nextjs, storage, "Uploads and retrieves logos", "HTTPS / S3 API")
    Rel(nextjs, stripe_api, "Redirects to Checkout / Customer Portal", "HTTPS / REST")
    Rel(stripe_api, nextjs, "Posts subscription lifecycle events", "HTTPS / Webhook")
    Rel(nextjs, resend_api, "Sends quote & invoice notification emails", "HTTPS / REST")
```

---

### 2.3 Level 3: Component Diagram (Next.js Application Internals)

```mermaid
C4Component
    title Component Diagram - Next.js Modular Monolith

    Container_Boundary(app, "Next.js Server Boundary") {
        Component(middleware, "Auth Middleware", "Next.js Middleware", "Refreshes auth cookies, verifies session, enforces route guards.")
        Component(actions, "Server Actions Layer", "TypeScript Mutations", "Validates input via Zod, authenticates org membership, coordinates services.")
        Component(routes, "API Route Handlers", "Next.js Route Handlers", "Handles Stripe webhooks, PDF streaming endpoints, public quote responses.")
        
        Component(quote_svc, "Quote Service", "Domain Logic", "Calculates totals, enforces quote FSM, handles quote-to-job cloning.")
        Component(job_svc, "Job Service", "Domain Logic", "Dispatches technicians, updates job lifecycle, validates schedules.")
        Component(inv_svc, "Invoice Service", "Domain Logic", "Clones jobs to invoices, records payments, recalculates balances.")
        Component(calc_engine, "Finance Calculation Engine", "Pure TypeScript Library", "Calculates subtotal, discounts, taxable base, tax, and totals in integer cents.")
        Component(pdf_svc, "PDF Generation Service", "@react-pdf/renderer", "Generates pixel-perfect quote and invoice vector PDFs in memory.")
    }

    ContainerDb(db, "Supabase PostgreSQL", "Database", "RLS protected tables")

    Rel(middleware, actions, "Passes authenticated context")
    Rel(actions, quote_svc, "Invokes quote operations")
    Rel(actions, job_svc, "Invokes job operations")
    Rel(actions, inv_svc, "Invokes invoice operations")
    Rel(quote_svc, calc_engine, "Executes financial math")
    Rel(inv_svc, calc_engine, "Executes financial math")
    Rel(routes, pdf_svc, "Requests PDF binary stream")
    Rel(quote_svc, db, "Reads/Writes via typed Supabase client")
    Rel(job_svc, db, "Reads/Writes via typed Supabase client")
    Rel(inv_svc, db, "Reads/Writes via typed Supabase client")
```

---

## 3. Multi-Tenant Isolation Pattern

TradeFlow implements **Shared Database, Shared Schema Multi-Tenancy with Row Level Security (RLS)**:

```
                            [ Incoming HTTP Request ]
                                        |
                                        v
                    [ Next.js Middleware / Auth Verification ]
                                        |
                       Resolves active organization_id
                                        |
                                        v
                       [ Server Action / Service Layer ]
                     Passes session JWT to Supabase Client
                                        |
                                        v
                       [ PostgreSQL Execution Engine ]
                                        |
                 +---------------------------------------------+
                 |            PostgreSQL Row Level Security     |
                 |  Filters ALL rows by active organization_id |
                 +---------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
        [ Organization A Data ]                       [ Organization B Data ]
        (Isolated & Protected)                        (Isolated & Protected)
```

### Defense-in-Depth Enforcement:
1. **Layer 1 (Application Middleware):** Validates authentication session and confirms the user belongs to at least one valid organization.
2. **Layer 2 (Service Layer / Server Action):** Explicitly injects the authenticated `organization_id` into query filters and mutation payloads.
3. **Layer 3 (Database Row Level Security):** Absolute safeguard. If application logic has a defect or omitted filter, PostgreSQL rejects access unless the current user has a matching membership in `organization_members` for that row.

---

## 4. End-to-End Request-Response Lifecycles

### 4.1 Authenticated Business Flow: Quote $\rightarrow$ Job $\rightarrow$ Invoice
```mermaid
sequenceDiagram
    autonumber
    actor Owner as Dave (Plumber)
    participant UI as Mobile Browser (Next.js)
    participant Action as Server Action
    participant Calc as Finance Engine
    participant DB as PostgreSQL (Supabase)
    participant Resend as Resend API
    actor Client as Customer (Homeowner)

    Owner->>UI: Fills Quote form (2 items, 10% tax)
    UI->>Action: createQuoteAction(formData)
    Action->>Calc: calculateTotals(items, discount, taxRate)
    Calc-->>Action: {subtotal_cents, tax_cents, total_cents}
    Action->>DB: INSERT into quotes & quote_items (status='draft')
    DB-->>Action: Quote created with public_token
    Action-->>UI: Quote saved (Toast displayed)

    Owner->>UI: Taps "Send to Customer"
    UI->>Action: sendQuoteAction(quoteId)
    Action->>DB: UPDATE quotes SET status='sent', sent_at=NOW()
    Action->>Resend: sendQuoteEmail(customer.email, publicQuoteUrl)
    Resend-->>Client: Email delivered with approval link

    Client->>UI: Opens publicQuoteUrl, taps "Accept Quote"
    UI->>Action: acceptQuotePublicAction(publicToken, signerName)
    Action->>DB: UPDATE quotes SET status='accepted', accepted_at=NOW()
    Action-->>UI: Displays "Quote Approved" confirmation screen

    Owner->>UI: Taps "Convert to Job" on accepted quote
    UI->>Action: convertQuoteToJobAction(quoteId)
    Action->>DB: BEGIN TRANSACTION
    Action->>DB: INSERT into jobs (source_quote_id, customer_id, items...)
    Action->>DB: COMMIT TRANSACTION
    Action-->>UI: Job J-2026-0001 created & scheduled!
```

---

### 4.2 Stripe Subscription Webhook Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor Stripe as Stripe Webhook Dispatcher
    participant Route as POST /api/webhooks/stripe
    participant Engine as Stripe Node SDK
    participant DB as PostgreSQL (Admin Client)

    Stripe->>Route: POST /api/webhooks/stripe (raw body + stripe-signature)
    Route->>Engine: stripe.webhooks.constructEvent(body, signature, secret)
    alt Signature Invalid
        Engine-->>Route: Throw SignatureVerificationError
        Route-->>Stripe: HTTP 400 Bad Request
    else Signature Valid
        Route->>DB: Check event idempotency (stripe_event_id)
        alt Event Already Processed
            Route-->>Stripe: HTTP 200 OK (Idempotent Skip)
        else New Event
            alt event.type == "checkout.session.completed"
                Route->>DB: UPDATE subscriptions SET status='active', stripe_customer_id=...
            else event.type == "customer.subscription.updated"
                Route->>DB: UPDATE subscriptions SET status=new_status, current_period_end=...
            else event.type == "customer.subscription.deleted"
                Route->>DB: UPDATE subscriptions SET status='canceled'
            end
            Route-->>Stripe: HTTP 200 OK
        end
    end
```

---

## 5. Technology Stack Matrix & Trade-Off Analysis

| Decision | Alternative Considered | Chosen Approach | Architectural Trade-Off Analysis |
| :--- | :--- | :--- | :--- |
| **System Architecture** | Microservices (Auth service, Job service, Billing service) | **Modular Monolith** | Microservices would guarantee failure on an 8-day timeline due to distributed tracing, network boundaries, and deployment complexity. Modular monolith ensures zero-latency internal calls, shared type safety, and atomic transactions. |
| **Database Access** | Prisma ORM | **Supabase Client + Postgres Typed SQL** | Prisma client requires binary engine compilation that bloats serverless cold starts on Vercel and has historically complicated Postgres RLS session variable propagation. Direct typed Supabase client is lightweight, native, and directly passes JWT context to RLS policies. |
| **PDF Generation** | Headless Chrome (Puppeteer / Playwright) | **@react-pdf/renderer** | Headless Chromium exceeds Vercel's standard function size limits (50MB) and incurs 2-5s cold starts. React PDF generates pure vector PDFs in-memory in $< 400\text{ms}$ with zero binary dependencies. |
| **Scheduling Engine** | External Cron Fleet (Temporal / BullMQ) | **Vercel Cron / Webhook triggers** | Avoids spinning up dedicated Redis or worker VPS instances. Standard status transitions (e.g. marking overdue invoices) run via daily Vercel Cron jobs invoking secure internal route handlers. |

---

## 6. Disaster Recovery, Backup & Fault Tolerance

1. **Database Resilience:** Supabase Point-in-Time Recovery (PITR) enabled; automated daily full backups retained for 30 days.
2. **Stateless Compute:** All Next.js compute nodes on Vercel are stateless and replicated globally. Node failures trigger instantaneous traffic rerouting to healthy serverless instances.
3. **Data Loss Invariants:** Quotes and invoices are append-only state machines. Voiding or cancelling records preserves historical rows with timestamps; hard deletion is prohibited for any financial document with recorded payments.
