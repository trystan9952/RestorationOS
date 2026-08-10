import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";
import { getSupabaseClient } from "@/lib/supabase";
import type { RoomMeasurementRow } from "@/types/database";

/**
 * Room measurement persistence (one record per room).
 *
 * TODO: Future estimating may consume calculated quantities from these values.
 * Do not duplicate measurement data into estimate_line_items.
 */

export type CreateRoomMeasurementInput = {
  lossId: string;
  roomId: string;
  lengthFt: number;
  widthFt: number;
  ceilingHeightFt: number;
};

export type UpdateRoomMeasurementInput = {
  lengthFt: number;
  widthFt: number;
  ceilingHeightFt: number;
};

function assertPositiveDimension(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a number greater than 0.`);
  }
}

function mapRoomMeasurementRow(row: RoomMeasurementRow): RoomMeasurement {
  return {
    id: row.id,
    lossId: row.loss_id,
    roomId: row.room_id,
    lengthFt: Number(row.length_ft),
    widthFt: Number(row.width_ft),
    ceilingHeightFt: Number(row.ceiling_height_ft),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRoomMeasurement(
  roomId: string
): Promise<RoomMeasurement | null> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("room_measurements")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle()
  );

  return data ? mapRoomMeasurementRow(data) : null;
}

export async function createRoomMeasurement(
  input: CreateRoomMeasurementInput
): Promise<RoomMeasurement> {
  assertPositiveDimension("Length", input.lengthFt);
  assertPositiveDimension("Width", input.widthFt);
  assertPositiveDimension("Ceiling height", input.ceilingHeightFt);

  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("room_measurements")
      .insert({
        loss_id: input.lossId,
        room_id: input.roomId,
        length_ft: input.lengthFt,
        width_ft: input.widthFt,
        ceiling_height_ft: input.ceilingHeightFt,
      })
      .select("*")
      .single()
  );

  return mapRoomMeasurementRow(data);
}

export async function updateRoomMeasurement(
  id: string,
  input: UpdateRoomMeasurementInput
): Promise<RoomMeasurement> {
  assertPositiveDimension("Length", input.lengthFt);
  assertPositiveDimension("Width", input.widthFt);
  assertPositiveDimension("Ceiling height", input.ceilingHeightFt);

  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("room_measurements")
      .update({
        length_ft: input.lengthFt,
        width_ft: input.widthFt,
        ceiling_height_ft: input.ceilingHeightFt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapRoomMeasurementRow(data);
}

export async function deleteRoomMeasurement(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(
    await supabase.from("room_measurements").delete().eq("id", id)
  );
}
