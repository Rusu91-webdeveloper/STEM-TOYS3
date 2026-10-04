import { z } from "zod";

import { refundReviewSchema } from "@/lib/returns/reviewed-stripe-refund";

export const manualRefundProofSchema = z
  .object({
    review: refundReviewSchema,
    reference: z.string().trim().min(5).max(150),
    paidAt: z
      .string()
      .datetime()
      .refine(
        date => Date.parse(date) <= Date.now(),
        "Plata nu poate fi în viitor."
      ),
    agreedMethodAndNoFees: z.literal(true),
  })
  .strict();

export function manualRefundAudit(
  proof: z.infer<typeof manualRefundProofSchema>,
  reviewer: string
) {
  return `[MANUAL_RETURN_REFUND ${JSON.stringify({ amountRon: proof.review.amountRon, reference: proof.reference, paidAt: proof.paidAt, notes: proof.review.notes, reviewer, agreedMethodAndNoFees: true })}]`;
}
