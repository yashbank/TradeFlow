# User & System Flows — TradeFlow
**Version:** 1.0  
**Target Personas:** Owner ("Dave"), Admin ("Sarah"), Technician ("Mike"), Customer ("Sarah Jenkins")  
**Design Principle:** Frictionless, thumb-friendly mobile interactions, zero redundant data entry  

---

## 1. Flow 1: Business Registration & Workspace Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Dave (Owner/Plumber)
    participant Web as TradeFlow Browser
    participant API as Auth & Onboarding Action
    participant Supa as Supabase (Auth + DB)

    Owner->>Web: Visits /signup
    Web->>Owner: Displays Email, Password, Name, Business Name, Country, Currency
    Owner->>Web: Fills form & submits
    Web->>API: registerUserAction(formData)
    API->>Supa: auth.signUp({email, password})
    Supa-->>API: returns user {id}
    API->>Supa: INSERT into organizations (name, country, currency, tax_rate)
    API->>Supa: INSERT into organization_members (user_id, org_id, role='owner')
    API->>Supa: INSERT into subscriptions (org_id, status='trialing', trial_end=NOW()+14d)
    API-->>Web: Sets secure auth cookie & redirects
    Web->>Owner: Renders Dashboard with Onboarding Checklist
```

### Onboarding Checklist Screen State:
1. Business Profile Configured (Completed)
2. Add Your First Customer (Pending CTA)
3. Send Your First Quote (Locked until customer added)

---

## 2. Flow 2: Customer Creation & Directory Management

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Sarah (Admin / Dispatcher)
    participant UI as Customer UI
    participant Action as createCustomerAction
    participant DB as PostgreSQL

    Admin->>UI: Taps "+ Add Customer"
    UI->>Admin: Displays quick-add form (Name, Phone, Address, Email, Notes)
    Admin->>UI: Inputs "Sarah Jenkins", phone, address
    UI->>Action: Submits payload
    Action->>DB: INSERT into customers (organization_id, ...)
    DB-->>Action: Returns customer ID
    Action-->>UI: Optimistic list update + Toast "Customer Created"
    UI->>Admin: Navigates to Customer Detail view showing linked Quotes/Jobs
```

---

## 3. Flow 3: Quote Creation, Preview & Customer Delivery

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Dave (Plumber)
    participant UI as Mobile Quote Form
    participant Calc as Finance Engine
    participant Action as createQuoteAction
    participant DB as PostgreSQL
    participant Email as Resend Email Service
    actor Cust as Sarah Jenkins (Customer)

    Owner->>UI: Selects Customer -> Taps "Create Quote"
    UI->>Owner: Renders Line Item Builder
    Owner->>UI: Inputs Item 1: "Water Heater", Qty: 1, Price: $1,450.00
    Owner->>UI: Inputs Item 2: "Labor", Qty: 3.5 hrs, Price: $110.00/hr
    UI->>Calc: calculateDocumentTotals(items, discount, taxRate)
    Calc-->>UI: Subtotal: $1,835.00 | Tax (8.25%): $151.39 | Total: $1,986.39
    Owner->>UI: Taps "Send to Customer"
    UI->>Action: sendQuoteAction(quotePayload)
    Action->>DB: INSERT quotes & quote_items (status='sent')
    Action->>Email: sendQuoteEmail(cust.email, publicUrl)
    Email-->>Cust: Delivered: "Quote Q-2026-0001 from Dave's Plumbing"
    Action-->>UI: Status updated to "Sent" + Shareable Link copied to clipboard
```

---

## 4. Flow 4: Customer Public Quote Review & Digital Approval

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Sarah Jenkins (Homeowner)
    participant Mobile as Mobile Safari
    participant Portal as /view/quote/:token Route
    participant DB as PostgreSQL
    participant Notify as Notification Event
    actor Owner as Dave (Plumber)

    Cust->>Mobile: Taps link in SMS/Email
    Mobile->>Portal: GET /view/quote/:token
    Portal->>DB: SELECT quote, items, org WHERE public_token = :token
    DB-->>Portal: Returns quote data
    Portal-->>Mobile: Renders branded mobile view (Logo, Items, Terms, Big Green "Approve" Button)
    Cust->>Mobile: Taps "Approve Quote"
    Mobile->>Mobile: Prompts: "Type your full name to confirm"
    Cust->>Mobile: Types "Sarah Jenkins" -> Taps "Confirm Approval"
    Mobile->>Portal: POST /api/public/quotes/:token/respond ({action: 'accept', signer_name: 'Sarah Jenkins'})
    Portal->>DB: UPDATE quotes SET status='accepted', accepted_at=NOW(), accepted_by_name=...
    Portal-->>Mobile: Displays confetti & "Thank You! Dave's Plumbing has been notified."
    Portal->>Notify: Emits QuoteAcceptedEvent
    Notify-->>Owner: Mobile in-app toast / email: "Quote Q-2026-0001 Approved by Sarah Jenkins!"
```

---

## 5. Flow 5: 1-Click Quote-to-Job Conversion & Dispatch

```mermaid
sequenceDiagram
    autonumber
    actor Dispatcher as Dave / Sarah
    participant UI as Quote Detail View
    participant Action as convertQuoteToJobAction
    participant DB as PostgreSQL
    actor Tech as Mike (Technician)

    Dispatcher->>UI: Opens accepted quote Q-2026-0001
    UI->>Dispatcher: Prominently highlights "Convert to Active Job" banner
    Dispatcher->>UI: Taps "Convert to Job"
    UI->>Dispatcher: Dialog: "Assign Technician & Schedule Window"
    Dispatcher->>UI: Selects "Mike (Tech)" and Tomorrow 09:00 AM - 01:00 PM
    UI->>Action: convertQuoteToJobAction(quoteId, techId, schedule)
    Action->>DB: Atomic RPC: Copies items, customer, address to jobs table
    DB-->>Action: Returns job_id and job_number J-2026-0001
    Action-->>UI: Navigates to Job Detail page
    UI-->>Tech: Job appears on Mike's "Today's Schedule" mobile dashboard
```

---

## 6. Flow 6: Mobile Technician Field Execution

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Mike (Field Tech)
    participant Mobile as Mobile App / PWA
    participant Action as updateJobStatusAction
    participant DB as PostgreSQL

    Tech->>Mobile: Opens TradeFlow on phone in truck
    Mobile->>Tech: Displays 1 upcoming job: "J-2026-0001 - Sarah Jenkins"
    Tech->>Mobile: Taps "Navigate" -> Opens Apple/Google Maps with customer address
    Tech->>Mobile: Arrives on site -> Taps "Start Job"
    Mobile->>Action: updateJobStatusAction(jobId, 'in_progress')
    Action->>DB: UPDATE jobs SET status='in_progress', started_at=NOW()
    Action-->>Mobile: Status badge changes to "In Progress"
    Note over Tech,Mobile: Tech replaces water heater and tests connections
    Tech->>Mobile: Taps "Complete Job"
    Mobile->>Tech: Prompts: "Add internal completion notes"
    Tech->>Mobile: Inputs: "Replaced faulty relief valve. Pressure normal at 60 PSI."
    Tech->>Mobile: Taps "Finish"
    Mobile->>Action: updateJobStatusAction(jobId, 'completed', notes)
    Action->>DB: UPDATE jobs SET status='completed', completed_at=NOW()
    Action-->>Mobile: Shows "Job Completed! Ready for Invoicing"
```

---

## 7. Flow 7: 1-Click Job-to-Invoice Conversion & Delivery

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Dave (Plumber)
    participant UI as Job Completed Screen
    participant Action as convertJobToInvoiceAction
    participant DB as PostgreSQL
    participant Email as Resend Email Service
    actor Cust as Sarah Jenkins (Homeowner)

    Owner->>UI: Views completed job J-2026-0001
    UI->>Owner: Displays primary CTA: "Create Invoice"
    Owner->>UI: Taps "Create Invoice"
    UI->>Action: convertJobToInvoiceAction(jobId)
    Action->>DB: Atomic copy of customer and line items into invoices & invoice_items
    DB-->>Action: Returns invoice_number INV-2026-0001 (Status: draft)
    Action-->>UI: Opens editable Invoice Review screen
    Owner->>UI: Verifies totals ($1,986.39) -> Taps "Send Invoice"
    UI->>Action: sendInvoiceAction(invoiceId)
    Action->>DB: UPDATE invoices SET status='sent', sent_at=NOW()
    Action->>Email: sendInvoiceEmail(cust.email, publicInvoiceUrl)
    Email-->>Cust: Delivered: "Invoice INV-2026-0001 from Dave's Plumbing"
    Action-->>UI: Invoice marked "Sent"
```

---

## 8. Flow 8: Customer Invoice Review & Offline Payment Recording

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Sarah Jenkins (Customer)
    actor Owner as Dave (Plumber)
    participant UI as Invoice Action UI
    participant Action as recordPaymentAction
    participant DB as PostgreSQL

    Cust->>Owner: Hands check / taps credit card on square terminal on-site
    Owner->>UI: Opens Invoice INV-2026-0001
    UI->>Owner: Taps "+ Record Payment"
    UI->>Owner: Displays modal: Amount ($1,986.39), Method (Credit Card), Ref #
    Owner->>UI: Confirms payment
    UI->>Action: recordPaymentAction(invoiceId, payload)
    Action->>DB: INSERT into payments (amount_cents, method, ...)
    Action->>DB: UPDATE invoices SET amount_paid_cents = total_cents, balance_due_cents = 0, status = 'paid', paid_at = NOW()
    Action-->>UI: Displays green "PAID IN FULL" stamp
    UI->>Owner: Offers "Send Receipt to Customer"
```

---

## 9. Flow 9: Operational Dashboard Telemetry Updates

```mermaid
sequenceDiagram
    autonumber
    participant Client as Next.js RSC
    participant DB as PostgreSQL
    actor Owner as Dave (Plumber)

    Owner->>Client: Navigates to /dashboard
    Client->>DB: Parallel Aggregation Queries (scoped to organization_id)
    Note over Client,DB: 1. SUM(payments.amount) WHERE payment_date in current month<br/>2. SUM(invoices.balance_due) WHERE status in ('sent', 'overdue')<br/>3. COUNT(jobs) WHERE scheduled_start::date = CURRENT_DATE<br/>4. COUNT(quotes accepted) / COUNT(quotes total)
    DB-->>Client: Returns aggregated metrics
    Client-->>Owner: Displays: MTD Revenue: $18,420 | Outstanding: $4,210 | Jobs Today: 3 | Win Rate: 68%
```

---

## 10. Flow 10: SaaS Subscription Checkout & Webhook Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Dave (Plumber)
    participant UI as In-App Billing Banner
    participant Action as createCheckoutSessionAction
    participant Stripe as Stripe Hosted Checkout
    participant Webhook as /api/webhooks/stripe
    participant DB as PostgreSQL

    Note over Owner,UI: Day 12 of 14-Day Free Trial
    Owner->>UI: Taps "Upgrade to Starter ($39/mo)"
    UI->>Action: createCheckoutSessionAction()
    Action->>Stripe: stripe.checkout.sessions.create({customer_email, client_reference_id: org.id})
    Stripe-->>Action: Returns session checkout URL
    Action-->>UI: Redirects browser to Stripe Checkout
    Owner->>Stripe: Enters credit card & confirms subscription
    Stripe-->>UI: Redirects to /dashboard?billing=success
    Stripe->>Webhook: POST /api/webhooks/stripe (checkout.session.completed)
    Webhook->>Stripe: Verifies stripe-signature
    Webhook->>DB: UPDATE subscriptions SET status='active', stripe_customer_id=...
    DB-->>Webhook: OK
    Webhook-->>Stripe: HTTP 200 OK
    UI->>Owner: Displays "Subscription Active - Thank You!"
```
