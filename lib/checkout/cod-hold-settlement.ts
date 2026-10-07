import type Stripe from "stripe";

export type CodHoldOutcome =
  | "released"
  | "expired"
  | "already_released"
  | "captured_review"
  | "review_required"
  | "retry_required"
  | "not_required";
export type CodHoldEvent = "delivery" | "cancellation" | "refusal";

/** A hold is separate from COD payment. This procedure never captures or
 * creates a replacement payment, even when delivery happens after expiry. */
export async function settleCodHold(
  stripe: Stripe,
  input: { paymentIntentId: string; orderId: string; now?: Date }
): Promise<{ outcome: CodHoldOutcome; expiresAt: string | null }> {
  const now = input.now ?? new Date();
  const retrieve = () =>
    stripe.paymentIntents.retrieve(
      input.paymentIntentId,
      {
        expand: ["latest_charge"],
      },
      { timeout: 3000, maxNetworkRetries: 0 }
    );
  let intent = await retrieve();
  const charge = intent.latest_charge;
  const captureBefore =
    charge && typeof charge !== "string"
      ? charge.payment_method_details?.card?.capture_before
      : undefined;
  const expiresAt = captureBefore
    ? new Date(captureBefore * 1000).toISOString()
    : null;
  const expired = Boolean(
    captureBefore && captureBefore * 1000 <= now.getTime()
  );
  if (
    intent.currency !== "ron" ||
    intent.capture_method !== "manual" ||
    intent.metadata.paymentFlow !== "cod_guarantee" ||
    (intent.metadata.orderId && intent.metadata.orderId !== input.orderId)
  )
    return { outcome: "review_required", expiresAt };

  const terminalOutcome = () => {
    if (intent.status === "succeeded" || intent.amount_received > 0)
      return "captured_review" as const;
    if (intent.status === "canceled")
      return expired && intent.cancellation_reason === "automatic"
        ? ("expired" as const)
        : ("already_released" as const);
    return null;
  };
  const terminal = terminalOutcome();
  if (terminal) return { outcome: terminal, expiresAt };
  if (intent.status !== "requires_capture")
    return { outcome: "review_required", expiresAt };

  try {
    intent = await stripe.paymentIntents.cancel(
      input.paymentIntentId,
      { cancellation_reason: "abandoned" },
      {
        idempotencyKey: `cod-hold-release-${input.orderId}-${input.paymentIntentId}`,
        timeout: 3000,
        maxNetworkRetries: 0,
      }
    );
  } catch (error) {
    // Expiry or another worker can win the race. Confirm Stripe's current
    // state before claiming release; retry a real provider failure later.
    intent = await retrieve();
    const raced = terminalOutcome();
    if (raced) return { outcome: raced, expiresAt };
    throw error;
  }
  return {
    outcome:
      intent.status === "canceled"
        ? "released"
        : (terminalOutcome() ?? "retry_required"),
    expiresAt,
  };
}
