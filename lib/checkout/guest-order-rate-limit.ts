import { NextResponse } from "next/server";

import { getClientIdentifier, rateLimiter } from "@/lib/rate-limit";

const WINDOW_MS = 10 * 60 * 1000;

const GUEST_ORDER_LIMIT = 5;
const GUEST_ORDER_ENDPOINT = "checkout:guest-order";

const GUEST_GUARANTEE_INTENT_LIMIT = 20;
const GUEST_GUARANTEE_INTENT_ENDPOINT = "checkout:guest-cod-guarantee-intent";

export const GUEST_ORDER_RATE_LIMIT_MESSAGE =
  "Ai trimis prea multe comenzi fără cont. Încearcă din nou în câteva minute.";

export const GUEST_GUARANTEE_INTENT_RATE_LIMIT_MESSAGE =
  "Ai încercat prea multe autorizări de garanție. Încearcă din nou în câteva minute.";

async function enforceGuestCheckoutLimit(
  request: Request,
  endpoint: string,
  maxRequests: number,
  message: string,
  errorCode: string
): Promise<NextResponse | null> {
  const clientId = getClientIdentifier(request);
  const result = await rateLimiter.checkLimit(clientId, endpoint, {
    windowMs: WINDOW_MS,
    maxRequests,
    message,
  });

  if (result.success) return null;

  return NextResponse.json(
    {
      success: false,
      message,
      error: errorCode,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter ?? 600),
      },
    }
  );
}

/**
 * Guest checkout only. Logged-in orders must not call this.
 * Uses the shared Redis limiter, which falls back to memory when Redis is absent.
 */
export function enforceGuestOrderRateLimit(
  request: Request
): Promise<NextResponse | null> {
  return enforceGuestCheckoutLimit(
    request,
    GUEST_ORDER_ENDPOINT,
    GUEST_ORDER_LIMIT,
    GUEST_ORDER_RATE_LIMIT_MESSAGE,
    "GUEST_ORDER_RATE_LIMIT"
  );
}

/**
 * Separate, looser bucket for guest COD guarantee PaymentIntent creation.
 * Visiting the Ramburs step must not consume the order-placement limit.
 */
export function enforceGuestGuaranteeIntentRateLimit(
  request: Request
): Promise<NextResponse | null> {
  return enforceGuestCheckoutLimit(
    request,
    GUEST_GUARANTEE_INTENT_ENDPOINT,
    GUEST_GUARANTEE_INTENT_LIMIT,
    GUEST_GUARANTEE_INTENT_RATE_LIMIT_MESSAGE,
    "GUEST_GUARANTEE_INTENT_RATE_LIMIT"
  );
}
