import { NextResponse } from "next/server";

import { normalizeCheckoutEmail } from "@/lib/checkout/guest-customer";
import { enforceGuestOrderRateLimit } from "@/lib/checkout/guest-order-rate-limit";

const GUEST_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PaymentIntentActor =
  | { kind: "user"; userId: string; email: string }
  | { kind: "guest"; email: string };

interface AccessInput {
  request: Request;
  hasSessionUser: boolean;
  sessionUserId?: string | null;
  sessionEmail?: string | null;
  requestedFlow: string | null;
  payloadValid: boolean;
  guestEmail?: string | null;
  hasCheckoutContext: boolean;
  invalidPayloadResponse: NextResponse;
}

/**
 * Logged-in shoppers keep the existing payment-intent path.
 * Guests may create a PaymentIntent only for a COD guarantee, and only
 * under the same per-IP limit as guest orders.
 */
export async function resolvePaymentIntentActor(
  input: AccessInput
): Promise<PaymentIntentActor | NextResponse> {
  if (input.hasSessionUser && input.sessionUserId) {
    if (!input.payloadValid) return input.invalidPayloadResponse;
    return {
      kind: "user",
      userId: input.sessionUserId,
      email: input.sessionEmail || "",
    };
  }

  if (input.requestedFlow !== "cod_guarantee") {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const rateLimited = await enforceGuestOrderRateLimit(input.request);
  if (rateLimited) return rateLimited;

  if (!input.payloadValid) return input.invalidPayloadResponse;

  const guestEmail = normalizeCheckoutEmail(input.guestEmail);
  if (!guestEmail || !GUEST_EMAIL_PATTERN.test(guestEmail)) {
    return NextResponse.json(
      {
        success: false,
        error: "GUEST_EMAIL_REQUIRED",
        message:
          "A valid email is required to authorize a COD guarantee without an account.",
      },
      { status: 400 }
    );
  }

  if (!input.hasCheckoutContext) {
    return NextResponse.json(
      {
        success: false,
        error: "CHECKOUT_CONTEXT_REQUIRED",
        message: "Checkout context is required to price a guest COD guarantee.",
      },
      { status: 400 }
    );
  }

  return { kind: "guest", email: guestEmail };
}

export function isPaymentIntentActor(
  value: PaymentIntentActor | NextResponse
): value is PaymentIntentActor {
  if (!value || typeof value !== "object" || !("kind" in value)) return false;
  return value.kind === "user" || value.kind === "guest";
}
