// ==============================================================================
// src/lib/finance/calculator.ts — Pure Deterministic Financial Engine
// ==============================================================================

export interface LineItemInput {
  quantity: number;
  unitPriceCents?: number;
  unit_price_cents?: number;
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
 * Calculates line-item totals, subtotal, discount, tax, and total strictly in integer cents.
 *
 * @param items Array of line items
 * @param discountFlatCents Flat discount in cents (takes precedence if > 0)
 * @param discountRateBasisPoints Percentage discount in basis points (1000 = 10.00%)
 * @param taxRateBasisPoints Tax rate in basis points (825 = 8.25%)
 */
export function calculateDocumentTotals(
  items: LineItemInput[],
  discountFlatCents: number = 0,
  discountRateBasisPoints: number = 0,
  taxRateBasisPoints: number = 0
): CalculationResult {
  // Defensive sanitization of discount and tax parameters
  const safeDiscountFlat =
    typeof discountFlatCents === 'number' && !isNaN(discountFlatCents)
      ? Math.max(0, discountFlatCents)
      : 0;
  const safeDiscountRateBps =
    typeof discountRateBasisPoints === 'number' && !isNaN(discountRateBasisPoints)
      ? Math.max(0, discountRateBasisPoints)
      : 0;
  const safeTaxRateBps =
    typeof taxRateBasisPoints === 'number' && !isNaN(taxRateBasisPoints)
      ? Math.max(0, taxRateBasisPoints)
      : 0;

  // 1. Calculate each line item total: round(qty * unitPriceCents)
  const itemTotals = (items || []).map((item) => {
    const rawQty = item.quantity;
    const qty = typeof rawQty === 'number' && !isNaN(rawQty) ? Math.max(0, rawQty) : 0;
    const rawPrice = item.unitPriceCents ?? item.unit_price_cents ?? 0;
    const price = typeof rawPrice === 'number' && !isNaN(rawPrice) ? Math.max(0, rawPrice) : 0;
    return Math.round(qty * price);
  });

  // 2. Subtotal is the exact sum of line items
  const subtotalCents = itemTotals.reduce((acc, curr) => acc + curr, 0);

  // 3. Discount calculation (Flat discount takes precedence if > 0, otherwise percentage)
  let discountCents = 0;
  if (safeDiscountFlat > 0) {
    discountCents = Math.min(Math.round(safeDiscountFlat), subtotalCents);
  } else if (safeDiscountRateBps > 0) {
    discountCents = Math.round((subtotalCents * safeDiscountRateBps) / 10000);
    discountCents = Math.min(discountCents, subtotalCents);
  }

  // 4. Calculate Taxable Base (taxable items minus pro-rated discount)
  let taxableItemsTotalCents = 0;
  (items || []).forEach((item, idx) => {
    if (item.taxable) {
      taxableItemsTotalCents += itemTotals[idx];
    }
  });

  let taxableBaseCents = 0;
  if (subtotalCents > 0 && taxableItemsTotalCents > 0) {
    const discountPortionForTaxable = Math.round(
      discountCents * (taxableItemsTotalCents / subtotalCents)
    );
    taxableBaseCents = Math.max(0, taxableItemsTotalCents - discountPortionForTaxable);
  }

  // 5. Calculate Tax: round(taxableBase * rate / 10000)
  const taxCents =
    safeTaxRateBps > 0
      ? Math.round((taxableBaseCents * safeTaxRateBps) / 10000)
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
