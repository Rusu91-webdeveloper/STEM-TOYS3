import { parseCodGuaranteeEvidence } from "@/lib/checkout/cod-guarantee";
import type { CodHoldOutcome } from "@/lib/checkout/cod-hold-settlement";

export function readCodHoldSettlement(notes?: string | null) {
  const paymentIntentId =
    parseCodGuaranteeEvidence(notes).authorizedPaymentIntentId;
  if (!notes || !paymentIntentId) return null;
  const entries = [
    ...notes.matchAll(
      /COD Guarantee settlement - PI: ([^|]+?) - Outcome: (released|expired|already_released|captured_review|review_required|retry_required) - Event: (delivery|cancellation|refusal) - At: ([^|]+?)(?: - Expires: ([^|]+))?(?= \||$)/g
    ),
  ];
  const latest = entries.filter(entry => entry[1] === paymentIntentId).at(-1);
  return latest
    ? {
        outcome: latest[2] as CodHoldOutcome,
        recordedAt: latest[4].trim(),
        expiresAt:
          latest[5]?.trim() === "unknown" ? null : (latest[5]?.trim() ?? null),
      }
    : null;
}
