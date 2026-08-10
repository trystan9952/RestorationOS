"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DeleteJobDialog } from "@/components/jobs/DeleteJobDialog";
import { EditJobDialog } from "@/components/jobs/EditJobDialog";
import { Header } from "@/components/layout/Header";
import {
  LOSS_STATUSES,
  type LossStatus,
} from "@/lib/domain/Loss";
import { useTwinStore } from "@/lib/store/useTwinStore";
import { buildLossActivity } from "@/lib/utils/buildLossActivity";

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateOfLoss(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shortenDescription(value: string, max = 80): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1)}…`;
}

export default function DashboardPage() {
  const router = useRouter();
  const hydrateFromDatabase = useTwinStore(
    (state) => state.hydrateFromDatabase
  );
  const loadLossRoomDetails = useTwinStore(
    (state) => state.loadLossRoomDetails
  );
  const addRoom = useTwinStore((state) => state.addRoom);
  const updateLossStatus = useTwinStore((state) => state.updateLossStatus);
  const clearLossError = useTwinStore((state) => state.clearLossError);
  const activeLoss = useTwinStore((state) => state.activeLoss);
  const activeLossId = useTwinStore((state) => state.activeLossId);
  const isUpdatingLossStatus = useTwinStore(
    (state) => state.isUpdatingLossStatus
  );
  const isDeletingLoss = useTwinStore((state) => state.isDeletingLoss);
  const lossError = useTwinStore((state) => state.lossError);
  const rooms = useTwinStore((state) => state.rooms);
  const photosByRoomId = useTwinStore((state) => state.photosByRoomId);
  const moistureByRoomId = useTwinStore((state) => state.moistureByRoomId);
  const notesByRoomId = useTwinStore((state) => state.notesByRoomId);
  const equipmentByRoomId = useTwinStore((state) => state.equipmentByRoomId);
  const status = useTwinStore((state) => state.status);
  const error = useTwinStore((state) => state.error);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      await hydrateFromDatabase();
      await loadLossRoomDetails();
    })();
  }, [hydrateFromDatabase, loadLossRoomDetails]);

  const activity = useMemo(
    () =>
      buildLossActivity(
        {
          rooms,
          photosByRoomId,
          moistureByRoomId,
          notesByRoomId,
          equipmentByRoomId,
        },
        10
      ),
    [
      equipmentByRoomId,
      moistureByRoomId,
      notesByRoomId,
      photosByRoomId,
      rooms,
    ]
  );

  const address = activeLoss?.address?.trim() || "No address yet";
  const customer = activeLoss?.customer?.trim() || "No customer yet";
  const phone = activeLoss?.phone?.trim() || "";
  const insurance = activeLoss?.insurance?.trim() || "—";
  const claimNumber = activeLoss?.claimNumber?.trim() || "—";
  const lossType = activeLoss?.lossType ?? "Other";
  const dateOfLoss = activeLoss?.dateOfLoss ?? "";
  const lossStatus = activeLoss?.status ?? "New";

  async function handleStatusChange(nextStatus: LossStatus) {
    if (isUpdatingLossStatus || nextStatus === lossStatus) {
      return;
    }

    clearLossError();

    try {
      await updateLossStatus(nextStatus);
    } catch {
      // lossError is set in the store
    }
  }

  function openAddRoom() {
    setAddError(null);
    setRoomName("");
    setIsAddOpen(true);
  }

  function closeAddRoom() {
    setIsAddOpen(false);
    setRoomName("");
    setAddError(null);
  }

  async function handleAddRoom() {
    const name = roomName.trim();
    if (!name || isAddingRoom) {
      return;
    }

    setIsAddingRoom(true);
    setAddError(null);

    try {
      await addRoom(name);
      closeAddRoom();
    } catch (caught) {
      setAddError(
        caught instanceof Error ? caught.message : "Could not add room."
      );
    } finally {
      setIsAddingRoom(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Jobs
        </Link>

        <Header
          title="Dashboard"
          subtitle={activeLossId ? "Current loss" : "No active loss"}
        />

        {!activeLossId ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              Select a job from the list, or start a new loss.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-block rounded-lg border border-slate-600 px-5 py-3 font-medium hover:bg-slate-800"
              >
                ← Jobs
              </Link>
              <Link
                href="/new-loss"
                className="inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
              >
                + New Loss
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {error ? (
              <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                <Link
                  href="/estimate"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
                >
                  Estimate
                </Link>
                <Link
                  href="/price-catalog"
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                >
                  Price Catalog
                </Link>
                <Link
                  href="/settings"
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearLossError();
                    setIsEditOpen(true);
                  }}
                  disabled={isDeletingLoss}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  Edit Job
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearLossError();
                    setIsDeleteOpen(true);
                  }}
                  disabled={isDeletingLoss}
                  className="rounded-lg border border-red-900/70 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-60"
                >
                  Delete Job
                </button>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                    {lossType} Loss
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight">
                    {address}
                  </h2>
                  <p className="mt-2 text-xl text-slate-200">{customer}</p>

                  <div className="mt-6 grid gap-3 text-slate-300 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Date of Loss
                      </p>
                      <p className="mt-1">
                        {dateOfLoss ? formatDateOfLoss(dateOfLoss) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Phone
                      </p>
                      <p className="mt-1">{phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Insurance
                      </p>
                      <p className="mt-1">{insurance}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Claim
                      </p>
                      <p className="mt-1">{claimNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full shrink-0 rounded-lg border border-slate-700 bg-slate-950/50 p-4 lg:w-64">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-yellow-400">
                    {lossStatus}
                  </p>
                  <label
                    htmlFor="loss-status"
                    className="mt-4 mb-1 block text-sm text-slate-300"
                  >
                    Update status
                  </label>
                  <select
                    id="loss-status"
                    value={lossStatus}
                    disabled={isUpdatingLossStatus}
                    onChange={(event) =>
                      void handleStatusChange(
                        event.target.value as LossStatus
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                  >
                    {LOSS_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {isUpdatingLossStatus ? (
                    <p className="mt-2 text-xs text-slate-500">Saving...</p>
                  ) : null}
                  {lossError ? (
                    <p className="mt-2 text-xs text-red-300">{lossError}</p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">Rooms</h2>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/rooms"
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                  >
                    View All Rooms
                  </Link>
                  <button
                    type="button"
                    onClick={openAddRoom}
                    disabled={isAddingRoom || status === "loading"}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
                  >
                    + Add Room
                  </button>
                </div>
              </div>

              {rooms.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-700 px-4 py-10 text-center">
                  <p className="text-slate-400">No rooms added yet.</p>
                  <button
                    type="button"
                    onClick={openAddRoom}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    + Add Room
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room) => {
                    const photoCount = photosByRoomId[room.id]?.length ?? 0;
                    const moistureCount =
                      moistureByRoomId[room.id]?.length ?? 0;
                    const noteCount = notesByRoomId[room.id]?.length ?? 0;
                    const equipmentCount =
                      equipmentByRoomId[room.id]?.length ?? 0;

                    return (
                      <Link
                        key={room.id}
                        href={`/room/${room.id}`}
                        className="rounded-xl border border-slate-700 bg-slate-950/40 p-5 transition hover:border-blue-500"
                      >
                        <h3 className="text-xl font-semibold">{room.name}</h3>
                        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-400">
                          <div>
                            <dt className="inline">Photos: </dt>
                            <dd className="inline text-slate-200">
                              {photoCount}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline">Moisture: </dt>
                            <dd className="inline text-slate-200">
                              {moistureCount}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline">Notes: </dt>
                            <dd className="inline text-slate-200">
                              {noteCount}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline">Equipment: </dt>
                            <dd className="inline text-slate-200">
                              {equipmentCount}
                            </dd>
                          </div>
                        </dl>
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={openAddRoom}
                    className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-700 p-5 text-slate-400 transition hover:border-blue-500 hover:text-blue-300"
                  >
                    + Add Room
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-2xl font-bold">Recent Activity</h2>

              {activity.length === 0 ? (
                <p className="mt-4 text-slate-400">No activity recorded yet.</p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 border-b border-slate-800 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="text-xs text-slate-500">
                          {formatActivityTime(item.timestamp)}
                        </p>
                        <p className="mt-1 font-medium text-slate-200">
                          {item.roomName}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {item.title} — {shortenDescription(item.description)}
                        </p>
                      </div>
                      <Link
                        href={`/room/${item.roomId}`}
                        className="shrink-0 text-sm text-blue-400 hover:text-blue-300"
                      >
                        View Room
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {isAddOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="text-xl font-bold">Add Room</h3>
              <label
                htmlFor="dashboard-room-name"
                className="mt-4 mb-1 block text-sm text-slate-300"
              >
                Room Name
              </label>
              <input
                id="dashboard-room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="Kitchen"
                disabled={isAddingRoom}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAddRoom();
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {addError ? (
                <p className="mt-3 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                  {addError}
                </p>
              ) : null}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddRoom}
                  disabled={isAddingRoom}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleAddRoom()}
                  disabled={!roomName.trim() || isAddingRoom}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
                >
                  {isAddingRoom ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeLoss ? (
          <EditJobDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            loss={activeLoss}
          />
        ) : null}

        <DeleteJobDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          loss={activeLoss}
          onDeleted={() => {
            setIsDeleteOpen(false);
            router.push("/");
          }}
        />
      </div>
    </main>
  );
}
