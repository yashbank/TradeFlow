# API Specification Document — TradeFlow
**Version:** 1.0  
**Standard:** OpenAPI 3.1 & Next.js Server Actions Spec  
**Security Model:** Supabase SSR JWT Cookies, Public URL Tokens, Stripe Signature  
**Payload Format:** JSON (`application/json`) & PDF Streams (`application/pdf`)  

---

## 1. Global API Standards & Envelope Conventions

### 1.1 Mutation & Query Architecture
1. **Application UI Mutations:** Implemented primarily via type-safe Next.js **Server Actions** (`src/actions/`) for internal web client interactions.
2. **REST Route Handlers:** Implemented in `src/app/api/` for:
   - External incoming webhooks (`/api/webhooks/stripe`)
   - Document generation streams (`/api/quotes/:id/pdf`, `/api/invoices/:id/pdf`)
   - Public customer view & approval endpoints (`/api/public/...`)
   - Machine-accessible REST routes for mobile clients

### 1.2 Unified Response Envelope
Every JSON response adheres to a strict standard envelope:

#### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-10T12:00:00.000Z"
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Quote with ID 7a9e1e2d-3b8c-4f1a-9f5b-6c2e8d1a3b5c was not found.",
    "details": [
      {
        "field": "quote_id",
        "issue": "Invalid UUID format or does not exist."
      }
    ]
  }
}
```

### 1.3 Standard Error Codes Catalog

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Request payload failed Zod schema parsing. |
| `401` | `AUTH_UNAUTHORIZED` | User session is missing, invalid, or expired. |
| `403` | `ORG_FORBIDDEN` | User does not have sufficient role permissions in active organization. |
| `402` | `SUBSCRIPTION_REQUIRED` | Organization trial has expired and requires active Stripe subscription. |
| `404` | `RESOURCE_NOT_FOUND` | Requested entity does not exist or belongs to another organization. |
| `409` | `STATE_CONFLICT` | Requested state transition is invalid (e.g. converting draft quote to job). |
| `429` | `RATE_LIMITED` | Too many requests sent to public approval or auth endpoints. |
| `500` | `INTERNAL_SERVER_ERROR`| Unhandled server exception. |

---

## 2. Authentication & Workspace Endpoints

### 2.1 Register New User & Workspace
- **Action / Path:** `POST /api/auth/register` (Server Action: `registerUserAction`)
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "dave@davesplumbing.com",
    "password": "Password123!",
    "full_name": "Dave Miller",
    "business_name": "Dave's Fast Plumbing",
    "country": "US",
    "currency": "USD",
    "timezone": "America/New_York"
  }
  ```
- **Validation:** 
  - `email`: Valid email format.
  - `password`: Min 8 characters, at least 1 digit, 1 special character.
  - `country`: `US` | `GB` | `AU`.
  - `currency`: `USD` | `GBP` | `AUD`.
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "organization_id": "e4f8b91a-7b2c-4f8a-9a1b-3c4d5e6f7a8b",
      "trial_end": "2026-09-24T12:00:00.000Z"
    }
  }
  ```

### 2.2 Get Current Organization & User Context
- **Action / Path:** `GET /api/org/current` (Server Action: `getCurrentOrgContext`)
- **Auth:** Session Cookie
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "organization": {
        "id": "e4f8b91a-7b2c-4f8a-9a1b-3c4d5e6f7a8b",
        "name": "Dave's Fast Plumbing",
        "currency": "USD",
        "tax_rate_basis_points": 825,
        "subscription_status": "trialing",
        "days_left_in_trial": 13
      },
      "user": {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "full_name": "Dave Miller",
        "email": "dave@davesplumbing.com",
        "role": "owner"
      }
    }
  }
  ```

---

## 3. Customer CRM Endpoints

### 3.1 List Customers
- **Action / Path:** `GET /api/customers` (Server Action: `getCustomersAction`)
- **Auth:** Session Cookie (`owner`, `admin`, `technician`)
- **Query Params:** `search` (string), `limit` (default 25), `offset` (default 0)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "customers": [
        {
          "id": "f1d2c3b4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
          "first_name": "Sarah",
          "last_name": "Jenkins",
          "company_name": null,
          "email": "sarah.j@example.com",
          "phone": "+15550192834",
          "address_line1": "742 Evergreen Terrace",
          "city": "Springfield",
          "state": "IL",
          "postal_code": "62704",
          "open_quotes_count": 1,
          "active_jobs_count": 0,
          "created_at": "2026-09-10T10:00:00.000Z"
        }
      ],
      "total_count": 1
    }
  }
  ```

### 3.2 Create Customer
- **Action / Path:** `POST /api/customers` (Server Action: `createCustomerAction`)
- **Auth:** Session Cookie (`owner`, `admin`)
- **Request Body:**
  ```json
  {
    "first_name": "Sarah",
    "last_name": "Jenkins",
    "company_name": null,
    "email": "sarah.j@example.com",
    "phone": "5550192834",
    "address_line1": "742 Evergreen Terrace",
    "address_line2": "Apt 2B",
    "city": "Springfield",
    "state": "IL",
    "postal_code": "62704",
    "country": "US",
    "notes": "Gate code #4491. Beware of dog."
  }
  ```
- **Response `201 Created`:** Returns created customer record.

---

## 4. Quote Management Endpoints

### 4.1 Create Quote
- **Action / Path:** `POST /api/quotes` (Server Action: `createQuoteAction`)
- **Auth:** Session Cookie (`owner`, `admin`)
- **Request Body:**
  ```json
  {
    "customer_id": "f1d2c3b4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
    "issue_date": "2026-09-10",
    "expiry_date": "2026-10-10",
    "notes": "Includes 1-year labor warranty.",
    "terms": "50% deposit required on jobs exceeding $1,000.",
    "discount_cents": 2500,
    "items": [
      {
        "description": "50-Gallon Rheem Water Heater Supply & Install",
        "quantity": 1.0,
        "unit_price_cents": 145000,
        "taxable": true
      },
      {
        "description": "Plumbing Labor & Disposal",
        "quantity": 3.5,
        "unit_price_cents": 11000,
        "taxable": true
      }
    ]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "7a9e1e2d-3b8c-4f1a-9f5b-6c2e8d1a3b5c",
      "quote_number": "Q-2026-0001",
      "status": "draft",
      "subtotal_cents": 183500,
      "discount_cents": 2500,
      "tax_cents": 14933,
      "total_cents": 195933,
      "public_token": "a8f5c382b9e144a8726e10f43892d7ca893b11928374a56b4c3e21a0f8e91d2c"
    }
  }
  ```

### 4.2 Send Quote to Customer
- **Action / Path:** `POST /api/quotes/:id/send` (Server Action: `sendQuoteAction`)
- **Auth:** Session Cookie (`owner`, `admin`)
- **Effect:** Sets `status = 'sent'`, sets `sent_at = NOW()`, triggers Resend email to customer with link: `https://tradeflow.app/view/quote/:public_token`.

### 4.3 Convert Accepted Quote to Job
- **Action / Path:** `POST /api/quotes/:id/convert-to-job` (Server Action: `convertQuoteToJobAction`)
- **Auth:** Session Cookie (`owner`, `admin`)
- **Validation:** Quote must be in status `accepted`.
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "job_id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
      "job_number": "J-2026-0001",
      "status": "scheduled"
    }
  }
  ```

---

## 5. Job Scheduling Endpoints

### 5.1 Update Job Status & Schedule
- **Action / Path:** `PATCH /api/jobs/:id` (Server Action: `updateJobAction`)
- **Auth:** Session Cookie (`owner`, `admin`, `technician`)
- **Request Body:**
  ```json
  {
    "status": "in_progress",
    "scheduled_start": "2026-09-12T09:00:00Z",
    "scheduled_end": "2026-09-12T13:00:00Z",
    "assigned_to_user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "internal_notes": "Main shutoff valve located on north exterior wall."
  }
  ```
- **Rules:** Technicians can only edit jobs where `assigned_to_user_id == auth.uid()` and can only update `status` and `internal_notes`.

### 5.2 Convert Completed Job to Invoice
- **Action / Path:** `POST /api/jobs/:id/convert-to-invoice` (Server Action: `convertJobToInvoiceAction`)
- **Auth:** Session Cookie (`owner`, `admin`)
- **Validation:** Job must be in status `completed`.
- **Response `201 Created`:** Returns generated invoice with number `INV-2026-0001` and status `draft`.

---

## 6. Invoicing & Payment Endpoints

### 6.1 Record Offline Payment
- **Action / Path:** `POST /api/invoices/:id/payments` (Server Action: `recordPaymentAction`)
- **Auth:** Session Cookie (`owner`, `admin`)
- **Request Body:**
  ```json
  {
    "amount_cents": 195933,
    "payment_date": "2026-09-12",
    "payment_method": "credit_card",
    "reference_number": "AUTH_TRANS_991823",
    "notes": "Paid via Square reader on site."
  }
  ```
- **Business Logic:**
  - Creates row in `payments`.
  - Recalculates `amount_paid_cents` and `balance_due_cents`.
  - If `balance_due_cents == 0`, transitions invoice `status` to `paid` and sets `paid_at = NOW()`.
- **Response `200 OK`:** Returns updated invoice summary and payment record.

### 6.2 Stream Invoice PDF
- **Path:** `GET /api/invoices/:id/pdf` (Route Handler)
- **Auth:** Session Cookie OR Query Param `?token=:public_token`
- **Response Headers:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="Invoice-INV-2026-0001.pdf"`

---

## 7. Public Customer Portal Endpoints

### 7.1 View Public Quote
- **Path:** `GET /api/public/quotes/:token` (Route Handler)
- **Auth:** Public (Secured by 256-bit token entropy)
- **Rate Limit:** 30 requests / minute / IP
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "organization": {
        "name": "Dave's Fast Plumbing",
        "phone": "555-0199",
        "email": "dave@davesplumbing.com",
        "logo_url": "https://..."
      },
      "customer": {
        "name": "Sarah Jenkins",
        "address": "742 Evergreen Terrace, Springfield, IL"
      },
      "quote": {
        "quote_number": "Q-2026-0001",
        "status": "sent",
        "issue_date": "2026-09-10",
        "expiry_date": "2026-10-10",
        "items": [...],
        "subtotal_cents": 183500,
        "discount_cents": 2500,
        "tax_cents": 14933,
        "total_cents": 195933,
        "notes": "Includes 1-year labor warranty."
      }
    }
  }
  ```

### 7.2 Customer Accept or Reject Quote
- **Path:** `POST /api/public/quotes/:token/respond` (Route Handler / Public Server Action)
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "action": "accept", // "accept" or "reject"
    "signer_name": "Sarah Jenkins",
    "rejection_reason": null
  }
  ```
- **Validation:** If `action == "accept"`, `signer_name` is required ($\ge 2$ characters). If `action == "reject"`, `signer_name` is optional.
- **Audit Logging:** Captures remote IP address and User-Agent into `quotes.accepted_ip` and `audit_logs`.

---

## 8. Stripe Subscription & Webhook Endpoints

### 8.1 Create Checkout Session
- **Action / Path:** `POST /api/billing/create-checkout-session` (Server Action)
- **Auth:** Session Cookie (`owner`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_..."
    }
  }
  ```

### 8.2 Stripe Webhook Handler
- **Path:** `POST /api/webhooks/stripe` (Route Handler)
- **Auth:** Stripe Webhook Signature (`stripe-signature` header)
- **Events Handled:**
  - `checkout.session.completed`: Updates subscription to `active`, stores `stripe_customer_id` and `stripe_subscription_id`.
  - `customer.subscription.updated`: Syncs `status`, `current_period_end`, `cancel_at_period_end`.
  - `customer.subscription.deleted`: Sets `status = 'canceled'`.
  - `invoice.payment_succeeded`: Confirms successful recurring payment.
  - `invoice.payment_failed`: Transitions status to `past_due`.
