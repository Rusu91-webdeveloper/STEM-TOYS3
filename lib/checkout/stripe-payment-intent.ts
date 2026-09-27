import Stripe from "stripe";

import {
  PaymentIntentAlreadyUsedError,
  PaymentIntentOwnershipError,
  paymentIntentMetadataMatchesActor,
  paymentIntentMetadataOrderId,
  type PaymentIntentActorRef,
} from "@/lib/checkout/payment-intent-ownership";

const REUSABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
];

const TERMINAL_STATUSES: Stripe.PaymentIntent.Status[] = [
  "succeeded",
  "canceled",
];

export function sanitizePaymentIntentMetadata(
  metadata?: Record<string, string | number | boolean>
) {
  if (!metadata) {
    return {};
  }

  return Object.entries(metadata).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    },
    {}
  );
}

export async function reuseOrCreatePaymentIntent(
  stripe: Stripe,
  normalizedCurrency: string,
  paymentIntentId: string,
  amount: number,
  metadata: Record<string, string>,
  createParams: Stripe.PaymentIntentCreateParams,
  idempotencyKey: string,
  actor: PaymentIntentActorRef,
  receiptEmail?: string
): Promise<Stripe.PaymentIntent> {
  try {
    const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntentMetadataMatchesActor(existing.metadata, actor)) {
      throw new PaymentIntentOwnershipError();
    }

    if (paymentIntentMetadataOrderId(existing.metadata)) {
      throw new PaymentIntentAlreadyUsedError();
    }

    if (TERMINAL_STATUSES.includes(existing.status)) {
      console.log(
        `PaymentIntent ${paymentIntentId} is in terminal state (${existing.status}). Creating new PaymentIntent.`
      );
      return stripe.paymentIntents.create(createParams, { idempotencyKey });
    }

    if (
      existing.currency === normalizedCurrency &&
      REUSABLE_STATUSES.includes(existing.status)
    ) {
      return stripe.paymentIntents.update(paymentIntentId, {
        amount,
        metadata,
        receipt_email: receiptEmail,
      });
    }

    console.log(
      `PaymentIntent ${paymentIntentId} has status ${existing.status} which is not reusable. Creating new PaymentIntent.`
    );
  } catch (intentError) {
    if (
      intentError instanceof PaymentIntentOwnershipError ||
      intentError instanceof PaymentIntentAlreadyUsedError
    ) {
      throw intentError;
    }
    console.warn(
      `Unable to reuse payment intent ${paymentIntentId}:`,
      intentError
    );
  }

  return stripe.paymentIntents.create(createParams, { idempotencyKey });
}
