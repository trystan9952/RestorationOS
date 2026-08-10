import type { EstimateQuantitySource } from "@/lib/domain/EstimateQuantitySource";

/**
 * Estimate line item within an estimate area.
 *
 * Line total is calculated in application code: quantity × unitPrice.
 * Do not store a persisted total column in the MVP schema.
 *
 * quantitySource records whether quantity came from manual entry or a
 * room measurement calculated quantity. Calculated values are not duplicated.
 */

export interface EstimateLineItem {
  id: string;
  estimateAreaId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  quantitySource: EstimateQuantitySource;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
