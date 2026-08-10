/**
 * Build reviewable scope → estimate suggestions for the builder UI.
 * Pure / deterministic — does not persist anything.
 */

import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { Room } from "@/lib/domain/Room";
import type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";
import type { ScopeItem } from "@/lib/domain/ScopeItem";
import type { EstimateQuantitySource } from "@/lib/domain/EstimateQuantitySource";
import {
  getBestCatalogMatch,
  type MatchConfidence,
} from "@/lib/utils/matchScopeToCatalog";
import { suggestEstimateQuantitySource } from "@/lib/utils/suggestEstimateQuantitySource";
import { calculateLineItemTotal } from "@/lib/utils/estimateTotals";

export type ScopeSuggestionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "already_linked";

export type ScopeEstimateSuggestion = {
  id: string;
  scopeItemId: string;
  roomId: string;
  roomName: string;
  scopeDescription: string;
  alreadyLinked: boolean;
  existingLineItemId: string | null;
  catalogItemId: string | null;
  catalogName: string;
  matchConfidence: MatchConfidence;
  matchReason: string;
  quantitySource: EstimateQuantitySource;
  quantity: string;
  unit: string;
  unitPrice: string;
  quantitySuggestionReason: string;
  measurementAvailable: boolean;
  status: ScopeSuggestionStatus;
  /** User customized quantity/unit after suggestion */
  quantityManuallyEdited: boolean;
};

export type BuildScopeEstimateSuggestionsInput = {
  rooms: Room[];
  selectedRoomIds: string[];
  scopeItemsByRoomId: Record<string, ScopeItem[]>;
  measurementsByRoomId: Record<string, RoomMeasurement | null | undefined>;
  catalogItems: PriceCatalogItem[];
};

export function buildScopeEstimateSuggestions(
  input: BuildScopeEstimateSuggestionsInput
): ScopeEstimateSuggestion[] {
  const {
    rooms,
    selectedRoomIds,
    scopeItemsByRoomId,
    measurementsByRoomId,
    catalogItems,
  } = input;

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const suggestions: ScopeEstimateSuggestion[] = [];

  for (const roomId of selectedRoomIds) {
    const room = roomById.get(roomId);
    if (!room) {
      continue;
    }

    const scopeItems = scopeItemsByRoomId[roomId] ?? [];
    const measurement = measurementsByRoomId[roomId];

    for (const scopeItem of scopeItems) {
      if (scopeItem.estimateLineItemId) {
        suggestions.push({
          id: scopeItem.id,
          scopeItemId: scopeItem.id,
          roomId,
          roomName: room.name,
          scopeDescription: scopeItem.description,
          alreadyLinked: true,
          existingLineItemId: scopeItem.estimateLineItemId,
          catalogItemId: null,
          catalogName: "",
          matchConfidence: "none",
          matchReason: "Already linked to an estimate line item.",
          quantitySource: "manual",
          quantity: "",
          unit: "",
          unitPrice: "",
          quantitySuggestionReason: "",
          measurementAvailable: Boolean(measurement),
          status: "already_linked",
          quantityManuallyEdited: false,
        });
        continue;
      }

      const match = getBestCatalogMatch(scopeItem, catalogItems);
      if (!match) {
        suggestions.push({
          id: scopeItem.id,
          scopeItemId: scopeItem.id,
          roomId,
          roomName: room.name,
          scopeDescription: scopeItem.description,
          alreadyLinked: false,
          existingLineItemId: null,
          catalogItemId: null,
          catalogName: "",
          matchConfidence: "none",
          matchReason: "No catalog match found.",
          quantitySource: "manual",
          quantity: "",
          unit: "EA",
          unitPrice: "0",
          quantitySuggestionReason:
            "No catalog match — choose a catalog item or enter values manually.",
          measurementAvailable: Boolean(measurement),
          status: "pending",
          quantityManuallyEdited: false,
        });
        continue;
      }

      const quantitySuggestion = suggestEstimateQuantitySource(
        scopeItem,
        match.catalogItem,
        measurement
      );

      suggestions.push({
        id: scopeItem.id,
        scopeItemId: scopeItem.id,
        roomId,
        roomName: room.name,
        scopeDescription: scopeItem.description,
        alreadyLinked: false,
        existingLineItemId: null,
        catalogItemId: match.catalogItem.id,
        catalogName: match.catalogItem.name,
        matchConfidence: match.confidence,
        matchReason: match.matchReason,
        quantitySource: quantitySuggestion.source,
        quantity:
          quantitySuggestion.quantity != null
            ? String(quantitySuggestion.quantity)
            : "",
        unit: quantitySuggestion.unit,
        unitPrice: String(match.catalogItem.unitPrice),
        quantitySuggestionReason: quantitySuggestion.reason,
        measurementAvailable: quantitySuggestion.measurementAvailable,
        status: "pending",
        quantityManuallyEdited: false,
      });
    }
  }

  return suggestions;
}

export function suggestionLineTotal(
  suggestion: Pick<ScopeEstimateSuggestion, "quantity" | "unitPrice">
): number | null {
  const quantity = Number(suggestion.quantity);
  const unitPrice = Number(suggestion.unitPrice);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return null;
  }
  return calculateLineItemTotal({ quantity, unitPrice });
}

export function isSuggestionApprovable(
  suggestion: ScopeEstimateSuggestion
): boolean {
  if (suggestion.status === "already_linked" || suggestion.status === "rejected") {
    return false;
  }
  if (!suggestion.catalogItemId || !suggestion.catalogName.trim()) {
    return false;
  }
  if (suggestion.matchConfidence === "none" && !suggestion.catalogItemId) {
    return false;
  }

  const quantity = Number(suggestion.quantity);
  const unitPrice = Number(suggestion.unitPrice);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return false;
  }
  if (!suggestion.unit.trim()) {
    return false;
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return false;
  }
  return true;
}
