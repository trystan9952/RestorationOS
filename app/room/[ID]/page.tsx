"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { MoistureReadings } from "@/components/moisture/MoistureReadings";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { useTwinStore } from "@/lib/store/useTwinStore";

export default function RoomPage() {
  const params = useParams<{ ID: string }>();
  const roomId = params.ID;

  const hydrateFromDatabase = useTwinStore((state) => state.hydrateFromDatabase);
  const loadRoomPhotos = useTwinStore((state) => state.loadRoomPhotos);
  const loadMoistureReadings = useTwinStore(
    (state) => state.loadMoistureReadings
  );
  const room = useTwinStore((state) =>
    state.rooms.find((item) => item.id === roomId)
  );

  useEffect(() => {
    void (async () => {
      await hydrateFromDatabase();
      if (roomId) {
        await Promise.all([
          loadRoomPhotos(roomId),
          loadMoistureReadings(roomId),
        ]);
      }
    })();
  }, [hydrateFromDatabase, loadMoistureReadings, loadRoomPhotos, roomId]);

  const title = room?.name ?? "Room not found";
  const subtitle = room
    ? "Digital Twin Room"
    : "This room is not in the current twin session.";

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Header title={title} subtitle={subtitle} />

        {room ? (
          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-6 text-2xl font-bold">📷 Photos</h2>
              <PhotoUploader roomId={roomId} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <MoistureReadings roomId={roomId} />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-bold">📦 Equipment</h2>
                <p className="mt-4 text-slate-400">No equipment added.</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-bold">📝 Notes</h2>
                <textarea
                  className="mt-4 h-40 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
                  placeholder="Inspection notes..."
                />
              </div>
            </div>
          </div>
        ) : null}

        <Link
          href="/rooms"
          className="mt-10 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Back to Rooms
        </Link>
      </div>
    </main>
  );
}
