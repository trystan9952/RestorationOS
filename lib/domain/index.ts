export type { Building } from "@/lib/domain/Building";
export type { Equipment, EquipmentStatus } from "@/lib/domain/Equipment";
export type { Estimate } from "@/lib/domain/Estimate";
export type { EstimateArea } from "@/lib/domain/EstimateArea";
export type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
export type { EstimateQuantitySource } from "@/lib/domain/EstimateQuantitySource";
export {
  ESTIMATE_QUANTITY_SOURCES,
  MEASUREMENT_QUANTITY_SOURCES,
  formatQuantitySourceLabel,
  isEstimateQuantitySource,
} from "@/lib/domain/EstimateQuantitySource";
export type { Loss, LossStatus, LossType } from "@/lib/domain/Loss";
export { LOSS_STATUSES, LOSS_TYPES } from "@/lib/domain/Loss";
export type { MoistureReading } from "@/lib/domain/MoistureReading";
export type { Photo } from "@/lib/domain/Photo";
export type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
export type { Room, RoomCategory, RoomClass } from "@/lib/domain/Room";
export type { RoomMeasurement } from "@/lib/domain/RoomMeasurement";
export type { RoomNote } from "@/lib/domain/RoomNote";
export type { ScopeItem } from "@/lib/domain/ScopeItem";
export type {
  EquipmentPlacedTimelineEvent,
  EquipmentRemovedTimelineEvent,
  MoistureTimelineEvent,
  NoteTimelineEvent,
  PhotoTimelineEvent,
  TimelineEvent,
  TimelineEventType,
} from "@/lib/domain/TimelineEvent";
