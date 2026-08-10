/**
 * Display helpers for the professional estimate document.
 * Derived values only — no persisted estimate_number field.
 */

/** Stable display id from estimate UUID, e.g. EST-7F3A21 */
export function formatEstimateNumber(estimateId: string): string {
  const hex = estimateId.replace(/-/g, "").toUpperCase();
  const short = hex.length >= 6 ? hex.slice(-6) : hex.padStart(6, "0");
  return `EST-${short}`;
}

/** Format estimate created_at for document display. */
export function formatEstimateDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format loss date_of_loss (YYYY-MM-DD or ISO) for document display. */
export function formatLossDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }

  // Prefer calendar date for date-only values to avoid timezone shifts
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const local = new Date(year, month - 1, day);
    if (Number.isNaN(local.getTime())) {
      return "—";
    }
    return local.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function displayField(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}
