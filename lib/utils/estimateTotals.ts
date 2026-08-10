import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";

/** Round money to cents without careless float drift. */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Line total = quantity × unit price (rounded to cents). */
export function calculateLineItemTotal(
  lineItem: Pick<EstimateLineItem, "quantity" | "unitPrice">
): number {
  return roundCurrency(lineItem.quantity * lineItem.unitPrice);
}

/** Area total = sum of its line item totals. */
export function calculateAreaTotal(
  lineItems: Array<Pick<EstimateLineItem, "quantity" | "unitPrice">>
): number {
  const sum = lineItems.reduce(
    (total, item) => total + calculateLineItemTotal(item),
    0
  );
  return roundCurrency(sum);
}

/**
 * Estimate total = sum of all area totals.
 * Pass one array of line items per area.
 */
export function calculateEstimateTotal(
  areas: Array<Array<Pick<EstimateLineItem, "quantity" | "unitPrice">>>
): number {
  const sum = areas.reduce(
    (total, items) => total + calculateAreaTotal(items),
    0
  );
  return roundCurrency(sum);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrency(value));
}
