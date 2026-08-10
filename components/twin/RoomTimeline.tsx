"use client";

import { useMemo } from "react";

import type { Equipment } from "@/lib/domain/Equipment";
import type { MoistureReading } from "@/lib/domain/MoistureReading";
import type { Photo } from "@/lib/domain/Photo";
import type { RoomNote } from "@/lib/domain/RoomNote";
import type { TimelineEvent } from "@/lib/domain/TimelineEvent";
import { useTwinStore } from "@/lib/store/useTwinStore";
import { buildRoomTimeline } from "@/lib/utils/buildRoomTimeline";

type RoomTimelineProps = {
  roomId: string;
};

const EMPTY_PHOTOS: Photo[] = [];
const EMPTY_MOISTURE: MoistureReading[] = [];
const EMPTY_NOTES: RoomNote[] = [];
const EMPTY_EQUIPMENT: Equipment[] = [];

function eventIcon(type: TimelineEvent["type"]): string {
  switch (type) {
    case "photo":
      return "📸";
    case "moisture":
      return "💧";
    case "note":
      return "📝";
    case "equipment_placed":
    case "equipment_removed":
      return "📦";
  }
}

function formatEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toISOString().slice(0, 10);
}

export function RoomTimeline({ roomId }: RoomTimelineProps) {
  const photosForRoom = useTwinStore((state) => state.photosByRoomId[roomId]);
  const moistureForRoom = useTwinStore(
    (state) => state.moistureByRoomId[roomId]
  );
  const notesForRoom = useTwinStore((state) => state.notesByRoomId[roomId]);
  const equipmentForRoom = useTwinStore(
    (state) => state.equipmentByRoomId[roomId]
  );

  const photos = photosForRoom ?? EMPTY_PHOTOS;
  const moistureReadings = moistureForRoom ?? EMPTY_MOISTURE;
  const notes = notesForRoom ?? EMPTY_NOTES;
  const equipment = equipmentForRoom ?? EMPTY_EQUIPMENT;

  const events = useMemo(
    () =>
      buildRoomTimeline({
        photos,
        moistureReadings,
        notes,
        equipment,
      }),
    [equipment, moistureReadings, notes, photos]
  );

  const groups = useMemo(() => {
    const byDate = new Map<string, TimelineEvent[]>();

    for (const event of events) {
      const key = dateKey(event.timestamp);
      const existing = byDate.get(key);
      if (existing) {
        existing.push(event);
      } else {
        byDate.set(key, [event]);
      }
    }

    return Array.from(byDate.entries()).map(([key, items]) => ({
      key,
      label: formatEventDate(items[0]!.timestamp),
      items,
    }));
  }, [events]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-6 text-2xl font-bold">Timeline</h2>

      {events.length === 0 ? (
        <p className="text-slate-400">No activity recorded yet.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
                {group.label}
              </h3>
              <ol className="space-y-4 border-l border-slate-700 pl-4">
                {group.items.map((event) => (
                  <li key={`${event.type}-${event.id}`} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-500" />
                    <p className="text-xs text-slate-500">
                      {formatEventTime(event.timestamp)}
                    </p>
                    <p className="mt-1 font-medium">
                      {eventIcon(event.type)} {event.title}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
                      {event.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
