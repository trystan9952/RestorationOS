export type LossStatus =
  | "Initializing"
  | "Inspection"
  | "Drying"
  | "Complete";

/** A restoration job / claim (loss) in RestorationOS. */
export interface Loss {
  id: string;
  address: string;
  customer: string;
  phone: string;
  insurance: string;
  claimNumber: string;
  status: LossStatus;
  createdAt: string;
}
