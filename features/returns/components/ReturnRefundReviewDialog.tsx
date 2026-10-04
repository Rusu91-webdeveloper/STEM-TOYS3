"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { isStripePaymentMethod } from "@/lib/orders/customer-order-display";
import { manualRefundProofSchema } from "@/lib/returns/manual-refund-proof";
import { RETURN_POLICY_REFUND_RO } from "@/lib/returns/policy";
import { refundReviewSchema } from "@/lib/returns/reviewed-stripe-refund";

export type RefundReviewTarget = {
  id: string;
  order: {
    orderNumber: string;
    total: number;
    shippingCost: number;
    discountAmount: number;
    paymentMethod: string;
  };
  orderItem: { name: string; price: number; quantity: number };
};

export function ReturnRefundReviewDialog({
  target,
  onClose,
  onUpdated,
}: {
  target: RefundReviewTarget;
  onClose: () => void;
  onUpdated: (record: unknown) => void;
}) {
  const csrf = useCsrfToken();
  const isStripe = isStripePaymentMethod(target.order.paymentMethod);
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [agreedMethod, setAgreedMethod] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const review = refundReviewSchema.safeParse({
      amountRon: Number(amount.replace(",", ".")),
      notes,
      confirmed,
    });
    if (!review.success) {
      setError(
        "Introdu suma exactă în lei, explicația calculului (minimum 10 caractere) și confirmă verificarea."
      );
      return;
    }
    const manual = isStripe
      ? null
      : manualRefundProofSchema.safeParse({
          review: review.data,
          reference,
          paidAt: paidAt ? new Date(paidAt).toISOString() : "",
          agreedMethodAndNoFees: agreedMethod,
        });
    if (manual?.success === false) {
      setError(
        "Confirmă dovada plății deja efectuate, data și modalitatea acceptată de client, fără costuri suplimentare."
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/returns/${target.id}/status`, {
        method: "PATCH",
        headers: csrf.addToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          status: "REFUNDED",
          ...(isStripe
            ? { refundReview: review.data }
            : {
                manualRefundProof:
                  manual?.success ? manual.data : null,
              }),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.refundError ?? result.error ?? "Rambursarea nu s-a finalizat."
        );
      onUpdated(result.return);
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Rambursarea a eșuat."
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Verificarea rambursării — {target.order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Verifică suma datorată și dovada rambursării înainte de a actualiza returul.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {target.orderItem.name}:{" "}
          {(target.orderItem.price * target.orderItem.quantity).toFixed(2)} lei
          înainte de alocarea reducerilor. Total comandă:{" "}
          {target.order.total.toFixed(2)} lei; livrare:{" "}
          {target.order.shippingCost.toFixed(2)} lei; reducere:{" "}
          {target.order.discountAmount.toFixed(2)} lei.
        </p>
        <p className="text-sm">{RETURN_POLICY_REFUND_RO}</p>
        <p className="text-sm">
          Verifică declarația, întinderea retragerii, primirea bunurilor sau
          dovada expedierii și rambursările anterioare în procesator. Nu aștepta
          recuperarea banilor de la furnizor pentru a respecta termenul
          clientului. Pentru COD/Netopia efectuează separat rambursarea și
          înregistrează aici referința dovezii. Acest formular nu transferă bani
          pentru rambursările manuale.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            Suma exactă de rambursat (lei)
            <input
              className="block w-full rounded border p-2"
              inputMode="decimal"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              required
            />
          </label>
          <label className="block">
            Explicația calculului
            <textarea
              className="block w-full rounded border p-2"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              minLength={10}
              maxLength={500}
              required
              placeholder="Produse, reduceri, livrare standard inclusă sau motivul excluderii, rambursări anterioare."
            />
          </label>
          {!isStripe && (
            <>
              <label className="block">
                Referința dovezii rambursării efectuate
                <input
                  className="block w-full rounded border p-2"
                  value={reference}
                  onChange={event => setReference(event.target.value)}
                  required
                  minLength={5}
                  maxLength={150}
                />
              </label>
              <label className="block">
                Data și ora plății
                <input
                  className="block w-full rounded border p-2"
                  type="datetime-local"
                  value={paidAt}
                  onChange={event => setPaidAt(event.target.value)}
                  required
                />
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreedMethod}
                  onChange={event => setAgreedMethod(event.target.checked)}
                />
                Confirm plata efectivă prin modalitatea inițială sau acceptată
                expres de client, fără costuri suplimentare pentru acesta. Am
                verificat dovezile și rambursările anterioare.
              </label>
            </>
          )}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)}
            />
            Am verificat drepturile clientului și suma datorată; nu aplic taxe
            automate pentru retragere.
          </label>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={
              busy || !csrf.token || !confirmed || (!isStripe && !agreedMethod)
            }
          >
            {busy
              ? "Se verifică…"
              : isStripe
                ? "Confirmă rambursarea Stripe"
                : "Înregistrează rambursarea deja efectuată"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
