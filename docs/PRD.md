# Product Requirements Document (PRD) — TradeFlow
**Version:** 1.0  
**Status:** Approved for Architecture & Implementation  
**Target Audience:** US, UK, and Australian Plumbing SMBs (1–10 Technicians)  
**Timeline:** 8-Day Production MVP  

---

## 1. Executive Summary & Vision

TradeFlow is a streamlined, mobile-first SaaS platform engineered specifically for independent plumbing contractors and small plumbing businesses (1–10 technicians). 

Current Field Service Management (FSM) platforms like ServiceTitan, Jobber, and Housecall Pro have evolved into bloated, expensive enterprise suites laden with complex dispatch grids, inventory warehousing, GPS telematics, and steep learning curves. Small plumbing operators—who often operate directly from a truck or a home office—suffer from administrative overhead, lost billable hours, and delayed cash flow due to fragmented tools (paper receipts, SMS threads, phone notes, Excel spreadsheets).

TradeFlow solves this with a single, frictionless, non-redundant core pipeline:
$$\textbf{Lead / Customer} \longrightarrow \textbf{Quote} \longrightarrow \textbf{Job} \longrightarrow \textbf{Invoice} \longrightarrow \textbf{Payment}$$

The core value proposition is clear: **“Create a professional quote in 90 seconds, convert it into an active job upon customer approval, complete the work, and invoice the customer—without re-entering data at any stage.”**

---

## 2. Target Personas & Use Cases

### Persona 1: The Owner-Operator ("Dave")
- **Role:** Business owner, primary technician, estimator, and bookkeeper.
- **Pain Points:** Quotes jobs late in the evening after 10 hours on-site; forgets to invoice completed jobs; tracks receivables in his head or on paper notebooks; loses quotes due to slow turnaround.
- **Needs:** Mobile-optimized quote creation from the truck; immediate SMS/Email quote delivery with a customer approval link; 1-tap conversion of accepted quotes into jobs; instant invoicing upon job wrap-up.

### Persona 2: The Office Manager / Dispatcher ("Sarah")
- **Role:** Handles incoming customer calls, coordinates scheduling, issues invoices, chases overdue payments.
- **Pain Points:** Misplaced customer addresses; technicians calling for job details; duplicate entry between quote spreadsheets and billing tools.
- **Needs:** Centralized customer record with complete job/quote history; clear scheduling calendar; real-time visibility into quote acceptance and job completion.

### Persona 3: The Field Technician ("Mike")
- **Role:** Executes the plumbing work on-site (drain cleaning, water heater install, pipe repairs).
- **Pain Points:** Paper job slips get wet/dirty; unclear scope of work agreed upon by the customer.
- **Needs:** Clean mobile view of today's jobs; 1-tap driving directions; access to agreed scope and customer notes; ability to mark job "Completed" with internal notes.

### Persona 4: The Plumbing Customer ("Homeowner / Property Manager")
- **Role:** Buyer of plumbing services.
- **Pain Points:** Unclear handwritten quotes; confusing billing; delayed response times.
- **Needs:** Clean, professional digital quote on mobile; 1-tap "Accept Quote" or "Decline Quote" without creating an account; clear PDF breakdown of charges; transparent payment status.

---

## 3. Product Goals & Non-Goals

### 3.1 MVP In-Scope Goals
1. **Multi-Tenant Organization Workspace:** Complete data isolation per plumbing business with role-based access control (Owner, Admin, Technician).
2. **Unified Customer CRM:** Searchable directory of commercial and residential customers with full contact info, service address, and linked history.
3. **Frictionless Quote Engine:** Fast line-item entry (materials, labor, fixed fixtures), automated subtotal/discount/tax calculation, PDF generation, email dispatch, and a public web approval portal.
4. **1-Click Quote-to-Job Transition:** Automated conversion preserving all line items, customer details, and scope.
5. **Simple Job Scheduling & Tracking:** Dispatching to technicians, scheduled start/end windows, address mapping, and lifecycle tracking (`Scheduled` $\rightarrow$ `In Progress` $\rightarrow$ `Completed` $\rightarrow$ `Cancelled`).
6. **1-Click Job-to-Invoice Transition:** Automated invoice drafting from completed jobs, due date management, PDF generation, and public invoice viewing.
7. **Payment & Receivables Tracking:** Recording offline payments (credit card via terminal, cash, check, direct bank transfer) and tracking invoice statuses (`Draft`, `Sent`, `Paid`, `Overdue`, `Void`).
8. **Real-Time Operational Dashboard:** High-impact metrics: Monthly Revenue, Outstanding Receivables, Overdue Invoices, Active Quotes, Upcoming Jobs, and Quote Win Rate.
9. **SaaS Subscription Billing:** Stripe Checkout integration offering a 14-day free trial followed by a \$39/month Starter plan, managed via Stripe Customer Portal.

### 3.2 Explicit MVP Non-Goals (Out of Scope for 8-Day Build)
- Native iOS/Android mobile apps (PWA/Responsive Web only).
- GPS fleet tracking and real-time technician geofencing.
- Complex multi-vehicle route optimization.
- Real-time inventory and supplier catalog syncing.
- Double-entry accounting ledger (integrations with QuickBooks/Xero are Post-MVP).
- In-house credit card processing for end-customers (end-customers pay via bank transfer/check or technician records external terminal payment; Stripe is strictly for TradeFlow SaaS subscriptions in MVP).
- AI voice receptionist or automated phone dispatch.
- Multi-currency transactions within a single workspace (each workspace selects one base currency: USD, GBP, or AUD).

---

## 4. Feature Specifications

### 4.1 Workspace & Organization Management
- **Organization Profile:** Business Name, Registration/Tax Number (EIN/ABN/VAT), Phone, Email, Physical Address, Logo, Currency (`USD`, `GBP`, `AUD`), Default Tax Rate (%), Invoice Terms, and Default Quote Expiry Window (e.g., 30 days).
- **User Roles:**
  - **Owner:** Full system access, billing/subscription management, team management, delete permissions.
  - **Admin:** Operational access: full CRUD on customers, quotes, jobs, invoices, and scheduling; no billing management.
  - **Technician:** Read-only on assigned jobs and customer contact details; can update job status (`In Progress`, `Completed`) and append internal completion notes. Cannot view business financial dashboard or edit quotes/invoices.

### 4.2 Customer Management
- **Fields:** Customer Type (`Residential` vs `Commercial`), First Name, Last Name, Company Name (optional), Email, Phone Number, Service Address (Street, Line 2, City, State/Province, Postal Code, Country), Internal Notes.
- **Capabilities:**
  - Fast search by name, phone, email, or address.
  - Detail view displaying timeline of all Quotes, Jobs, and Invoices.
  - Quick actions: "Call Customer", "Email Customer", "Navigate to Address", "Create Quote", "Create Job".

### 4.3 Quote Management
- **Identifiers:** Sequential human-readable quote numbers (e.g., `Q-2026-0001`) unique per organization.
- **Line Items:** Description, Quantity (decimal, e.g., 2.5 hours), Unit Price (minor currency units/cents), Taxable flag.
- **Calculations:** Subtotal, Discount (flat amount or percentage), Tax Amount (derived from organization default or overridden rate), Grand Total.
- **Lifecycle Statuses:**
  - `Draft`: Created, not yet published to customer.
  - `Sent`: Dispatched to customer via email or direct link.
  - `Accepted`: Customer approved via public portal or marked manually by staff.
  - `Rejected`: Customer declined via public portal with optional reason.
  - `Expired`: Auto-transitioned if quote exceeds expiry date without acceptance.
- **Public Quote Portal:**
  - Unique high-entropy token URL (e.g., `https://tradeflow.app/view/quote/:token`).
  - Mobile-responsive view of quote breakdown and terms.
  - Prominent "Accept Quote" button requiring typed full name confirmation.
  - "Decline Quote" button with optional feedback field.
  - Download PDF button.

### 4.4 Job Management
- **Identifiers:** Sequential human-readable job numbers (e.g., `J-2026-0001`) unique per organization.
- **Fields:** Customer (linked), Source Quote (optional link), Title/Summary, Full Scope Description, Service Address, Assigned Technician, Scheduled Start Time, Scheduled End Time, Status, Internal Notes, Completed At timestamp.
- **Lifecycle Statuses:**
  - `Scheduled`: Date and time assigned.
  - `In Progress`: Technician on site, work started.
  - `Completed`: Work finished, ready for billing.
  - `Cancelled`: Aborted by customer or company.
- **Conversion Flow:** Clicking "Convert to Job" on an `Accepted` quote copies customer info, line items (into job description), and sets status to `Scheduled`.

### 4.5 Invoice & Payment Management
- **Identifiers:** Sequential invoice numbers (e.g., `INV-2026-0001`) unique per organization.
- **Fields:** Customer, Source Job, Source Quote, Issue Date, Due Date, Line Items, Subtotal, Discount, Tax, Total, Amount Paid, Balance Due, Payment Terms/Notes, Public Token.
- **Lifecycle Statuses:**
  - `Draft`: Editable draft.
  - `Sent`: Issued to customer.
  - `Paid`: Balance due equals zero.
  - `Overdue`: Unpaid and current date > due date.
  - `Void`: Cancelled/annulled invoice.
- **Conversion Flow:** Clicking "Create Invoice" on a `Completed` job populates customer and line items automatically.
- **Payment Recording:** Staff records offline payments against an invoice:
  - Amount Paid (cents), Payment Date, Method (`Credit Card / Terminal`, `Bank Transfer / ACH / BACS`, `Cash`, `Check`), Reference Number, Internal Notes.
  - Recalculates `amount_paid` and `balance_due`. When `balance_due == 0`, status auto-updates to `Paid`.

### 4.6 Operational Dashboard
- **Top Metrics Strip:**
  - **Revenue (MTD):** Total sum of payments collected in the current calendar month.
  - **Outstanding Invoices:** Total sum of unpaid balances for invoices in `Sent` or `Overdue` status.
  - **Overdue Invoices:** Total count and dollar sum of invoices past their due date.
  - **Open Quotes:** Total count and value of quotes currently in `Sent` status.
  - **Quote Conversion Rate:** Percentage of sent quotes that transitioned to `Accepted` over the trailing 30 days:
    $$\text{Conversion Rate} = \left( \frac{\text{Quotes Accepted}}{\text{Quotes Sent} + \text{Quotes Accepted} + \text{Quotes Rejected}} \right) \times 100$$
- **Actionable Lists:**
  - Today's Upcoming Jobs (with 1-tap call/navigate).
  - Quotes Requiring Follow-Up.
  - Recent Invoices.

### 4.7 SaaS Subscription & Billing
- **Tier:** Starter Plan — \$39 USD / month (or equivalent £32 GBP / \$59 AUD).
- **Trial:** 14-day full-access trial starting upon business registration; no credit card required upfront.
- **Enforcement:**
  - Days 1–14: Unrestricted access.
  - Day 15+ without active subscription: Read-only access to records; creation of new Quotes, Jobs, and Invoices blocked with an in-app upgrade banner.
- **Stripe Integration:** Stripe Checkout for subscription creation; Stripe Customer Portal for payment method updates, invoice downloads, and cancellations; Stripe Webhooks for real-time status synchronization (`trialing`, `active`, `past_due`, `canceled`).

---

## 5. User Interface & Experience Requirements

1. **Mobile-First Touch Ergonomics:**
   - Minimum tap target size of 44x44px for all buttons and interactive controls.
   - Fixed bottom action bar on mobile for high-frequency actions (e.g., "New Quote", "Save Draft", "Send Quote", "Start Job").
   - Native integration with device capabilities: `tel:` links for immediate calling, `mailto:` for email, and Google Maps / Apple Maps deep links for job addresses.
2. **Zero Duplicate Data Entry:**
   - Converting an accepted quote to a job must be completed in exactly 1 click.
   - Converting a completed job to an invoice must be completed in exactly 1 click.
3. **Deterministic Feedback:**
   - Every mutation provides optimistic or instant feedback with toast alerts.
   - Destructive actions (Voiding an invoice, Deleting a customer, Cancelling a job) require explicit confirmation dialogs.
4. **Professional Branding on Documents:**
   - Customer-facing Quote and Invoice PDFs must feature the organization logo, primary brand color, structured layout, clean typography, and clearly outlined terms.

---

## 6. Success Metrics & Release Criteria

### 6.1 Engineering & Quality Criteria
- 100% of Core Golden Path test cases passing (Signup $\rightarrow$ Customer $\rightarrow$ Quote $\rightarrow$ Accept $\rightarrow$ Job $\rightarrow$ Invoice $\rightarrow$ Payment).
- Zero data leakage between tenants verified via automated multi-tenant isolation test suite.
- P95 Server-Side response time < 250ms on all core routes.
- Lighthouse Mobile Performance score $\ge 85$.

### 6.2 Business & Go-To-Market Criteria
- Production deployment on custom domain with valid SSL.
- Stripe subscription test and live webhook verification passing.
- Time-to-first-quote for a newly registered user < 3 minutes.
- Acquisition target: 1+ paying subscriber within 10 days of production launch.
