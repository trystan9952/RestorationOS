/**
 * Professional estimate document model + display helpers.
 *
 * Source of truth for Web Preview, PDF, and Email attachment.
 * Totals use existing estimateTotals utilities — never recalculated differently.
 */

import type { CompanyProfile } from "@/lib/domain/CompanyProfile";
import type { Estimate, EstimateStatus } from "@/lib/domain/Estimate";
import type { EstimateArea } from "@/lib/domain/EstimateArea";
import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
import {
  formatQuantitySourceLabel,
  type EstimateQuantitySource,
} from "@/lib/domain/EstimateQuantitySource";
import type { Loss } from "@/lib/domain/Loss";
import type { Room } from "@/lib/domain/Room";
import {
  calculateAreaTotal,
  calculateEstimateTotal,
  calculateLineItemTotal,
} from "@/lib/utils/estimateTotals";

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

export function sanitizeEstimatePdfFilename(estimateNumber: string): string {
  const safe = estimateNumber.replace(/[^a-zA-Z0-9_-]/g, "");
  return `Estimate-${safe || "EST"}.pdf`;
}

export type EstimateDocumentCompany = {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
};

export type EstimateDocumentLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  quantitySource: EstimateQuantitySource;
  quantitySourceLabel: string;
  total: number;
};

export type EstimateDocumentArea = {
  id: string;
  name: string;
  roomId: string | null;
  roomLabel: string;
  lineItems: EstimateDocumentLineItem[];
  subtotal: number;
};

export type EstimateDocumentData = {
  company: EstimateDocumentCompany;
  estimate: {
    id: string;
    estimateNumber: string;
    status: EstimateStatus;
    date: string;
    notes: string | null;
  };
  loss: {
    customer: string;
    address: string;
    phone: string;
    insurance: string;
    claimNumber: string;
    lossType: string;
    dateOfLoss: string;
  };
  areas: EstimateDocumentArea[];
  totals: {
    subtotal: number;
  };
};

export type BuildEstimateDocumentInput = {
  company: CompanyProfile | null | undefined;
  estimate: Estimate;
  loss: Loss;
  areas: EstimateArea[];
  lineItemsByAreaId: Record<string, EstimateLineItem[]>;
  rooms: Room[];
};

function companyDisplayName(company: CompanyProfile | null | undefined): string {
  const name = company?.companyName?.trim();
  return name && name.length > 0 ? name : "RestorationOS";
}

function areaRoomLabel(area: EstimateArea, rooms: Room[]): string {
  if (!area.roomId) {
    return "Custom Area";
  }
  const room = rooms.find((entry) => entry.id === area.roomId);
  return room?.name?.trim() || area.name;
}

/**
 * Build the shared estimate document model for Preview / PDF / Email.
 * Uses persisted line item quantities and existing totals utilities.
 */
export function buildEstimateDocumentData(
  input: BuildEstimateDocumentInput
): EstimateDocumentData {
  const { company, estimate, loss, areas, lineItemsByAreaId, rooms } = input;

  const documentAreas: EstimateDocumentArea[] = areas.map((area) => {
    const lineItems = lineItemsByAreaId[area.id] ?? [];
    const mappedItems: EstimateDocumentLineItem[] = lineItems.map((item) => {
      const quantitySource = item.quantitySource ?? "manual";
      return {
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantitySource,
        quantitySourceLabel: formatQuantitySourceLabel(quantitySource),
        total: calculateLineItemTotal(item),
      };
    });

    return {
      id: area.id,
      name: area.name,
      roomId: area.roomId,
      roomLabel: areaRoomLabel(area, rooms),
      lineItems: mappedItems,
      subtotal: calculateAreaTotal(lineItems),
    };
  });

  const subtotal = calculateEstimateTotal(
    documentAreas.map((area) =>
      area.lineItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    )
  );

  const notes = estimate.notes?.trim() ? estimate.notes.trim() : null;

  return {
    company: {
      name: companyDisplayName(company),
      phone: company?.phone ?? null,
      email: company?.email ?? null,
      website: company?.website ?? null,
      address: company?.address ?? null,
      logoUrl: company?.logoUrl ?? null,
    },
    estimate: {
      id: estimate.id,
      estimateNumber: formatEstimateNumber(estimate.id),
      status: estimate.status,
      date: formatEstimateDate(estimate.createdAt),
      notes,
    },
    loss: {
      customer: loss.customer?.trim() ?? "",
      address: loss.address?.trim() ?? "",
      phone: loss.phone?.trim() ?? "",
      insurance: loss.insurance?.trim() ?? "",
      claimNumber: loss.claimNumber?.trim() ?? "",
      lossType: loss.lossType ?? "",
      dateOfLoss: loss.dateOfLoss?.trim()
        ? formatLossDate(loss.dateOfLoss)
        : "—",
    },
    areas: documentAreas,
    totals: {
      subtotal,
    },
  };
}
