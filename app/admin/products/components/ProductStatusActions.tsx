"use client";

import { useRouter } from "next/navigation";
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

export function ProductStatusActions({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<"none" | "approve" | "reject">("none");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: "APPROVED" | "REJECTED") {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          reason: next === "REJECTED" ? reason : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOpen("none");
      setReason("");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Starea produsului nu s-a salvat. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        className="bg-green-600 hover:bg-green-700 text-white"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setOpen("approve")}
      >
        Aprobă
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setOpen("reject")}
      >
        Respinge
      </Button>

      <Dialog
        open={open === "approve"}
        onOpenChange={() => {
          if (!loading) setOpen("none");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobă produsul</DialogTitle>
            <DialogDescription>
              Confirmă aprobarea produsului pentru catalog.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setOpen("none")}
            >
              Renunță
            </Button>
            <Button onClick={() => updateStatus("APPROVED")} disabled={loading}>
              Confirmă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={open === "reject"}
        onOpenChange={() => {
          if (!loading) setOpen("none");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge produsul</DialogTitle>
            <DialogDescription>
              Furnizorul poate vedea motivul respingerii.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Textarea
            aria-label="Motivul respingerii"
            placeholder="Motivul respingerii (opțional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setOpen("none")}
            >
              Renunță
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatus("REJECTED")}
              disabled={loading}
            >
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
