"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CatalogItemPicker } from "@/components/estimate/CatalogItemPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MEASUREMENT_QUANTITY_SOURCES,
  formatQuantitySourceLabel,
  type EstimateQuantitySource,
} from "@/lib/domain/EstimateQuantitySource";
import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { ScopeItem } from "@/lib/domain/ScopeItem";
import { useTwinStore } from "@/lib/store/useTwinStore";
import {
  formatQuantitySourceOptionLabel,
  getRoomQuantitySourceValue,
} from "@/lib/utils/estimateQuantitySource";
import { formatCurrency } from "@/lib/utils/estimateTotals";
import { formatQuantityDisplay } from "@/lib/utils/roomMeasurements";

type RoomScopeProps = {
  roomId: string;
};

const EMPTY_SCOPE: ScopeItem[] = [];
const COMMON_UNITS = ["SF", "LF", "EA", "HR", "DAY", "LS"] as const;

export function RoomScope({ roomId }: RoomScopeProps) {
  const itemsForRoom = useTwinStore((state) => state.scopeItemsByRoomId[roomId]);
  const items = itemsForRoom ?? EMPTY_SCOPE;
  const scopeError = useTwinStore((state) => state.scopeError);
  const isSavingScope = useTwinStore((state) => state.isSavingScope);
  const isUpdatingScope = useTwinStore((state) => state.isUpdatingScope);
  const isDeletingScope = useTwinStore((state) => state.isDeletingScope);
  const isAddingScopeToEstimate = useTwinStore(
    (state) => state.isAddingScopeToEstimate
  );
  const measurement = useTwinStore(
    (state) => state.roomMeasurementsByRoomId?.[roomId]
  );
  const saveScopeItem = useTwinStore((state) => state.saveScopeItem);
  const toggleScopeItem = useTwinStore((state) => state.toggleScopeItem);
  const deleteScopeItem = useTwinStore((state) => state.deleteScopeItem);
  const addScopeItemToEstimate = useTwinStore(
    (state) => state.addScopeItemToEstimate
  );
  const loadRoomMeasurement = useTwinStore(
    (state) => state.loadRoomMeasurement
  );
  const clearScopeError = useTwinStore((state) => state.clearScopeError);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScopeItem | null>(null);

  const [scopeForEstimate, setScopeForEstimate] = useState<ScopeItem | null>(
    null
  );
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<PriceCatalogItem | null>(null);
  const [isQuantityOpen, setIsQuantityOpen] = useState(false);
  /** null until the user explicitly chooses a source */
  const [quantitySource, setQuantitySource] =
    useState<EstimateQuantitySource | null>(null);
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualUnit, setManualUnit] = useState("SF");
  const [convertError, setConvertError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * When true, catalog Dialog onOpenChange(false) is from selecting an item
   * (transitioning to quantity step) — do NOT cancel the whole flow.
   */
  const transitioningToQuantityRef = useRef(false);

  const isBusy =
    isSavingScope ||
    isUpdatingScope ||
    isDeletingScope ||
    isAddingScopeToEstimate;
  const canSave = useMemo(() => description.trim().length > 0, [description]);
  const hasMeasurements = Boolean(measurement);

  useEffect(() => {
    if (scopeForEstimate || isCatalogOpen || isQuantityOpen) {
      void loadRoomMeasurement(roomId);
    }
  }, [
    isCatalogOpen,
    isQuantityOpen,
    loadRoomMeasurement,
    roomId,
    scopeForEstimate,
  ]);

  const confirmation = useMemo(() => {
    if (!selectedCatalogItem || !quantitySource) {
      return null;
    }

    if (quantitySource === "manual") {
      const qty = Number(manualQuantity);
      if (!Number.isFinite(qty) || qty <= 0 || !manualUnit.trim()) {
        return null;
      }
      return {
        sourceLabel: "Manual",
        quantity: qty,
        unit: manualUnit.trim(),
        unitPrice: selectedCatalogItem.unitPrice,
        total: qty * selectedCatalogItem.unitPrice,
      };
    }

    const resolved = getRoomQuantitySourceValue(measurement, quantitySource);
    if (!resolved) {
      return null;
    }

    return {
      sourceLabel: formatQuantitySourceLabel(quantitySource),
      quantity: resolved.quantity,
      unit: resolved.unit,
      unitPrice: selectedCatalogItem.unitPrice,
      total: resolved.quantity * selectedCatalogItem.unitPrice,
    };
  }, [
    manualQuantity,
    manualUnit,
    measurement,
    quantitySource,
    selectedCatalogItem,
  ]);

  function openForm() {
    clearScopeError();
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setDescription("");
    setFormError(null);
  }

  async function handleSave() {
    if (isSavingScope) {
      return;
    }

    const trimmed = description.trim();
    if (!trimmed) {
      setFormError("Scope description is required.");
      return;
    }

    setFormError(null);
    clearScopeError();

    try {
      await saveScopeItem(roomId, trimmed);
      closeForm();
    } catch {
      // scopeError is set in the store
    }
  }

  async function handleToggle(item: ScopeItem) {
    if (isBusy) {
      return;
    }

    clearScopeError();

    try {
      await toggleScopeItem(roomId, item.id);
    } catch {
      // scopeError is set in the store
    }
  }

  async function handleDelete() {
    if (!deleteTarget || isDeletingScope) {
      return;
    }

    clearScopeError();

    try {
      await deleteScopeItem(roomId, deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // scopeError is set in the store
    }
  }

  function resetConvertState() {
    setScopeForEstimate(null);
    setSelectedCatalogItem(null);
    setQuantitySource(null);
    setManualQuantity("1");
    setManualUnit("SF");
    setConvertError(null);
    setIsCatalogOpen(false);
    setIsQuantityOpen(false);
    transitioningToQuantityRef.current = false;
  }

  function startAddToEstimate(item: ScopeItem) {
    if (item.estimateLineItemId || isAddingScopeToEstimate) {
      return;
    }

    clearScopeError();
    setSuccessMessage(null);
    resetConvertState();
    setScopeForEstimate(item);
    setIsCatalogOpen(true);
  }

  function handleCatalogSelect(item: PriceCatalogItem) {
    // Prevent catalog close handler from cancelling the quantity step.
    transitioningToQuantityRef.current = true;
    setSelectedCatalogItem(item);
    setQuantitySource(null);
    setManualQuantity("1");
    setManualUnit(item.unit);
    setConvertError(null);
    setIsCatalogOpen(false);
    setIsQuantityOpen(true);
  }

  function handleCatalogOpenChange(open: boolean) {
    if (open) {
      setIsCatalogOpen(true);
      return;
    }

    setIsCatalogOpen(false);

    if (transitioningToQuantityRef.current) {
      transitioningToQuantityRef.current = false;
      return;
    }

    // User cancelled the catalog step — abort the whole flow.
    if (!isQuantityOpen) {
      resetConvertState();
    }
  }

  function closeQuantityStep() {
    if (isAddingScopeToEstimate) {
      return;
    }
    resetConvertState();
  }

  async function handleConfirmConvert() {
    if (
      !scopeForEstimate ||
      !selectedCatalogItem ||
      !quantitySource ||
      isAddingScopeToEstimate
    ) {
      return;
    }

    if (
      quantitySource !== "manual" &&
      !getRoomQuantitySourceValue(measurement, quantitySource)
    ) {
      setConvertError("Add room measurements to use calculated quantities.");
      return;
    }

    const parsedManual = Number(manualQuantity);
    if (quantitySource === "manual") {
      if (!Number.isFinite(parsedManual) || parsedManual <= 0) {
        setConvertError("Quantity must be a number greater than 0.");
        return;
      }
      if (!manualUnit.trim()) {
        setConvertError("Unit is required.");
        return;
      }
    }

    setConvertError(null);
    clearScopeError();

    try {
      await addScopeItemToEstimate({
        scopeItemId: scopeForEstimate.id,
        roomId,
        catalogItem: {
          name: selectedCatalogItem.name,
          // Manual allows overriding unit; measurement sources keep catalog
          // unit for price snapshot and resolve qty/unit in the store.
          unit:
            quantitySource === "manual"
              ? manualUnit.trim()
              : selectedCatalogItem.unit,
          unitPrice: selectedCatalogItem.unitPrice,
        },
        quantitySource,
        manualQuantity:
          quantitySource === "manual" ? parsedManual : undefined,
      });
      setSuccessMessage("Added to Estimate");
      resetConvertState();
    } catch {
      setConvertError(
        useTwinStore.getState().scopeError ??
          "Could not add this scope item to the estimate."
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Scope</h2>
        <button
          type="button"
          onClick={openForm}
          disabled={isBusy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          + Add Scope Item
        </button>
      </div>

      {successMessage ? (
        <p className="mt-4 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          {successMessage}{" "}
          <Link href="/estimate" className="text-blue-400 hover:text-blue-300">
            View Estimate
          </Link>
        </p>
      ) : null}

      {isFormOpen ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
          <div>
            <label
              htmlFor="scope-description"
              className="mb-1 block text-sm text-slate-300"
            >
              Scope description
            </label>
            <input
              id="scope-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Remove wet drywall"
              disabled={isSavingScope}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSave();
                }
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          {(formError || scopeError) && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {formError ?? scopeError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSavingScope}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || isSavingScope}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {isSavingScope ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {!isFormOpen && scopeError && !deleteTarget && !isQuantityOpen ? (
        <p className="mt-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {scopeError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-4 text-slate-400">No scope items yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={
                item.completed
                  ? "flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-3 opacity-70 sm:flex-row sm:items-start"
                  : "flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3 sm:flex-row sm:items-start"
              }
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => void handleToggle(item)}
                  disabled={isBusy}
                  className="mt-1 size-4 accent-blue-500"
                  aria-label={`Mark ${item.description} ${item.completed ? "incomplete" : "complete"}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      item.completed
                        ? "text-sm text-slate-400 line-through"
                        : "text-sm text-slate-200"
                    }
                  >
                    {item.description}
                  </p>
                  {item.estimateLineItemId ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-xs font-medium text-emerald-400">
                        ✓ Added to Estimate
                      </span>
                      <Link
                        href="/estimate"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        View Estimate
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startAddToEstimate(item)}
                      disabled={isBusy}
                      className="mt-2 rounded-lg border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                    >
                      {isAddingScopeToEstimate &&
                      scopeForEstimate?.id === item.id
                        ? "Adding..."
                        : "Add to Estimate"}
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearScopeError();
                  setDeleteTarget(item);
                }}
                disabled={isBusy}
                className="shrink-0 self-start text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <CatalogItemPicker
        open={isCatalogOpen}
        onOpenChange={handleCatalogOpenChange}
        onSelect={handleCatalogSelect}
      />

      <Dialog
        open={isQuantityOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeQuantityStep();
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose Quantity Source</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select how quantity is determined, review the preview, then
              confirm. Nothing is added to the estimate until you confirm.
            </DialogDescription>
          </DialogHeader>

          {selectedCatalogItem ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Catalog Item
              </p>
              <p className="mt-1 font-medium text-slate-100">
                {selectedCatalogItem.name}
              </p>
              <p className="mt-1 text-slate-400">
                Unit Price: {formatCurrency(selectedCatalogItem.unitPrice)} /{" "}
                {selectedCatalogItem.unit}
              </p>
              {scopeForEstimate ? (
                <p className="mt-2 text-xs text-slate-500">
                  From scope: {scopeForEstimate.description}
                </p>
              ) : null}
            </div>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm text-slate-300">
              Quantity Source
            </legend>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3">
              <input
                type="radio"
                name="scope-quantity-source"
                checked={quantitySource === "manual"}
                onChange={() => setQuantitySource("manual")}
                disabled={isAddingScopeToEstimate}
                className="mt-1 accent-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-slate-100">
                  Manual
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Enter quantity yourself
                </span>
              </span>
            </label>

            {MEASUREMENT_QUANTITY_SOURCES.map((source) => {
              const resolved = getRoomQuantitySourceValue(measurement, source);
              const disabled = !hasMeasurements || isAddingScopeToEstimate;

              return (
                <label
                  key={source}
                  className={
                    disabled
                      ? "flex cursor-not-allowed items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-3 opacity-60"
                      : "flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3"
                  }
                >
                  <input
                    type="radio"
                    name="scope-quantity-source"
                    checked={quantitySource === source}
                    onChange={() => setQuantitySource(source)}
                    disabled={disabled}
                    className="mt-1 accent-blue-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-100">
                      {hasMeasurements && resolved
                        ? formatQuantitySourceOptionLabel(source, measurement)
                        : `${formatQuantitySourceLabel(source)} — n/a`}
                    </span>
                    {hasMeasurements && resolved ? (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Uses room measurements
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {!hasMeasurements ? (
            <p className="text-xs text-amber-300/90">
              Add room measurements to use calculated quantities.
            </p>
          ) : measurement ? (
            <p className="text-xs text-slate-500">
              Room measurements:{" "}
              {formatQuantityDisplay(measurement.lengthFt)} ×{" "}
              {formatQuantityDisplay(measurement.widthFt)} ×{" "}
              {formatQuantityDisplay(measurement.ceilingHeightFt)} ft
            </p>
          ) : null}

          {quantitySource === "manual" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Quantity</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={manualQuantity}
                  onChange={(event) => setManualQuantity(event.target.value)}
                  disabled={isAddingScopeToEstimate}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Unit</span>
                <select
                  value={manualUnit}
                  onChange={(event) => setManualUnit(event.target.value)}
                  disabled={isAddingScopeToEstimate}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  {COMMON_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  {!COMMON_UNITS.includes(
                    manualUnit as (typeof COMMON_UNITS)[number]
                  ) && manualUnit ? (
                    <option value={manualUnit}>{manualUnit}</option>
                  ) : null}
                </select>
              </label>
            </div>
          ) : null}

          {confirmation && selectedCatalogItem ? (
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Confirmation
              </p>
              <dl className="mt-2 space-y-1 text-slate-300">
                <div className="flex justify-between gap-3">
                  <dt>Catalog Item</dt>
                  <dd className="text-right text-slate-100">
                    {selectedCatalogItem.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Quantity Source</dt>
                  <dd className="text-right text-slate-100">
                    {confirmation.sourceLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Quantity</dt>
                  <dd className="text-right text-slate-100">
                    {formatQuantityDisplay(confirmation.quantity)}{" "}
                    {confirmation.unit}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Unit Price</dt>
                  <dd className="text-right text-slate-100">
                    {formatCurrency(confirmation.unitPrice)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-800 pt-2 font-medium">
                  <dt>Total</dt>
                  <dd className="text-right text-yellow-400">
                    {formatCurrency(confirmation.total)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Choose a quantity source to see the confirmation preview.
            </p>
          )}

          {convertError ? (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {convertError}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose
              disabled={isAddingScopeToEstimate}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleConfirmConvert()}
              disabled={
                isAddingScopeToEstimate ||
                !selectedCatalogItem ||
                !quantitySource ||
                !confirmation
              }
            >
              {isAddingScopeToEstimate ? "Adding..." : "Add to Estimate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingScope) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={!isDeletingScope}
          className="bg-slate-900 text-white ring-slate-700 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Delete scope item?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This removes only this work item from the room. The room and job
              are not deleted.
            </DialogDescription>
          </DialogHeader>

          <p className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
            {deleteTarget?.description}
          </p>

          {scopeError ? (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {scopeError}
            </p>
          ) : null}

          <DialogFooter className="border-slate-800 bg-slate-950/60">
            <DialogClose
              disabled={isDeletingScope}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={!deleteTarget || isDeletingScope}
            >
              {isDeletingScope ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
