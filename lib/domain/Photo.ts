/** Photo attached to a room (metadata after Storage upload). */
export interface Photo {
  id: string;
  roomId: string;
  storagePath: string;
  url: string;
  createdAt: string;
}
