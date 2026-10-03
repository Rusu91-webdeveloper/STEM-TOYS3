/** @jest-environment node */
import { webcrypto } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});
const { getToken } = require("next-auth/jwt");

const { GET } = require("@/app/api/csrf-token/route");
const { validateCsrfForRequest } = require("@/lib/csrf");
const { generateCsrfToken, validateCsrfToken } = require("@/lib/security");

describe("checkout CSRF session round trips", () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    getToken.mockResolvedValue(null);
    process.env.CSRF_SECRET_KEY = "synthetic-csrf-test-secret";
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function orderRequest(cookie?: string, token?: string) {
    return new NextRequest("https://shop.example/api/checkout/order", {
      method: "POST",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(token ? { "x-csrf-token": token } : {}),
      },
      body: JSON.stringify({ items: [] }),
    });
  }

  it("issues an unpredictable HttpOnly guest cookie and a matching valid token", async () => {
    const response: NextResponse = await GET(
      new NextRequest("https://shop.example/api/csrf-token")
    );
    const payload = await response.json();
    const guestId = response.cookies.get("guest_id")?.value;
    expect(response.status).toBe(200);
    expect(guestId).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/);
    expect(response.headers.get("set-cookie")).toMatch(/Secure/);
    expect(response.headers.get("set-cookie")).toMatch(/SameSite=lax/i);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const result = await validateCsrfForRequest(
      orderRequest(`guest_id=${guestId}`, payload.csrfToken)
    );
    expect(result.valid).toBe(true);
    expect(result.sessionId).toBe(`guest:${guestId}`);

    const independent: NextResponse = await GET(
      new NextRequest("https://shop.example/api/csrf-token")
    );
    expect(independent.cookies.get("guest_id")?.value).not.toBe(guestId);
  });

  it("reuses an existing guest session without changing its cookie", async () => {
    const response: NextResponse = await GET(
      new NextRequest("https://shop.example/api/csrf-token", {
        headers: { cookie: "guest_id=existing-guest" },
      })
    );
    const payload = await response.json();
    expect(response.cookies.get("guest_id")).toBeUndefined();
    expect(
      (
        await validateCsrfForRequest(
          orderRequest("guest_id=existing-guest", payload.csrfToken)
        )
      ).valid
    ).toBe(true);
  });

  it("preserves authenticated identity after the order body has been consumed", async () => {
    getToken.mockResolvedValue({ sub: "customer-123" });
    const cookie = "__Secure-next-auth.session-token=synthetic-session";
    const response: NextResponse = await GET(
      new NextRequest("https://shop.example/api/csrf-token", {
        headers: { cookie },
      })
    );
    const payload = await response.json();
    expect(response.cookies.get("guest_id")).toBeUndefined();
    const request = orderRequest(cookie, payload.csrfToken);
    const body = await request.json();
    expect((await validateCsrfForRequest(request, body)).valid).toBe(true);
  });

  it("rejects a missing guest cookie and a missing token", async () => {
    const token = await generateCsrfToken("guest:one");
    expect(
      (await validateCsrfForRequest(orderRequest(undefined, token))).valid
    ).toBe(false);
    expect(
      (await validateCsrfForRequest(orderRequest("guest_id=one"))).valid
    ).toBe(false);
  });

  it("rejects cross-session, expired, malformed and forged tokens", async () => {
    const token = await generateCsrfToken("guest:one");
    expect(
      (await validateCsrfForRequest(orderRequest("guest_id=two", token))).valid
    ).toBe(false);
    const expired = await generateCsrfToken("guest:one", -1);
    expect(await validateCsrfToken(expired, "guest:one")).toBe(false);
    expect(
      await validateCsrfToken(btoa("guest:one:invalid:00"), "guest:one")
    ).toBe(false);
    const forged = btoa(atob(token).slice(0, -64) + "0".repeat(64));
    expect(await validateCsrfToken(forged, "guest:one")).toBe(false);
  });

  it("keeps ordinary authenticated-session signed tokens compatible", async () => {
    const token = await generateCsrfToken("customer-123");
    expect(await validateCsrfToken(token, "customer-123")).toBe(true);
    expect(await validateCsrfToken(token, "other-customer")).toBe(false);
  });

  it("uses the configured auth secret and fails closed if production has neither secret", async () => {
    delete process.env.CSRF_SECRET_KEY;
    process.env.NEXTAUTH_SECRET = "synthetic-auth-test-secret";
    process.env = { ...process.env, NODE_ENV: "production" };
    const token = await generateCsrfToken("guest:one");
    expect(await validateCsrfToken(token, "guest:one")).toBe(true);
    delete process.env.NEXTAUTH_SECRET;
    await expect(generateCsrfToken("guest:one")).rejects.toThrow(
      "server secret"
    );
  });
});
