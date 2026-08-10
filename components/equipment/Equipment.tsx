"use client";

import { useMemo, useState } from "react";

import type { Equipment, EquipmentStatus } from "@/lib/domain/Equipment";
import { useTwinStore } from "@/lib/store/useTwinStore";

type RoomEquipmentProps = {
  roomId: string;
};

const EMPTY_EQUIPMENT: Equipment[] = [];

const EQUIPMENT_TYPES = [
  "Dehumidifier",
  "Air Mover",
  "Air Scrubber",
  "HEPA",
  "Other",
] as const;

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: "running", label: "Running" },
  { value: "removed", label: "Removed" },
];

function formatPlacedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function statusLabel(status: EquipmentStatus): string {
  return status === "removed" ? "Removed" : "Running";
}

export function RoomEquipment({ roomId }: RoomEquipmentProps) {
  const equipmentForRoom = useTwinStore(
    (state) => state.equipmentByRoomId[roomId]
  );
  const equipment = equipmentForRoom ?? EMPTY_EQUIPMENT;
  const equipmentError = useTwinStore((state) => state.equipmentError);
  const isSavingEquipment = useTwinStore((state) => state.isSavingEquipment);
  const isUpdatingEquipmentStatus = useTwinStore(
    (state) => state.isUpdatingEquipmentStatus
  );
  const saveEquipment = useTwinStore((state) => state.saveEquipment);
  const updateEquipmentStatus = useTwinStore(
    (state) => state.updateEquipmentStatus
  );
  const clearEquipmentError = useTwinStore((state) => state.clearEquipmentError);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState<string>(EQUIPMENT_TYPES[0]);
  const [assetNumber, setAssetNumber] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("running");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isBusy = isSavingEquipment || isUpdatingEquipmentStatus;

  const canSave = useMemo(() => {
    return equipmentType.trim().length > 0 && location.trim().length > 0;
  }, [equipmentType, location]);

  function resetForm() {
    setEquipmentType(EQUIPMENT_TYPES[0]);
    setAssetNumber("");
    setStatus("running");
    setLocation("");
    setFormError(null);
  }

  function handleOpenForm() {
    clearEquipmentError();
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleCancel() {
    setIsFormOpen(false);
    resetForm();
  }

  async function handleSave() {
    if (isSavingEquipment) {
      return;
    }

    const trimmedType = equipmentType.trim();
    const trimmedLocation = location.trim();
    const trimmedAsset = assetNumber.trim();

    if (!trimmedType || !trimmedLocation) {
      setFormError("Equipment type and location are required.");
      return;
    }

    setFormError(null);
    clearEquipmentError();

    try {
      await saveEquipment(roomId, {
        equipmentType: trimmedType,
        assetNumber: trimmedAsset.length > 0 ? trimmedAsset : null,
        status,
        location: trimmedLocation,
      });
      setIsFormOpen(false);
      resetForm();
    } catch {
      // equipmentError is set in the store
    }
  }

  async function handleMarkRemoved(equipmentId: string) {
    if (isBusy) {
      return;
    }

    clearEquipmentError();

    try {
      await updateEquipmentStatus(roomId, equipmentId, "removed");
    } catch {
      // equipmentError is set in the store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">📦 Equipment</h2>
        <button
          type="button"
          onClick={handleOpenForm}
          disabled={isBusy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          + Add Equipment
        </button>
      </div>

      {isFormOpen ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
          <div>
            <label
              htmlFor="equipment-type"
              className="mb-1 block text-sm text-slate-300"
            >
              Equipment Type
            </label>
            <select
              id="equipment-type"
              value={equipmentType}
              onChange={(event) => setEquipmentType(event.target.value)}
              disabled={isSavingEquipment}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="equipment-asset"
              className="mb-1 block text-sm text-slate-300"
            >
              Asset Number
            </label>
            <input
              id="equipment-asset"
              value={assetNumber}
              onChange={(event) => setAssetNumber(event.target.value)}
              placeholder="D-001"
              disabled={isSavingEquipment}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="equipment-status"
              className="mb-1 block text-sm text-slate-300"
            >
              Status
            </label>
            <select
              id="equipment-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as EquipmentStatus)
              }
              disabled={isSavingEquipment}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="equipment-location"
              className="mb-1 block text-sm text-slate-300"
            >
              Location
            </label>
            <input
              id="equipment-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Kitchen / north wall"
              disabled={isSavingEquipment}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {(formError || equipmentError) && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {formError ?? equipmentError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSavingEquipment}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || isSavingEquipment}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {isSavingEquipment ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {!isFormOpen && equipmentError ? (
        <p className="mt-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {equipmentError}
        </p>
      ) : null}

      {equipment.length === 0 ? (
        <p className="mt-4 text-slate-400">No equipment added.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {equipment.map((item) => {
            const isRemoved = item.status === "removed";

            return (
              <li
                key={item.id}
                className={
                  isRemoved
                    ? "rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-3 opacity-70"
                    : "rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.equipmentType}</p>
                    {item.assetNumber ? (
                      <p className="mt-1 text-sm text-slate-300">
                        Asset: {item.assetNumber}
                      </p>
                    ) : null}
                    <p
                      className={
                        isRemoved
                          ? "mt-1 text-sm text-slate-500"
                          : "mt-1 text-sm text-emerald-400"
                      }
                    >
                      Status: {statusLabel(item.status)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{item.location}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Placed: {formatPlacedAt(item.placedAt)}
                    </p>
                  </div>

                  {!isRemoved ? (
                    <button
                      type="button"
                      onClick={() => void handleMarkRemoved(item.id)}
                      disabled={isBusy}
                      className="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1 text-xs hover:bg-slate-800 disabled:opacity-60"
                    >
                      {isUpdatingEquipmentStatus ? "Updating..." : "Mark Removed"}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
