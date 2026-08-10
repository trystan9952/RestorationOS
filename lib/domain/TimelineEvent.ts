/**
 * Derived Digital Twin timeline event.
 *
 * Not persisted — built in application code from existing room records
 * (photos, moisture readings, notes, equipment).
 *
 * TODO: Future versions may introduce a true timeline/event history table
 * (e.g. separate equipment placed vs removed events).
 */

export type TimelineEventType =
  | "photo"
  | "moisture"
  | "note"
  | "equipment_placed"
  | "equipment_removed";

type TimelineEventBase = {
  id: string;
  roomId: string;
  timestamp: string;
  title: string;
  description: string;
};

export type PhotoTimelineEvent = TimelineEventBase & {
  type: "photo";
  metadata: {
    originalFilename: string;
    publicUrl: string;
  };
};

export type MoistureTimelineEvent = TimelineEventBase & {
  type: "moisture";
  metadata: {
    material: string;
    reading: number;
    location: string;
  };
};

export type NoteTimelineEvent = TimelineEventBase & {
  type: "note";
  metadata: {
    note: string;
  };
};

export type EquipmentPlacedTimelineEvent = TimelineEventBase & {
  type: "equipment_placed";
  metadata: {
    equipmentType: string;
    assetNumber: string | null;
    location: string;
    status: "running";
  };
};

export type EquipmentRemovedTimelineEvent = TimelineEventBase & {
  type: "equipment_removed";
  metadata: {
    equipmentType: string;
    assetNumber: string | null;
    location: string;
    status: "removed";
  };
};

export type TimelineEvent =
  | PhotoTimelineEvent
  | MoistureTimelineEvent
  | NoteTimelineEvent
  | EquipmentPlacedTimelineEvent
  | EquipmentRemovedTimelineEvent;
