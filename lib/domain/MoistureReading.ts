/**
 * Moisture reading captured for a room material/location.
 *
 * TODO: Future Digital Twin may attach readings to Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */
export interface MoistureReading {
  id: string;
  lossId: string;
  roomId: string;
  material: string;
  reading: number;
  location: string;
  createdAt: string;
}
