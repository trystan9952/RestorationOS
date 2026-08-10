/**
 * Inspection note captured for a room.
 *
 * TODO: Future Digital Twin may attach notes to Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */
export interface RoomNote {
  id: string;
  lossId: string;
  roomId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}
