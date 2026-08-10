/**
 * How an estimate line item quantity was determined.
 *
 * Measurement-based sources derive quantity/unit from RoomMeasurement
 * calculations at runtime. Calculated values are never stored on the line item.
 */

export type EstimateQuantitySource =
  | "manual"
  | "floor_area"
  | "ceiling_area"
  | "wall_area"
  | "perimeter";

export const ESTIMATE_QUANTITY_SOURCES: EstimateQuantitySource[] = [
  "manual",
  "floor_area",
  "ceiling_area",
  "wall_area",
  "perimeter",
];

export const MEASUREMENT_QUANTITY_SOURCES: Exclude<
  EstimateQuantitySource,
  "manual"
>[] = ["floor_area", "ceiling_area", "wall_area", "perimeter"];

export function isEstimateQuantitySource(
  value: string
): value is EstimateQuantitySource {
  return (ESTIMATE_QUANTITY_SOURCES as string[]).includes(value);
}

export function formatQuantitySourceLabel(
  source: EstimateQuantitySource
): string {
  switch (source) {
    case "manual":
      return "Manual";
    case "floor_area":
      return "Floor Area";
    case "ceiling_area":
      return "Ceiling Area";
    case "wall_area":
      return "Wall Area";
    case "perimeter":
      return "Perimeter";
  }
}
