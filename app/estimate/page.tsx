"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { EmailEstimateDialog } from "@/components/estimate/EmailEstimateDialog";
import { EstimateWorkspace } from "@/components/estimate/EstimateWorkspace";
import { Header } from "@/components/layout/Header";
import { useTwinStore } from "@/lib/store/useTwinStore";
import {
  buildEstimateDocumentData,
  sanitizeEstimatePdfFilename,
} from "@/lib/utils/estimateDocument";

const ACTIVE_LOSS_STORAGE_KEY = "restorationos.activeLossId";

type EstimateViewMode = "edit" | "preview";

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
  const loadRoomMeasurement = useTwinStore(
    (state) => state.loadRoomMeasurement
  );
  const loadCompanyProfile = useTwinStore((state) => state.loadCompanyProfile);
  const activeLoss = useTwinStore((state) => state.activeLoss);
  const activeLossId = useTwinStore((state) => state.activeLossId);
  const rooms = useTwinStore((state) => state.rooms);
  const estimateByLossId = useTwinStore((state) => state.estimateByLossId);
  const estimateAreasByEstimateId = useTwinStore(
    (state) => state.estimateAreasByEstimateId
  );
  const estimateLineItemsByAreaId = useTwinStore(
    (state) => state.estimateLineItemsByAreaId
  );
  const companyProfile = useTwinStore((state) => state.companyProfile);
  const estimateStatus = useTwinStore((state) => state.estimateStatus);
  const estimateError = useTwinStore((state) => state.estimateError);
  const status = useTwinStore((state) => state.status);
  const error = useTwinStore((state) => state.error);

  const [ready, setReady] = useState(false);
  const [viewMode, setViewMode] = useState<EstimateViewMode>("edit");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

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
        await Promise.all([
          loadRooms(lossId),
          loadCompanyProfile().catch(() => null),
        ]);
        const estimate = await loadEstimateForLoss(lossId);
        const areas =
          useTwinStore.getState().estimateAreasByEstimateId[estimate.id] ??
          [];
        const roomIds = [
          ...new Set(
            areas
              .map((area) => area.roomId)
              .filter((id): id is string => Boolean(id))
          ),
        ];
        await Promise.allSettled(
          roomIds.map((roomId) => loadRoomMeasurement(roomId))
        );
      } catch {
        // Errors are stored in Zustand
      } finally {
        setReady(true);
      }
    })();
  }, [
    hydrateFromDatabase,
    loadCompanyProfile,
    loadEstimateForLoss,
    loadRoomMeasurement,
    loadRooms,
    router,
  ]);

  useEffect(() => {
    const lossId = activeLossId ?? readStoredLossId();
    if (!lossId) {
      return;
    }

    const estimate = estimateByLossId[lossId];
    if (!estimate) {
      return;
    }

    const areas = estimateAreasByEstimateId[estimate.id] ?? [];
    const roomIds = [
      ...new Set(
        areas
          .map((area) => area.roomId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    void Promise.allSettled(
      roomIds.map((roomId) => {
        const cached =
          useTwinStore.getState().roomMeasurementsByRoomId?.[roomId];
        if (cached !== undefined) {
          return Promise.resolve(cached);
        }
        return loadRoomMeasurement(roomId);
      })
    );
  }, [
    activeLossId,
    estimateAreasByEstimateId,
    estimateByLossId,
    loadRoomMeasurement,
  ]);

  const lossId = activeLossId ?? readStoredLossId();
  const estimate = lossId ? estimateByLossId[lossId] : undefined;
  const areas = estimate
    ? (estimateAreasByEstimateId[estimate.id] ?? [])
    : [];

  const documentData = useMemo(() => {
    if (!estimate || !activeLoss) {
      return null;
    }
    return buildEstimateDocumentData({
      company: companyProfile,
      estimate,
      loss: activeLoss,
      areas,
      lineItemsByAreaId: estimateLineItemsByAreaId,
      rooms,
    });
  }, [
    activeLoss,
    areas,
    companyProfile,
    estimate,
    estimateLineItemsByAreaId,
    rooms,
  ]);

  async function handleDownloadPdf() {
    if (!estimate || isGeneratingPdf) {
      return;
    }

    setPdfError(null);
    setIsGeneratingPdf(true);

    try {
      const response = await fetch(`/api/estimates/${estimate.id}/pdf`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Failed to generate PDF.");
      }

      const blob = await response.blob();
      const filename =
        documentData != null
          ? sanitizeEstimatePdfFilename(documentData.estimate.estimateNumber)
          : "Estimate.pdf";
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "Failed to generate PDF."
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  if (!ready || status === "loading" || estimateStatus === "loading") {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8 print:bg-white print:text-black">
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
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-6xl print:max-w-none">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300 print:hidden"
        >
          ← Dashboard
        </Link>

        <div className="print:hidden">
          <Header
            title="Estimate"
            subtitle="Build and preview the estimate for this loss"
          />
        </div>

        <div className="print:hidden mt-6 flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex w-full rounded-lg border border-slate-600 bg-slate-950 p-1 sm:w-auto"
            role="group"
            aria-label="Estimate view mode"
          >
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              aria-pressed={viewMode === "edit"}
              className={`min-h-11 flex-1 rounded-md px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                viewMode === "edit"
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              Edit Estimate
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              aria-pressed={viewMode === "preview"}
              className={`min-h-11 flex-1 rounded-md px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                viewMode === "preview"
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              Preview Estimate
            </button>
          </div>

          {viewMode === "preview" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={isGeneratingPdf}
                className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => setIsEmailOpen(true)}
                disabled={isGeneratingPdf}
                className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                Email Estimate
              </button>
            </div>
          ) : null}
        </div>

        {pdfError ? (
          <p className="print:hidden mt-3 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {pdfError}
          </p>
        ) : null}

        <div className="mt-6 print:mt-0">
          <EstimateWorkspace
            loss={activeLoss}
            estimate={estimate}
            rooms={rooms}
            viewMode={viewMode}
          />
        </div>

        {documentData ? (
          <EmailEstimateDialog
            open={isEmailOpen}
            onOpenChange={setIsEmailOpen}
            estimateId={estimate.id}
            document={documentData}
          />
        ) : null}
      </div>
    </main>
  );
}
