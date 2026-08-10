export type LossType = "Water" | "Fire" | "Mold" | "Other";

export type LossStatus =
  | "New"
  | "Inspection"
  | "Mitigation"
  | "Drying"
  | "Complete";

export const LOSS_TYPES: LossType[] = ["Water", "Fire", "Mold", "Other"];

export const LOSS_STATUSES: LossStatus[] = [
  "New",
  "Inspection",
  "Mitigation",
  "Drying",
  "Complete",
];

/** A restoration job / claim (loss) in RestorationOS. */
export interface Loss {
  id: string;
  address: string;
  customer: string;
  phone: string;
  insurance: string;
  claimNumber: string;
  lossType: LossType;
  dateOfLoss: string;
  status: LossStatus;
  createdAt: string;
}
