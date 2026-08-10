/**
 * Deterministic quantity-source suggestions for scope → estimate.
 * Suggestions only — the user must be able to change them.
 */

import type { EstimateQuantitySource } from "@/lib/domain/EstimateQuantitySource";
import { formatQuantitySourceLabel } from "@/lib/domain/EstimateQuantitySource";
import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";
import type { ScopeItem } from "@/lib/domain/ScopeItem";
import { getRoomQuantitySourceValue } from "@/lib/utils/estimateQuantitySource";
import { tokenizeForMatch } from "@/lib/utils/matchScopeToCatalog";

export type QuantitySuggestionConfidence = "high" | "medium" | "low";

export type QuantitySourceSuggestion = {
  source: EstimateQuantitySource;
  quantity: number | null;
  unit: string;
  reason: string;
  confidence: QuantitySuggestionConfidence;
  measurementAvailable: boolean;
};

function combinedText(
  scopeItem: Pick<ScopeItem, "description">,
  catalogItem: Pick<PriceCatalogItem, "name" | "unit" | "description">
): string {
  return `${scopeItem.description} ${catalogItem.name} ${catalogItem.description ?? ""}`;
}

function preferredMeasurementSource(
  scopeItem: Pick<ScopeItem, "description">,
  catalogItem: Pick<PriceCatalogItem, "name" | "unit" | "description">
): EstimateQuantitySource {
  const unit = catalogItem.unit.trim().toUpperCase();
  const tokens = new Set(
    tokenizeForMatch(combinedText(scopeItem, catalogItem))
  );

  if (unit === "LF") {
    return "perimeter";
  }

  if (unit === "EA" || unit === "HR" || unit === "LS" || unit === "DAY") {
    return "manual";
  }

  if (unit === "SF" || unit === "SY") {
    if (tokens.has("ceiling")) {
      return "ceiling_area";
    }
    if (
      tokens.has("flooring") ||
      tokens.has("carpet") ||
      tokens.has("vinyl") ||
      (tokens.has("tile") && !tokens.has("wall"))
    ) {
      return "floor_area";
    }
    if (
      tokens.has("drywall") ||
      tokens.has("insulation") ||
      tokens.has("paint") ||
      tokens.has("wall") ||
      tokens.has("baseboard")
    ) {
      return "wall_area";
    }
    // Default SF restoration work leans wall area
    return "wall_area";
  }

  return "manual";
}

/**
 * Suggest a quantity source + calculated quantity for a scope/catalog pair.
 * Never silently returns zero when measurements are missing — falls back to Manual.
 */
export function suggestEstimateQuantitySource(
  scopeItem: Pick<ScopeItem, "description">,
  catalogItem: Pick<PriceCatalogItem, "name" | "unit" | "unitPrice" | "description">,
  measurement: RoomMeasurement | null | undefined
): QuantitySourceSuggestion {
  const preferred = preferredMeasurementSource(scopeItem, catalogItem);
  const catalogUnit = catalogItem.unit.trim() || "EA";

  if (preferred === "manual") {
    return {
      source: "manual",
      quantity: null,
      unit: catalogUnit,
      reason: `Unit ${catalogUnit} typically requires a manual quantity.`,
      confidence: "high",
      measurementAvailable: Boolean(measurement),
    };
  }

  const resolved = getRoomQuantitySourceValue(measurement, preferred);
  if (!resolved) {
    return {
      source: "manual",
      quantity: null,
      unit: catalogUnit,
      reason: `Measurement unavailable for ${formatQuantitySourceLabel(preferred)}; use Manual.`,
      confidence: "medium",
      measurementAvailable: false,
    };
  }

  return {
    source: preferred,
    quantity: resolved.quantity,
    unit: resolved.unit,
    reason: `Suggested ${formatQuantitySourceLabel(preferred)} from room measurements.`,
    confidence: "high",
    measurementAvailable: true,
  };
}
