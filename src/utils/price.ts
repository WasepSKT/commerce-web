export type PriceInput = {
  price: number; // in smallest unit (e.g., cents or whole currency depending on app)
  discount_percent?: number | null;
  discount_amount?: number | null; // absolute amount to subtract
};

export type PriceResult = {
  original: number;
  discounted: number;
  discountPercent: number;
  discountAmount: number;
};

/**
 * Compute discounted price.
 * Rules:
 * - If discount_amount is provided, it takes precedence and discountPercent is derived.
 * - Clamp discountPercent to [0,100].
 * - Returns integer values (same unit as input). For currencies where decimals matter, input should be in cents.
 */
export function computePriceAfterDiscount(input: PriceInput): PriceResult {
  const original = Number(input.price) || 0;
  let discountPercent = 0;
  let discountAmount = 0;

  if (input.discount_amount != null) {
    discountAmount = Number(input.discount_amount) || 0;
    // prevent negative or over-discount
    discountAmount = Math.max(0, Math.min(discountAmount, original));
    discountPercent = original > 0 ? (discountAmount / original) * 100 : 0;
  } else if (input.discount_percent != null) {
    discountPercent = Number(input.discount_percent) || 0;
    discountPercent = Math.max(0, Math.min(discountPercent, 100));
    discountAmount = Math.round((discountPercent / 100) * original);
  }

  const discounted = Math.max(0, Math.round(original - discountAmount));

  return {
    original,
    discounted,
    discountPercent: Number(discountPercent),
    discountAmount: Number(discountAmount),
  };
}

export default computePriceAfterDiscount;
