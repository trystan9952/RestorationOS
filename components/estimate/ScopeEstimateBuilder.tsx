"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CatalogItemPicker } from "@/components/estimate/CatalogItemPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ESTIMATE_QUANTITY_SOURCES,
  formatQuantitySourceLabel,
  type EstimateQuantitySource,
} from "@/lib/domain/EstimateQuantitySource";
import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { Room } from "@/lib/domain/Room";
import { useTwinStore } from "@/lib/store/useTwinStore";
import {
  buildScopeEstimateSuggestions,
  isSuggestionApprovable,
  suggestionLineTotal,
  type ScopeEstimateSuggestion,
} from "@/lib/utils/buildScopeEstimateSuggestions";
import {
  formatQuantitySourceOptionLabel,
  getRoomQuantitySourceValue,
} from "@/lib/utils/estimateQuantitySource";
import { formatCurrency } from "@/lib/utils/estimateTotals";
import { suggestEstimateQuantitySource } from "@/lib/utils/suggestEstimateQuantitySource";

type ScopeEstimateBuilderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  lossId: string;
};

type BuilderPhase = "loading" | "rooms" | "review" | "done";

function confidenceClass(confidence: ScopeEstimateSuggestion["matchConfidence"]) {
  switch (confidence) {
    case "high":
      return "text-emerald-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-orange-400";
    default:
      return "text-slate-400";
  }
}

function confidenceLabel(confidence: ScopeEstimateSuggestion["matchConfidence"]) {
  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "None";
  }
}

export function ScopeEstimateBuilder({
  open,
  onOpenChange,
  rooms,
  lossId,
}: ScopeEstimateBuilderProps) {
  const scopeItemsByRoomId = useTwinStore((state) => state.scopeItemsByRoomId);
  const roomMeasurementsByRoomId = useTwinStore(
    (state) => state.roomMeasurementsByRoomId
  );
  const priceCatalogItems = useTwinStore((state) => state.priceCatalogItems);
  const loadRoomScope = useTwinStore((state) => state.loadRoomScope);
  const loadRoomMeasurement = useTwinStore((state) => state.loadRoomMeasurement);
  const loadPriceCatalog = useTwinStore((state) => state.loadPriceCatalog);
  const addApprovedScopeItemsToEstimate = useTwinStore(
    (state) => state.addApprovedScopeItemsToEstimate
  );
  const isBuildingEstimateFromScope = useTwinStore(
    (state) => state.isBuildingEstimateFromScope
  );

  const [phase, setPhase] = useState<BuilderPhase>("loading");
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ScopeEstimateSuggestion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [catalogPickerSuggestionId, setCatalogPickerSuggestionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPhase("loading");
    setLoadError(null);
    setActionError(null);
    setStatusMessage(null);
    setAddedCount(0);
    setSuggestions([]);
    setSelectedRoomIds(rooms.map((room) => room.id));

    void (async () => {
      try {
        setStatusMessage("Loading scope...");
        await Promise.all(
          rooms.map((room) => loadRoomScope(room.id).catch(() => []))
        );

        setStatusMessage("Matching catalog...");
        await loadPriceCatalog().catch(() => null);

        setStatusMessage("Calculating quantities...");
        await Promise.allSettled(
          rooms.map((room) => loadRoomMeasurement(room.id))
        );

        setStatusMessage(null);
        setPhase("rooms");
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to load scope data."
        );
        setPhase("rooms");
      }
    })();
  }, [
    open,
    rooms,
    loadRoomScope,
    loadPriceCatalog,
    loadRoomMeasurement,
    lossId,
  ]);

  const roomsWithScopeCount = useMemo(() => {
    return rooms.map((room) => {
      const items = scopeItemsByRoomId[room.id] ?? [];
      const available = items.filter((item) => !item.estimateLineItemId).length;
      const linked = items.filter((item) => item.estimateLineItemId).length;
      return { room, available, linked, total: items.length };
    });
  }, [rooms, scopeItemsByRoomId]);

  function toggleRoom(roomId: string) {
    setSelectedRoomIds((current) =>
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId]
    );
  }

  function selectAllRooms() {
    setSelectedRoomIds(rooms.map((room) => room.id));
  }

  function clearRooms() {
    setSelectedRoomIds([]);
  }

  function handleReviewSuggestions() {
    setActionError(null);
    const next = buildScopeEstimateSuggestions({
      rooms,
      selectedRoomIds,
      scopeItemsByRoomId,
      measurementsByRoomId: roomMeasurementsByRoomId ?? {},
      catalogItems: priceCatalogItems,
    });
    setSuggestions(next);
    setPhase("review");
  }

  function updateSuggestion(
    id: string,
    updater: (current: ScopeEstimateSuggestion) => ScopeEstimateSuggestion
  ) {
    setSuggestions((current) =>
      current.map((item) => (item.id === id ? updater(item) : item))
    );
  }

  function applyCatalogToSuggestion(
    suggestionId: string,
    catalogItem: PriceCatalogItem
  ) {
    updateSuggestion(suggestionId, (current) => {
      const measurement = roomMeasurementsByRoomId?.[current.roomId];
      const quantitySuggestion = suggestEstimateQuantitySource(
        { description: current.scopeDescription },
        catalogItem,
        measurement
      );

      return {
        ...current,
        catalogItemId: catalogItem.id,
        catalogName: catalogItem.name,
        matchConfidence:
          current.matchConfidence === "none" ? "medium" : current.matchConfidence,
        matchReason: `Selected catalog item: ${catalogItem.name}`,
        quantitySource: quantitySuggestion.source,
        quantity:
          quantitySuggestion.quantity != null
            ? String(quantitySuggestion.quantity)
            : current.quantityManuallyEdited
              ? current.quantity
              : "",
        unit: quantitySuggestion.unit,
        unitPrice: String(catalogItem.unitPrice),
        quantitySuggestionReason: quantitySuggestion.reason,
        measurementAvailable: quantitySuggestion.measurementAvailable,
        quantityManuallyEdited: false,
        status: current.status === "rejected" ? "pending" : current.status,
      };
    });
  }

  function handleQuantitySourceChange(
    suggestionId: string,
    source: EstimateQuantitySource
  ) {
    updateSuggestion(suggestionId, (current) => {
      if (source === "manual") {
        return {
          ...current,
          quantitySource: "manual",
          quantityManuallyEdited: true,
          quantitySuggestionReason: "Manual quantity selected.",
        };
      }

      const measurement = roomMeasurementsByRoomId?.[current.roomId];
      const resolved = getRoomQuantitySourceValue(measurement, source);
      if (!resolved) {
        return {
          ...current,
          quantitySource: "manual",
          quantity: "",
          quantityManuallyEdited: true,
          measurementAvailable: false,
          quantitySuggestionReason: `Measurement unavailable for ${formatQuantitySourceLabel(source)}; use Manual.`,
        };
      }

      return {
        ...current,
        quantitySource: source,
        quantity: String(resolved.quantity),
        unit: resolved.unit,
        quantityManuallyEdited: false,
        measurementAvailable: true,
        quantitySuggestionReason: `Using ${formatQuantitySourceLabel(source)} from room measurements.`,
      };
    });
  }

  function handleQuantityEdit(suggestionId: string, value: string) {
    updateSuggestion(suggestionId, (current) => ({
      ...current,
      quantity: value,
      quantitySource: "manual",
      quantityManuallyEdited: true,
      quantitySuggestionReason: "Quantity edited — source set to Manual.",
    }));
  }

  function handleUnitEdit(suggestionId: string, value: string) {
    updateSuggestion(suggestionId, (current) => ({
      ...current,
      unit: value,
      quantitySource: "manual",
      quantityManuallyEdited: true,
      quantitySuggestionReason: "Unit edited — source set to Manual.",
    }));
  }

  function handleUnitPriceEdit(suggestionId: string, value: string) {
    updateSuggestion(suggestionId, (current) => ({
      ...current,
      unitPrice: value,
    }));
  }

  function approveSuggestion(id: string) {
    updateSuggestion(id, (current) => {
      if (!isSuggestionApprovable({ ...current, status: "pending" })) {
        return current;
      }
      return { ...current, status: "approved" };
    });
  }

  function rejectSuggestion(id: string) {
    updateSuggestion(id, (current) =>
      current.status === "already_linked"
        ? current
        : { ...current, status: "rejected" }
    );
  }

  function approveAllHighConfidence() {
    setSuggestions((current) =>
      current.map((item) => {
        if (item.status === "already_linked" || item.status === "rejected") {
          return item;
        }
        if (item.matchConfidence !== "high") {
          return item;
        }
        if (!isSuggestionApprovable({ ...item, status: "pending" })) {
          return item;
        }
        return { ...item, status: "approved" };
      })
    );
  }

  const approvedSuggestions = suggestions.filter(
    (item) => item.status === "approved"
  );
  const pendingSuggestions = suggestions.filter(
    (item) => item.status === "pending"
  );
  const rejectedSuggestions = suggestions.filter(
    (item) => item.status === "rejected"
  );
  const linkedSuggestions = suggestions.filter(
    (item) => item.status === "already_linked"
  );

  async function handleAddApproved() {
    if (isBuildingEstimateFromScope || approvedSuggestions.length === 0) {
      return;
    }

    setActionError(null);

    const payload = approvedSuggestions.map((item) => ({
      scopeItemId: item.scopeItemId,
      roomId: item.roomId,
      catalogItem: {
        name: item.catalogName,
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
      },
      quantitySource: item.quantitySource,
      manualQuantity:
        item.quantitySource === "manual" ? Number(item.quantity) : undefined,
    }));

    const invalid = payload.filter(
      (item) =>
        !item.catalogItem.name.trim() ||
        !item.catalogItem.unit.trim() ||
        !Number.isFinite(item.catalogItem.unitPrice) ||
        item.catalogItem.unitPrice < 0 ||
        (item.quantitySource === "manual" &&
          (item.manualQuantity === undefined ||
            !Number.isFinite(item.manualQuantity) ||
            item.manualQuantity <= 0))
    );

    if (invalid.length > 0) {
      setActionError(
        "Some approved items are missing quantity, unit, or price. Fix them before adding."
      );
      return;
    }

    try {
      const result = await addApprovedScopeItemsToEstimate(payload);
      setAddedCount(result.added);

      if (result.failures.length > 0) {
        setActionError(
          `Added ${result.added} item(s). Failed: ${result.failures
            .map((failure) => failure.error)
            .join("; ")}`
        );
      }

      // Refresh suggestion statuses from store after persistence
      const refreshed = buildScopeEstimateSuggestions({
        rooms,
        selectedRoomIds,
        scopeItemsByRoomId: useTwinStore.getState().scopeItemsByRoomId,
        measurementsByRoomId:
          useTwinStore.getState().roomMeasurementsByRoomId ?? {},
        catalogItems: useTwinStore.getState().priceCatalogItems,
      });
      setSuggestions(refreshed);
      setPhase("done");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to add approved items to the estimate."
      );
    }
  }

  const catalogPickerSuggestion = suggestions.find(
    (item) => item.id === catalogPickerSuggestionId
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-4xl flex-col overflow-hidden border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Build Estimate From Scope</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review suggested catalog matches and quantities. Nothing is added
              to the estimate until you approve items and confirm.
            </DialogDescription>
          </DialogHeader>

          {loadError ? (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {loadError}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {actionError}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {phase === "loading" ? (
              <p className="py-10 text-center text-slate-400">
                {statusMessage || "Loading..."}
              </p>
            ) : null}

            {phase === "rooms" ? (
              <div className="grid gap-4">
                {rooms.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-slate-400">
                    Nothing to estimate. Add rooms first.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={selectAllRooms}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                      >
                        All Rooms
                      </button>
                      <button
                        type="button"
                        onClick={clearRooms}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="grid gap-2">
                      {roomsWithScopeCount.map(({ room, available, linked, total }) => {
                        const checked = selectedRoomIds.includes(room.id);
                        return (
                          <label
                            key={room.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRoom(room.id)}
                              className="mt-1"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-slate-100">
                                {room.name}
                              </span>
                              <span className="mt-1 block text-xs text-slate-400">
                                {total === 0
                                  ? "No scope items"
                                  : `${available} available · ${linked} already in estimate`}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {phase === "review" || phase === "done" ? (
              <div className="grid gap-4">
                {suggestions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-slate-400">
                    No scope items to estimate.
                  </p>
                ) : (
                  <>
                    {phase === "review" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={approveAllHighConfidence}
                          className="rounded-lg border border-emerald-800 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-950/40"
                        >
                          Approve All High Confidence
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhase("rooms")}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                        >
                          Change Rooms
                        </button>
                      </div>
                    ) : null}

                    {linkedSuggestions.length > 0 ? (
                      <section className="grid gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          Already in Estimate
                        </h3>
                        {linkedSuggestions.map((item) => (
                          <article
                            key={item.id}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3"
                          >
                            <p className="font-medium text-slate-200">
                              {item.roomName}
                            </p>
                            <p className="mt-1 text-slate-100">
                              {item.scopeDescription}
                            </p>
                            <p className="mt-2 text-sm text-emerald-400">
                              ✓ Already in Estimate
                            </p>
                          </article>
                        ))}
                      </section>
                    ) : null}

                    {[...pendingSuggestions, ...approvedSuggestions].map(
                      (item) => {
                        const total = suggestionLineTotal(item);
                        const measurement =
                          roomMeasurementsByRoomId?.[item.roomId];
                        const approved = item.status === "approved";

                        return (
                          <article
                            key={item.id}
                            className={`rounded-lg border px-3 py-4 sm:px-4 ${
                              approved
                                ? "border-emerald-800 bg-emerald-950/20"
                                : "border-slate-700 bg-slate-950/40"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                  {item.roomName}
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-100">
                                  {item.scopeDescription}
                                </h3>
                              </div>
                              {approved ? (
                                <span className="rounded-md bg-emerald-900/50 px-2 py-1 text-xs font-medium text-emerald-300">
                                  Approved
                                </span>
                              ) : null}
                            </div>

                            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <dt className="text-slate-500">Matched to</dt>
                                <dd className="mt-1 font-medium text-slate-100">
                                  {item.catalogName || "No catalog match found"}
                                </dd>
                                <dd
                                  className={`mt-1 text-xs ${confidenceClass(item.matchConfidence)}`}
                                >
                                  Confidence:{" "}
                                  {confidenceLabel(item.matchConfidence)}
                                </dd>
                                <dd className="mt-1 text-xs text-slate-500">
                                  {item.matchReason}
                                </dd>
                              </div>

                              <div>
                                <dt className="text-slate-500">
                                  Quantity source
                                </dt>
                                <dd className="mt-1">
                                  <label className="sr-only" htmlFor={`src-${item.id}`}>
                                    Quantity source
                                  </label>
                                  <select
                                    id={`src-${item.id}`}
                                    value={item.quantitySource}
                                    disabled={isBuildingEstimateFromScope}
                                    onChange={(event) =>
                                      handleQuantitySourceChange(
                                        item.id,
                                        event.target.value as EstimateQuantitySource
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                  >
                                    {ESTIMATE_QUANTITY_SOURCES.map((source) => (
                                      <option key={source} value={source}>
                                        {source === "manual"
                                          ? "Manual"
                                          : formatQuantitySourceOptionLabel(
                                              source,
                                              measurement
                                            )}
                                      </option>
                                    ))}
                                  </select>
                                </dd>
                                <dd className="mt-1 text-xs text-slate-500">
                                  {item.quantitySuggestionReason}
                                </dd>
                              </div>

                              <div>
                                <label
                                  htmlFor={`qty-${item.id}`}
                                  className="text-slate-500"
                                >
                                  Quantity
                                </label>
                                <input
                                  id={`qty-${item.id}`}
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.quantity}
                                  disabled={isBuildingEstimateFromScope}
                                  onChange={(event) =>
                                    handleQuantityEdit(item.id, event.target.value)
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`unit-${item.id}`}
                                  className="text-slate-500"
                                >
                                  Unit
                                </label>
                                <input
                                  id={`unit-${item.id}`}
                                  type="text"
                                  value={item.unit}
                                  disabled={isBuildingEstimateFromScope}
                                  onChange={(event) =>
                                    handleUnitEdit(item.id, event.target.value)
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`price-${item.id}`}
                                  className="text-slate-500"
                                >
                                  Unit Price
                                </label>
                                <input
                                  id={`price-${item.id}`}
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.unitPrice}
                                  disabled={isBuildingEstimateFromScope}
                                  onChange={(event) =>
                                    handleUnitPriceEdit(
                                      item.id,
                                      event.target.value
                                    )
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <dt className="text-slate-500">Total</dt>
                                <dd className="mt-1 text-base font-semibold text-slate-100">
                                  {total != null ? formatCurrency(total) : "—"}
                                </dd>
                              </div>
                            </dl>

                            {phase === "review" ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => approveSuggestion(item.id)}
                                  disabled={
                                    isBuildingEstimateFromScope ||
                                    !isSuggestionApprovable({
                                      ...item,
                                      status: "pending",
                                    })
                                  }
                                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium hover:bg-emerald-600 disabled:opacity-60"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCatalogPickerSuggestionId(item.id)
                                  }
                                  disabled={isBuildingEstimateFromScope}
                                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
                                >
                                  Change Match
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectSuggestion(item.id)}
                                  disabled={isBuildingEstimateFromScope}
                                  className="rounded-lg border border-red-900/70 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-60"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            ) : null}
                          </article>
                        );
                      }
                    )}

                    {rejectedSuggestions.length > 0 ? (
                      <section className="grid gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          Rejected
                        </h3>
                        {rejectedSuggestions.map((item) => (
                          <article
                            key={item.id}
                            className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-3 opacity-70"
                          >
                            <p className="font-medium text-slate-300">
                              {item.roomName}: {item.scopeDescription}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                updateSuggestion(item.id, (current) => ({
                                  ...current,
                                  status: "pending",
                                }))
                              }
                              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                              Restore
                            </button>
                          </article>
                        ))}
                      </section>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {phase === "done" ? (
              <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-4">
                <p className="font-medium text-emerald-300">
                  Added {addedCount} item{addedCount === 1 ? "" : "s"} to
                  estimate.
                </p>
                <Link
                  href="/estimate"
                  className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                  onClick={() => onOpenChange(false)}
                >
                  View Estimate
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBuildingEstimateFromScope}
            >
              {phase === "done" ? "Close" : "Cancel"}
            </Button>

            {phase === "rooms" ? (
              <Button
                onClick={handleReviewSuggestions}
                disabled={selectedRoomIds.length === 0}
              >
                Review Suggestions
              </Button>
            ) : null}

            {phase === "review" ? (
              <Button
                onClick={() => void handleAddApproved()}
                disabled={
                  isBuildingEstimateFromScope || approvedSuggestions.length === 0
                }
              >
                {isBuildingEstimateFromScope
                  ? "Adding to estimate..."
                  : `Add Approved Items to Estimate (${approvedSuggestions.length})`}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <CatalogItemPicker
        open={Boolean(catalogPickerSuggestion)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCatalogPickerSuggestionId(null);
          }
        }}
        onSelect={(item) => {
          if (catalogPickerSuggestionId) {
            applyCatalogToSuggestion(catalogPickerSuggestionId, item);
          }
          setCatalogPickerSuggestionId(null);
        }}
      />
    </>
  );
}
