"use client";

import { useMemo, useState } from "react";

import type { MoistureReading } from "@/lib/domain/MoistureReading";
import { useTwinStore } from "@/lib/store/useTwinStore";

type MoistureReadingsProps = {
  roomId: string;
};

const EMPTY_READINGS: MoistureReading[] = [];

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function MoistureReadings({ roomId }: MoistureReadingsProps) {
  const readingsForRoom = useTwinStore(
    (state) => state.moistureByRoomId[roomId]
  );
  const readings = readingsForRoom ?? EMPTY_READINGS;
  const moistureError = useTwinStore((state) => state.moistureError);
  const isSavingMoisture = useTwinStore((state) => state.isSavingMoisture);
  const saveMoistureReading = useTwinStore((state) => state.saveMoistureReading);
  const clearMoistureError = useTwinStore((state) => state.clearMoistureError);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [material, setMaterial] = useState("");
  const [reading, setReading] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    const trimmedMaterial = material.trim();
    const trimmedLocation = location.trim();
    const parsedReading = Number(reading);

    return (
      trimmedMaterial.length > 0 &&
      trimmedLocation.length > 0 &&
      reading.trim().length > 0 &&
      Number.isFinite(parsedReading)
    );
  }, [location, material, reading]);

  function resetForm() {
    setMaterial("");
    setReading("");
    setLocation("");
    setFormError(null);
  }

  function handleOpenForm() {
    clearMoistureError();
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleCancel() {
    setIsFormOpen(false);
    resetForm();
  }

  async function handleSave() {
    if (isSavingMoisture) {
      return;
    }

    const trimmedMaterial = material.trim();
    const trimmedLocation = location.trim();
    const parsedReading = Number(reading);

    if (!trimmedMaterial || !trimmedLocation || reading.trim() === "") {
      setFormError("Material, reading, and location are required.");
      return;
    }

    if (!Number.isFinite(parsedReading)) {
      setFormError("Reading must be a valid number.");
      return;
    }

    setFormError(null);
    clearMoistureError();

    try {
      await saveMoistureReading({
        roomId,
        material: trimmedMaterial,
        reading: parsedReading,
        location: trimmedLocation,
      });
      setIsFormOpen(false);
      resetForm();
    } catch {
      // moistureError is set in the store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">💧 Moisture</h2>
        <button
          type="button"
          onClick={handleOpenForm}
          disabled={isSavingMoisture}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          + Add Reading
        </button>
      </div>

      {isFormOpen ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
          <div>
            <label
              htmlFor="moisture-material"
              className="mb-1 block text-sm text-slate-300"
            >
              Material
            </label>
            <input
              id="moisture-material"
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              placeholder="Drywall"
              disabled={isSavingMoisture}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="moisture-reading"
              className="mb-1 block text-sm text-slate-300"
            >
              Reading (%)
            </label>
            <input
              id="moisture-reading"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={reading}
              onChange={(event) => setReading(event.target.value)}
              placeholder="14"
              disabled={isSavingMoisture}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="moisture-location"
              className="mb-1 block text-sm text-slate-300"
            >
              Location
            </label>
            <input
              id="moisture-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Wall behind kitchen sink"
              disabled={isSavingMoisture}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {(formError || moistureError) && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {formError ?? moistureError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSavingMoisture}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || isSavingMoisture}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {isSavingMoisture ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {!isFormOpen && moistureError ? (
        <p className="mt-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {moistureError}
        </p>
      ) : null}

      {readings.length === 0 ? (
        <p className="mt-4 text-slate-400">No readings yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {readings.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3"
            >
              <p className="font-medium">{item.material}</p>
              <p className="mt-1 text-sm text-slate-300">
                Reading: {item.reading}%
              </p>
              <p className="mt-1 text-sm text-slate-400">{item.location}</p>
              <p className="mt-2 text-xs text-slate-500">
                {formatCreatedAt(item.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
