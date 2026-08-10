"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScopeItem } from "@/lib/domain/ScopeItem";
import { useTwinStore } from "@/lib/store/useTwinStore";

type RoomScopeProps = {
  roomId: string;
};

/**
 * TODO (future estimating phase): support "Add to Estimate" from a scope item
 * without auto-duplicating scope into estimate_line_items. That flow should
 * create/update an EstimateLineItem via estimateRepository intentionally.
 */

const EMPTY_SCOPE: ScopeItem[] = [];

export function RoomScope({ roomId }: RoomScopeProps) {
  const itemsForRoom = useTwinStore((state) => state.scopeItemsByRoomId[roomId]);
  const items = itemsForRoom ?? EMPTY_SCOPE;
  const scopeError = useTwinStore((state) => state.scopeError);
  const isSavingScope = useTwinStore((state) => state.isSavingScope);
  const isUpdatingScope = useTwinStore((state) => state.isUpdatingScope);
  const isDeletingScope = useTwinStore((state) => state.isDeletingScope);
  const saveScopeItem = useTwinStore((state) => state.saveScopeItem);
  const toggleScopeItem = useTwinStore((state) => state.toggleScopeItem);
  const deleteScopeItem = useTwinStore((state) => state.deleteScopeItem);
  const clearScopeError = useTwinStore((state) => state.clearScopeError);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScopeItem | null>(null);

  const isBusy = isSavingScope || isUpdatingScope || isDeletingScope;
  const canSave = useMemo(() => description.trim().length > 0, [description]);

  function openForm() {
    clearScopeError();
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setDescription("");
    setFormError(null);
  }

  async function handleSave() {
    if (isSavingScope) {
      return;
    }

    const trimmed = description.trim();
    if (!trimmed) {
      setFormError("Scope description is required.");
      return;
    }

    setFormError(null);
    clearScopeError();

    try {
      await saveScopeItem(roomId, trimmed);
      closeForm();
    } catch {
      // scopeError is set in the store
    }
  }

  async function handleToggle(item: ScopeItem) {
    if (isBusy) {
      return;
    }

    clearScopeError();

    try {
      await toggleScopeItem(roomId, item.id);
    } catch {
      // scopeError is set in the store
    }
  }

  async function handleDelete() {
    if (!deleteTarget || isDeletingScope) {
      return;
    }

    clearScopeError();

    try {
      await deleteScopeItem(roomId, deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // scopeError is set in the store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Scope</h2>
        <button
          type="button"
          onClick={openForm}
          disabled={isBusy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          + Add Scope Item
        </button>
      </div>

      {isFormOpen ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
          <div>
            <label
              htmlFor="scope-description"
              className="mb-1 block text-sm text-slate-300"
            >
              Scope description
            </label>
            <input
              id="scope-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Remove wet drywall"
              disabled={isSavingScope}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSave();
                }
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          {(formError || scopeError) && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {formError ?? scopeError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSavingScope}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || isSavingScope}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {isSavingScope ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {!isFormOpen && scopeError && !deleteTarget ? (
        <p className="mt-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {scopeError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-4 text-slate-400">No scope items yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={
                item.completed
                  ? "flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-3 opacity-70"
                  : "flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-3"
              }
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => void handleToggle(item)}
                disabled={isBusy}
                className="mt-1 size-4 accent-blue-500"
                aria-label={`Mark ${item.description} ${item.completed ? "incomplete" : "complete"}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    item.completed
                      ? "text-sm text-slate-400 line-through"
                      : "text-sm text-slate-200"
                  }
                >
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearScopeError();
                  setDeleteTarget(item);
                }}
                disabled={isBusy}
                className="shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingScope) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={!isDeletingScope}
          className="bg-slate-900 text-white ring-slate-700 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Delete scope item?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This removes only this work item from the room. The room and job
              are not deleted.
            </DialogDescription>
          </DialogHeader>

          <p className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
            {deleteTarget?.description}
          </p>

          {scopeError ? (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {scopeError}
            </p>
          ) : null}

          <DialogFooter className="border-slate-800 bg-slate-950/60">
            <DialogClose
              disabled={isDeletingScope}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={!deleteTarget || isDeletingScope}
            >
              {isDeletingScope ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
