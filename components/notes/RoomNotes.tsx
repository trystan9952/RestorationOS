"use client";

import { useMemo, useState } from "react";

import type { RoomNote } from "@/lib/domain/RoomNote";
import { useTwinStore } from "@/lib/store/useTwinStore";

type RoomNotesProps = {
  roomId: string;
};

const EMPTY_NOTES: RoomNote[] = [];

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function RoomNotes({ roomId }: RoomNotesProps) {
  const notesForRoom = useTwinStore((state) => state.notesByRoomId[roomId]);
  const notes = notesForRoom ?? EMPTY_NOTES;
  const noteError = useTwinStore((state) => state.noteError);
  const isSavingNote = useTwinStore((state) => state.isSavingNote);
  const saveRoomNote = useTwinStore((state) => state.saveRoomNote);
  const clearNoteError = useTwinStore((state) => state.clearNoteError);

  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const canSave = useMemo(() => draft.trim().length > 0, [draft]);

  async function handleSave() {
    if (isSavingNote) {
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      setFormError("Note cannot be empty.");
      return;
    }

    setFormError(null);
    clearNoteError();

    try {
      await saveRoomNote(roomId, trimmed);
      setDraft("");
    } catch {
      // noteError is set in the store
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold">📝 Notes</h2>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={isSavingNote}
        className="mt-4 h-40 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 disabled:opacity-60"
        placeholder="Inspection notes..."
      />

      {(formError || noteError) && (
        <p className="mt-3 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {formError ?? noteError}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!canSave || isSavingNote}
        className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
      >
        {isSavingNote ? "Saving..." : "Save Note"}
      </button>

      {notes.length === 0 ? (
        <p className="mt-4 text-slate-400">No notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3"
            >
              <p className="whitespace-pre-wrap text-sm text-slate-200">
                {item.note}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {formatCreatedAt(item.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
