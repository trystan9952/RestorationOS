/**
 * Room-level scope / work item for restoration activities.
 *
 * Not estimating, pricing, or invoicing — work tracking only.
 *
 * TODO: Future Digital Twin may attach scope items to Wall / estimate lines.
 * Wall relationships are intentionally omitted in this MVP.
 */
export interface ScopeItem {
  id: string;
  lossId: string;
  roomId: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
