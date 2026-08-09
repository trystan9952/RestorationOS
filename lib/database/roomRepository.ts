import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { Room, RoomCategory, RoomClass } from "@/lib/domain/Room";
import { getSupabaseClient } from "@/lib/supabase";
import type { Database, RoomRow } from "@/types/database";

type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];

export type CreateRoomInput = {
  lossId: string;
  name: string;
  floor?: number;
  category?: RoomCategory;
  class?: RoomClass;
  affected?: boolean;
};

export type UpdateRoomInput = {
  name?: string;
  floor?: number;
  category?: RoomCategory;
  class?: RoomClass;
  affected?: boolean;
};

function mapRoomRow(row: RoomRow): Room {
  return {
    id: row.id,
    lossId: row.loss_id,
    name: row.name,
    floor: row.floor,
    category: row.category as RoomCategory,
    class: row.class as RoomClass,
    affected: row.affected,
    createdAt: row.created_at,
  };
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("rooms")
      .insert({
        loss_id: input.lossId,
        name: input.name,
        floor: input.floor ?? 1,
        category: input.category ?? 1,
        class: input.class ?? 1,
        affected: input.affected ?? true,
      })
      .select("*")
      .single()
  );

  return mapRoomRow(data);
}

/** Fetch all rooms for a loss (ordered by created_at). */
export async function getRooms(lossId: string): Promise<Room[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("rooms")
      .select("*")
      .eq("loss_id", lossId)
      .order("created_at", { ascending: true })
  );

  return (data ?? []).map(mapRoomRow);
}

/** @deprecated Prefer getRooms — kept for existing callers. */
export const listRoomsByLossId = getRooms;

export async function getRoomById(id: string): Promise<Room | null> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase.from("rooms").select("*").eq("id", id).maybeSingle()
  );

  return data ? mapRoomRow(data) : null;
}

export async function updateRoom(
  id: string,
  input: UpdateRoomInput
): Promise<Room> {
  const supabase = getSupabaseClient();

  const update: RoomUpdate = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.floor !== undefined) update.floor = input.floor;
  if (input.category !== undefined) update.category = input.category;
  if (input.class !== undefined) update.class = input.class;
  if (input.affected !== undefined) update.affected = input.affected;

  const data = unwrapSingle(
    await supabase
      .from("rooms")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapRoomRow(data);
}

export async function deleteRoom(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(await supabase.from("rooms").delete().eq("id", id));
}
