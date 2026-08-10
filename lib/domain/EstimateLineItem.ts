/**
 * Estimate line item within an estimate area.
 *
 * Line total is calculated in application code: quantity × unitPrice.
 * Do not store a persisted total column in the MVP schema.
 */

export interface EstimateLineItem {
  id: string;
  estimateAreaId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
