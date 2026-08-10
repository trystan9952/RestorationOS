"use client";

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
import type { Loss } from "@/lib/domain/Loss";
import { useTwinStore } from "@/lib/store/useTwinStore";

type DeleteJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loss: Loss | null;
  onDeleted: (wasActive: boolean) => void;
};

export function DeleteJobDialog({
  open,
  onOpenChange,
  loss,
  onDeleted,
}: DeleteJobDialogProps) {
  const deleteLoss = useTwinStore((state) => state.deleteLoss);
  const isDeletingLoss = useTwinStore((state) => state.isDeletingLoss);
  const lossError = useTwinStore((state) => state.lossError);
  const clearLossError = useTwinStore((state) => state.clearLossError);

  async function handleDelete() {
    if (!loss || isDeletingLoss) {
      return;
    }

    clearLossError();

    try {
      const result = await deleteLoss(loss.id);
      onOpenChange(false);
      onDeleted(result.wasActive);
    } catch {
      // lossError is set in the store
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isDeletingLoss) {
          return;
        }
        if (!nextOpen) {
          clearLossError();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={!isDeletingLoss}
        className="bg-slate-900 text-white ring-slate-700 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Delete this job?</DialogTitle>
          <DialogDescription className="text-slate-400">
            This will permanently delete this loss and all associated rooms,
            photos, moisture readings, notes, and equipment.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-3 text-sm text-slate-200">
          <p className="font-medium text-red-300">
            {loss?.address.trim() || "Untitled address"}
          </p>
          <p className="mt-1 text-slate-400">
            {loss?.customer.trim() || "No customer"}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
            <li>Job information</li>
            <li>Rooms</li>
            <li>Photos</li>
            <li>Moisture readings</li>
            <li>Notes</li>
            <li>Equipment</li>
          </ul>
          <p className="mt-3 text-xs text-red-300">This cannot be undone.</p>
        </div>

        {lossError ? (
          <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {lossError}
          </p>
        ) : null}

        <DialogFooter className="border-slate-800 bg-slate-950/60">
          <DialogClose
            disabled={isDeletingLoss}
            render={<Button variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={!loss || isDeletingLoss}
          >
            {isDeletingLoss ? "Deleting..." : "Delete Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
