import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { MoistureReading } from "@/lib/domain/MoistureReading";
import { getSupabaseClient } from "@/lib/supabase";
import type { MoistureReadingRow } from "@/types/database";

/**
 * Moisture reading persistence.
 *
 * TODO: Future Digital Twin may attach readings to Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */

export type CreateMoistureReadingInput = {
  lossId: string;
  roomId: string;
  material: string;
  reading: number;
  location: string;
};

function mapMoistureReadingRow(row: MoistureReadingRow): MoistureReading {
  return {
    id: row.id,
    lossId: row.loss_id,
    roomId: row.room_id,
    material: row.material,
    reading: Number(row.reading),
    location: row.location,
    createdAt: row.created_at,
  };
}

export async function createMoistureReading(
  input: CreateMoistureReadingInput
): Promise<MoistureReading> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("moisture_readings")
      .insert({
        loss_id: input.lossId,
        room_id: input.roomId,
        material: input.material,
        reading: input.reading,
        location: input.location,
      })
      .select("*")
      .single()
  );

  return mapMoistureReadingRow(data);
}

/** Fetch moisture readings for a room (newest first). */
export async function getMoistureReadings(
  roomId: string
): Promise<MoistureReading[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("moisture_readings")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
  );

  return (data ?? []).map(mapMoistureReadingRow);
}

/** @deprecated Prefer getMoistureReadings */
export const listMoistureReadingsByRoomId = getMoistureReadings;

export async function deleteMoistureReading(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(
    await supabase.from("moisture_readings").delete().eq("id", id)
  );
}
