import type { MoistureReading } from "@/lib/domain/MoistureReading";

/**
 * Moisture reading persistence.
 * TODO: Implement against final schema (no tables invented here).
 */

export type CreateMoistureReadingInput = {
  roomId: string;
  value: number;
  unit: string;
  recordedAt?: string;
};

export async function listMoistureReadingsByRoomId(
  _roomId: string
): Promise<MoistureReading[]> {
  // TODO: Load moisture readings from database
  return [];
}

export async function createMoistureReading(
  _input: CreateMoistureReadingInput
): Promise<MoistureReading> {
  // TODO: Save moisture readings
  throw new Error("TODO: Save moisture readings once schema is designed");
}

export async function deleteMoistureReading(_id: string): Promise<void> {
  // TODO: Delete moisture reading from database
  throw new Error("TODO: Delete moisture reading once schema is designed");
}
