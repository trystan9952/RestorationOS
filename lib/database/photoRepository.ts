import type { Photo } from "@/lib/domain/Photo";

/**
 * Photo persistence stubs.
 *
 * TODO: Do not create the photos table yet.
 * Future Digital Twin will organize photos by Building → Floor → Room → Wall.
 * Implement Storage upload + metadata persistence after that hierarchy exists.
 */

export type CreatePhotoInput = {
  roomId: string;
  storagePath: string;
  url: string;
};

export type UpdatePhotoInput = {
  storagePath?: string;
  url?: string;
};

export async function createPhoto(_input: CreatePhotoInput): Promise<Photo> {
  // TODO: Upload photo to Supabase Storage and persist metadata
  // (Building → Floor → Room → Wall hierarchy — not implemented yet)
  throw new Error(
    "TODO: Photos table deferred until Digital Twin photo hierarchy (Building → Floor → Room → Wall)"
  );
}

export async function getPhotos(_roomId: string): Promise<Photo[]> {
  // TODO: Load photos once Building → Floor → Room → Wall model exists
  return [];
}

/** @deprecated Prefer getPhotos */
export const listPhotosByRoomId = getPhotos;

export async function getPhotoById(_id: string): Promise<Photo | null> {
  // TODO: Load photo by id once photos schema exists
  return null;
}

export async function updatePhoto(
  _id: string,
  _input: UpdatePhotoInput
): Promise<Photo> {
  // TODO: Update photo metadata once photos schema exists
  throw new Error(
    "TODO: Photos table deferred until Digital Twin photo hierarchy (Building → Floor → Room → Wall)"
  );
}

export async function deletePhoto(_id: string): Promise<void> {
  // TODO: Delete photo metadata (and Storage object) once photos schema exists
  throw new Error(
    "TODO: Photos table deferred until Digital Twin photo hierarchy (Building → Floor → Room → Wall)"
  );
}
