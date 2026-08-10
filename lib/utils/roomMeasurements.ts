import type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";

export type RoomDimensions = Pick<
  RoomMeasurement,
  "lengthFt" | "widthFt" | "ceilingHeightFt"
>;

/** Floor area (SF) = length × width */
export function calculateFloorArea(measurement: RoomDimensions): number {
  return measurement.lengthFt * measurement.widthFt;
}

/** Ceiling area (SF) = length × width */
export function calculateCeilingArea(measurement: RoomDimensions): number {
  return measurement.lengthFt * measurement.widthFt;
}

/** Perimeter (LF) = 2 × (length + width) */
export function calculatePerimeter(measurement: RoomDimensions): number {
  return 2 * (measurement.lengthFt + measurement.widthFt);
}

/** Wall area (SF) = perimeter × ceiling height */
export function calculateWallArea(measurement: RoomDimensions): number {
  return calculatePerimeter(measurement) * measurement.ceilingHeightFt;
}

/**
 * Display-only formatting. Does not alter underlying measurement values.
 * Whole numbers stay whole; otherwise up to 2 decimal places.
 */
export function formatQuantityDisplay(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
