import type { LossStatus } from "@/lib/domain/Loss";

/**
 * Property / building associated with a loss.
 * TODO: Align fields with final schema when designed manually.
 */
export interface Building {
  id: string;
  address: string;
  customer: string;
  phone: string;
  insurance: string;
  claimNumber: string;
  status: LossStatus;
  createdAt: string;
}
