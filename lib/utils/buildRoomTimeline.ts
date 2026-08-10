import type { Equipment } from "@/lib/domain/Equipment";
import type { MoistureReading } from "@/lib/domain/MoistureReading";
import type { Photo } from "@/lib/domain/Photo";
import type { RoomNote } from "@/lib/domain/RoomNote";
import type { TimelineEvent } from "@/lib/domain/TimelineEvent";

export type BuildRoomTimelineInput = {
  photos: Photo[];
  moistureReadings: MoistureReading[];
  notes: RoomNote[];
  equipment: Equipment[];
};

function equipmentLabel(item: Equipment): string {
  const asset = item.assetNumber?.trim();
  const name = asset
    ? `${item.equipmentType} ${asset}`
    : item.equipmentType;

  return `${name} — ${item.location}`;
}

function photoEvent(photo: Photo): TimelineEvent {
  return {
    id: photo.id,
    roomId: photo.roomId,
    type: "photo",
    timestamp: photo.createdAt,
    title: "Photo added",
    description: photo.originalFilename || "Photo",
    metadata: {
      originalFilename: photo.originalFilename,
      publicUrl: photo.publicUrl,
    },
  };
}

function moistureEvent(reading: MoistureReading): TimelineEvent {
  return {
    id: reading.id,
    roomId: reading.roomId,
    type: "moisture",
    timestamp: reading.createdAt,
    title: "Moisture reading",
    description: `${reading.material} — ${reading.reading}% — ${reading.location}`,
    metadata: {
      material: reading.material,
      reading: reading.reading,
      location: reading.location,
    },
  };
}

function noteEvent(note: RoomNote): TimelineEvent {
  return {
    id: note.id,
    roomId: note.roomId,
    type: "note",
    timestamp: note.createdAt,
    title: "Note added",
    description: note.note,
    metadata: {
      note: note.note,
    },
  };
}

function equipmentEvent(item: Equipment): TimelineEvent {
  const description = equipmentLabel(item);

  if (item.status === "removed") {
    return {
      id: item.id,
      roomId: item.roomId,
      type: "equipment_removed",
      timestamp: item.placedAt,
      title: "Equipment removed",
      description,
      metadata: {
        equipmentType: item.equipmentType,
        assetNumber: item.assetNumber,
        location: item.location,
        status: "removed",
      },
    };
  }

  return {
    id: item.id,
    roomId: item.roomId,
    type: "equipment_placed",
    timestamp: item.placedAt,
    title: "Equipment placed",
    description,
    metadata: {
      equipmentType: item.equipmentType,
      assetNumber: item.assetNumber,
      location: item.location,
      status: "running",
    },
  };
}

/**
 * Derive a newest-first Digital Twin timeline from existing room records.
 * Source tables remain the source of truth — nothing is duplicated.
 */
export function buildRoomTimeline(
  input: BuildRoomTimelineInput
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...input.photos.map(photoEvent),
    ...input.moistureReadings.map(moistureEvent),
    ...input.notes.map(noteEvent),
    ...input.equipment.map(equipmentEvent),
  ];

  return events.sort((a, b) => {
    const aTime = Date.parse(a.timestamp);
    const bTime = Date.parse(b.timestamp);

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;

    return bTime - aTime;
  });
}
