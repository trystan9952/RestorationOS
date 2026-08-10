import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { Equipment, EquipmentStatus } from "@/lib/domain/Equipment";
import { getSupabaseClient } from "@/lib/supabase";
import type { EquipmentRow } from "@/types/database";

/**
 * Equipment persistence.
 *
 * TODO: Future Digital Twin may attach equipment to Wall and track runtime/logs.
 * Wall relationships are intentionally omitted in this MVP.
 */

export type CreateEquipmentInput = {
  lossId: string;
  roomId: string;
  equipmentType: string;
  assetNumber?: string | null;
  status: EquipmentStatus;
  location: string;
  placedAt?: string;
};

function mapEquipmentRow(row: EquipmentRow): Equipment {
  return {
    id: row.id,
    lossId: row.loss_id,
    roomId: row.room_id,
    equipmentType: row.equipment_type,
    assetNumber: row.asset_number,
    status: row.status as EquipmentStatus,
    location: row.location,
    placedAt: row.placed_at,
    createdAt: row.created_at,
  };
}

export async function createEquipment(
  input: CreateEquipmentInput
): Promise<Equipment> {
  const supabase = getSupabaseClient();

  const assetNumber = input.assetNumber?.trim()
    ? input.assetNumber.trim()
    : null;

  const data = unwrapSingle(
    await supabase
      .from("equipment")
      .insert({
        loss_id: input.lossId,
        room_id: input.roomId,
        equipment_type: input.equipmentType,
        asset_number: assetNumber,
        status: input.status,
        location: input.location,
        ...(input.placedAt ? { placed_at: input.placedAt } : {}),
      })
      .select("*")
      .single()
  );

  return mapEquipmentRow(data);
}

/** Fetch equipment for a room (newest placement first). */
export async function getEquipment(roomId: string): Promise<Equipment[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("equipment")
      .select("*")
      .eq("room_id", roomId)
      .order("placed_at", { ascending: false })
  );

  return (data ?? []).map(mapEquipmentRow);
}

export async function updateEquipmentStatus(
  id: string,
  status: EquipmentStatus
): Promise<Equipment> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("equipment")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapEquipmentRow(data);
}

/** @deprecated Prefer getEquipment */
export const listEquipmentByRoomId = getEquipment;

export async function deleteEquipment(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(await supabase.from("equipment").delete().eq("id", id));
}
