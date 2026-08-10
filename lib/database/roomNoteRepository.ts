import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { RoomNote } from "@/lib/domain/RoomNote";
import { getSupabaseClient } from "@/lib/supabase";
import type { RoomNoteRow } from "@/types/database";

/**
 * Room note persistence.
 *
 * TODO: Future Digital Twin may attach notes to Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */

export type CreateRoomNoteInput = {
  lossId: string;
  roomId: string;
  note: string;
};

function mapRoomNoteRow(row: RoomNoteRow): RoomNote {
  return {
    id: row.id,
    lossId: row.loss_id,
    roomId: row.room_id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRoomNote(
  input: CreateRoomNoteInput
): Promise<RoomNote> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("room_notes")
      .insert({
        loss_id: input.lossId,
        room_id: input.roomId,
        note: input.note,
      })
      .select("*")
      .single()
  );

  return mapRoomNoteRow(data);
}

/** Fetch room notes for a room (newest first). */
export async function getRoomNotes(roomId: string): Promise<RoomNote[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("room_notes")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
  );

  return (data ?? []).map(mapRoomNoteRow);
}
