/** Shared non-entity application types. Domain entities live in lib/domain. */

export type AsyncStatus = "idle" | "loading" | "error";

export type { Database, LossRow, RoomRow } from "@/types/database";
