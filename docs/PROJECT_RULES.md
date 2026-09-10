# Engineering Standards & Project Rules — TradeFlow
**Version:** 1.0  
**Scope:** Mandatory guidelines for all Human Engineers and AI Coding Agents  
**Target:** Production-Grade Quality, High Velocity, Zero Security Vulnerabilities  

---

## 1. Non-Negotiable Core Tenets

1. **BRD.md is the Business Truth:** Never introduce features, alter pricing models, or change domain pipelines that contradict `BRD.md`.
2. **Zero Floating-Point Money:** Financial values in code and database must strictly be integers representing minor units (`BIGINT` / `number` cents/pence). Never use `0.1 + 0.2` style decimal math.
3. **Row-Level Security (RLS) on Everything:** Every table containing tenant data must have PostgreSQL RLS enabled and tested. Database bypass (`service_role`) is strictly prohibited in user request flows.
4. **No Unauthorized Dependencies:** Do not install heavy ORMs, alternative UI frameworks, or extra state managers. The stack is locked to:
   - Next.js 15 (App Router) + React 19
   - TypeScript 5.x (Strict) + Zod 3.x
   - Tailwind CSS + shadcn/ui + Lucide React
   - Supabase (`@supabase/ssr`, PostgreSQL 16)
   - Stripe Node SDK
   - Resend + React Email
   - `@react-pdf/renderer`
   - Vitest + Playwright
5. **Mobile-First UX:** Always build and test UI for mobile touch viewports ($375\text{px} - 430\text{px}$) first before verifying desktop layouts. Minimum tap target is $44\text{px} \times 44\text{px}$.

---

## 2. Directory Structure & Architecture Conventions

All application source code resides under `src/`:

```
src/
├── app/                        # Next.js App Router
│   ├── (app)/                  # Authenticated staff routes (layout with nav)
│   │   ├── dashboard/          # Operational KPI dashboard
│   │   ├── customers/          # Customer CRM views
│   │   ├── quotes/             # Quote builder and management
│   │   ├── jobs/               # Job scheduling and tech dispatch
│   │   ├── invoices/           # Invoicing and payment tracking
│   │   └── settings/           # Organization profile and team
│   ├── (auth)/                 # Unauthenticated auth routes (login, signup, reset)
│   ├── (marketing)/            # Public landing page and pricing
│   ├── (public)/               # Public homeowner quote/invoice portal
│   │   └── view/               # /view/quote/[token] & /view/invoice/[token]
│   └── api/                    # Route handlers (webhooks, PDF streaming, health)
│       ├── health/             # GET /api/health
│       ├── webhooks/stripe/    # POST /api/webhooks/stripe
│       └── [entity]/[id]/pdf/  # GET /api/.../pdf streaming
├── actions/                    # Next.js Server Actions (Zod validated mutations)
├── components/                 # UI components
│   ├── ui/                     # Primitives from shadcn/ui
│   ├── shared/                 # Reusable tables, badges, modals, empty states
│   └── [module]/               # Module-specific components (QuoteBuilder, etc.)
├── emails/                     # React Email templates for Resend dispatch
├── lib/                        # Core utilities and singletons
│   ├── finance/                # Pure financial calculator engine
│   ├── supabase/               # Client, server, and admin Supabase client helpers
│   ├── stripe/                 # Stripe client initialization
│   └── utils.ts                # Formatting, cn() class merger
├── services/                   # Isolated domain business logic services
│   ├── CustomerService.ts
│   ├── QuoteService.ts
│   ├── JobService.ts
│   ├── InvoiceService.ts
│   ├── BillingService.ts
│   └── PdfService.ts
└── types/                      # Shared TypeScript interfaces and database types
```

---

## 3. TypeScript & Coding Standards

1. **Strict Type Safety:**
   - `"strict": true` is enabled in `tsconfig.json`.
   - The use of `any` is strictly prohibited. Use `unknown` with explicit type guards or Zod schemas.
   - Do not use `@ts-ignore` or `@ts-nocheck`. Fix the root typing error.
2. **Server Components vs Client Components:**
   - Pages and layouts must be React Server Components (RSC) by default.
   - Add `'use client'` only to leaf components that require interactivity (forms, modals, interactive buttons, state hooks).
   - Never fetch database records directly inside a Client Component. Fetch data in Server Components and pass down as props, or mutate via Server Actions.
3. **Zod Runtime Validation:**
   - Every Server Action and API Route Handler must parse input payloads with a dedicated Zod schema before invoking domain services.
   - Example:
     ```typescript
     export const CreateQuoteSchema = z.object({
       customerId: z.string().uuid(),
       issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
       expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
       discountCents: z.number().int().nonnegative().default(0),
       items: z.array(z.object({
         description: z.string().min(1),
         quantity: z.number().positive(),
         unitPriceCents: z.number().int().nonnegative(),
         taxable: z.boolean().default(true),
       })).min(1, 'At least one line item is required.'),
       notes: z.string().optional(),
     });
     ```

---

## 4. Database & SQL Rules

1. **Migration Hygiene:**
   - Never modify the database via the Supabase web UI in production.
   - All schema changes, indexes, triggers, and RLS policies must be saved as versioned SQL scripts in `supabase/migrations/`.
2. **Column Naming Conventions:**
   - Tables and columns use `snake_case` in PostgreSQL (e.g. `organization_id`, `subtotal_cents`).
   - Foreign keys must be named `<target_table_singular>_id` (e.g. `customer_id`, `source_quote_id`).
3. **Indexes:**
   - Every foreign key column must have an index.
   - Composite queries (e.g. `organization_id, status`) must have multi-column indexes matching query filter patterns.
4. **Primary Keys:**
   - All primary keys must be `UUID` with default `gen_random_uuid()`.

---

## 5. Security & Multi-Tenancy Rules

1. **Session Context Propagation:**
   - When executing database operations from Server Actions or Route Handlers, always use the authenticated server client created via `@supabase/ssr`.
   - This passes the user's session JWT to Postgres, allowing RLS policies to evaluate `auth.uid()`.
2. **Never Trust Client Calculations:**
   - Clients may send line items with quantities and unit prices.
   - The server must re-execute `calculateDocumentTotals()` to derive `subtotal_cents`, `tax_cents`, and `total_cents`.
   - Never accept grand totals submitted from the browser.
3. **Service Role Key Usage:**
   - The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS.
   - It is permitted **ONLY** in `src/app/api/webhooks/stripe/route.ts` where incoming requests originate from Stripe without a user session.
   - Using the service role key in user-facing Server Actions will cause immediate PR rejection.
4. **Secrets Discipline:**
   - Never commit `.env` or `.env.local` to Git.
   - Never prefix server secrets with `NEXT_PUBLIC_`.

---

## 6. Git & Version Control Conventions

1. **Commit Message Format (Conventional Commits):**
   - `feat(quote): add dynamic line item builder with live tax preview`
   - `fix(billing): handle customer.subscription.deleted webhook event`
   - `test(finance): add unit tests for pro-rated discount calculations`
   - `refactor(db): optimize RLS policy on jobs table`
   - `docs(api): document public quote approval endpoint`
2. **Branch Hygiene:**
   - Work in feature branches branched from `main`: `feature/module-name` or `fix/issue-name`.
   - Rebase on `main` before merging; keep git history linear and clean.
3. **Pre-Commit Verification:**
   - Before committing code, run:
     ```bash
     npm run lint
     npx tsc --noEmit
     npm run test:unit
     ```

---

## 7. AI Coding Agent Operating Instructions

When an AI Coding Agent operates in this repository:
1. **Read Before Writing:** Inspect existing schemas in `DB_SCHEMA.md` and type definitions in `src/types/` before generating new components or actions.
2. **Never Hallucinate Dependencies:** Only import libraries that exist in `package.json`. If a new package is genuinely required, document the justification.
3. **Atomic File Creation:** Complete the entire file cleanly with zero placeholders, missing types, or `// TODO` stubs.
4. **Always Type-Check:** After making file edits, execute `npx tsc --noEmit` via the terminal sandbox to guarantee zero compiler errors.
5. **Preserve Invariants:** If an instruction requests a change that violates a core invariant (e.g. using floats for money or bypassing RLS), halt immediately and notify the user with architectural rationale.
