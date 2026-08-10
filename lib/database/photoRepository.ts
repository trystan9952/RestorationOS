import { DatabaseError, unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type { Photo } from "@/lib/domain/Photo";
import { getSupabaseClient } from "@/lib/supabase";
import {
  ROOM_PHOTOS_BUCKET,
  type Database,
  type PhotoRow,
} from "@/types/database";

/**
 * Photo metadata + Storage uploads.
 *
 * TODO: Future Digital Twin will organize photos by Building → Floor → Room → Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */

export type CreatePhotoInput = {
  lossId: string;
  roomId: string;
  storagePath: string;
  publicUrl: string;
  originalFilename: string;
};

export type UpdatePhotoInput = {
  storagePath?: string;
  publicUrl?: string;
  originalFilename?: string;
};

export type UploadRoomPhotoInput = {
  lossId: string;
  roomId: string;
  file: File;
};

type PhotoUpdate = Database["public"]["Tables"]["photos"]["Update"];

function mapPhotoRow(row: PhotoRow): Photo {
  return {
    id: row.id,
    lossId: row.loss_id,
    roomId: row.room_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    originalFilename: row.original_filename,
    createdAt: row.created_at,
  };
}

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim() || "photo";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createPhoto(input: CreatePhotoInput): Promise<Photo> {
  const supabase = getSupabaseClient();

  const data = unwrapSingle(
    await supabase
      .from("photos")
      .insert({
        loss_id: input.lossId,
        room_id: input.roomId,
        storage_path: input.storagePath,
        public_url: input.publicUrl,
        original_filename: input.originalFilename,
      })
      .select("*")
      .single()
  );

  return mapPhotoRow(data);
}

/**
 * Upload a file to the room-photos bucket, then persist photo metadata.
 */
export async function uploadRoomPhoto(
  input: UploadRoomPhotoInput
): Promise<Photo> {
  const supabase = getSupabaseClient();
  const safeName = sanitizeFilename(input.file.name);
  const storagePath = `${input.lossId}/${input.roomId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(ROOM_PHOTOS_BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new DatabaseError(uploadError.message, uploadError);
  }

  const { data: publicData } = supabase.storage
    .from(ROOM_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);

  return createPhoto({
    lossId: input.lossId,
    roomId: input.roomId,
    storagePath,
    publicUrl: publicData.publicUrl,
    originalFilename: input.file.name,
  });
}

/** Fetch all photos for a room (ordered by created_at). */
export async function getPhotos(roomId: string): Promise<Photo[]> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("photos")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
  );

  return (data ?? []).map(mapPhotoRow);
}

/** @deprecated Prefer getPhotos */
export const listPhotosByRoomId = getPhotos;

export async function getPhotoById(id: string): Promise<Photo | null> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase.from("photos").select("*").eq("id", id).maybeSingle()
  );

  return data ? mapPhotoRow(data) : null;
}

export async function updatePhoto(
  id: string,
  input: UpdatePhotoInput
): Promise<Photo> {
  const supabase = getSupabaseClient();

  const update: PhotoUpdate = {};
  if (input.storagePath !== undefined) update.storage_path = input.storagePath;
  if (input.publicUrl !== undefined) update.public_url = input.publicUrl;
  if (input.originalFilename !== undefined) {
    update.original_filename = input.originalFilename;
  }

  const data = unwrapSingle(
    await supabase
      .from("photos")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()
  );

  return mapPhotoRow(data);
}

export async function deletePhoto(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const existing = await getPhotoById(id);
  if (existing) {
    const { error: storageError } = await supabase.storage
      .from(ROOM_PHOTOS_BUCKET)
      .remove([existing.storagePath]);

    if (storageError) {
      throw new DatabaseError(storageError.message, storageError);
    }
  }

  unwrapQuery(await supabase.from("photos").delete().eq("id", id));
}
