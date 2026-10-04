import type Stripe from "stripe";
import { z } from "zod";

export const refundReviewSchema = z
  .object({
    amountRon: z
      .number()
      .positive()
      .finite()
      .refine(
        value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
        "Folosește cel mult două zecimale."
      ),
    notes: z.string().trim().min(10).max(500),
    confirmed: z.literal(true),
  })
  .strict();

/** One reviewed refund per return. Consult processor history before retrying:
 * idempotency keys alone expire and do not repair a failed database write. */
export async function reviewedStripeRefund(
  stripe: Stripe,
  input: {
    review: z.infer<typeof refundReviewSchema>;
    returnId: string;
    orderNumber: string;
    orderItemId: string;
    paymentIntentId: string;
    orderTotal: number;
    reviewerId: string;
  }
) {
  const amount = Math.round(input.review.amountRon * 100);
  if (amount > Math.round(input.orderTotal * 100))
    throw new Error("Suma depășește totalul comenzii.");
  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId, {
    expand: ["latest_charge"],
  });
  const charge = intent.latest_charge;
  if (
    intent.status !== "succeeded" ||
    intent.currency !== "ron" ||
    !charge ||
    typeof charge === "string" ||
    charge.disputed ||
    !charge.paid
  ) {
    throw new Error(
      "Plata RON și disponibilitatea rambursării trebuie verificate în Stripe."
    );
  }
  const history = await stripe.refunds.list({
    payment_intent: input.paymentIntentId,
    limit: 100,
  });
  if (history.has_more)
    throw new Error(
      "Istoric extins de rambursări: verificare manuală în Stripe necesară."
    );
  const existing = history.data.find(
    refund => refund.metadata?.returnId === input.returnId
  );
  if (existing && existing.amount !== amount)
    throw new Error(
      "Există deja o rambursare pentru acest retur cu altă sumă. Verifică Stripe înainte de continuare."
    );
  if (!existing && amount > charge.amount - charge.amount_refunded)
    throw new Error("Suma depășește soldul rambursabil al plății.");
  const refund =
    existing ??
    (await stripe.refunds.create(
      {
        payment_intent: input.paymentIntentId,
        amount,
        metadata: {
          returnId: input.returnId,
          orderNumber: input.orderNumber,
          orderItemId: input.orderItemId,
          reviewedBy: input.reviewerId,
          reviewNotes: input.review.notes,
        },
      },
      { idempotencyKey: `return-refund-${input.returnId}` }
    ));
  if (refund.status !== "succeeded")
    return { succeeded: false, status: refund.status, fullyRefunded: false };
  // Do not infer full payment reimbursement from the number of return rows.
  const refreshed = await stripe.paymentIntents.retrieve(
    input.paymentIntentId,
    { expand: ["latest_charge"] }
  );
  const finalCharge = refreshed.latest_charge;
  const fullyRefunded = Boolean(
    finalCharge &&
      typeof finalCharge !== "string" &&
      finalCharge.amount_refunded >= finalCharge.amount
  );
  return { succeeded: true, status: refund.status, fullyRefunded };
}
