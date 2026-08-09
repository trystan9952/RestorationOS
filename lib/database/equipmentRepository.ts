import type { Equipment } from "@/lib/domain/Equipment";

/**
 * Equipment persistence.
 * TODO: Implement against final schema (no tables invented here).
 */

export type CreateEquipmentInput = {
  roomId: string;
  name: string;
};

export async function listEquipmentByRoomId(
  _roomId: string
): Promise<Equipment[]> {
  // TODO: Load equipment from database
  return [];
}

export async function createEquipment(
  _input: CreateEquipmentInput
): Promise<Equipment> {
  // TODO: Save equipment to database
  throw new Error("TODO: Save equipment once schema is designed");
}

export async function deleteEquipment(_id: string): Promise<void> {
  // TODO: Delete equipment from database
  throw new Error("TODO: Delete equipment once schema is designed");
}
