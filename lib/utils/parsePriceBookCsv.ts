/**
 * Parse / validate normalized price-book CSV:
 * Category, Code, Description, Unit Price, UOM
 *
 * Does not invent prices. Preserves source values.
 */

export type PriceBookSourceRow = {
  rowNumber: number;
  category: string;
  code: string;
  description: string;
  unitPrice: number;
  unit: string;
  sortOrder: number;
};

export type PriceBookParseError = {
  rowNumber: number;
  message: string;
  raw?: string;
};

export type PriceBookParseResult = {
  rows: PriceBookSourceRow[];
  errors: PriceBookParseError[];
  header: string[];
};

const REQUIRED_HEADERS = [
  "Category",
  "Code",
  "Description",
  "Unit Price",
  "UOM",
] as const;

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

/** Minimal RFC4180-ish CSV parser (quotes + escaped quotes). */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      cur += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }
    if (ch === "\r") {
      continue;
    }
    cur += ch;
  }

  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  return rows.filter((entry) =>
    entry.some((cell) => String(cell).trim().length > 0)
  );
}

/**
 * Map a CSV row into Category/Code/Description/UnitPrice/UOM.
 * If description contains unquoted commas (extra columns), reassemble:
 * [category, code, ...description parts..., unitPrice, uom]
 */
function mapColumns(cells: string[]): {
  category: string;
  code: string;
  description: string;
  unitPriceRaw: string;
  unit: string;
} | null {
  const trimmed = cells.map((cell) => cell.trim());
  if (trimmed.length < 5) {
    return null;
  }

  if (trimmed.length === 5) {
    return {
      category: trimmed[0]!,
      code: trimmed[1]!,
      description: trimmed[2]!,
      unitPriceRaw: trimmed[3]!,
      unit: trimmed[4]!,
    };
  }

  // Extra commas inside Description — last is UOM, second-to-last is Unit Price
  const category = trimmed[0]!;
  const code = trimmed[1]!;
  const unit = trimmed[trimmed.length - 1]!;
  const unitPriceRaw = trimmed[trimmed.length - 2]!;
  const description = trimmed.slice(2, -2).join(",").trim();

  return { category, code, description, unitPriceRaw, unit };
}

function parseUnitPrice(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

export function parsePriceBookCsv(text: string): PriceBookParseResult {
  const matrix = parseCsvText(text);
  if (matrix.length === 0) {
    throw new Error("Unable to read price book. The file is empty.");
  }

  const header = (matrix[0] ?? []).map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter(
    (required) =>
      !header.some((column) => column.toLowerCase() === required.toLowerCase())
  );

  if (missing.length > 0) {
    throw new Error(
      `Invalid price book format.\nMissing column:\n${missing.join("\n")}`
    );
  }

  // Prefer header-name mapping when exactly 5 columns; otherwise positional + repair
  const headerIndex = {
    category: header.findIndex((h) => h.toLowerCase() === "category"),
    code: header.findIndex((h) => h.toLowerCase() === "code"),
    description: header.findIndex((h) => h.toLowerCase() === "description"),
    unitPrice: header.findIndex((h) => h.toLowerCase() === "unit price"),
    uom: header.findIndex((h) => h.toLowerCase() === "uom"),
  };

  const rows: PriceBookSourceRow[] = [];
  const errors: PriceBookParseError[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const rowNumber = i + 1;
    const cells = matrix[i] ?? [];
    const mapped =
      cells.length === header.length && header.length === 5
        ? {
            category: (cells[headerIndex.category] ?? "").trim(),
            code: (cells[headerIndex.code] ?? "").trim(),
            description: (cells[headerIndex.description] ?? "").trim(),
            unitPriceRaw: (cells[headerIndex.unitPrice] ?? "").trim(),
            unit: (cells[headerIndex.uom] ?? "").trim(),
          }
        : mapColumns(cells);

    if (!mapped) {
      errors.push({
        rowNumber,
        message: "Row does not have Category, Code, Description, Unit Price, UOM.",
        raw: cells.join(","),
      });
      continue;
    }

    const problems: string[] = [];
    if (!mapped.category) problems.push("Category is required.");
    if (!mapped.code) problems.push("Code is required.");
    if (!mapped.description) problems.push("Description is required.");
    if (!mapped.unit) problems.push("UOM is required.");

    const unitPrice = parseUnitPrice(mapped.unitPriceRaw);
    if (unitPrice === null) {
      problems.push(
        `Unit Price must be a valid number >= 0 (got "${mapped.unitPriceRaw}").`
      );
    }

    if (problems.length > 0) {
      errors.push({
        rowNumber,
        message: problems.join(" "),
        raw: cells.join(","),
      });
      continue;
    }

    rows.push({
      rowNumber,
      category: mapped.category,
      code: mapped.code,
      description: mapped.description,
      unitPrice: unitPrice!,
      unit: mapped.unit,
      sortOrder: rows.length,
    });
  }

  return { rows, errors, header };
}
