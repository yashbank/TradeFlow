# BRD — TradeFlow
**Version:** 0.1 | **Status:** MVP Approved for SDD | **Target:** US/UK/AU plumbing SMBs

## 1. Product
TradeFlow is a mobile-first SaaS for small plumbing businesses to manage:
**Lead/Customer → Quote → Job → Invoice → Payment**

## 2. Business Problem
Small trade businesses lose time and revenue through fragmented calls, messages, spreadsheets and manual quote/invoice workflows. Existing FSM products are broader and can become expensive/complex as teams grow. The MVP must win on simplicity, speed and a focused workflow. 

## 3. ICP
- Primary: plumbing businesses with 1–10 employees/technicians
- Markets: US, UK, Australia
- Buyer: owner/operator
- User: owner, admin, technician
- Device: mobile-first; desktop supported

## 4. Value Proposition
**“Create a professional quote, turn it into a job, finish the job and invoice the customer — without duplicate data entry.”**

## 5. MVP Goals
- Customer records in one place
- Fast quote creation and sending
- Quote → job conversion
- Job scheduling/status tracking
- Job → invoice conversion
- Invoice PDF/email delivery
- Payment status tracking
- Basic dashboard
- Multi-user business workspace
- Subscription billing

## 6. MVP Non-Goals
No GPS fleet tracking, payroll, accounting ledger, inventory management, complex dispatch optimization, native mobile apps, AI voice receptionist, advanced accounting integrations or enterprise RBAC.

## 7. Core User Flow
1. Sign up → create business
2. Add customer
3. Create quote
4. Send quote
5. Customer accepts/rejects
6. Convert accepted quote → job
7. Schedule/assign job
8. Mark job completed
9. Convert job → invoice
10. Send invoice
11. Record payment/status
12. Dashboard updates

## 8. Functional Requirements
### Authentication
- Email/password
- Session management
- Password reset
- Business/workspace isolation

### Customers
- CRUD
- Name, email, phone, address, notes
- Customer history

### Quotes
- Quote number
- Customer
- Line items: description, quantity, unit price, tax
- Discount
- Notes/terms
- Draft/Sent/Accepted/Rejected/Expired
- PDF generation
- Email delivery
- Accept/reject action

### Jobs
- Job number
- Customer
- Source quote
- Scheduled date/time
- Assigned technician
- Address
- Description
- Status: Scheduled/In Progress/Completed/Cancelled
- Internal notes
- Completion timestamp

### Invoices
- Invoice number
- Customer
- Source job/quote
- Line items/tax/discount
- Due date
- Draft/Sent/Paid/Overdue/Void
- PDF
- Email delivery
- Payment recording

### Dashboard
- Revenue
- Outstanding invoices
- Overdue invoices
- Open quotes
- Upcoming jobs
- Quote conversion rate

### Subscription
- Stripe Checkout
- Trial
- Active/Canceled/Past Due states
- Webhook synchronization
- Feature gating

## 9. Business Rules
- Every business owns its data.
- Users cannot access another business's records.
- Quote numbers and invoice numbers are unique per business.
- Only accepted quotes can become jobs.
- Completed jobs can generate invoices.
- Paid invoices cannot be edited; use void/correction flow.
- Monetary values use integer minor units/decimal-safe representation; never floating-point arithmetic.
- All important mutations have created/updated timestamps.
- Server validates every client-supplied value.

## 10. Security
- Server-side authorization on every protected resource
- Tenant isolation
- Password hashing via managed auth/provider
- Secrets only in environment variables
- HTTPS
- Input validation
- Rate limiting on auth/public endpoints
- Stripe webhook signature verification
- Audit-ready mutation timestamps

## 11. UX Requirements
- Mobile-first
- Minimal clicks
- Clear primary CTA per page
- Professional quote/invoice output
- Responsive desktop UI
- Loading/error/empty states
- Accessible forms and keyboard navigation
- No feature overload

## 12. Success Metrics
### Launch
- Production deployment
- Signup → workspace completion works
- Quote → job → invoice flow works end-to-end
- Stripe subscription works
- No P0/P1 defects

### Business
- 100 qualified prospects contacted
- 10 demos/trials
- 3 active trial users
- **1+ paying customer within 10 days**
- Target initial MRR: **$39+**

## 13. Pricing Hypothesis
- Trial: 14 days
- Starter: $39/month
- Growth: later; not MVP
Pricing must be validated against customer feedback and competitor positioning.

## 14. Competitive Position
The category already contains established products such as Jobber, Housecall Pro, Workiz, ServiceTitan and regional tools. Therefore TradeFlow must NOT compete on feature count. Initial differentiation:
**simpler onboarding + focused plumbing workflow + fast quote-to-invoice experience + lower complexity.**

## 15. MVP Acceptance Criteria
A test business can:
**Signup → add customer → create/send quote → accept → create/schedule job → complete → create/send invoice → record payment**, with data persistence, authorization, responsive UI and no critical errors.

## 16. Constraints
- 8-day build target
- Solo developer + AI coding agent
- Near-zero initial infrastructure/marketing cost
- Web application only
- Use managed services where they reduce development/ops burden
- Architecture must support future trades without rewriting core domain

## 17. Future Roadmap
AI quote assistance → SMS/WhatsApp → online payments → QuickBooks/Xero → recurring jobs → inventory → technician mobile/PWA → AI receptionist → multi-trade templates.

## 18. Definition of Done
MVP is done only when:
**requirements implemented + tests passing + production deployed + security reviewed + payment tested + real-user workflow verified + launch checklist complete.**

## 19. Next Artifact
`SDD.md` — solution architecture, components, technology decisions, deployment architecture, security boundaries and integration design.
