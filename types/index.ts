/** Shared non-entity application types. Domain entities live in lib/domain. */

export type AsyncStatus = "idle" | "loading" | "error";

export type {
  Database,
  LossRow,
  MoistureReadingRow,
  PhotoRow,
  RoomRow,
} from "@/types/database";
export { ROOM_PHOTOS_BUCKET } from "@/types/database";
