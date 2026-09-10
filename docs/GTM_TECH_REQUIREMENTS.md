# Go-To-Market (GTM) Technical Requirements — TradeFlow
**Version:** 1.0  
**Focus:** Acquisition, Activation Velocity, Conversion Tracking & Retention  
**Goal:** 100 Qualified Contacts $\rightarrow$ 10 Demos $\rightarrow$ 3 Active Trialists $\rightarrow$ $\ge 1$ Paying Customer ($39+ MRR) within 10 Days  

---

## 1. Product Analytics & Activation Telemetry

To ensure rapid feedback during the 10-day pilot, TradeFlow implements lightweight, privacy-conscious event instrumentation (PostHog or client/server telemetry).

### 1.1 Core Telemetry Events Specification

| Event Name | Trigger Point | Payload Properties | Business Significance |
| :--- | :--- | :--- | :--- |
| `user_signed_up` | Registration completed | `organization_id`, `country`, `currency` | Top of funnel acquisition |
| `org_onboarded` | Profile setup finished | `business_name`, `tax_rate_set` | User completed setup |
| `customer_created` | First customer saved | `has_address`, `has_phone` | First operational entity |
| `quote_created` | Quote saved as draft | `line_item_count`, `total_cents` | Product trial engagement |
| `quote_sent` | Quote emailed/linked | `delivery_channel`, `quote_number` | **Core Activation Milestone** |
| `public_quote_viewed` | Customer opens quote link | `public_token`, `device_type` | Homeowner engagement |
| `quote_accepted` | Customer confirms approval | `public_token`, `time_to_accept_sec` | **Aha! Moment for Plumber** |
| `quote_converted_to_job` | Job created from quote | `quote_id`, `job_id` | Pipeline progression |
| `job_completed` | Tech marks job finished | `job_id`, `has_notes` | Operational fulfillment |
| `invoice_sent` | Invoice dispatched | `invoice_number`, `total_cents` | Monetization trigger |
| `payment_recorded` | Staff records payment | `amount_cents`, `method` | Cash flow realization |
| `checkout_initiated` | Upgrade button clicked | `plan_id`, `trial_days_remaining` | Purchase intent |
| `subscription_activated`| Stripe checkout completed | `stripe_customer_id`, `mrr_cents` | **Paying Customer Goal** |

---

## 2. In-App User Onboarding & Activation Checklist

New plumbing operators must reach the "Aha!" moment (creating and sending a professional quote) in $< 3\text{ minutes}$.

### 2.1 The 3-Step Guided Activation Widget
Rendered prominently at the top of the dashboard until all 3 steps are complete:
1. **Step 1: Set Up Business Details** (Auto-checked upon registration).
2. **Step 2: Add Your First Customer** (CTA opens modal with pre-filled test sample option "Sarah Jenkins - 742 Evergreen Terrace").
3. **Step 3: Create & Send Your First Quote** (CTA opens quote editor with pre-loaded plumbing labor and materials templates).

### 2.2 Quick-Start Plumbing Item Presets
To eradicate friction for Dave in his truck, the quote builder offers 1-tap item templates:
- `Standard Service Call & Diagnostic` — 1 hr @ \$95.00
- `Emergency Drain Snaking / Clear Blockage` — 1.5 hrs @ \$180.00
- `50-Gal Rheem Water Heater Supply & Installation` — Flat \$1,650.00
- `Garbage Disposal Replacement` — Flat \$280.00
- `Toilet Replacement (Standard Two-Piece)` — Flat \$320.00

---

## 3. Transactional Email Branding & Templates

Emails are generated using React Email (`src/emails/`) and delivered via Resend. Design adheres to high-contrast, clean typography that renders flawlessly in Apple Mail, Gmail, and Outlook Mobile.

### 3.1 Template Inventory
1. **`QuoteSentEmail`:**
   - **Subject:** `Quote Q-{{quote_number}} from {{business_name}}`
   - **Hero:** Business Logo, Business Name, Quote Total (`$1,986.39`).
   - **Body:** Scope summary, expiry notice ("Valid until Oct 10, 2026").
   - **Primary CTA:** High-contrast full-width button $\rightarrow$ `Review & Approve Quote`.
2. **`QuoteAcceptedNotificationEmail` (to Plumber):**
   - **Subject:** `🎉 Quote Q-{{quote_number}} Approved by {{customer_name}}!`
   - **Body:** "Sarah Jenkins has approved your quote for \$1,986.39. Click below to convert this into a scheduled job."
   - **Primary CTA:** `Convert to Job Now`.
3. **`InvoiceSentEmail`:**
   - **Subject:** `Invoice INV-{{invoice_number}} from {{business_name}}`
   - **Body:** Amount due, due date, breakdown summary.
   - **Primary CTA:** `View Invoice & Payment Details`.
4. **`PaymentReceiptEmail`:**
   - **Subject:** `Receipt for Invoice INV-{{invoice_number}} - Dave's Fast Plumbing`
   - **Body:** Confirms receipt of payment (\$1,986.39) with transaction reference number and updated balance due (\$0.00).

---

## 4. Search Engine Optimization (SEO) & Public Marketing Assets

### 4.1 Marketing Landing Page Architecture (`/app/(marketing)/page.tsx`)
- **Hero Section:**
  - Headline: *"The 90-Second Quote-to-Invoice App for Plumbers"*
  - Subhead: *"Win more jobs, dispatch your team, and get paid faster without wrestling complex software. Built for plumbing businesses with 1–10 trucks."*
  - CTA: `Start 14-Day Free Trial` (No credit card required).
- **Interactive Workflow Visualizer:**
  - 4-step interactive widget demonstrating: `Customer -> Quote -> Job -> Invoice`.
- **Transparent Pricing Card:**
  - **Starter Plan:** \$39/month. Includes unlimited customers, quotes, jobs, and invoices; 3 user seats included.
- **Social Proof / Trade Validation:**
  - "Built for US, UK, and Australian Trade Regulations."

### 4.2 OpenGraph & Schema.org Structured Data
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TradeFlow",
  "operatingSystem": "Web, iOS, Android",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "39.00",
    "priceCurrency": "USD"
  },
  "description": "Mobile-first field management, quoting, and invoicing software for plumbing contractors."
}
</script>
```

---

## 5. In-App User Feedback & Support Mechanism

During the 8-day MVP and initial customer validation phase, immediate user feedback is critical.
1. **Lightweight Feedback Modal:** Accessible via a permanent floating "Feedback" pill on mobile and desktop:
   - Quick rating (1 to 5 stars).
   - Textarea: *"What was confusing or what feature is missing?"*
   - Direct submission to internal Discord/Slack webhook or founder email.
2. **Founder Support Deep Link:** "Call / WhatsApp Founder Dave" direct contact link inside workspace settings for high-touch customer support.
