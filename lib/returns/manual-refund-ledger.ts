import { z } from "zod";

import { manualRefundProofSchema } from "@/lib/returns/manual-refund-proof";

const auditSchema = z.object({
  amountRon: manualRefundProofSchema.shape.review.shape.amountRon,
  reference: z.string().min(5),
  paidAt: z.string().datetime(),
  reviewer: z.string().min(1),
  agreedMethodAndNoFees: z.literal(true),
});

/** Reconcile recorded repayments across the order. Missing historical proof
 * requires review rather than guessing a refundable balance from item counts. */
export function reconcileManualRepayments(
  records: { id: string; resolutionNotes: string | null }[],
  input: {
    returnId: string;
    orderTotal: number;
    proof: z.infer<typeof manualRefundProofSchema>;
  }
) {
  let totalMinor = 0;
  for (const record of records) {
    const matches = [
      ...(record.resolutionNotes ?? "").matchAll(
        /\[MANUAL_RETURN_REFUND (.+)\]/g
      ),
    ];
    if (matches.length !== 1)
      throw new Error(
        "Rambursări anterioare fără dovadă unică: verifică manual soldul comenzii."
      );
    let raw: unknown;
    try {
      raw = JSON.parse(matches[0][1]);
    } catch {
      raw = null;
    }
    const audit = auditSchema.safeParse(raw);
    if (!audit.success)
      throw new Error(
        "Dovada unei rambursări anterioare necesită verificare manuală."
      );
    if (record.id === input.returnId) {
      if (
        audit.data.reference !== input.proof.reference ||
        audit.data.amountRon !== input.proof.review.amountRon
      )
        throw new Error(
          "Dovada existentă nu poate fi înlocuită la reîncercare."
        );
      continue;
    }
    if (audit.data.reference === input.proof.reference)
      throw new Error(
        "Această dovadă de plată este deja înregistrată pe alt retur."
      );
    totalMinor += Math.round(audit.data.amountRon * 100);
  }
  totalMinor += Math.round(input.proof.review.amountRon * 100);
  const orderMinor = Math.round(input.orderTotal * 100);
  if (totalMinor > orderMinor)
    throw new Error(
      "Totalul rambursărilor înregistrate depășește suma comenzii."
    );
  return { fullyRefunded: totalMinor === orderMinor, totalMinor };
}
