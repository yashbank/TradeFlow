# Business Logic & State Machines — TradeFlow
**Version:** 1.0  
**Domain:** Small Plumbing Services (1–10 Technicians)  
**Invariants:** Multi-Tenant Isolation, Integer Currency Arithmetic, Unidirectional Pipeline  

---

## 1. Core Domain Invariants & Rules

The TradeFlow business domain is governed by nine immutable system invariants:

1. **Strict Multi-Tenant Isolation:** No entity (Customer, Quote, Job, Invoice, Payment, Member) may ever be created, viewed, updated, or queried across organization boundaries.
2. **Deterministic Minor-Unit Arithmetic:** All monetary amounts are non-negative 64-bit integers representing minor units (`cents` for USD/AUD, `pence` for GBP). Decimal/floating-point arithmetic for currency is strictly prohibited.
3. **Unidirectional Operational Progression:** The standard pipeline progresses strictly as:
   $$\text{Customer} \longrightarrow \text{Quote (Accepted)} \longrightarrow \text{Job (Completed)} \longrightarrow \text{Invoice} \longrightarrow \text{Payment}$$
4. **Conditional Conversion Pre-Requisites:**
   - A Quote **MUST** be in `accepted` status before it can be converted to a Job.
   - A Job **MUST** be in `completed` status before it can be converted to an Invoice.
5. **Invoice Financial Immutability:** Once an Invoice reaches `paid` status (or has recorded non-zero payments), its line items, customer association, and financial totals become strictly immutable. Rectifications must occur via credit/void adjustments.
6. **Unique Sequential Numbering:** Quote numbers (`Q-YYYY-XXXX`), Job numbers (`J-YYYY-XXXX`), and Invoice numbers (`INV-YYYY-XXXX`) are unique within each organization and monotonically increasing.
7. **Atomic State Transitions:** State transitions that initiate side effects (e.g. converting quote to job or recording payments) must execute within atomic database transactions.
8. **Public Portal Token Isolation:** Public access tokens (`public_token`) for quotes and invoices are high-entropy cryptographic strings. A token grants read access exclusively to that specific document and its parent organization's public branding; it never exposes internal UUIDs or sibling documents.
9. **Subscription Feature Gate:** An organization whose subscription status is `past_due` (beyond the 3-day grace period) or `canceled` is restricted to read-only access and payment collection. New quote, job, and invoice creations are blocked.

---

## 2. Financial Calculation Engine Specification

The financial calculation engine executes with exact integer arithmetic. Below is the normative TypeScript implementation used across the platform.

### 2.1 Formal Calculation Logic

```typescript
export interface LineItemInput {
  quantity: number; // e.g., 2.5
  unitPriceCents: number; // e.g., 12000 ($120.00)
  taxable: boolean;
}

export interface CalculationResult {
  itemTotals: number[];
  subtotalCents: number;
  discountCents: number;
  taxableBaseCents: number;
  taxCents: number;
  totalCents: number;
}

/**
 * Deterministic Financial Calculator
 * @param items Array of line items
 * @param discountFlatCents Flat discount in cents (optional)
 * @param discountRateBasisPoints Percentage discount in basis points (e.g. 1000 = 10%)
 * @param taxRateBasisPoints Tax rate in basis points (e.g. 825 = 8.25%)
 */
export function calculateDocumentTotals(
  items: LineItemInput[],
  discountFlatCents: number = 0,
  discountRateBasisPoints: number = 0,
  taxRateBasisPoints: number = 0
): CalculationResult {
  // 1. Calculate each line item total: round(qty * unitPriceCents)
  const itemTotals = items.map((item) =>
    Math.round(item.quantity * item.unitPriceCents)
  );

  // 2. Subtotal is the exact sum of line items
  const subtotalCents = itemTotals.reduce((acc, curr) => acc + curr, 0);

  // 3. Discount calculation (Flat takes precedence if > 0, otherwise percentage)
  let discountCents = 0;
  if (discountFlatCents > 0) {
    discountCents = Math.min(discountFlatCents, subtotalCents);
  } else if (discountRateBasisPoints > 0) {
    discountCents = Math.round(
      (subtotalCents * discountRateBasisPoints) / 10000
    );
  }

  // 4. Calculate Taxable Base (subtotal of taxable items minus pro-rated discount)
  let taxableItemsTotalCents = 0;
  items.forEach((item, idx) => {
    if (item.taxable) {
      taxableItemsTotalCents += itemTotals[idx];
    }
  });

  let taxableBaseCents = 0;
  if (subtotalCents > 0 && taxableItemsTotalCents > 0) {
    // Pro-rate discount against taxable items
    const discountPortionForTaxable = Math.round(
      discountCents * (taxableItemsTotalCents / subtotalCents)
    );
    taxableBaseCents = Math.max(0, taxableItemsTotalCents - discountPortionForTaxable);
  }

  // 5. Calculate Tax: round(taxableBase * rate / 10000)
  const taxCents =
    taxRateBasisPoints > 0
      ? Math.round((taxableBaseCents * taxRateBasisPoints) / 10000)
      : 0;

  // 6. Grand Total: Subtotal - Discount + Tax
  const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);

  return {
    itemTotals,
    subtotalCents,
    discountCents,
    taxableBaseCents,
    taxCents,
    totalCents,
  };
}
```

---

## 3. Finite State Machines (FSMs)

### 3.1 Quote State Machine

```
   [ Create ]
       |
       v
   +-------+           Send
   | Draft | ------------------------> +------+
   +-------+                          | Sent |
       |                               +------+
       | Delete                           |
       x                                  +---------------------+---------------------+
                                          | Customer Accepts    | Customer Rejects    | Expiry Date Passed
                                          v                     v                     v
                                    +----------+          +----------+          +---------+
                                    | Accepted |          | Rejected |          | Expired |
                                    +----------+          +----------+          +---------+
                                          |                     |                     |
                                    Convert to Job        Re-open / Edit        Re-open / Edit
                                          v                     v                     v
                                      [ Job ]               [ Draft ]             [ Draft ]
```

#### State Transition Rules:
| Current State | Event | Target State | Permitted Roles | Invariants & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| **None** | `CREATE` | `draft` | Owner, Admin | Generates quote number and public token. |
| **draft** | `SEND` | `sent` | Owner, Admin | Sets `sent_at = NOW()`; triggers transactional email. |
| **draft** | `DELETE` | *Deleted* | Owner, Admin | Only permissible if no linked jobs exist. |
| **sent** | `ACCEPT` | `accepted` | Public Customer, Owner, Admin | Sets `accepted_at = NOW()`, captures signer name & IP; locks line items. |
| **sent** | `REJECT` | `rejected` | Public Customer, Owner, Admin | Sets `rejected_at = NOW()`, logs optional reason. |
| **sent** | `EXPIRE` | `expired` | System Cron | Evaluated daily when `CURRENT_DATE > expiry_date`. |
| **rejected / expired** | `REOPEN` | `draft` | Owner, Admin | Creates a clone or reopens for revision. |
| **accepted** | `CONVERT_JOB`| `accepted` (Locked) | Owner, Admin | Spawns Job record; links `source_quote_id`. |

---

### 3.2 Job State Machine

```
    [ From Quote or Manual ]
                |
                v
        +---------------+           Cancel
        |   Scheduled   | -------------------------> +-----------+
        +---------------+                            | Cancelled |
                |                                    +-----------+
                | Technician Taps "Start Job"
                v
        +---------------+
        |  In Progress  |
        +---------------+
                |
                | Technician Taps "Complete Job"
                v
        +---------------+
        |   Completed   |
        +---------------+
                |
                | Convert to Invoice
                v
           [ Invoice ]
```

#### State Transition Rules:
| Current State | Event | Target State | Permitted Roles | Invariants & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| **None** | `CREATE` | `scheduled` | Owner, Admin | Assigns job number; requires customer and address. |
| **scheduled** | `START` | `in_progress` | Owner, Admin, Assigned Tech | Sets `started_at = NOW()`. |
| **scheduled** | `CANCEL` | `cancelled` | Owner, Admin | Marks job cancelled; frees technician dispatch slot. |
| **in_progress**| `COMPLETE` | `completed` | Owner, Admin, Assigned Tech | Sets `completed_at = NOW()`; validates finish notes. |
| **completed** | `CONVERT_INVOICE`| `completed` | Owner, Admin | Spawns draft Invoice populated with job details. |

---

### 3.3 Invoice State Machine

```
   [ From Job or Manual ]
              |
              v
        +-----------+           Send
        |   Draft   | ------------------------> +------+
        +-----------+                           | Sent | <-------------------+
              |                                 +------+                     |
              | Delete                             |                         |
              x                                    +------------+            |
                                                   | Record     | Due Date   |
                                                   | Payment    | Passed     |
                                                   v            v            |
                                              +---------+  +---------+       | Payment
                                              |  Paid   |  | Overdue |       | Reversal
                                              +---------+  +---------+       |
                                                   |            |            |
                                                   x            +------------+
                                             (Immutable)        | Record Payment Full
                                                                v
                                                           +---------+
                                                           |  Paid   |
                                                           +---------+
```

#### State Transition Rules:
| Current State | Event | Target State | Permitted Roles | Invariants & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| **None** | `CREATE` | `draft` | Owner, Admin | Assigns invoice number; calculates line items. |
| **draft** | `SEND` | `sent` | Owner, Admin | Sets `sent_at = NOW()`; sends email with public link. |
| **sent** | `RECORD_FULL_PAYMENT`| `paid` | Owner, Admin | `balance_due_cents == 0`; sets `paid_at = NOW()`. |
| **sent** | `RECORD_PARTIAL_PAYMENT`| `sent` | Owner, Admin | `balance_due_cents > 0`; updates `amount_paid_cents`. |
| **sent** | `DUE_DATE_PASSED` | `overdue` | System Cron | Evaluated daily when `CURRENT_DATE > due_date`. |
| **overdue** | `RECORD_FULL_PAYMENT`| `paid` | Owner, Admin | `balance_due_cents == 0`; sets `paid_at = NOW()`. |
| **draft / sent**| `VOID` | `void` | Owner, Admin | Sets `voided_at = NOW()`; prohibited if payments recorded. |

---

### 3.4 SaaS Subscription State Machine

```
   [ Organization Created ]
              |
              v
       +--------------+
       |   Trialing   | (14-Day Free Access)
       +--------------+
         /          \
  Checkout        Trial Expires
  Succeeds        without Card
       v              v
+------------+  +------------+
|   Active   |  |  Past Due  | (3-Day Grace Period)
+------------+  +------------+
       |              |
  Cancellation        Grace Expires
  or Default          |
       v              v
+----------------------------+
|          Canceled          | (Mutations Blocked / Read-Only)
+----------------------------+
```

---

## 4. Pipeline Conversion Engines

### 4.1 Accepted Quote $\longrightarrow$ Job Conversion Engine
When an authorized user triggers "Convert to Job" on an `accepted` quote:
1. **Validation:**
   - Verify `quotes.status == 'accepted'`.
   - Verify `organization_id` matches current active workspace.
2. **Transaction Execution:**
   - Acquire next job sequence number: `job_number = fn_next_sequence(org_id, 'job')`.
   - Concatenate quote line items into formatted job scope description.
   - Insert new row into `jobs`:
     - `customer_id`: copied from quote.
     - `source_quote_id`: set to `quote.id`.
     - `title`: `"Plumbing Service - " || quote.quote_number`.
     - `description`: formatted line-item breakdown.
     - `address_line1`, `city`, `state`, `postal_code`: copied from customer record.
     - `status`: `'scheduled'`.
3. **Audit Log:** Insert record into `audit_logs` documenting quote conversion.

### 4.2 Completed Job $\longrightarrow$ Invoice Conversion Engine
When an authorized user triggers "Create Invoice" on a `completed` job:
1. **Validation:**
   - Verify `jobs.status == 'completed'`.
   - Check if an active invoice already links to `source_job_id` (prevent duplicate billing).
2. **Transaction Execution:**
   - Acquire next invoice sequence number: `invoice_number = fn_next_sequence(org_id, 'invoice')`.
   - Retrieve source quote line items if `source_quote_id` exists; otherwise create default service line item from job title.
   - Run financial calculation engine on line items.
   - Insert row into `invoices`:
     - `customer_id`: copied from job.
     - `source_job_id`: set to `job.id`.
     - `source_quote_id`: copied from job.
     - `status`: `'draft'`.
     - Calculated totals: `subtotal_cents`, `tax_cents`, `total_cents`.
     - `balance_due_cents`: initialized to `total_cents`.
     - `amount_paid_cents`: initialized to `0`.
   - Bulk insert line items into `invoice_items`.
3. **Audit Log:** Log invoice creation event in `audit_logs`.

---

## 5. Role-Based Action Matrix

| Action | Owner | Admin | Technician | Public Client |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Subscription & Billing** | Yes | No | No | No |
| **Invite / Remove Team Members** | Yes | Yes | No | No |
| **Create / Edit / Delete Customers** | Yes | Yes | No | No |
| **View Customer Records** | Yes | Yes | Assigned Jobs Only | No |
| **Create / Edit / Send Quotes** | Yes | Yes | No | No |
| **View Quote Breakdown & PDF** | Yes | Yes | No | Token Only |
| **Accept / Decline Quote** | Yes | Yes | No | Yes (via Token) |
| **Create / Dispatch Jobs** | Yes | Yes | No | No |
| **View Assigned Jobs Schedule** | Yes | Yes | Assigned Jobs Only | No |
| **Start / Complete Job & Add Notes** | Yes | Yes | Assigned Jobs Only | No |
| **Create / Edit / Send Invoices** | Yes | Yes | No | No |
| **Record Payments** | Yes | Yes | No | No |
| **View Financial Dashboard KPIs** | Yes | Yes | No | No |
