# Solution Design Document (SDD) — TradeFlow
**Version:** 1.0  
**Status:** Approved for Implementation  
**Target:** 8-Day Production MVP  

---

## 1. System Overview & Technology Stack

TradeFlow is designed as a **production-grade modular monolith** built on serverless, managed infrastructure to minimize operational burden, eliminate maintenance costs, and ensure zero-downtime scalability for an 8-day solo-developer sprint.

### 1.1 Core Technology Choices & Rationale

| Layer | Technology | Version / Tooling | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Frontend & API Framework** | **Next.js (App Router)** | 15.x (React 19) | Unified TypeScript codebase; Server Components minimize client bundle size; Server Actions simplify type-safe mutation pipelines without REST boilerplate; native Route Handlers for webhooks. |
| **Language & Validation** | **TypeScript & Zod** | TS 5.x, Zod 3.x | End-to-end type safety from database types to UI components; runtime schema validation on every client input and webhook payload. |
| **Styling & Component Library** | **Tailwind CSS & shadcn/ui** | Tailwind v4 / Lucide Icons | Accessible, high-contrast, mobile-first design tokens; copy-paste component ownership without bulky runtime CSS-in-JS dependencies. |
| **Database & Auth** | **Supabase (PostgreSQL 16)** | Managed Cloud / PG 16 | ACID compliance; built-in Row Level Security (RLS) provides guaranteed multi-tenant isolation at the engine level; Supabase Auth handles secure session cookies and password hashing. |
| **Subscription Billing** | **Stripe** | Stripe Node SDK 14+ | Industry standard for SaaS billing; offloads PCI-DSS compliance, credit card storage, and EU/UK/US tax/SCA handling via Stripe Checkout and Customer Portal. |
| **Transactional Email** | **Resend + React Email** | Resend SDK | Highest deliverability; JSX-based responsive email templates matching the exact design of the customer portal. |
| **Document Generation (PDF)** | **@react-pdf/renderer** | v3.x | Native serverless PDF generation; operates inside Vercel serverless functions without requiring heavy Chromium/Puppeteer binaries. |
| **Hosting & CI/CD** | **Vercel** | Edge Network | Zero-config automatic deployments; instant preview branches; global edge CDN caching for static assets. |

---

## 2. Architecture & Layered Component Decomposition

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION LAYER                                 |
|  [Next.js Server Components]  [Client Islands (Forms/Buttons)]  [Public Portal]   |
+-----------------------------------------+-----------------------------------------+
                                          |
                        Server Actions / Route Handlers
                                          v
+-----------------------------------------------------------------------------------+
|                             DOMAIN & SERVICES LAYER                               |
|  [Auth/Org Service]   [Customer Service]   [Quote Engine]   [Job Dispatcher]      |
|  [Invoice Engine]     [Billing Service]    [Email Service]  [PDF Engine]          |
+-----------------------------------------+-----------------------------------------+
                                          |
                      Typed Supabase SSR Client (auth.uid())
                                          v
+-----------------------------------------------------------------------------------+
|                              PERSISTENCE & SECURITY                               |
|        PostgreSQL 16 Database with Row-Level Security (RLS) Enforced              |
|        Tables: organizations, members, customers, quotes, jobs, invoices...       |
+-----------------------------------------+-----------------------------------------+
                                          |
                       External Secure Service Gateways
                                          v
+-----------------------------------------------------------------------------------+
|                          EXTERNAL CLOUD INTEGRATIONS                              |
|         [Stripe Billing API]      [Resend Email API]      [Supabase Storage]      |
+-----------------------------------------------------------------------------------+
```

### 2.1 Presentation Layer
- **Authenticated App (`/app/(app)/...`):** High-density, mobile-first layout with bottom navigation on mobile devices and responsive side navigation on desktop. Built with React Server Components (RSC) to stream server data directly without client-side waterfalls.
- **Public Customer Portal (`/app/(public)/view/...`):** Unauthenticated, lightweight routes where homeowners view quotes and invoices. Optimized for mobile viewports with single-action buttons ("Accept Quote", "Decline Quote", "Download PDF").
- **Marketing & Auth Routes (`/app/(marketing)/...`, `/app/(auth)/...`):** Clean sign-up, login, password-reset, and landing pages.

### 2.2 Domain & Services Layer
Encapsulates all business logic into isolated TypeScript modules located in `src/services/`:
- `OrganizationService`: Workspace provisioning, membership, and settings.
- `CustomerService`: CRM CRUD, search index queries, timeline aggregation.
- `QuoteService`: Sequential numbering, line item calculations, FSM transitions, acceptance tokens.
- `JobService`: Job conversion, dispatching, scheduling validation, technician status updates.
- `InvoiceService`: Invoice generation from jobs, calculation engine, payment ledger, balance reconciliation.
- `BillingService`: Stripe checkout session creation, customer portal links, subscription status resolution.
- `PdfService`: Vector PDF streaming generation using React PDF.
- `EmailService`: Transactional dispatch via Resend with typed templates.

### 2.3 Persistence Layer
- All interactions with the database occur through the Supabase Server Client initialized via `@supabase/ssr`.
- The user's authenticated session cookie (`sb-*-auth-token`) carries the user's Supabase JWT.
- Postgres executes every query under the context of `auth.uid()`, strictly bound by Row Level Security (RLS) policies.
- No client-side database queries are permitted; all mutations flow through Server Actions with Zod schema validation.

---

## 3. Data Architecture & Consistency Guarantees

### 3.1 Multi-Tenancy Architecture
TradeFlow implements a **Shared Database, Shared Schema with Row-Level Security Tenant Discriminator** pattern.
1. Every business is represented by a row in the `organizations` table.
2. Every tenant-scoped entity (`customers`, `quotes`, `quote_items`, `jobs`, `invoices`, `invoice_items`, `payments`) includes a mandatory `organization_id UUID NOT NULL` column referencing `organizations(id) ON DELETE CASCADE`.
3. PostgreSQL Row Level Security (RLS) is enabled on 100% of tenant tables. Policies evaluate the authenticated user's organization membership:
   ```sql
   EXISTS (
     SELECT 1 FROM organization_members
     WHERE organization_members.organization_id = table_name.organization_id
       AND organization_members.user_id = auth.uid()
   )
   ```
4. Even if an application-layer bug fails to include a `WHERE organization_id = ...` filter, PostgreSQL completely prevents cross-tenant data leakage or tampering.

### 3.2 Monetary Precision Architecture
- **Inviolable Rule:** No floating-point data types (`FLOAT`, `DOUBLE PRECISION`, or JS `number` decimals) are ever used for financial amounts.
- In PostgreSQL: All prices, rates, subtotals, taxes, and payments are stored as `BIGINT` representing minor units (cents for USD/AUD, pence for GBP).
- In TypeScript: Amounts are typed as `type Cents = number` (integer) and formatted only at the presentation boundary via a dedicated formatting utility:
  ```typescript
  export function formatCurrency(amountCents: number, currency: 'USD' | 'GBP' | 'AUD'): string {
    return new Intl.NumberFormat(currencyLocales[currency], {
      style: 'currency',
      currency,
    }).format(amountCents / 100);
  }
  ```
- Tax rates are stored in basis points (e.g., $10.00\% = 1000$ basis points; $8.25\% = 825$ basis points) to eliminate decimal rounding errors.

### 3.3 Atomic Sequence Generation
To ensure sequential, human-friendly, gapless numbering (`Q-2026-0001`, `J-2026-0001`, `INV-2026-0001`) per organization without collision:
- A dedicated table `sequences` tracks `(organization_id, entity_type, last_val)`.
- A stored procedure `fn_next_sequence(org_id UUID, entity_type TEXT)` utilizes `SELECT ... FOR UPDATE` row-level locking to atomically increment and format the identifier within an isolated database transaction.

---

## 4. Core Engine Specifications

### 4.1 Financial Calculation Engine
The calculation engine is implemented as a deterministic pure function (`src/lib/finance/calculator.ts`) used on both client (for live form previews) and server (for database validation).

```
+-------------------------------------------------------------+
| Line Item 1: Quantity x Unit Price (Cents) = Item Total     |
| Line Item 2: Quantity x Unit Price (Cents) = Item Total     |
+-------------------------------------------------------------+
                              |
                              v
                   [ Subtotal Cents = Sum ]
                              |
              - [ Discount Cents (Flat or %) ]
                              |
                              v
                  [ Net Taxable Base Cents ]
                              |
             + [ Tax Cents = Base x Tax Rate / 10000 ]
                              |
                              v
                [ Grand Total Cents = Net + Tax ]
                              |
              - [ Total Payments Recorded (Cents) ]
                              |
                              v
             [ Balance Due Cents = Total - Paid ]
```

#### Deterministic Rules:
1. **Line Item Total:**
   $$\text{total\_cents} = \text{Math.round}(\text{quantity} \times \text{unit\_price\_cents})$$
2. **Subtotal:**
   $$\text{subtotal\_cents} = \sum_{i} \text{item}[i].\text{total\_cents}$$
3. **Discount Calculation:**
   - If Flat: $\text{discount\_cents} = \min(\text{discount\_input\_cents}, \text{subtotal\_cents})$
   - If Percentage: $\text{discount\_cents} = \text{Math.round}\left(\frac{\text{subtotal\_cents} \times \text{discount\_basis\_points}}{10000}\right)$
4. **Tax Calculation:**
   - Evaluated exclusively over line items flagged `taxable = true`.
   - Tax amount is calculated using half-up integer rounding:
     $$\text{tax\_cents} = \text{Math.round}\left(\frac{\text{taxable\_base\_cents} \times \text{tax\_rate\_basis\_points}}{10000}\right)$$
5. **Grand Total:**
   $$\text{grand\_total\_cents} = \text{subtotal\_cents} - \text{discount\_cents} + \text{tax\_cents}$$

### 4.2 State Machine Engine

#### Quote State Machine:
```
           +-----------------------+
           |         Draft         |
           +-----------------------+
                       |
                  (Send Quote)
                       v
           +-----------------------+
           |         Sent          | <------------------+
           +-----------------------+                    |
             /         |         \                      |
     (Accept)      (Decline)     (Expires)        (Resend / Re-open)
           v           v           v                    |
    +----------+ +----------+ +----------+              |
    | Accepted | | Rejected | | Expired  | -------------+
    +----------+ +----------+ +----------+
         |
  (Convert to Job)
         v
    [Active Job]
```

#### Job State Machine:
```
           +-----------------------+
           |       Scheduled       |
           +-----------------------+
             /                   \
      (Start Job)             (Cancel)
           v                       v
    +-------------+         +-------------+
    | In Progress |         |  Cancelled  |
    +-------------+         +-------------+
           |
      (Complete)
           v
    +-------------+
    |  Completed  |
    +-------------+
           |
  (Convert to Invoice)
           v
    [Draft Invoice]
```

#### Invoice State Machine:
```
           +-----------------------+
           |         Draft         |
           +-----------------------+
                       |
                 (Send Invoice)
                       v
           +-----------------------+
           |         Sent          | <------------------+
           +-----------------------+                    |
             /         |         \                      |
  (Record Full) (Current Date    (Void)           (Payment Reversal)
           v       > Due Date)     v                    |
    +----------+       v      +----------+              |
    |   Paid   |  +---------+ |   Void   |              |
    +----------+  | Overdue | +----------+              |
        ^         +---------+                           |
        |              |                                |
        +--------------+--------------------------------+
             (Record Payment Full)
```

### 4.3 PDF Generation Engine
- Implemented using `@react-pdf/renderer` in `src/services/pdf/`.
- Streamed directly to the client via Next.js Route Handler `GET /api/quotes/[id]/pdf` and `GET /api/invoices/[id]/pdf`.
- Supports organization branding: Dynamically renders business logo, address, customer details, line-item grid, tax summary, terms, and approval metadata.
- Execution runs entirely in-memory with zero temporary disk writes, ensuring optimal performance on serverless environments.

---

## 5. Security Architecture

1. **Authentication & Session Tokens:**
   - Handled via Supabase Auth using cryptographically signed JWTs stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
   - Automatically refreshed via Next.js middleware using `@supabase/ssr`.
2. **Role-Based Access Control (RBAC):**
   - User roles (`owner`, `admin`, `technician`) stored in `organization_members`.
   - Verified via server helper `requireRole(['owner', 'admin'])` before executing sensitive Server Actions.
3. **Public View Security:**
   - Homeowners access quotes and invoices via high-entropy public tokens (`public_token` generated via `crypto.randomBytes(32).toString('hex')`).
   - The public token is indexed and decoupled from internal database UUIDs.
   - Public mutations (Quote Acceptance) require valid token matching and log the remote IP and User-Agent for legal auditability.
4. **Stripe Webhook Defense:**
   - Raw request body buffers are verified against the Stripe Webhook Secret (`STRIPE_WEBHOOK_SECRET`) using `stripe.webhooks.constructEvent`.
   - Replay attacks are mitigated by Stripe's embedded timestamp validation (5-minute tolerance).

---

## 6. Integrations Design

### 6.1 Stripe Billing Integration
- **Subscription Model:** Single active subscription per organization in table `subscriptions`.
- **Checkout Flow:** Owner clicks "Subscribe" $\rightarrow$ Server Action invokes `stripe.checkout.sessions.create()` with `client_reference_id = org.id` $\rightarrow$ Redirect to Stripe Hosted Checkout $\rightarrow$ Webhook handles `checkout.session.completed` and writes subscription ID and status to `subscriptions`.
- **Portal Flow:** Owner clicks "Manage Subscription" $\rightarrow$ Server Action invokes `stripe.billingPortal.sessions.create()` $\rightarrow$ Redirect to Stripe Customer Portal.

### 6.2 Resend Email Integration
- Asynchronous dispatch via Resend SDK:
  - `sendQuoteEmail({ to, quote, org, publicUrl })`
  - `sendInvoiceEmail({ to, invoice, org, publicUrl })`
- Graceful degradation: If email sending fails due to an invalid customer email address, the error is caught and logged, allowing staff to copy the public link manually without breaking the application flow.
