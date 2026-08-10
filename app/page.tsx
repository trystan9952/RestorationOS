"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Loss } from "@/lib/domain/Loss";
import { useTwinStore } from "@/lib/store/useTwinStore";

function formatDateOfLoss(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function JobCard({
  loss,
  onOpen,
  disabled,
}: {
  loss: Loss;
  onOpen: (lossId: string) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(loss.id)}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-blue-500 disabled:opacity-60"
    >
      <h2 className="text-xl font-semibold tracking-tight">
        {loss.address.trim() || "Untitled address"}
      </h2>
      <p className="mt-1 text-slate-300">
        {loss.customer.trim() || "No customer"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-blue-300">{loss.lossType} Loss</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">
          Date of Loss: {formatDateOfLoss(loss.dateOfLoss)}
        </span>
      </div>

      <p className="mt-3 text-sm">
        <span className="text-slate-500">Status: </span>
        <span className="font-medium text-yellow-400">{loss.status}</span>
      </p>

      {(loss.insurance.trim() || loss.claimNumber.trim()) && (
        <div className="mt-3 space-y-1 text-sm text-slate-400">
          {loss.insurance.trim() ? <p>{loss.insurance.trim()}</p> : null}
          {loss.claimNumber.trim() ? (
            <p>Claim #{loss.claimNumber.trim()}</p>
          ) : null}
        </div>
      )}
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const losses = useTwinStore((state) => state.losses);
  const lossesStatus = useTwinStore((state) => state.lossesStatus);
  const lossesError = useTwinStore((state) => state.lossesError);
  const loadLosses = useTwinStore((state) => state.loadLosses);
  const openLoss = useTwinStore((state) => state.openLoss);
  const clearLossesError = useTwinStore((state) => state.clearLossesError);
  const [openingLossId, setOpeningLossId] = useState<string | null>(null);

  useEffect(() => {
    void loadLosses();
  }, [loadLosses]);

  async function handleOpenLoss(lossId: string) {
    if (openingLossId) {
      return;
    }

    setOpeningLossId(lossId);

    try {
      await openLoss(lossId);
      router.push("/dashboard");
    } catch {
      // lossError handled in store; keep user on list
      setOpeningLossId(null);
    }
  }

  const isLoading = lossesStatus === "loading";
  const hasError = lossesStatus === "error";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
              RestorationOS
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Jobs
            </h1>
            <p className="mt-2 text-slate-400">
              Select a job to continue, or start a new loss.
            </p>
          </div>

          <Link
            href="/new-loss"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
          >
            + New Loss
          </Link>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center text-slate-400">
            Loading jobs...
          </div>
        ) : null}

        {hasError ? (
          <div className="rounded-xl border border-red-900 bg-red-950/40 px-6 py-10 text-center">
            <p className="text-red-300">
              {lossesError || "Unable to load jobs."}
            </p>
            <button
              type="button"
              onClick={() => {
                clearLossesError();
                void loadLosses();
              }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isLoading && !hasError && losses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <p className="text-lg text-slate-300">No jobs yet.</p>
            <p className="mt-2 text-slate-500">
              Create your first loss to open the job dashboard.
            </p>
            <Link
              href="/new-loss"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
            >
              + New Loss
            </Link>
          </div>
        ) : null}

        {!isLoading && !hasError && losses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {losses.map((loss) => (
              <JobCard
                key={loss.id}
                loss={loss}
                onOpen={(lossId) => void handleOpenLoss(lossId)}
                disabled={openingLossId !== null}
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
