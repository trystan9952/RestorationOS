/**
 * Room measurements (length / width / ceiling height in feet).
 *
 * Calculated quantities (floor area, wall area, perimeter, etc.) are derived
 * in application code — they are not stored on this record.
 *
 * TODO: Future estimating may use these values to suggest line-item quantities.
 * Measurements must remain independent of estimate_line_items.
 */

export interface RoomMeasurement {
  id: string;
  lossId: string;
  roomId: string;
  lengthFt: number;
  widthFt: number;
  ceilingHeightFt: number;
  createdAt: string;
  updatedAt: string;
}
