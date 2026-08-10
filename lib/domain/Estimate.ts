/**
 * Estimate for a restoration loss (one active estimate per loss in MVP).
 *
 * TODO: Future versions may add revisions, approvals, markups, and catalogs.
 */

export type EstimateStatus = "Draft" | "Complete";

export const ESTIMATE_STATUSES: EstimateStatus[] = ["Draft", "Complete"];

export interface Estimate {
  id: string;
  lossId: string;
  status: EstimateStatus;
  /** Estimate-level notes (not room notes). Null when empty. */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
