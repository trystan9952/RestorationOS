import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { Estimate, EstimateStatus } from "@/lib/domain/Estimate";
import type { EstimateArea } from "@/lib/domain/EstimateArea";
import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
import {
  isEstimateQuantitySource,
  type EstimateQuantitySource,
} from "@/lib/domain/EstimateQuantitySource";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  EstimateAreaRow,
  EstimateLineItemRow,
  EstimateRow,
} from "@/types/database";

/**
 * Estimate foundation persistence.
 *
 * Loss → Estimate (1:1) → Areas → Line Items
 *
 * TODO: Future versions may add revisions, markups, catalogs, and exports.
 */

export type CreateEstimateAreaInput = {
  estimateId: string;
  name: string;
  roomId?: string | null;
  sortOrder?: number;
};

export type UpdateEstimateAreaInput = {
  name?: string;
  sortOrder?: number;
};

export type CreateEstimateLineItemInput = {
  estimateAreaId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  quantitySource?: EstimateQuantitySource;
  sortOrder?: number;
};

export type UpdateEstimateLineItemInput = {
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  quantitySource?: EstimateQuantitySource;
  sortOrder?: number;
};

function mapEstimateRow(row: EstimateRow): Estimate {
  return {
    id: row.id,
    lossId: row.loss_id,
    status: row.status as EstimateStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEstimateAreaRow(row: EstimateAreaRow): EstimateArea {
  return {
    id: row.id,
    estimateId: row.estimate_id,
    roomId: row.room_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQuantitySource(
  value: string | null | undefined
): EstimateQuantitySource {
  if (value && isEstimateQuantitySource(value)) {
    return value;
  }
  return "manual";
}

function mapEstimateLineItemRow(row: EstimateLineItemRow): EstimateLineItem {
  return {
    id: row.id,
    estimateAreaId: row.estimate_area_id,
    description: row.description,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    quantitySource: mapQuantitySource(row.quantity_source),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getEstimateByLossId(
  lossId: string
): Promise<Estimate | null> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("estimates")
      .select("*")
      .eq("loss_id", lossId)
      .maybeSingle()
  );

  return data ? mapEstimateRow(data) : null;
}

export async function createEstimate(lossId: string): Promise<Estimate> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("estimates")
      .insert({
        loss_id: lossId,
        status: "Draft",
      })
      .select("*")
      .single()
  );

  return mapEstimateRow(data);
}

export async function updateEstimateStatus(
  estimateId: string,
  status: EstimateStatus
): Promise<Estimate> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("estimates")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", estimateId)
      .select("*")
      .single()
  );

  return mapEstimateRow(data);
}

export async function createEstimateArea(
  input: CreateEstimateAreaInput
): Promise<EstimateArea> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("estimate_areas")
      .insert({
        estimate_id: input.estimateId,
        name: input.name.trim(),
        room_id: input.roomId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single()
  );

  return mapEstimateAreaRow(data);
}

export async function getEstimateAreas(
  estimateId: string
): Promise<EstimateArea[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("estimate_areas")
      .select("*")
      .eq("estimate_id", estimateId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
  );

  return (data ?? []).map(mapEstimateAreaRow);
}

export async function updateEstimateArea(
  id: string,
  input: UpdateEstimateAreaInput
): Promise<EstimateArea> {
  const supabase = getSupabaseClient();

  const update: {
    name?: string;
    sort_order?: number;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) update.name = input.name.trim();
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  const data = unwrapSingle(
    await supabase
      .from("estimate_areas")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapEstimateAreaRow(data);
}

export async function deleteEstimateArea(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(await supabase.from("estimate_areas").delete().eq("id", id));
}

export async function createEstimateLineItem(
  input: CreateEstimateLineItemInput
): Promise<EstimateLineItem> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("estimate_line_items")
      .insert({
        estimate_area_id: input.estimateAreaId,
        description: input.description.trim(),
        quantity: input.quantity,
        unit: input.unit.trim(),
        unit_price: input.unitPrice,
        quantity_source: input.quantitySource ?? "manual",
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single()
  );

  return mapEstimateLineItemRow(data);
}

export async function getEstimateLineItems(
  areaId: string
): Promise<EstimateLineItem[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_area_id", areaId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
  );

  return (data ?? []).map(mapEstimateLineItemRow);
}

export async function updateEstimateLineItem(
  id: string,
  input: UpdateEstimateLineItemInput
): Promise<EstimateLineItem> {
  const supabase = getSupabaseClient();

  const update: {
    description?: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    quantity_source?: EstimateQuantitySource;
    sort_order?: number;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.description !== undefined) {
    update.description = input.description.trim();
  }
  if (input.quantity !== undefined) update.quantity = input.quantity;
  if (input.unit !== undefined) update.unit = input.unit.trim();
  if (input.unitPrice !== undefined) update.unit_price = input.unitPrice;
  if (input.quantitySource !== undefined) {
    update.quantity_source = input.quantitySource;
  }
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  const data = unwrapSingle(
    await supabase
      .from("estimate_line_items")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapEstimateLineItemRow(data);
}

export async function deleteEstimateLineItem(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(
    await supabase.from("estimate_line_items").delete().eq("id", id)
  );
}
