"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  const [open, setOpen] = useState<"none" | "approve" | "reject">("none");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: "APPROVED" | "REJECTED") {
    try {
      setLoading(true);
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
      // Simple reload to reflect changes
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to update product status");
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
        disabled={disabled}
        onClick={() => setOpen("approve")}
      >
        Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen("reject")}
      >
        Reject
      </Button>

      <Dialog open={open === "approve"} onOpenChange={() => setOpen("none")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve product</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen("none")}>
              Cancel
            </Button>
            <Button onClick={() => updateStatus("APPROVED")} disabled={loading}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "reject"} onOpenChange={() => setOpen("none")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject product</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Optional rejection reason (shown to supplier)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen("none")}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatus("REJECTED")}
              disabled={loading}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
