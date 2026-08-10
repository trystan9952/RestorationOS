import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { ScopeItem } from "@/lib/domain/ScopeItem";
import { getSupabaseClient } from "@/lib/supabase";
import type { ScopeItemRow } from "@/types/database";

/**
 * Room scope / work-item persistence.
 *
 * TODO: Future Digital Twin may attach scope items to Wall / estimate lines.
 * Wall relationships are intentionally omitted in this MVP.
 */

export type CreateScopeItemInput = {
  lossId: string;
  roomId: string;
  description: string;
};

export type UpdateScopeItemInput = {
  description?: string;
  completed?: boolean;
};

function mapScopeItemRow(row: ScopeItemRow): ScopeItem {
  return {
    id: row.id,
    lossId: row.loss_id,
    roomId: row.room_id,
    description: row.description,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createScopeItem(
  input: CreateScopeItemInput
): Promise<ScopeItem> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("room_scope_items")
      .insert({
        loss_id: input.lossId,
        room_id: input.roomId,
        description: input.description,
        completed: false,
      })
      .select("*")
      .single()
  );

  return mapScopeItemRow(data);
}

/** Fetch scope items for a room (oldest first — checklist order). */
export async function getScopeItems(roomId: string): Promise<ScopeItem[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("room_scope_items")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
  );

  return (data ?? []).map(mapScopeItemRow);
}

export async function updateScopeItem(
  id: string,
  input: UpdateScopeItemInput
): Promise<ScopeItem> {
  const supabase = getSupabaseClient();

  const update: {
    description?: string;
    completed?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.description !== undefined) {
    update.description = input.description;
  }
  if (input.completed !== undefined) {
    update.completed = input.completed;
  }

  const data = unwrapSingle(
    await supabase
      .from("room_scope_items")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapScopeItemRow(data);
}

export async function deleteScopeItem(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(await supabase.from("room_scope_items").delete().eq("id", id));
}
