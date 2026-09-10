# Security Architecture & Threat Model — TradeFlow
**Version:** 1.0  
**Methodology:** Microsoft STRIDE & OWASP Top 10 (2021)  
**Standard:** SOC2 / HIPAA / ISO 27001 Readiness Baseline  

---

## 1. Threat Modeling (STRIDE Analysis)

| Threat Category | Potential Attack Vector in TradeFlow | Impact | Architectural Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates an authenticated plumbing business owner or technician via stolen session tokens. | High (Unauthorized access to tenant CRM & finances) | 1. Supabase Auth with PKCE flow.<br/>2. Session cookies marked `HttpOnly`, `SameSite=Lax`, `Secure`.<br/>3. Short-lived access JWTs (1 hour) with rotating refresh tokens. |
| **Tampering** | Malicious user intercepts quote/invoice submission to artificially alter line-item unit prices or calculated tax. | High (Loss of revenue, fraudulent invoicing) | 1. Client-supplied line items are recomputed on the server via `calculateDocumentTotals()`.<br/>2. Client total amounts are strictly ignored.<br/>3. Database triggers enforce timestamp audit logs. |
| **Repudiation** | Homeowner denies approving a quote or agreeing to terms after work commences. | Medium (Disputed invoices, legal exposure) | 1. Public approval logs typed legal name, timestamp, client IP address, and User-Agent.<br/>2. An immutable audit record is committed to `quotes.accepted_ip` and `audit_logs`. |
| **Information Disclosure** | Tenant A attempts to access or scrape customers, quotes, or invoices belonging to Tenant B. | Critical (Breach of customer PII and business financials) | 1. Multi-tenant Row Level Security (RLS) on 100% of tables.<br/>2. Database-level policy checks `is_org_member(organization_id)` using `auth.uid()`.<br/>3. Public document tokens utilize 256 bits of entropy. |
| **Denial of Service** | Malicious actors flood the public quote PDF generation route to exhaust Vercel serverless CPU/memory. | Medium (Temporary service degradation) | 1. Rate limiting on public routes (30 req/min/IP).<br/>2. In-memory PDF rendering via `@react-pdf/renderer` avoiding heavy headless Chrome forks.<br/>3. Response caching headers for immutable documents. |
| **Elevation of Privilege** | A field technician crafts an HTTP request to elevate their role to `owner` or modify company subscription billing. | Critical (Hostile workspace takeover) | 1. Role-based Server Action guards (`requireRole(['owner', 'admin'])`).<br/>2. Database RLS policies explicitly reject UPDATE queries on `organization_members` or `organizations` unless user has `owner` role. |

---

## 2. OWASP Top 10 Mitigations Matrix

### 2.1 A01: Broken Access Control (Cross-Tenant & RBAC Leaks)
- **Mitigation:**
  - PostgreSQL Row Level Security (RLS) is enabled on all tables. Queries without valid active session context return 0 rows.
  - Foreign keys (`customer_id`, `source_quote_id`, `assigned_to_user_id`) must belong to the caller's `organization_id`. Cross-tenant foreign key injections fail database constraint checks.

### 2.2 A02: Cryptographic Failures
- **Mitigation:**
  - Zero plaintext passwords. Supabase Auth manages hashing using Argon2id/bcrypt.
  - All transport traffic enforces TLS 1.3 via Vercel Edge with HSTS enabled (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
  - Sensitive environment variables are encrypted at rest on Vercel and never exposed via `NEXT_PUBLIC_` prefixes.

### 2.3 A03: Injection (SQLi, XSS, Command Injection)
- **Mitigation:**
  - **SQL Injection:** 100% of database interactions occur through Supabase client parameterized queries or PL/pgSQL stored procedures. Dynamic string concatenation in SQL is strictly forbidden.
  - **Cross-Site Scripting (XSS):** React 19 / Next.js auto-escapes rendered content. User inputs (customer notes, descriptions) are rendered as text. Markdown or HTML injection is blocked.
  - **Input Validation:** Strict runtime validation on every Server Action and Route Handler using Zod schemas.

### 2.4 A04: Insecure Design
- **Mitigation:**
  - Unidirectional domain pipelines prevent invalid state manipulation (e.g., quotes cannot become jobs unless `accepted`).
  - Public portals for customers accept only predefined actions (`accept`, `reject`) without exposing internal administrative APIs.

### 2.5 A05: Security Misconfiguration
- **Mitigation:**
  - Supabase `service_role` secret key is restricted exclusively to the Stripe webhook handler. User requests execute strictly with the user's scoped JWT context.
  - Production builds disable source maps and verbose debug logging.

### 2.6 A06: Vulnerable and Outdated Components
- **Mitigation:**
  - Automated GitHub Dependabot dependency auditing and automated vulnerability scanning.
  - Pinned production package versions. Minimal dependency footprint (no legacy NPM packages).

### 2.7 A07: Identification and Authentication Failures
- **Mitigation:**
  - Account lockout and rate limiting on repeated failed login attempts managed by Supabase GoTrue auth.
  - Password complexity: Minimum 8 characters, at least 1 number, and 1 symbol.
  - Password reset tokens expire after 60 minutes and become invalid once consumed.

### 2.8 A08: Software and Data Integrity Failures
- **Mitigation:**
  - Stripe webhooks must pass cryptographic signature verification via `stripe.webhooks.constructEvent(payload, signature, secret)`.
  - Replay attacks are rejected by verifying Stripe's 5-minute event timestamp window.

### 2.9 A09: Security Logging and Monitoring Failures
- **Mitigation:**
  - All critical business mutations (Quote Acceptance, Payment Recorded, Member Invited, Invoice Voided) write immutable audit logs to `audit_logs` with user ID, IP address, timestamp, and delta payload.
  - Sentry error monitoring captures unhandled exceptions with sanitized stack traces.

### 2.10 A10: Server-Side Request Forgery (SSRF)
- **Mitigation:**
  - No user-controlled URLs are fetched from server runtime. PDF generation compiles assets in-memory; image logos are loaded exclusively from verified Supabase Storage domains.

---

## 3. Multi-Tenant Isolation Proof & Verification Architecture

```
+-----------------------------------------------------------------------------------+
|                         CLIENT MUTATION INVOCATION                                |
|                         createQuoteAction(payload)                                |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                     LAYER 1: SESSION CONTEXT RESOLUTION                           |
|  - Validates user JWT via Supabase SSR                                            |
|  - Queries user's active membership: organization_members                         |
|  - Injects organization_id into execution context                                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                    LAYER 2: SCHEMA & TENANCY VALIDATION                           |
|  - Zod parses payload                                                             |
|  - Explicitly asserts payload.customer belongs to organization_id                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                  LAYER 3: POSTGRES ROW LEVEL SECURITY (RLS)                       |
|  - Database enforces: organization_id = session.organization_id                   |
|  - If application layer bug omits filter -> DB enforces policy                    |
|  - Cross-tenant read/write returns zero rows or raises 42501 (insufficient_priv)  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Public Token Security Architecture

Public quotes and invoices are viewed by homeowners without logging in. Security relies on:
1. **Entropy:** Public tokens are 64-character hexadecimal strings generated using 32 cryptographically secure random bytes:
   $$\text{Entropy} = 32 \text{ bytes} \times 8 = 256 \text{ bits}$$
   Brute-force probability is negligible ($2^{256} \approx 1.15 \times 10^{77}$ combinations).
2. **Timing-Safe Evaluation:** Token lookups utilize indexed equality matches in PostgreSQL.
3. **Information Compartmentalization:** The public quote endpoint (`/api/public/quotes/:token`) returns only:
   - Organization public branding (Name, Phone, Email, Logo).
   - Quote metadata and line items.
   - Customer name and service address.
   It does **not** expose database UUIDs, other customers, internal technician notes, or financial metrics.
4. **Rate Limiting:** Public endpoints are guarded with IP-based rate limiting (maximum 30 requests per minute per IP address).

---

## 5. Secrets Management & Environment Isolation

| Variable Name | Environment | Exposure | Usage |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public | Supabase endpoint URL for API connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public | Public anonymous key with restricted RLS access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **Secret** | Bypasses RLS; strictly restricted to Stripe Webhooks |
| `STRIPE_SECRET_KEY` | Server Only | **Secret** | Stripe API communication for subscriptions |
| `STRIPE_WEBHOOK_SECRET` | Server Only | **Secret** | Cryptographic verification of Stripe events |
| `RESEND_API_KEY` | Server Only | **Secret** | Transactional email dispatch |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Public | Canonical base URL for email links and redirects |

### Strict Rule:
No secret key (`SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`) shall ever be prefixed with `NEXT_PUBLIC_` or bundled into client-side JavaScript.
