import type { EstimateQuantitySource } from "@/lib/domain/EstimateQuantitySource";
import type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";
import {
  calculateCeilingArea,
  calculateFloorArea,
  calculatePerimeter,
  calculateWallArea,
  formatQuantityDisplay,
  type RoomDimensions,
} from "@/lib/utils/roomMeasurements";

export type QuantitySourceResult = {
  quantity: number;
  unit: "SF" | "LF";
};

/**
 * Resolve a measurement-based quantity source to quantity + unit.
 * Returns null for manual (caller controls quantity/unit).
 */
export function getRoomQuantitySourceValue(
  measurement: RoomDimensions | null | undefined,
  source: EstimateQuantitySource
): QuantitySourceResult | null {
  if (source === "manual") {
    return null;
  }

  if (!measurement) {
    return null;
  }

  switch (source) {
    case "floor_area":
      return {
        quantity: calculateFloorArea(measurement),
        unit: "SF",
      };
    case "ceiling_area":
      return {
        quantity: calculateCeilingArea(measurement),
        unit: "SF",
      };
    case "wall_area":
      return {
        quantity: calculateWallArea(measurement),
        unit: "SF",
      };
    case "perimeter":
      return {
        quantity: calculatePerimeter(measurement),
        unit: "LF",
      };
  }
}

export function formatQuantitySourceOptionLabel(
  source: Exclude<EstimateQuantitySource, "manual">,
  measurement: RoomMeasurement | null | undefined
): string {
  const result = getRoomQuantitySourceValue(measurement, source);
  if (!result) {
    return `${sourceLabel(source)} — n/a`;
  }

  return `${sourceLabel(source)} — ${formatQuantityDisplay(result.quantity)} ${result.unit}`;
}

function sourceLabel(source: Exclude<EstimateQuantitySource, "manual">): string {
  switch (source) {
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
