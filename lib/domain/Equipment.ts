/**
 * Drying / mitigation equipment placed in a room.
 *
 * TODO: Future Digital Twin may attach equipment to Wall and track runtime/logs.
 * Wall relationships are intentionally omitted in this MVP.
 */

export type EquipmentStatus = "running" | "removed";

export interface Equipment {
  id: string;
  lossId: string;
  roomId: string;
  equipmentType: string;
  assetNumber: string | null;
  status: EquipmentStatus;
  location: string;
  placedAt: string;
  createdAt: string;
}
