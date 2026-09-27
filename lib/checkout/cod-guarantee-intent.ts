import { normalizeCheckoutEmail } from "@/lib/checkout/guest-customer";

export interface GuestCodGuaranteeIntentMetadata {
  guestEmail?: string | null;
  paymentFlow?: string | null;
  userId?: string | null;
}

export interface GuestCodGuaranteeIntentError {
  status: number;
  error: string;
  message: string;
}

/**
 * Guest COD orders must carry a guarantee PaymentIntent created for this
 * checkout email. Logged-in orders do not use this check.
 */
export function guestCodGuaranteeIntentError(input: {
  guestEmail: string | null;
  checkoutUserId: string | null;
  metadata: GuestCodGuaranteeIntentMetadata | null | undefined;
}): GuestCodGuaranteeIntentError | null {
  const guestEmail = normalizeCheckoutEmail(input.guestEmail);
  const intentEmail = normalizeCheckoutEmail(input.metadata?.guestEmail);

  if (!guestEmail || intentEmail !== guestEmail) {
    return {
      status: 403,
      error: "COD_GUARANTEE_EMAIL_MISMATCH",
      message:
        "COD guarantee authorization does not match this checkout email.",
    };
  }

  if (input.metadata?.paymentFlow !== "cod_guarantee") {
    return {
      status: 400,
      error: "COD_GUARANTEE_INTENT_INVALID",
      message: "COD guarantee authorization is invalid for this order.",
    };
  }

  const intentUserId = input.metadata?.userId?.trim() || "";
  if (intentUserId && intentUserId !== (input.checkoutUserId ?? "")) {
    return {
      status: 403,
      error: "PAYMENT_INTENT_USER_MISMATCH",
      message:
        "This payment authorization does not belong to the current user.",
    };
  }

  return null;
}
