import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import { getSupabaseClient } from "@/lib/supabase";
import type { PriceCatalogItemRow } from "@/types/database";

/**
 * Global company price catalog persistence.
 *
 * TODO: Scope by authenticated company/tenant before beta.
 * Estimate line items copy values as snapshots — do not add FK dependencies.
 */

export type CreatePriceCatalogItemInput = {
  category: string;
  name: string;
  description?: string | null;
  unit: string;
  unitPrice: number;
  active?: boolean;
  sortOrder?: number;
};

export type UpdatePriceCatalogItemInput = {
  category?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  unitPrice?: number;
  active?: boolean;
  sortOrder?: number;
};

function assertNonBlank(label: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function mapPriceCatalogItemRow(row: PriceCatalogItemRow): PriceCatalogItem {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortCatalogItems(items: PriceCatalogItem[]): PriceCatalogItem[] {
  return [...items].sort((a, b) => {
    const categoryCmp = a.category.localeCompare(b.category);
    if (categoryCmp !== 0) return categoryCmp;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

export async function getPriceCatalogItems(): Promise<PriceCatalogItem[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("price_catalog_items")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
  );

  return sortCatalogItems((data ?? []).map(mapPriceCatalogItemRow));
}

export async function getActivePriceCatalogItems(): Promise<PriceCatalogItem[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("price_catalog_items")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
  );

  return sortCatalogItems((data ?? []).map(mapPriceCatalogItemRow));
}

export async function getPriceCatalogCategories(): Promise<string[]> {
  const items = await getPriceCatalogItems();
  return [...new Set(items.map((item) => item.category))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function createPriceCatalogItem(
  input: CreatePriceCatalogItemInput
): Promise<PriceCatalogItem> {
  const category = assertNonBlank("Category", input.category);
  const name = assertNonBlank("Name", input.name);
  const unit = assertNonBlank("Unit", input.unit);
  const description = input.description?.trim() || null;

  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    throw new Error("Unit price must be a number greater than or equal to 0.");
  }

  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("price_catalog_items")
      .insert({
        category,
        name,
        description,
        unit,
        unit_price: input.unitPrice,
        active: input.active ?? true,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single()
  );

  return mapPriceCatalogItemRow(data);
}

export async function updatePriceCatalogItem(
  id: string,
  input: UpdatePriceCatalogItemInput
): Promise<PriceCatalogItem> {
  const supabase = getSupabaseClient();

  const update: {
    category?: string;
    name?: string;
    description?: string | null;
    unit?: string;
    unit_price?: number;
    active?: boolean;
    sort_order?: number;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.category !== undefined) {
    update.category = assertNonBlank("Category", input.category);
  }
  if (input.name !== undefined) {
    update.name = assertNonBlank("Name", input.name);
  }
  if (input.description !== undefined) {
    update.description = input.description?.trim() || null;
  }
  if (input.unit !== undefined) {
    update.unit = assertNonBlank("Unit", input.unit);
  }
  if (input.unitPrice !== undefined) {
    if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
      throw new Error(
        "Unit price must be a number greater than or equal to 0."
      );
    }
    update.unit_price = input.unitPrice;
  }
  if (input.active !== undefined) update.active = input.active;
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  const data = unwrapSingle(
    await supabase
      .from("price_catalog_items")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapPriceCatalogItemRow(data);
}

export async function setPriceCatalogItemActive(
  id: string,
  active: boolean
): Promise<PriceCatalogItem> {
  return updatePriceCatalogItem(id, { active });
}

export async function deletePriceCatalogItem(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(
    await supabase.from("price_catalog_items").delete().eq("id", id)
  );
}
