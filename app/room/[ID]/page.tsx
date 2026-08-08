"use client";

import Link from "next/link";
import Header from "../../../components/header";
import PhotoUploader from "@/components/PhotoUploader";

export default function RoomPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl">

        <Header
          title="Kitchen"
          subtitle="Digital Twin Room"
        />

        <div className="grid gap-6">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-6 text-2xl font-bold">
              📷 Photos
            </h2>

            <PhotoUploader />
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                💧 Moisture
              </h2>

              <p className="mt-4 text-slate-400">
                No readings yet.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                📦 Equipment
              </h2>

              <p className="mt-4 text-slate-400">
                No equipment added.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                📝 Notes
              </h2>

              <textarea
                className="mt-4 h-40 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
                placeholder="Inspection notes..."
              />
            </div>

          </div>

        </div>

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