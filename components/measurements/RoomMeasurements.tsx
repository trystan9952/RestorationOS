"use client";

import { useEffect, useMemo, useState } from "react";

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
import { useTwinStore } from "@/lib/store/useTwinStore";
import {
  calculateCeilingArea,
  calculateFloorArea,
  calculatePerimeter,
  calculateWallArea,
  formatQuantityDisplay,
} from "@/lib/utils/roomMeasurements";

type RoomMeasurementsProps = {
  roomId: string;
};

function parsePositiveDimension(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function toInputValue(value: number | undefined): string {
  if (value === undefined) {
    return "";
  }
  return String(value);
}

export function RoomMeasurements({ roomId }: RoomMeasurementsProps) {
  const measurement = useTwinStore(
    (state) => state.roomMeasurementsByRoomId?.[roomId]
  );
  const measurementError = useTwinStore((state) => state.measurementError);
  const isSavingMeasurement = useTwinStore(
    (state) => state.isSavingMeasurement
  );
  const isDeletingMeasurement = useTwinStore(
    (state) => state.isDeletingMeasurement
  );
  const saveRoomMeasurement = useTwinStore(
    (state) => state.saveRoomMeasurement
  );
  const deleteRoomMeasurement = useTwinStore(
    (state) => state.deleteRoomMeasurement
  );
  const clearMeasurementError = useTwinStore(
    (state) => state.clearMeasurementError
  );

  const [lengthFt, setLengthFt] = useState("");
  const [widthFt, setWidthFt] = useState("");
  const [ceilingHeightFt, setCeilingHeightFt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isClearOpen, setIsClearOpen] = useState(false);

  useEffect(() => {
    if (measurement) {
      setLengthFt(toInputValue(measurement.lengthFt));
      setWidthFt(toInputValue(measurement.widthFt));
      setCeilingHeightFt(toInputValue(measurement.ceilingHeightFt));
      return;
    }

    if (measurement === null) {
      setLengthFt("");
      setWidthFt("");
      setCeilingHeightFt("");
    }
  }, [measurement]);

  const previewDimensions = useMemo(() => {
    const length = parsePositiveDimension(lengthFt);
    const width = parsePositiveDimension(widthFt);
    const height = parsePositiveDimension(ceilingHeightFt);

    if (length === null || width === null || height === null) {
      return null;
    }

    return {
      lengthFt: length,
      widthFt: width,
      ceilingHeightFt: height,
    };
  }, [ceilingHeightFt, lengthFt, widthFt]);

  const calculated = useMemo(() => {
    if (!previewDimensions) {
      return null;
    }

    return {
      floorArea: calculateFloorArea(previewDimensions),
      ceilingArea: calculateCeilingArea(previewDimensions),
      perimeter: calculatePerimeter(previewDimensions),
      wallArea: calculateWallArea(previewDimensions),
    };
  }, [previewDimensions]);

  const isBusy = Boolean(isSavingMeasurement || isDeletingMeasurement);
  const hasSavedMeasurement = Boolean(measurement);

  async function handleSave() {
    if (isSavingMeasurement || !saveRoomMeasurement) {
      return;
    }

    const length = parsePositiveDimension(lengthFt);
    const width = parsePositiveDimension(widthFt);
    const height = parsePositiveDimension(ceilingHeightFt);

    if (length === null || width === null || height === null) {
      setFormError(
        "Length, width, and ceiling height are required and must be greater than 0."
      );
      return;
    }

    setFormError(null);
    clearMeasurementError?.();

    try {
      await saveRoomMeasurement(roomId, {
        lengthFt: length,
        widthFt: width,
        ceilingHeightFt: height,
      });
    } catch {
      // measurementError is set in the store
    }
  }

  async function handleClear() {
    if (isDeletingMeasurement || !measurement || !deleteRoomMeasurement) {
      return;
    }

    clearMeasurementError?.();

    try {
      await deleteRoomMeasurement(roomId);
      setIsClearOpen(false);
      setFormError(null);
    } catch {
      // measurementError is set in the store
    }
  }

  return (
    <section aria-labelledby="room-measurements-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="room-measurements-heading" className="text-2xl font-bold">
          Measurements
        </h2>
        {hasSavedMeasurement ? (
          <button
            type="button"
            onClick={() => {
              clearMeasurementError?.();
              setIsClearOpen(true);
            }}
            disabled={isBusy}
            className="rounded-lg border border-red-900/70 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-60"
          >
            Clear Measurements
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-slate-400">
        Enter room dimensions in feet. Calculated quantities update
        automatically.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm" htmlFor={`length-ft-${roomId}`}>
          <span className="mb-1 block text-slate-300">Length (ft)</span>
          <input
            id={`length-ft-${roomId}`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={lengthFt}
            onChange={(event) => setLengthFt(event.target.value)}
            disabled={isBusy}
            placeholder="12"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-base outline-none focus:border-blue-500 disabled:opacity-60"
          />
        </label>

        <label className="block text-sm" htmlFor={`width-ft-${roomId}`}>
          <span className="mb-1 block text-slate-300">Width (ft)</span>
          <input
            id={`width-ft-${roomId}`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={widthFt}
            onChange={(event) => setWidthFt(event.target.value)}
            disabled={isBusy}
            placeholder="10"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-base outline-none focus:border-blue-500 disabled:opacity-60"
          />
        </label>

        <label
          className="block text-sm"
          htmlFor={`ceiling-height-ft-${roomId}`}
        >
          <span className="mb-1 block text-slate-300">Ceiling Height (ft)</span>
          <input
            id={`ceiling-height-ft-${roomId}`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={ceilingHeightFt}
            onChange={(event) => setCeilingHeightFt(event.target.value)}
            disabled={isBusy}
            placeholder="8"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-base outline-none focus:border-blue-500 disabled:opacity-60"
          />
        </label>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isBusy}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          {isSavingMeasurement ? "Saving..." : "Save Measurements"}
        </button>
      </div>

      {formError ? (
        <p className="mt-3 text-sm text-red-300">{formError}</p>
      ) : null}
      {measurementError ? (
        <p className="mt-3 text-sm text-red-300">{measurementError}</p>
      ) : null}

      <div className="mt-6 border-t border-slate-800 pt-4">
        <h3 className="text-lg font-semibold">Calculated Quantities</h3>
        {calculated ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Floor Area
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatQuantityDisplay(calculated.floorArea)} SF
              </dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Ceiling Area
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatQuantityDisplay(calculated.ceilingArea)} SF
              </dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Wall Area
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatQuantityDisplay(calculated.wallArea)} SF
              </dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Perimeter
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatQuantityDisplay(calculated.perimeter)} LF
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Enter length, width, and ceiling height to see calculated
            quantities.
          </p>
        )}
      </div>

      <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Clear measurements?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This deletes only the measurement record for this room. Photos,
              moisture, notes, equipment, scope, and estimates are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              disabled={isDeletingMeasurement}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void handleClear()}
              disabled={isDeletingMeasurement}
            >
              {isDeletingMeasurement ? "Clearing..." : "Clear Measurements"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
