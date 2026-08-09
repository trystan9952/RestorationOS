/**
 * Moisture reading captured for a room or material.
 * TODO: Finalize fields when moisture schema is designed.
 */
export interface MoistureReading {
  id: string;
  roomId: string;
  value: number;
  unit: string;
  recordedAt: string;
}
