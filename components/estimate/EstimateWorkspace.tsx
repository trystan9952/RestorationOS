"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CatalogItemPicker } from "@/components/estimate/CatalogItemPicker";
import { EstimateDocumentPreview } from "@/components/estimate/EstimateDocumentPreview";
import { ScopeEstimateBuilder } from "@/components/estimate/ScopeEstimateBuilder";
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
  ESTIMATE_STATUSES,
  type Estimate,
  type EstimateStatus,
} from "@/lib/domain/Estimate";
import type { EstimateArea } from "@/lib/domain/EstimateArea";
import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
import {
  MEASUREMENT_QUANTITY_SOURCES,
  formatQuantitySourceLabel,
  type EstimateQuantitySource,
} from "@/lib/domain/EstimateQuantitySource";
import type { Loss } from "@/lib/domain/Loss";
import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { Room } from "@/lib/domain/Room";
import type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";
import { useTwinStore } from "@/lib/store/useTwinStore";
import {
  formatQuantitySourceOptionLabel,
  getRoomQuantitySourceValue,
} from "@/lib/utils/estimateQuantitySource";
import {
  buildEstimateDocumentData,
  formatEstimateDate,
  formatEstimateNumber,
} from "@/lib/utils/estimateDocument";
import {
  calculateAreaTotal,
  calculateEstimateTotal,
  calculateLineItemTotal,
  formatCurrency,
} from "@/lib/utils/estimateTotals";
import { formatQuantityDisplay } from "@/lib/utils/roomMeasurements";

const EMPTY_AREAS: EstimateArea[] = [];
const EMPTY_LINE_ITEMS: EstimateLineItem[] = [];

const COMMON_UNITS = ["SF", "LF", "EA", "HR", "SY", "LS"] as const;

type EstimateViewMode = "edit" | "preview";

type EstimateWorkspaceProps = {
  loss: Loss;
  estimate: Estimate;
  rooms: Room[];
  /** Controlled by /estimate page so mode toggle stays at the top of the route. */
  viewMode: EstimateViewMode;
};

type LineItemFormState = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  quantitySource: EstimateQuantitySource;
};

function emptyLineItemForm(): LineItemFormState {
  return {
    description: "",
    quantity: "1",
    unit: "SF",
    unitPrice: "0",
    quantitySource: "manual",
  };
}

function parseMoneyInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function applyQuantitySourceToForm(
  current: LineItemFormState,
  source: EstimateQuantitySource,
  measurement: RoomMeasurement | null | undefined
): LineItemFormState {
  if (source === "manual") {
    return {
      ...current,
      quantitySource: "manual",
    };
  }

  const resolved = getRoomQuantitySourceValue(measurement, source);
  if (!resolved) {
    return {
      ...current,
      quantitySource: "manual",
    };
  }

  return {
    ...current,
    quantitySource: source,
    quantity: String(resolved.quantity),
    unit: resolved.unit,
  };
}

export function EstimateWorkspace({
  loss,
  estimate,
  rooms,
  viewMode,
}: EstimateWorkspaceProps) {
  const estimateNotes = estimate.notes ?? null;
  const areasForEstimate = useTwinStore(
    (state) => state.estimateAreasByEstimateId[estimate.id]
  );
  const areas = areasForEstimate ?? EMPTY_AREAS;
  const lineItemsByAreaId = useTwinStore(
    (state) => state.estimateLineItemsByAreaId
  );
  const roomMeasurementsByRoomId = useTwinStore(
    (state) => state.roomMeasurementsByRoomId
  );
  const estimateError = useTwinStore((state) => state.estimateError);
  const isSavingEstimateArea = useTwinStore(
    (state) => state.isSavingEstimateArea
  );
  const isSavingEstimateLineItem = useTwinStore(
    (state) => state.isSavingEstimateLineItem
  );
  const isUpdatingEstimate = useTwinStore((state) => state.isUpdatingEstimate);
  const isDeletingEstimateArea = useTwinStore(
    (state) => state.isDeletingEstimateArea
  );
  const isDeletingEstimateLineItem = useTwinStore(
    (state) => state.isDeletingEstimateLineItem
  );

  const saveEstimateArea = useTwinStore((state) => state.saveEstimateArea);
  const updateEstimateArea = useTwinStore((state) => state.updateEstimateArea);
  const deleteEstimateArea = useTwinStore((state) => state.deleteEstimateArea);
  const saveEstimateLineItem = useTwinStore(
    (state) => state.saveEstimateLineItem
  );
  const updateEstimateLineItem = useTwinStore(
    (state) => state.updateEstimateLineItem
  );
  const deleteEstimateLineItem = useTwinStore(
    (state) => state.deleteEstimateLineItem
  );
  const updateEstimateStatus = useTwinStore(
    (state) => state.updateEstimateStatus
  );
  const updateEstimateNotes = useTwinStore(
    (state) => state.updateEstimateNotes
  );
  const clearEstimateError = useTwinStore((state) => state.clearEstimateError);
  const companyProfile = useTwinStore((state) => state.companyProfile);
  const loadCompanyProfile = useTwinStore((state) => state.loadCompanyProfile);

  const [notesDraft, setNotesDraft] = useState(estimateNotes ?? "");
  const [notesSaveMessage, setNotesSaveMessage] = useState<string | null>(null);

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isCustomAreaOpen, setIsCustomAreaOpen] = useState(false);
  const [customAreaName, setCustomAreaName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [areaFormError, setAreaFormError] = useState<string | null>(null);

  const [editingArea, setEditingArea] = useState<EstimateArea | null>(null);
  const [editAreaName, setEditAreaName] = useState("");
  const [deleteAreaTarget, setDeleteAreaTarget] = useState<EstimateArea | null>(
    null
  );

  const [lineItemAreaId, setLineItemAreaId] = useState<string | null>(null);
  const [lineItemForm, setLineItemForm] = useState<LineItemFormState>(
    emptyLineItemForm
  );
  const [editingLineItem, setEditingLineItem] =
    useState<EstimateLineItem | null>(null);
  const [lineItemFormError, setLineItemFormError] = useState<string | null>(
    null
  );
  const [deleteLineItemTarget, setDeleteLineItemTarget] =
    useState<EstimateLineItem | null>(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [isScopeBuilderOpen, setIsScopeBuilderOpen] = useState(false);

  useEffect(() => {
    setNotesDraft(estimateNotes ?? "");
  }, [estimate.id, estimateNotes]);

  useEffect(() => {
    if (!companyProfile) {
      void loadCompanyProfile().catch(() => {
        // companyProfileError is stored; preview falls back to RestorationOS
      });
    }
  }, [companyProfile, loadCompanyProfile]);

  const documentData = useMemo(
    () =>
      buildEstimateDocumentData({
        company: companyProfile,
        estimate: { ...estimate, notes: estimateNotes },
        loss,
        areas,
        lineItemsByAreaId,
        rooms,
      }),
    [
      areas,
      companyProfile,
      estimate,
      estimateNotes,
      lineItemsByAreaId,
      loss,
      rooms,
    ]
  );

  const availableRooms = useMemo(() => {
    const linkedRoomIds = new Set(
      areas.map((area) => area.roomId).filter((id): id is string => Boolean(id))
    );
    return rooms.filter((room) => !linkedRoomIds.has(room.id));
  }, [areas, rooms]);

  const estimateTotal = useMemo(() => {
    return calculateEstimateTotal(
      areas.map((area) => lineItemsByAreaId[area.id] ?? EMPTY_LINE_ITEMS)
    );
  }, [areas, lineItemsByAreaId]);

  const isBusy =
    isSavingEstimateArea ||
    isSavingEstimateLineItem ||
    isUpdatingEstimate ||
    isDeletingEstimateArea ||
    isDeletingEstimateLineItem;

  const activeLineItemArea = useMemo(
    () => areas.find((area) => area.id === lineItemAreaId) ?? null,
    [areas, lineItemAreaId]
  );

  const activeAreaMeasurement = useMemo(() => {
    if (!activeLineItemArea?.roomId) {
      return null;
    }
    return roomMeasurementsByRoomId?.[activeLineItemArea.roomId] ?? null;
  }, [activeLineItemArea, roomMeasurementsByRoomId]);

  const activeAreaHasMeasurements = Boolean(activeAreaMeasurement);
  const activeAreaIsRoomLinked = Boolean(activeLineItemArea?.roomId);
  const isMeasurementSource = lineItemForm.quantitySource !== "manual";

  const previewLineTotal = useMemo(() => {
    const quantity = parseMoneyInput(lineItemForm.quantity);
    const unitPrice = parseMoneyInput(lineItemForm.unitPrice);
    if (quantity === null || unitPrice === null) {
      return null;
    }
    return calculateLineItemTotal({ quantity, unitPrice });
  }, [lineItemForm.quantity, lineItemForm.unitPrice]);

  function getAreaMeasurement(
    area: EstimateArea
  ): RoomMeasurement | null | undefined {
    if (!area.roomId) {
      return null;
    }
    return roomMeasurementsByRoomId?.[area.roomId];
  }

  async function handleStatusChange(nextStatus: EstimateStatus) {
    if (isUpdatingEstimate || nextStatus === estimate.status) {
      return;
    }

    clearEstimateError();
    try {
      await updateEstimateStatus(estimate.id, nextStatus);
    } catch {
      // estimateError is set in the store
    }
  }

  async function handleSaveNotes() {
    if (isUpdatingEstimate) {
      return;
    }

    clearEstimateError();
    setNotesSaveMessage(null);

    try {
      await updateEstimateNotes(estimate.id, notesDraft);
      setNotesSaveMessage("Notes saved.");
    } catch {
      // estimateError is set in the store
    }
  }

  function openAddRoom() {
    clearEstimateError();
    setAreaFormError(null);
    setSelectedRoomId(availableRooms[0]?.id ?? "");
    setIsAddRoomOpen(true);
  }

  function openCustomArea() {
    clearEstimateError();
    setAreaFormError(null);
    setCustomAreaName("");
    setIsCustomAreaOpen(true);
  }

  async function handleAddRoomArea() {
    if (isSavingEstimateArea) {
      return;
    }

    const room = availableRooms.find((item) => item.id === selectedRoomId);
    if (!room) {
      setAreaFormError("Select a room to add.");
      return;
    }

    setAreaFormError(null);
    clearEstimateError();

    try {
      await saveEstimateArea({
        estimateId: estimate.id,
        name: room.name,
        roomId: room.id,
      });
      setIsAddRoomOpen(false);
    } catch {
      // estimateError is set in the store
    }
  }

  async function handleAddCustomArea() {
    if (isSavingEstimateArea) {
      return;
    }

    const name = customAreaName.trim();
    if (!name) {
      setAreaFormError("Area name is required.");
      return;
    }

    setAreaFormError(null);
    clearEstimateError();

    try {
      await saveEstimateArea({
        estimateId: estimate.id,
        name,
        roomId: null,
      });
      setIsCustomAreaOpen(false);
      setCustomAreaName("");
    } catch {
      // estimateError is set in the store
    }
  }

  async function handleSaveAreaName() {
    if (!editingArea || isSavingEstimateArea) {
      return;
    }

    const name = editAreaName.trim();
    if (!name) {
      setAreaFormError("Area name is required.");
      return;
    }

    setAreaFormError(null);
    clearEstimateError();

    try {
      await updateEstimateArea(estimate.id, editingArea.id, name);
      setEditingArea(null);
    } catch {
      // estimateError is set in the store
    }
  }

  async function handleDeleteArea() {
    if (!deleteAreaTarget || isDeletingEstimateArea) {
      return;
    }

    clearEstimateError();

    try {
      await deleteEstimateArea(estimate.id, deleteAreaTarget.id);
      setDeleteAreaTarget(null);
    } catch {
      // estimateError is set in the store
    }
  }

  function openAddLineItem(areaId: string) {
    clearEstimateError();
    setLineItemFormError(null);
    setEditingLineItem(null);
    setLineItemForm(emptyLineItemForm());
    setLineItemAreaId(areaId);
  }

  function openEditLineItem(item: EstimateLineItem) {
    clearEstimateError();
    setLineItemFormError(null);
    setEditingLineItem(item);

    const area = areas.find((entry) => entry.id === item.estimateAreaId);
    const measurement = area ? getAreaMeasurement(area) : null;
    let nextForm: LineItemFormState = {
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      quantitySource: item.quantitySource ?? "manual",
    };

    // Recalculate from current measurements when source is measurement-based
    if (item.quantitySource !== "manual") {
      nextForm = applyQuantitySourceToForm(
        nextForm,
        item.quantitySource,
        measurement
      );
    }

    setLineItemForm(nextForm);
    setLineItemAreaId(item.estimateAreaId);
  }

  function closeLineItemDialog() {
    setLineItemAreaId(null);
    setEditingLineItem(null);
    setLineItemForm(emptyLineItemForm());
    setLineItemFormError(null);
  }

  function handleQuantitySourceChange(source: EstimateQuantitySource) {
    if (
      source !== "manual" &&
      (!activeAreaIsRoomLinked || !activeAreaHasMeasurements)
    ) {
      setLineItemFormError(
        "Add room measurements to use calculated quantities."
      );
      return;
    }

    setLineItemFormError(null);
    setLineItemForm((current) =>
      applyQuantitySourceToForm(current, source, activeAreaMeasurement)
    );
  }

  function handleQuantityChange(value: string) {
    setLineItemForm((current) => {
      if (current.quantitySource !== "manual") {
        return {
          ...current,
          quantity: value,
          quantitySource: "manual",
        };
      }
      return {
        ...current,
        quantity: value,
      };
    });
  }

  function handleUnitChange(value: string) {
    setLineItemForm((current) => {
      if (current.quantitySource !== "manual") {
        return {
          ...current,
          unit: value,
          quantitySource: "manual",
        };
      }
      return {
        ...current,
        unit: value,
      };
    });
  }

  /**
   * Snapshot catalog values into the form.
   * Does NOT change quantity_source (measurement/manual remains).
   */
  function handleSelectCatalogItem(item: PriceCatalogItem) {
    setLineItemForm((current) => ({
      ...current,
      description: item.name,
      unit: item.unit,
      unitPrice: String(item.unitPrice),
    }));
    setLineItemFormError(null);
  }

  async function handleSaveLineItem() {
    if (!lineItemAreaId || isSavingEstimateLineItem) {
      return;
    }

    const description = lineItemForm.description.trim();
    const quantitySource = lineItemForm.quantitySource;
    let unit = lineItemForm.unit.trim();
    let quantity = parseMoneyInput(lineItemForm.quantity);
    const unitPrice = parseMoneyInput(lineItemForm.unitPrice);

    if (quantitySource !== "manual") {
      const resolved = getRoomQuantitySourceValue(
        activeAreaMeasurement,
        quantitySource
      );
      if (!resolved) {
        setLineItemFormError(
          "Add room measurements to use calculated quantities."
        );
        return;
      }
      quantity = resolved.quantity;
      unit = resolved.unit;
    }

    if (!description) {
      setLineItemFormError("Description is required.");
      return;
    }
    if (quantity === null || quantity <= 0) {
      setLineItemFormError("Quantity must be a number greater than 0.");
      return;
    }
    if (!unit) {
      setLineItemFormError("Unit is required.");
      return;
    }
    if (unitPrice === null) {
      setLineItemFormError("Unit price must be a valid non-negative number.");
      return;
    }

    setLineItemFormError(null);
    clearEstimateError();

    try {
      if (editingLineItem) {
        await updateEstimateLineItem(lineItemAreaId, editingLineItem.id, {
          description,
          quantity,
          unit,
          unitPrice,
          quantitySource,
        });
      } else {
        await saveEstimateLineItem({
          areaId: lineItemAreaId,
          description,
          quantity,
          unit,
          unitPrice,
          quantitySource,
        });
      }
      closeLineItemDialog();
    } catch {
      // estimateError is set in the store
    }
  }

  async function handleDeleteLineItem() {
    if (!deleteLineItemTarget || isDeletingEstimateLineItem) {
      return;
    }

    clearEstimateError();

    try {
      await deleteEstimateLineItem(
        deleteLineItemTarget.estimateAreaId,
        deleteLineItemTarget.id
      );
      setDeleteLineItemTarget(null);
    } catch {
      // estimateError is set in the store
    }
  }

  return (
    <div className="grid gap-6">
      {estimateError ? (
        <p className="print:hidden rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {estimateError}
        </p>
      ) : null}

      {viewMode === "preview" ? (
        <EstimateDocumentPreview document={documentData} />
      ) : (
        <>
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              RestorationOS
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Estimate</h2>
            <p className="mt-2 text-xl text-slate-200">
              {loss.address?.trim() || "No address yet"}
            </p>
            <p className="mt-1 text-lg text-slate-300">
              {loss.customer?.trim() || "No customer yet"}
            </p>
            <dl className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
              <div>
                <dt className="inline text-slate-500">Estimate #: </dt>
                <dd className="inline text-slate-200">
                  {formatEstimateNumber(estimate.id)}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Estimate Date: </dt>
                <dd className="inline text-slate-200">
                  {formatEstimateDate(estimate.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Claim Number: </dt>
                <dd className="inline text-slate-200">
                  {loss.claimNumber?.trim() || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="w-full shrink-0 rounded-lg border border-slate-700 bg-slate-950/50 p-4 lg:w-64">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Estimate Status
            </p>
            <p className="mt-2 text-2xl font-semibold text-yellow-400">
              {estimate.status}
            </p>
            <label
              htmlFor="estimate-status"
              className="mt-4 mb-1 block text-sm text-slate-300"
            >
              Update status
            </label>
            <select
              id="estimate-status"
              value={estimate.status}
              disabled={isUpdatingEstimate}
              onChange={(event) =>
                void handleStatusChange(event.target.value as EstimateStatus)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
            >
              {ESTIMATE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {isUpdatingEstimate ? (
              <p className="mt-2 text-xs text-slate-500">Saving...</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-blue-900/50 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Estimate Notes</h2>
        <p className="mt-2 text-sm text-slate-400">
          Notes appear on the estimate preview when saved. These are not room
          notes.
        </p>
        <label
          htmlFor="estimate-notes"
          className="mt-4 mb-1 block text-sm text-slate-300"
        >
          Notes
        </label>
        <textarea
          id="estimate-notes"
          value={notesDraft}
          onChange={(event) => {
            setNotesDraft(event.target.value);
            setNotesSaveMessage(null);
          }}
          rows={5}
          placeholder="Add estimate-level notes for the customer or adjuster..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSaveNotes()}
            disabled={isUpdatingEstimate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
          >
            {isUpdatingEstimate ? "Saving..." : "Save Notes"}
          </button>
          {notesSaveMessage ? (
            <p className="text-sm text-emerald-400">{notesSaveMessage}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Estimate Areas</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsScopeBuilderOpen(true)}
              disabled={isBusy || rooms.length === 0}
              className="rounded-lg border border-emerald-800 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-60"
            >
              Add Items From Scope
            </button>
            <button
              type="button"
              onClick={openAddRoom}
              disabled={isBusy || availableRooms.length === 0}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              + Add Room to Estimate
            </button>
            <button
              type="button"
              onClick={openCustomArea}
              disabled={isBusy}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              + Custom Area
            </button>
          </div>
        </div>

        {areas.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-700 px-4 py-10 text-center">
            <p className="text-slate-400">No estimate areas yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add a room or create a custom area to start building the estimate.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {areas.map((area) => {
              const lineItems =
                lineItemsByAreaId[area.id] ?? EMPTY_LINE_ITEMS;
              const areaTotal = calculateAreaTotal(lineItems);
              const measurement = getAreaMeasurement(area);
              const room = area.roomId
                ? rooms.find((entry) => entry.id === area.roomId)
                : null;

              return (
                <article
                  key={area.id}
                  className="rounded-lg border border-slate-700 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{area.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Subtotal:{" "}
                        <span className="font-medium text-slate-200">
                          {formatCurrency(areaTotal)}
                        </span>
                      </p>
                      {area.roomId ? (
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>
                            Room:{" "}
                            <span className="text-slate-300">
                              {room?.name ?? area.name}
                            </span>
                          </p>
                          {measurement ? (
                            <p>
                              Measurements:{" "}
                              <span className="text-slate-300">
                                {formatQuantityDisplay(measurement.lengthFt)} ×{" "}
                                {formatQuantityDisplay(measurement.widthFt)} ×{" "}
                                {formatQuantityDisplay(
                                  measurement.ceilingHeightFt
                                )}{" "}
                                ft
                              </span>
                            </p>
                          ) : (
                            <p>
                              Measurements not available.{" "}
                              <Link
                                href={`/room/${area.roomId}`}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Add room measurements
                              </Link>{" "}
                              to use calculated quantities.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          Custom area — Manual quantity only
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openAddLineItem(area.id)}
                        disabled={isBusy}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
                      >
                        + Add Line Item
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAreaFormError(null);
                          setEditingArea(area);
                          setEditAreaName(area.name);
                        }}
                        disabled={isBusy}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteAreaTarget(area)}
                        disabled={isBusy}
                        className="rounded-lg border border-red-900/70 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {lineItems.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      No line items yet.
                    </p>
                  ) : (
                    <>
                      <div className="mt-4 hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="border-b border-slate-700 text-slate-400">
                            <tr>
                              <th className="py-2 pr-3 font-medium">
                                Description
                              </th>
                              <th className="py-2 pr-3 font-medium">Qty</th>
                              <th className="py-2 pr-3 font-medium">Unit</th>
                              <th className="py-2 pr-3 font-medium">Source</th>
                              <th className="py-2 pr-3 font-medium">
                                Unit Price
                              </th>
                              <th className="py-2 pr-3 font-medium">Total</th>
                              <th className="py-2 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lineItems.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-slate-800/80"
                              >
                                <td className="py-3 pr-3 text-slate-100">
                                  {item.description}
                                </td>
                                <td className="py-3 pr-3 tabular-nums">
                                  {item.quantity}
                                </td>
                                <td className="py-3 pr-3">{item.unit}</td>
                                <td className="py-3 pr-3 text-slate-400">
                                  {formatQuantitySourceLabel(
                                    item.quantitySource ?? "manual"
                                  )}
                                </td>
                                <td className="py-3 pr-3 tabular-nums">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="py-3 pr-3 tabular-nums font-medium">
                                  {formatCurrency(calculateLineItemTotal(item))}
                                </td>
                                <td className="py-3">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEditLineItem(item)}
                                      disabled={isBusy}
                                      className="text-blue-400 hover:text-blue-300 disabled:opacity-60"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteLineItemTarget(item)
                                      }
                                      disabled={isBusy}
                                      className="text-red-400 hover:text-red-300 disabled:opacity-60"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 grid gap-3 md:hidden">
                        {lineItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"
                          >
                            <p className="font-medium text-slate-100">
                              {item.description}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                              {item.quantity} {item.unit} ×{" "}
                              {formatCurrency(item.unitPrice)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Source:{" "}
                              {formatQuantitySourceLabel(
                                item.quantitySource ?? "manual"
                              )}
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-100">
                              {formatCurrency(calculateLineItemTotal(item))}
                            </p>
                            <div className="mt-3 flex gap-3">
                              <button
                                type="button"
                                onClick={() => openEditLineItem(item)}
                                disabled={isBusy}
                                className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-60"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteLineItemTarget(item)}
                                disabled={isBusy}
                                className="text-sm text-red-400 hover:text-red-300 disabled:opacity-60"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
                    <p className="text-sm text-slate-300">
                      Area subtotal:{" "}
                      <span className="font-semibold text-white">
                        {formatCurrency(areaTotal)}
                      </span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <p className="text-lg font-semibold">
            Estimate Subtotal:{" "}
            <span className="text-yellow-400">
              {formatCurrency(estimateTotal)}
            </span>
          </p>
        </div>
      </section>

      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Add Room to Estimate</DialogTitle>
            <DialogDescription className="text-slate-400">
              Creates an estimate area linked to the selected room. The room
              itself is not duplicated.
            </DialogDescription>
          </DialogHeader>
          {availableRooms.length === 0 ? (
            <p className="text-sm text-slate-400">
              All rooms are already on this estimate, or no rooms exist yet.
            </p>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Room</span>
              <select
                value={selectedRoomId}
                onChange={(event) => setSelectedRoomId(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
              >
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {areaFormError ? (
            <p className="text-sm text-red-300">{areaFormError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose
              disabled={isSavingEstimateArea}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleAddRoomArea()}
              disabled={isSavingEstimateArea || availableRooms.length === 0}
            >
              {isSavingEstimateArea ? "Saving..." : "Add Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomAreaOpen} onOpenChange={setIsCustomAreaOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Custom Area</DialogTitle>
            <DialogDescription className="text-slate-400">
              For hallways, exteriors, or other areas that are not rooms.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Name</span>
            <input
              value={customAreaName}
              onChange={(event) => setCustomAreaName(event.target.value)}
              placeholder="Hallway"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          {areaFormError ? (
            <p className="text-sm text-red-300">{areaFormError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose
              disabled={isSavingEstimateArea}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleAddCustomArea()}
              disabled={isSavingEstimateArea}
            >
              {isSavingEstimateArea ? "Saving..." : "Add Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingArea !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingArea(null);
            setAreaFormError(null);
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the estimate area name.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Name</span>
            <input
              value={editAreaName}
              onChange={(event) => setEditAreaName(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          {areaFormError ? (
            <p className="text-sm text-red-300">{areaFormError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose
              disabled={isSavingEstimateArea}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleSaveAreaName()}
              disabled={isSavingEstimateArea}
            >
              {isSavingEstimateArea ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteAreaTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAreaTarget(null);
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Delete estimate area?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will permanently delete{" "}
              <span className="text-slate-200">
                {deleteAreaTarget?.name ?? "this area"}
              </span>{" "}
              and all of its line items. The underlying room will not be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              disabled={isDeletingEstimateArea}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteArea()}
              disabled={isDeletingEstimateArea}
            >
              {isDeletingEstimateArea ? "Deleting..." : "Delete Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={lineItemAreaId !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeLineItemDialog();
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLineItem ? "Edit Line Item" : "Add Line Item"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Use the catalog for description/unit/price, and quantity source
              for quantity. Editing quantity or unit switches the source to
              Manual.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-slate-300">Line item details</span>
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(true)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              >
                Add from Catalog
              </button>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Description</span>
              <input
                value={lineItemForm.description}
                onChange={(event) =>
                  setLineItemForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Remove wet drywall"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Quantity Source</span>
              <select
                value={lineItemForm.quantitySource}
                onChange={(event) =>
                  handleQuantitySourceChange(
                    event.target.value as EstimateQuantitySource
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="manual">Manual</option>
                {MEASUREMENT_QUANTITY_SOURCES.map((source) => (
                  <option
                    key={source}
                    value={source}
                    disabled={
                      !activeAreaIsRoomLinked || !activeAreaHasMeasurements
                    }
                  >
                    {activeAreaHasMeasurements
                      ? formatQuantitySourceOptionLabel(
                          source,
                          activeAreaMeasurement
                        )
                      : `${formatQuantitySourceLabel(source)} — n/a`}
                  </option>
                ))}
              </select>
              {!activeAreaIsRoomLinked ? (
                <p className="mt-1 text-xs text-slate-500">
                  Custom areas support Manual quantity only.
                </p>
              ) : null}
              {activeAreaIsRoomLinked && !activeAreaHasMeasurements ? (
                <p className="mt-1 text-xs text-amber-300/90">
                  Measurements not available.{" "}
                  {activeLineItemArea?.roomId ? (
                    <Link
                      href={`/room/${activeLineItemArea.roomId}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Add room measurements
                    </Link>
                  ) : null}{" "}
                  to use calculated quantities.
                </p>
              ) : null}
              {isMeasurementSource ? (
                <p className="mt-1 text-xs text-slate-500">
                  Changing quantity or unit will switch this to Manual.
                </p>
              ) : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Quantity</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lineItemForm.quantity}
                  onChange={(event) => handleQuantityChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Unit</span>
                <select
                  value={lineItemForm.unit}
                  onChange={(event) => handleUnitChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
                >
                  {COMMON_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  {!COMMON_UNITS.includes(
                    lineItemForm.unit as (typeof COMMON_UNITS)[number]
                  ) && lineItemForm.unit ? (
                    <option value={lineItemForm.unit}>
                      {lineItemForm.unit}
                    </option>
                  ) : null}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Unit Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lineItemForm.unitPrice}
                  onChange={(event) =>
                    setLineItemForm((current) => ({
                      ...current,
                      unitPrice: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            </div>
            <p className="text-sm text-slate-400">
              Line total:{" "}
              <span className="font-medium text-slate-100">
                {previewLineTotal === null
                  ? "—"
                  : formatCurrency(previewLineTotal)}
              </span>
            </p>
          </div>
          {lineItemFormError ? (
            <p className="text-sm text-red-300">{lineItemFormError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose
              disabled={isSavingEstimateLineItem}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleSaveLineItem()}
              disabled={isSavingEstimateLineItem}
            >
              {isSavingEstimateLineItem ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CatalogItemPicker
        open={isCatalogPickerOpen}
        onOpenChange={setIsCatalogPickerOpen}
        onSelect={handleSelectCatalogItem}
      />

      <Dialog
        open={deleteLineItemTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteLineItemTarget(null);
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Delete line item?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will remove{" "}
              <span className="text-slate-200">
                {deleteLineItemTarget?.description ?? "this line item"}
              </span>{" "}
              from the estimate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              disabled={isDeletingEstimateLineItem}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteLineItem()}
              disabled={isDeletingEstimateLineItem}
            >
              {isDeletingEstimateLineItem ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScopeEstimateBuilder
        open={isScopeBuilderOpen}
        onOpenChange={setIsScopeBuilderOpen}
        rooms={rooms}
        lossId={loss.id}
      />
        </>
      )}
    </div>
  );
}
