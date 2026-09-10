# Deployment & Production Runbook — TradeFlow
**Version:** 1.0  
**Target Environment:** Vercel (Edge & Serverless) + Supabase Cloud (PostgreSQL 16) + Stripe + Resend  
**SLA Target:** 99.9% Uptime | P95 Serverless Latency < 250ms  

---

## 1. Production Infrastructure Architecture

```
                                [ Cloudflare / Vercel Edge DNS ]
                                                |
                                        HTTPS (TLS 1.3)
                                                v
                                  [ Vercel Global Edge Network ]
                                 (Next.js 15 Serverless Runtime)
                                                |
                   +----------------------------+----------------------------+
                   |                            |                            |
                   v                            v                            v
       [ Supabase Managed Cloud ]       [ Stripe API Gateway ]       [ Resend Email API ]
       - PostgreSQL 16 (East US)        - Subscriptions / SCA        - Transactional SMTP/API
       - Supabase Auth (GoTrue)         - Webhooks: /api/webhooks    - Verified Domain (SPF/DKIM)
       - Supabase Storage (S3)
```

---

## 2. Environment Variables Specification

The following variables must be configured in Vercel Production and Preview environments:

```bash
# ==============================================================================
# TRADEFLOW PRODUCTION ENVIRONMENT VARIABLES (.env.production)
# ==============================================================================

# Application Base URLs
NEXT_PUBLIC_APP_URL="https://app.tradeflow.com"

# Supabase Public & Client Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase Privileged Service Key (RESTRICTED: Webhooks only)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Stripe Billing Configuration
STRIPE_SECRET_KEY="sk_live_51P..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51P..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_1P..."

# Resend Transactional Email
RESEND_API_KEY="re_123456789..."
EMAIL_FROM="Dave from TradeFlow <support@tradeflow.com>"

# Operational & Observability
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="sntrys_..."
NODE_ENV="production"
```

---

## 3. Supabase Cloud Setup & Migration Runbook

### 3.1 Provisioning Project
1. Log into [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. **Project Name:** `tradeflow-production`.
3. **Database Region:** Select region nearest primary user base (e.g. `US East - North Virginia` or `Europe - London` or `Australia - Sydney`).
4. Generate a 32-character secure database password and store in your team password manager.

### 3.2 Executing Migrations
Use the Supabase CLI to push declarative migrations:
```bash
# Authenticate CLI
npx supabase login

# Link local repository to production project ref
npx supabase link --project-ref your-project-ref

# Apply all database schema, constraints, sequences, functions, and RLS policies
npx supabase db push
```

### 3.3 Storage Bucket Configuration
1. Navigate to **Storage** $\rightarrow$ **New Bucket**.
2. Name: `business-logos`.
3. Set **Public Bucket** to `TRUE` (allows public download of business logos on quotes/invoices).
4. Apply storage RLS policy:
   ```sql
   CREATE POLICY "Org members can upload business logos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'business-logos');
   ```

---

## 4. Stripe Production Setup Runbook

### 4.1 Create Product & Pricing
1. Open [Stripe Dashboard](https://dashboard.stripe.com) in Live Mode.
2. Navigate to **Product Catalog** $\rightarrow$ **Add Product**.
3. **Product Name:** `TradeFlow Starter Plan`.
4. **Description:** `All-in-one quoting, job scheduling, and invoicing for trade professionals`.
5. **Pricing:** Recurring $\rightarrow$ **\$39.00 USD** (or regional currency) $\rightarrow$ Monthly billing.
6. Copy the resulting `price_...` ID and assign to `STRIPE_STARTER_PRICE_ID`.

### 4.2 Configure Stripe Customer Portal
1. Navigate to **Settings** $\rightarrow$ **Billing** $\rightarrow$ **Customer Portal**.
2. Enable:
   - "Allow customers to update payment methods"
   - "Allow customers to cancel subscriptions" (at period end)
   - "Allow customers to view invoice history and receipts"
3. Add Terms of Service and Privacy Policy URLs.

### 4.3 Configure Production Webhook
1. Navigate to **Developers** $\rightarrow$ **Webhooks** $\rightarrow$ **Add Endpoint**.
2. **Endpoint URL:** `https://app.tradeflow.com/api/webhooks/stripe`.
3. **Events to listen for:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Reveal the **Signing Secret** (`whsec_...`) and assign to `STRIPE_WEBHOOK_SECRET` in Vercel.

---

## 5. Resend Transactional Email Runbook

### 5.1 Domain Verification
1. Log in to [Resend Dashboard](https://resend.com).
2. Navigate to **Domains** $\rightarrow$ **Add Domain** (`tradeflow.com`).
3. Add the generated DNS records to your DNS provider (Cloudflare/Route53/Namecheap):
   - **DKIM:** `resend._domainkey.tradeflow.com` (TXT)
   - **SPF:** `send.tradeflow.com` (MX & TXT)
   - **DMARC:** `_dmarc.tradeflow.com` (TXT: `v=DMARC1; p=none;`)
4. Verify domain status displays green **Verified**.

---

## 6. Vercel Deployment Runbook

### 6.1 Project Linking & Build Configuration
1. In the Vercel Dashboard, select **Add New...** $\rightarrow$ **Project**.
2. Import the `TradeFlow` Git repository.
3. Configure Build Settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
4. Populate all environment variables from Section 2 into **Settings $\rightarrow$ Environment Variables**.
5. Trigger initial deployment.

### 6.2 Custom Domain & SSL
1. In Vercel Project Settings, navigate to **Domains**.
2. Add `app.tradeflow.com` (application) and `tradeflow.com` (marketing redirect).
3. Update CNAME record in DNS: `cname.vercel-dns.com`.
4. Wait for automated Let's Encrypt SSL certificate issuance.

---

## 7. Rollback & Disaster Recovery Procedures

### 7.1 Instant Application Rollback (Vercel)
If a critical frontend or serverless defect is detected:
1. Open Vercel Dashboard $\rightarrow$ **Deployments**.
2. Locate the last known healthy deployment commit.
3. Click the three dots menu $\rightarrow$ **Instant Rollback**.
4. Traffic is rerouted across the global edge network in $< 5\text{ seconds}$.

### 7.2 Database Point-in-Time Recovery (Supabase PITR)
If catastrophic data corruption occurs:
1. In Supabase Dashboard, navigate to **Database** $\rightarrow$ **Backups**.
2. Select **Point in Time Recovery (PITR)**.
3. Choose the exact timestamp (UTC) immediately preceding the incident.
4. Confirm restore to an isolated instance, verify data integrity, and re-point `NEXT_PUBLIC_SUPABASE_URL`.

### 7.3 Zero-Downtime Schema Migration Strategy
1. **Rule:** Never drop or rename active columns in a single deployment.
2. **Phase 1 (Expand):** Add new nullable column or table; push database migration.
3. **Phase 2 (Migrate):** Deploy updated application code writing to both new and legacy columns.
4. **Phase 3 (Contract):** Run background backfill script; drop obsolete column in a subsequent migration.

---

## 8. Observability, Health Checks & Monitoring

### 8.1 Production Health Check Endpoint
- **Route:** `GET /api/health`
- **Implementation:**
  ```typescript
  // src/app/api/health/route.ts
  import { NextResponse } from 'next/server';
  import { createAdminClient } from '@/lib/supabase/admin';

  export async function GET() {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from('sequences').select('count', { count: 'exact', head: true });
      if (error) throw error;

      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (err: any) {
      return NextResponse.json({
        status: 'unhealthy',
        error: err.message,
      }, { status: 503 });
    }
  }
  ```

### 8.2 Error Tracking with Sentry
- Client and server runtime exceptions are piped to Sentry with scrubbed PII (all credit card details and customer phone numbers redacted).
- Alert triggers notify engineering via Slack / Email on any `5xx` rate exceeding 1% of total traffic.
