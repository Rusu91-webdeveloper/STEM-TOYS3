"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export type CodRejectionInput = { reason: string; notes?: string };

export function CodRejectionDialog({
  busy,
  onClose,
  onConfirm,
}: {
  busy: boolean;
  onClose: () => void;
  onConfirm: (input: CodRejectionInput) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(false);

  async function confirm() {
    if (busy || !reason.trim()) return;
    setError(false);
    try {
      if (
        await onConfirm({
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        })
      )
        onClose();
      else setError(true);
    } catch {
      setError(true);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Înregistrează refuzul coletului</DialogTitle>
          <DialogDescription>
            Comanda cu ramburs va fi marcată ca refuzată. Garanția nu este
            încasată prin această acțiune. Verifică eventualele declarații de
            retragere și erori de livrare înainte de confirmare.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="cod-refusal-reason" className="text-sm font-medium">
            Motivul refuzului *
          </label>
          <Textarea
            id="cod-refusal-reason"
            value={reason}
            disabled={busy}
            required
            onChange={event => setReason(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cod-refusal-notes" className="text-sm font-medium">
            Note suplimentare (opțional)
          </label>
          <Textarea
            id="cod-refusal-notes"
            value={notes}
            disabled={busy}
            onChange={event => setNotes(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            Refuzul nu s-a înregistrat. Datele introduse sunt păstrate; încearcă
            din nou.
          </p>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Renunță
          </Button>
          <Button
            variant="destructive"
            disabled={busy || !reason.trim()}
            onClick={confirm}
          >
            {busy ? "Se înregistrează…" : "Confirmă refuzul"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
