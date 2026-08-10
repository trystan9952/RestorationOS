import type { Equipment } from "@/lib/domain/Equipment";
import type { MoistureReading } from "@/lib/domain/MoistureReading";
import type { Photo } from "@/lib/domain/Photo";
import type { Room } from "@/lib/domain/Room";
import type { RoomNote } from "@/lib/domain/RoomNote";
import type { TimelineEventType } from "@/lib/domain/TimelineEvent";
import { buildRoomTimeline } from "@/lib/utils/buildRoomTimeline";

export type LossActivityItem = {
  id: string;
  roomId: string;
  roomName: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
};

export type BuildLossActivityInput = {
  rooms: Room[];
  photosByRoomId: Record<string, Photo[]>;
  moistureByRoomId: Record<string, MoistureReading[]>;
  notesByRoomId: Record<string, RoomNote[]>;
  equipmentByRoomId: Record<string, Equipment[]>;
};

/**
 * Derive newest-first loss activity from existing room records.
 * Reuses buildRoomTimeline — no duplicated event storage.
 */
export function buildLossActivity(
  input: BuildLossActivityInput,
  limit = 10
): LossActivityItem[] {
  const events = input.rooms.flatMap((room) => {
    const timeline = buildRoomTimeline({
      photos: input.photosByRoomId[room.id] ?? [],
      moistureReadings: input.moistureByRoomId[room.id] ?? [],
      notes: input.notesByRoomId[room.id] ?? [],
      equipment: input.equipmentByRoomId[room.id] ?? [],
    });

    return timeline.map((event) => ({
      id: `${event.type}-${event.id}`,
      roomId: room.id,
      roomName: room.name,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
    }));
  });

  return events
    .sort((a, b) => {
      const aTime = Date.parse(a.timestamp);
      const bTime = Date.parse(b.timestamp);

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;

      return bTime - aTime;
    })
    .slice(0, limit);
}
