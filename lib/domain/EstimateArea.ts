/**
 * Estimate area (often linked to a Room, but room_id is optional).
 *
 * Deleting a Room sets roomId to null — the estimate area remains.
 */

export interface EstimateArea {
  id: string;
  estimateId: string;
  roomId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
