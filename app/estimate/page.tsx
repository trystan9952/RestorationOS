"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { EstimateWorkspace } from "@/components/estimate/EstimateWorkspace";
import { Header } from "@/components/layout/Header";
import { useTwinStore } from "@/lib/store/useTwinStore";

const ACTIVE_LOSS_STORAGE_KEY = "restorationos.activeLossId";

function readStoredLossId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_LOSS_STORAGE_KEY);
}

export default function EstimatePage() {
  const router = useRouter();
  const hydrateFromDatabase = useTwinStore(
    (state) => state.hydrateFromDatabase
  );
  const loadRooms = useTwinStore((state) => state.loadRooms);
  const loadEstimateForLoss = useTwinStore(
    (state) => state.loadEstimateForLoss
  );
  const activeLoss = useTwinStore((state) => state.activeLoss);
  const activeLossId = useTwinStore((state) => state.activeLossId);
  const rooms = useTwinStore((state) => state.rooms);
  const estimateByLossId = useTwinStore((state) => state.estimateByLossId);
  const estimateStatus = useTwinStore((state) => state.estimateStatus);
  const estimateError = useTwinStore((state) => state.estimateError);
  const status = useTwinStore((state) => state.status);
  const error = useTwinStore((state) => state.error);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      await hydrateFromDatabase();

      const lossId =
        useTwinStore.getState().activeLossId ?? readStoredLossId();

      if (!lossId) {
        router.replace("/");
        return;
      }

      try {
        await loadRooms(lossId);
        await loadEstimateForLoss(lossId);
      } catch {
        // Errors are stored in Zustand
      } finally {
        setReady(true);
      }
    })();
  }, [hydrateFromDatabase, loadEstimateForLoss, loadRooms, router]);

  const lossId = activeLossId ?? readStoredLossId();
  const estimate = lossId ? estimateByLossId[lossId] : undefined;

  if (!ready || status === "loading" || estimateStatus === "loading") {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
        <div className="mx-auto max-w-6xl">
          <Header title="Estimate" subtitle="Loading..." />
          <p className="mt-6 text-slate-400">Loading estimate...</p>
        </div>
      </main>
    );
  }

  if (!lossId || !activeLoss) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
        <div className="mx-auto max-w-6xl">
          <Header title="Estimate" subtitle="No active loss" />
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              Select a job before opening the estimate.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
            >
              ← Jobs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!estimate) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard"
            className="mb-6 inline-block text-blue-400 hover:text-blue-300"
          >
            ← Dashboard
          </Link>
          <Header title="Estimate" subtitle="Unable to load" />
          <p className="mt-6 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {estimateError || error || "Could not load or create the estimate."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Dashboard
        </Link>

        <Header
          title="Estimate"
          subtitle="Build areas and line items for this loss"
        />

        <div className="mt-6">
          <EstimateWorkspace
            loss={activeLoss}
            estimate={estimate}
            rooms={rooms}
          />
        </div>
      </div>
    </main>
  );
}
