import { NextResponse } from "next/server";

import {
  evaluateCodGuaranteePolicy,
  isLockerShippingMethodId,
} from "@/lib/checkout/cod-guarantee-policy";
import { resolveCodGuaranteeCustomerStats } from "@/lib/checkout/cod-guarantee-risk";
import type { RecipientType } from "@/lib/shipping/cod-thresholds";

export const COD_GUARANTEE_NOT_REQUIRED_ERROR = "COD_GUARANTEE_NOT_REQUIRED";

/**
 * Guest guarantee PaymentIntents are created only when the same policy the
 * order route uses says this cart, email, and delivery method need one.
 */
export async function guestGuaranteePolicyRejection(input: {
  guestEmail: string;
  orderTotal: number;
  shippingMethodId?: string | null;
  recipientType?: RecipientType | null;
}): Promise<NextResponse | null> {
  const stats = await resolveCodGuaranteeCustomerStats({
    guestEmail: input.guestEmail,
  });
  const recipientType: RecipientType =
    input.recipientType === "B2B" ? "B2B" : "B2C";
  const policy = evaluateCodGuaranteePolicy({
    orderTotal: input.orderTotal,
    recipientType,
    isLockerDelivery: isLockerShippingMethodId(input.shippingMethodId),
    priorOrderCount: stats.priorOrderCount,
    priorCodRtoCount: stats.priorCodRtoCount,
  });

  if (policy.required) return null;

  return NextResponse.json(
    {
      success: false,
      error: COD_GUARANTEE_NOT_REQUIRED_ERROR,
      message:
        "A card guarantee is not required for this cash-on-delivery checkout.",
    },
    { status: 400 }
  );
}
