import { NextResponse } from "next/server";

import { getClientIdentifier, rateLimiter } from "@/lib/rate-limit";

const GUEST_ORDER_LIMIT = 5;
const GUEST_ORDER_WINDOW_MS = 10 * 60 * 1000;
const GUEST_ORDER_ENDPOINT = "checkout:guest-order";

export const GUEST_ORDER_RATE_LIMIT_MESSAGE =
  "Ai trimis prea multe comenzi fără cont. Încearcă din nou în câteva minute.";

/**
 * Guest checkout only. Logged-in orders must not call this.
 * Uses the shared Redis limiter, which falls back to memory when Redis is absent.
 */
export async function enforceGuestOrderRateLimit(
  request: Request
): Promise<NextResponse | null> {
  const clientId = getClientIdentifier(request);
  const result = await rateLimiter.checkLimit(clientId, GUEST_ORDER_ENDPOINT, {
    windowMs: GUEST_ORDER_WINDOW_MS,
    maxRequests: GUEST_ORDER_LIMIT,
    message: GUEST_ORDER_RATE_LIMIT_MESSAGE,
  });

  if (result.success) return null;

  return NextResponse.json(
    {
      success: false,
      message: GUEST_ORDER_RATE_LIMIT_MESSAGE,
      error: "GUEST_ORDER_RATE_LIMIT",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter ?? 600),
      },
    }
  );
}
