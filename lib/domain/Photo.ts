/**
 * Photo attached to a room (metadata after Storage upload).
 *
 * TODO: Future Digital Twin will organize photos by Building → Floor → Room → Wall.
 * Wall relationships are intentionally omitted in this MVP.
 */
export interface Photo {
  id: string;
  lossId: string;
  roomId: string;
  storagePath: string;
  publicUrl: string;
  originalFilename: string;
  createdAt: string;
}
