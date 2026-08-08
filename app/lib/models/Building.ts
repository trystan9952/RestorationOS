import { Room } from "./Room";

export type Building = {
  id: string;

  address: string;

  customer: string;

  phone: string;

  insurance: string;

  claimNumber: string;

  createdAt: Date;

  status: "Initializing" | "Inspection" | "Drying" | "Complete";

  rooms: Room[];
};