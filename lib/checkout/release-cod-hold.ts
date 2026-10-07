import { parseCodGuaranteeEvidence } from "@/lib/checkout/cod-guarantee";
import {
  settleCodHold,
  type CodHoldEvent,
  type CodHoldOutcome,
} from "@/lib/checkout/cod-hold-settlement";
import { db } from "@/lib/db";
import { getStripeServerClient } from "@/lib/stripe-server";

async function recordOutcome(orderId: string, marker: string, details: string) {
  // Read current notes and compare-and-swap: a courier/admin update must not
  // lose a cancellation reason, authorization evidence or another audit entry.
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await db.order.findUnique({
      where: { id: orderId },
      select: { notes: true },
    });
    if (!current) throw new Error("Order missing during hold settlement");
    if (current.notes?.includes(marker)) {
      if (marker.endsWith("Outcome: retry_required"))
        await db.order.updateMany({
          where: { id: orderId, notes: current.notes },
          data: { updatedAt: new Date() },
        });
      return;
    }
    const changed = await db.order.updateMany({
      where: { id: orderId, notes: current.notes },
      data: {
        notes: [current.notes, `${marker}${details}`]
          .filter(Boolean)
          .join(" | "),
      },
    });
    if (changed.count) return;
  }
  throw new Error("Order changed during hold settlement; retry required");
}

export async function releaseCodGuaranteeHoldIfNeeded(params: {
  orderId: string;
  notes?: string | null;
  event?: CodHoldEvent;
}): Promise<{ outcome: CodHoldOutcome }> {
  const paymentIntentId = parseCodGuaranteeEvidence(
    params.notes
  ).authorizedPaymentIntentId;
  if (!paymentIntentId) return { outcome: "not_required" };
  try {
    const result = await settleCodHold(getStripeServerClient(), {
      paymentIntentId,
      orderId: params.orderId,
    });
    await recordOutcome(
      params.orderId,
      `COD Guarantee settlement - PI: ${paymentIntentId} - Outcome: ${result.outcome}`,
      ` - Event: ${params.event ?? "delivery"} - At: ${new Date().toISOString()} - Expires: ${result.expiresAt ?? "unknown"}`
    );
    return result;
  } catch {
    console.error(
      `COD hold settlement requires retry for order ${params.orderId}`
    );
    await recordOutcome(
      params.orderId,
      `COD Guarantee settlement - PI: ${paymentIntentId} - Outcome: retry_required`,
      ` - Event: ${params.event ?? "delivery"} - At: ${new Date().toISOString()}`
    ).catch(() =>
      console.error(`COD hold audit unavailable for order ${params.orderId}`)
    );
    return { outcome: "retry_required" };
  }
}

/** Retry terminal COD holds from the existing authenticated daily worker. */
export async function reconcileTerminalCodHolds() {
  const outcomes: Record<string, number> = {};
  const orders = await db.order.findMany({
    where: {
      paymentMethod: { in: ["cash_on_delivery", "cod"] },
      status: { in: ["DELIVERED", "COMPLETED", "CANCELLED"] },
      notes: { contains: "COD Guarantee authorized at" },
      NOT: [
        "released",
        "expired",
        "already_released",
        "captured_review",
        "review_required",
      ].map(outcome => ({
        notes: { contains: ` - Outcome: ${outcome}` },
      })),
    },
    select: { id: true, notes: true, status: true },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: 3,
  });
  let checked = 0;
  const deadline = Date.now() + 8000;
  for (const order of orders) {
    if (Date.now() >= deadline) break;
    checked++;
    const result = await releaseCodGuaranteeHoldIfNeeded({
      orderId: order.id,
      notes: order.notes,
      event: order.status === "CANCELLED" ? "cancellation" : "delivery",
    });
    outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1;
  }
  return { checked, outcomes };
}
