"use client";

import { useEffect, useState } from "react";

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
import type { EstimateDocumentData } from "@/lib/utils/estimateDocument";

type EmailEstimateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateId: string;
  document: EstimateDocumentData;
};

function buildDefaultSubject(document: EstimateDocumentData): string {
  return `Estimate from ${document.company.name} — ${document.estimate.estimateNumber}`;
}

function buildDefaultMessage(document: EstimateDocumentData): string {
  const customer = document.loss.customer.trim() || "Customer";
  return `Hello ${customer},\n\nPlease find your estimate attached.\n\nThank you,\n${document.company.name}`;
}

export function EmailEstimateDialog({
  open,
  onOpenChange,
  estimateId,
  document,
}: EmailEstimateDialogProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTo("");
    setSubject(buildDefaultSubject(document));
    setMessage(buildDefaultMessage(document));
    setError(null);
    setSuccess(false);
    setSending(false);
  }, [open, document]);

  async function handleSend() {
    if (sending) {
      return;
    }

    setError(null);
    setSuccess(false);
    setSending(true);

    try {
      const response = await fetch(`/api/estimates/${estimateId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to email estimate.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to email estimate.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Email Estimate</DialogTitle>
          <DialogDescription className="text-slate-400">
            Sends a PDF of this estimate. Totals are generated from saved
            estimate data.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-3 text-sm text-emerald-300">
            Estimate emailed successfully.
          </div>
        ) : (
          <div className="grid gap-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">To</span>
              <input
                type="email"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                autoComplete="email"
                required
                disabled={sending}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={sending}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                disabled={sending}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </label>
          </div>
        )}

        {error ? (
          <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />} disabled={sending}>
            {success ? "Done" : "Cancel"}
          </DialogClose>
          {!success ? (
            <Button onClick={() => void handleSend()} disabled={sending}>
              {sending ? "Sending..." : "Send Email"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
