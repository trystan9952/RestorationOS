/**
 * Room-level scope / work item for restoration activities.
 *
 * Not estimating, pricing, or invoicing — work tracking only.
 *
 * estimateLineItemId is a workflow link set by "Add to Estimate".
 * It is cleared (NULL) when the estimate line item is deleted.
 *
 * TODO: Future Digital Twin may attach scope items to Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */
export interface ScopeItem {
  id: string;
  lossId: string;
  roomId: string;
  description: string;
  completed: boolean;
  estimateLineItemId: string | null;
  createdAt: string;
  updatedAt: string;
}
