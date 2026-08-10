"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useTwinStore } from "@/lib/store/useTwinStore";
import { formatCurrency } from "@/lib/utils/estimateTotals";
import { parsePriceBookCsv } from "@/lib/utils/parsePriceBookCsv";
import {
  buildPriceBookImportPreview,
  summarizeImportPreview,
  type ImportPreviewRow,
  type ImportRowAction,
} from "@/lib/utils/priceBookImport";

type Phase = "upload" | "preview" | "done";

export function PriceBookImportWorkspace() {
  const priceCatalogItems = useTwinStore((state) => state.priceCatalogItems);
  const loadPriceCatalog = useTwinStore((state) => state.loadPriceCatalog);
  const importPriceBookOperations = useTwinStore(
    (state) => state.importPriceBookOperations
  );
  const isSavingPriceCatalog = useTwinStore(
    (state) => state.isSavingPriceCatalog
  );

  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [resultSummary, setResultSummary] = useState<{
    added: number;
    updated: number;
    skipped: number;
    failed: number;
    failureMessages: string[];
  } | null>(null);

  const summary = useMemo(
    () => summarizeImportPreview(previewRows),
    [previewRows]
  );

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    setParseError(null);
    setActionError(null);
    setResultSummary(null);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv")) {
      setParseError(
        "Unable to read price book. Upload a .csv file (Excel import is deferred)."
      );
      return;
    }

    try {
      await loadPriceCatalog();
      const text = await file.text();
      const parsed = parsePriceBookCsv(text);
      const existing = useTwinStore.getState().priceCatalogItems;
      const preview = buildPriceBookImportPreview(
        parsed.rows,
        existing,
        parsed.errors
      );
      setFileName(file.name);
      setPreviewRows(preview);
      setPhase("preview");
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Unable to read price book."
      );
      setPhase("upload");
    }
  }

  function setRowAction(id: string, action: ImportRowAction) {
    setPreviewRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }
        if (row.kind === "error") {
          return row;
        }
        if (row.kind === "new" && action !== "add" && action !== "skip") {
          return row;
        }
        if (
          (row.kind === "existing_identical" ||
            row.kind === "existing_price_diff") &&
          action !== "keep" &&
          action !== "update" &&
          action !== "skip"
        ) {
          return row;
        }
        return { ...row, action };
      })
    );
  }

  function markAllNewAsAdd() {
    setPreviewRows((current) =>
      current.map((row) =>
        row.kind === "new" ? { ...row, action: "add" as const } : row
      )
    );
  }

  async function runImport(mode: "new_only" | "selected_updates" | "selected") {
    if (isSavingPriceCatalog) {
      return;
    }

    setActionError(null);

    const operations = previewRows
      .filter((row) => {
        if (!row.source) {
          return false;
        }
        if (mode === "new_only") {
          return row.kind === "new" && row.action === "add";
        }
        if (mode === "selected_updates") {
          return row.kind === "existing_price_diff" && row.action === "update";
        }
        return row.action === "add" || row.action === "update";
      })
      .map((row) => {
        const source = row.source!;
        if (row.action === "update" && row.existingItem) {
          return {
            type: "update" as const,
            id: row.existingItem.id,
            category: source.category,
            code: source.code,
            name: source.description,
            description: source.description,
            unit: source.unit,
            unitPrice: source.unitPrice,
          };
        }
        return {
          type: "add" as const,
          category: source.category,
          code: source.code,
          name: source.description,
          description: source.description,
          unit: source.unit,
          unitPrice: source.unitPrice,
          sortOrder: source.sortOrder,
        };
      });

    if (operations.length === 0) {
      setActionError("No rows selected for this import action.");
      return;
    }

    try {
      const result = await importPriceBookOperations(operations);
      const skipped = previewRows.filter(
        (row) => row.action === "keep" || row.action === "skip"
      ).length;

      setResultSummary({
        added: result.added,
        updated: result.updated,
        skipped,
        failed: result.failures.length + summary.errors,
        failureMessages: result.failures.map(
          (failure) => `${failure.label}: ${failure.error}`
        ),
      });

      // Refresh preview against updated catalog for honesty after partial runs
      await loadPriceCatalog();
      setPhase("done");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Import failed."
      );
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Import Price Book</h2>
        <p className="mt-2 text-sm text-slate-400">
          Upload the normalized CSV (Category, Code, Description, Unit Price,
          UOM). Prices are never invented or silently overwritten.
        </p>

        {phase === "upload" ? (
          <div className="mt-6 grid gap-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">CSV file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  void handleFile(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
              />
            </label>
            {parseError ? (
              <p className="whitespace-pre-wrap rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                {parseError}
              </p>
            ) : null}
          </div>
        ) : null}

        {phase === "preview" ? (
          <div className="mt-6 grid gap-4">
            <p className="text-sm text-slate-300">
              File: <span className="font-medium text-white">{fileName}</span>
            </p>

            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <dt className="text-slate-500">Total rows</dt>
                <dd className="mt-1 text-lg font-semibold">{summary.total}</dd>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <dt className="text-slate-500">New</dt>
                <dd className="mt-1 text-lg font-semibold text-emerald-400">
                  {summary.newCount}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <dt className="text-slate-500">Existing</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {summary.existingCount}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <dt className="text-slate-500">Price diffs</dt>
                <dd className="mt-1 text-lg font-semibold text-yellow-400">
                  {summary.updateCandidates}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <dt className="text-slate-500">Errors</dt>
                <dd className="mt-1 text-lg font-semibold text-red-400">
                  {summary.errors}
                </dd>
              </div>
            </dl>

            {actionError ? (
              <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                {actionError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markAllNewAsAdd}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              >
                Mark All New → Add
              </button>
              <button
                type="button"
                onClick={() => void runImport("new_only")}
                disabled={isSavingPriceCatalog || summary.selectedAdds === 0}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
              >
                {isSavingPriceCatalog
                  ? "Importing..."
                  : `Import All New Items (${summary.selectedAdds})`}
              </button>
              {summary.updateCandidates > 0 ? (
                <button
                  type="button"
                  onClick={() => void runImport("selected_updates")}
                  disabled={
                    isSavingPriceCatalog || summary.selectedUpdates === 0
                  }
                  className="rounded-lg border border-yellow-700 px-3 py-1.5 text-sm text-yellow-300 hover:bg-yellow-950/30 disabled:opacity-60"
                >
                  Apply Selected Updates ({summary.selectedUpdates})
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setPhase("upload");
                  setPreviewRows([]);
                  setFileName(null);
                }}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              >
                Choose Another File
              </button>
            </div>

            <div className="grid gap-3">
              {previewRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-lg border border-slate-700 bg-slate-950/40 p-3"
                >
                  {row.kind === "error" ? (
                    <>
                      <p className="text-sm font-semibold text-red-400">
                        Row {row.id.replace("error-", "")} · Error
                      </p>
                      <p className="mt-1 text-sm text-red-300">
                        {row.errorMessage}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            {row.source?.category} · {row.source?.code}
                          </p>
                          <p className="mt-1 font-medium text-slate-100">
                            {row.source?.description}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {row.source?.unit} ·{" "}
                            {formatCurrency(row.source?.unitPrice ?? 0)}
                          </p>
                        </div>
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            row.kind === "new"
                              ? "bg-emerald-950/50 text-emerald-300"
                              : row.kind === "existing_price_diff"
                                ? "bg-yellow-950/40 text-yellow-300"
                                : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {row.kind === "new"
                            ? "New"
                            : row.kind === "existing_price_diff"
                              ? "Existing (price differs)"
                              : "Existing"}
                        </span>
                      </div>

                      {row.kind === "existing_price_diff" && row.existingItem ? (
                        <p className="mt-2 text-xs text-slate-400">
                          Existing price:{" "}
                          {formatCurrency(row.existingItem.unitPrice)} ·
                          Imported price:{" "}
                          {formatCurrency(row.source?.unitPrice ?? 0)} · Default
                          Keep Existing
                        </p>
                      ) : null}

                      <label className="mt-3 block text-sm">
                        <span className="mb-1 block text-slate-400">Action</span>
                        <select
                          value={row.action}
                          disabled={isSavingPriceCatalog}
                          onChange={(event) =>
                            setRowAction(
                              row.id,
                              event.target.value as ImportRowAction
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-56"
                        >
                          {row.kind === "new" ? (
                            <>
                              <option value="add">Add</option>
                              <option value="skip">Skip</option>
                            </>
                          ) : (
                            <>
                              <option value="keep">Keep Existing</option>
                              <option value="update">Update</option>
                              <option value="skip">Skip</option>
                            </>
                          )}
                        </select>
                      </label>
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {phase === "done" && resultSummary ? (
          <div className="mt-6 grid gap-3">
            <p className="text-emerald-300">
              Imported {resultSummary.added} new items.
            </p>
            <p className="text-slate-300">
              Updated {resultSummary.updated} items.
            </p>
            <p className="text-slate-300">
              Skipped {resultSummary.skipped} items.
            </p>
            <p className="text-slate-300">
              Failed {resultSummary.failed} rows.
            </p>
            {resultSummary.failureMessages.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-red-300">
                {resultSummary.failureMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
            <Link
              href="/price-catalog"
              className="mt-2 inline-flex w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Back to Price Catalog
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
