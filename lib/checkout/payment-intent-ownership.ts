import { normalizeCheckoutEmail } from "@/lib/checkout/guest-customer";
import { db } from "@/lib/db";

export type PaymentIntentActorRef =
  | { kind: "user"; userId: string }
  | { kind: "guest"; email?: string | null };

interface IntentMetadata {
  userId?: string | null;
  guestEmail?: string | null;
  orderId?: string | null;
}

export class PaymentIntentOwnershipError extends Error {
  readonly code = "PAYMENT_INTENT_OWNERSHIP";
  readonly status = 403;

  constructor() {
    super(
      "This payment authorization does not belong to the current checkout."
    );
    this.name = "PaymentIntentOwnershipError";
  }
}

export class PaymentIntentAlreadyUsedError extends Error {
  readonly code = "PAYMENT_INTENT_ALREADY_USED";
  readonly status = 409;

  constructor() {
    super("This payment authorization is already attached to an order.");
    this.name = "PaymentIntentAlreadyUsedError";
  }
}

export function checkoutPaymentIntentActor(input: {
  sessionUserId?: string | null;
  guestEmail?: string | null;
}): PaymentIntentActorRef {
  const sessionUserId = input.sessionUserId?.trim() ?? "";
  if (sessionUserId) {
    return { kind: "user", userId: sessionUserId };
  }
  return { kind: "guest", email: input.guestEmail };
}

/**
 * Logged-in shoppers match metadata.userId. Guests match metadata.guestEmail.
 * A missing owner field is not a match.
 */
export function paymentIntentMetadataMatchesActor(
  metadata: IntentMetadata | null | undefined,
  actor: PaymentIntentActorRef
): boolean {
  if (actor.kind === "user") {
    const intentUserId = metadata?.userId?.trim() ?? "";
    return intentUserId.length > 0 && intentUserId === actor.userId;
  }

  const actorEmail = normalizeCheckoutEmail(actor.email);
  const intentEmail = normalizeCheckoutEmail(metadata?.guestEmail);
  return Boolean(actorEmail) && intentEmail === actorEmail;
}

export function paymentIntentMetadataOrderId(
  metadata: IntentMetadata | null | undefined
): string | null {
  const orderId = metadata?.orderId?.trim() ?? "";
  return orderId.length > 0 ? orderId : null;
}

export function findOrderUsingPaymentIntent(
  paymentIntentId: string
): Promise<{ id: string } | null> {
  const id = paymentIntentId.trim();
  if (!id) return Promise.resolve(null);

  return db.order.findFirst({
    where: {
      OR: [{ stripePaymentIntentId: id }, { notes: { contains: id } }],
    },
    select: { id: true },
  });
}
