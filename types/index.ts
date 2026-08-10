/** Shared non-entity application types. Domain entities live in lib/domain. */

export type AsyncStatus = "idle" | "loading" | "error";

export type {
  Database,
  EquipmentRow,
  EstimateAreaRow,
  EstimateLineItemRow,
  EstimateRow,
  LossRow,
  LossStatus,
  LossType,
  MoistureReadingRow,
  PhotoRow,
  PriceCatalogItemRow,
  RoomMeasurementRow,
  RoomNoteRow,
  RoomRow,
  ScopeItemRow,
} from "@/types/database";
export { ROOM_PHOTOS_BUCKET } from "@/types/database";
