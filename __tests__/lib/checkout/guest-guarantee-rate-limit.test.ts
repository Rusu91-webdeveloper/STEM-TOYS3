/**
 * @jest-environment node
 */

import {
  enforceGuestGuaranteeIntentRateLimit,
  enforceGuestOrderRateLimit,
} from "@/lib/checkout/guest-order-rate-limit";

function requestFrom(ip: string) {
  return new Request("http://localhost/api/checkout/order", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("guest checkout rate limits", () => {
  it("keeps order placement at 5 per 10 minutes, separate from guarantee intents", async () => {
    const req = requestFrom("198.51.100.10");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await enforceGuestOrderRateLimit(req)).toBeNull();
    }

    const blocked = await enforceGuestOrderRateLimit(req);
    expect(blocked?.status).toBe(429);
    const body = await blocked!.json();
    expect(body.error).toBe("GUEST_ORDER_RATE_LIMIT");

    expect(await enforceGuestGuaranteeIntentRateLimit(req)).toBeNull();
  });

  it("allows 20 guarantee intent creates per 10 minutes per IP", async () => {
    const req = requestFrom("198.51.100.11");

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(await enforceGuestGuaranteeIntentRateLimit(req)).toBeNull();
    }

    const blocked = await enforceGuestGuaranteeIntentRateLimit(req);
    expect(blocked?.status).toBe(429);
    const body = await blocked!.json();
    expect(body.error).toBe("GUEST_GUARANTEE_INTENT_RATE_LIMIT");
    expect(body.message).not.toMatch(/comenzi fără cont/);
  });

  it("does not let guarantee intent attempts consume the order limit", async () => {
    const req = requestFrom("198.51.100.12");

    for (let attempt = 0; attempt < 6; attempt += 1) {
      expect(await enforceGuestGuaranteeIntentRateLimit(req)).toBeNull();
    }

    expect(await enforceGuestOrderRateLimit(req)).toBeNull();
  });
});
