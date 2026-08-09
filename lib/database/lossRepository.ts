import { unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { Loss, LossStatus } from "@/lib/domain/Loss";
import { getSupabaseClient } from "@/lib/supabase";
import type { Database, LossRow } from "@/types/database";

type LossUpdate = Database["public"]["Tables"]["losses"]["Update"];

export type CreateLossInput = {
  address: string;
  customer: string;
  phone: string;
  insurance: string;
  claimNumber: string;
  status?: LossStatus;
};

export type UpdateLossInput = {
  address?: string;
  customer?: string;
  phone?: string;
  insurance?: string;
  claimNumber?: string;
  status?: LossStatus;
};

function mapLossRow(row: LossRow): Loss {
  return {
    id: row.id,
    address: row.address,
    customer: row.customer,
    phone: row.phone,
    insurance: row.insurance,
    claimNumber: row.claim_number,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createLoss(input: CreateLossInput): Promise<Loss> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("losses")
      .insert({
        address: input.address,
        customer: input.customer,
        phone: input.phone,
        insurance: input.insurance,
        claim_number: input.claimNumber,
        status: input.status ?? "Initializing",
      })
      .select("*")
      .single()
  );

  return mapLossRow(data);
}

/** Fetch a single loss by id. */
export async function getLoss(id: string): Promise<Loss | null> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase.from("losses").select("*").eq("id", id).maybeSingle()
  );

  return data ? mapLossRow(data) : null;
}

/** @deprecated Prefer getLoss — kept for existing callers. */
export const getLossById = getLoss;

export async function listLosses(): Promise<Loss[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("losses")
      .select("*")
      .order("created_at", { ascending: false })
  );

  return (data ?? []).map(mapLossRow);
}

export async function updateLoss(
  id: string,
  input: UpdateLossInput
): Promise<Loss> {
  const supabase = getSupabaseClient();

  const update: LossUpdate = {};
  if (input.address !== undefined) update.address = input.address;
  if (input.customer !== undefined) update.customer = input.customer;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.insurance !== undefined) update.insurance = input.insurance;
  if (input.claimNumber !== undefined) update.claim_number = input.claimNumber;
  if (input.status !== undefined) update.status = input.status;

  const data = unwrapSingle(
    await supabase
      .from("losses")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapLossRow(data);
}

export async function deleteLoss(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  unwrapQuery(await supabase.from("losses").delete().eq("id", id));
}
