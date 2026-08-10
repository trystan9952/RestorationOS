/**
 * Classify parsed price-book rows against existing catalog items.
 * Never silently overwrites prices — conflicts default to Keep Existing.
 */

import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { PriceBookSourceRow } from "@/lib/utils/parsePriceBookCsv";

export type ImportRowAction = "add" | "keep" | "update" | "skip";

export type ImportPreviewKind =
  | "new"
  | "existing_identical"
  | "existing_price_diff"
  | "error";

export type ImportPreviewRow = {
  id: string;
  source: PriceBookSourceRow | null;
  kind: ImportPreviewKind;
  action: ImportRowAction;
  existingItem: PriceCatalogItem | null;
  errorMessage?: string;
};

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function catalogDuplicateKey(item: {
  code?: string | null;
  category: string;
  name: string;
  unit: string;
}): string {
  const code = item.code?.trim();
  if (code) {
    return `code:${normalizeKeyPart(code)}`;
  }
  return `fallback:${normalizeKeyPart(item.category)}|${normalizeKeyPart(item.name)}|${normalizeKeyPart(item.unit)}`;
}

function sourceDuplicateKey(row: PriceBookSourceRow): string {
  return catalogDuplicateKey({
    code: row.code,
    category: row.category,
    name: row.description,
    unit: row.unit,
  });
}

function pricesEqual(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

export function buildPriceBookImportPreview(
  sourceRows: PriceBookSourceRow[],
  existingItems: PriceCatalogItem[],
  parseErrors: Array<{ rowNumber: number; message: string }>
): ImportPreviewRow[] {
  const byKey = new Map<string, PriceCatalogItem>();
  for (const item of existingItems) {
    byKey.set(catalogDuplicateKey(item), item);
  }

  const preview: ImportPreviewRow[] = [];

  for (const error of parseErrors) {
    preview.push({
      id: `error-${error.rowNumber}`,
      source: null,
      kind: "error",
      action: "skip",
      existingItem: null,
      errorMessage: error.message,
    });
  }

  for (const row of sourceRows) {
    const key = sourceDuplicateKey(row);
    const existing = byKey.get(key) ?? null;

    if (!existing) {
      preview.push({
        id: `new-${row.rowNumber}`,
        source: row,
        kind: "new",
        action: "add",
        existingItem: null,
      });
      continue;
    }

    const identical =
      existing.category === row.category &&
      existing.name === row.description &&
      existing.unit === row.unit &&
      pricesEqual(existing.unitPrice, row.unitPrice) &&
      (existing.code?.trim() || "") === row.code.trim();

    if (identical) {
      preview.push({
        id: `keep-${row.rowNumber}`,
        source: row,
        kind: "existing_identical",
        action: "keep",
        existingItem: existing,
      });
      continue;
    }

    // Any non-identical existing match (price or other fields).
    // Default Keep Existing — never silently overwrite company prices.
    preview.push({
      id: `diff-${row.rowNumber}`,
      source: row,
      kind: "existing_price_diff",
      action: "keep",
      existingItem: existing,
    });
  }

  return preview;
}

export function summarizeImportPreview(rows: ImportPreviewRow[]): {
  total: number;
  newCount: number;
  existingCount: number;
  updateCandidates: number;
  errors: number;
  selectedAdds: number;
  selectedUpdates: number;
} {
  return {
    total: rows.length,
    newCount: rows.filter((row) => row.kind === "new").length,
    existingCount: rows.filter(
      (row) =>
        row.kind === "existing_identical" || row.kind === "existing_price_diff"
    ).length,
    updateCandidates: rows.filter((row) => row.kind === "existing_price_diff")
      .length,
    errors: rows.filter((row) => row.kind === "error").length,
    selectedAdds: rows.filter((row) => row.action === "add").length,
    selectedUpdates: rows.filter((row) => row.action === "update").length,
  };
}
