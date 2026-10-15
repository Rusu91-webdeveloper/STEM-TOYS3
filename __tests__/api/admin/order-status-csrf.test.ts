/** @jest-environment node */
import { webcrypto } from "node:crypto";

import { NextRequest } from "next/server";

import { PATCH } from "@/app/api/admin/orders/[id]/route";
import { GET as csrfGET } from "@/app/api/csrf-token/route";
import { auth } from "@/lib/auth";
import { releaseCodGuaranteeHoldIfNeeded } from "@/lib/checkout/release-cod-hold";
import { db } from "@/lib/db";
import { sendOrderCancellationEmail } from "@/lib/email/order-templates";
import { generateCsrfToken } from "@/lib/security";

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn().mockResolvedValue({ sub: "admin-test" }),
}));
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: { order: { findFirst: jest.fn(), update: jest.fn() } },
}));
jest.mock("@/lib/cache", () => ({ invalidateCachePattern: jest.fn() }));
jest.mock("@/lib/cache/analytics-cache", () => ({
  invalidateAnalyticsOnOrderChange: jest.fn(),
}));
jest.mock("@/lib/checkout/release-cod-hold", () => ({
  releaseCodGuaranteeHoldIfNeeded: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/email/order-templates", () => ({
  sendOrderCancellationEmail: jest.fn(),
}));
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});

const cookie = "__Secure-next-auth.session-token=synthetic-admin-session";
const params = { params: Promise.resolve({ id: "OriginalCaseID" }) };
function request(token?: string) {
  return new NextRequest(
    "https://shop.example/api/admin/orders/OriginalCaseID",
    {
      method: "PATCH",
      headers: {
        cookie,
        "Content-Type": "application/json",
        ...(token ? { "X-CSRF-Token": token } : {}),
      },
      body: JSON.stringify({
        status: "CANCELLED",
        cancellationReason: "La cererea clientului",
      }),
    }
  );
}
async function freshToken(): Promise<string> {
  const response = await csrfGET(
    new NextRequest("https://shop.example/api/csrf-token", {
      headers: { cookie },
    })
  );
  expect(response.status).toBe(200);
  return (await response.json()).csrfToken;
}

describe("admin order status security boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "admin-test", role: "ADMIN" },
    });
    (db.order.findFirst as jest.Mock).mockResolvedValue({
      id: "OriginalCaseID",
      status: "READY_FOR_SHIPPING",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "PENDING",
      notes: "Existing operational note",
    });
    (db.order.update as jest.Mock).mockResolvedValue({
      id: "OriginalCaseID",
      orderNumber: "ORD-TEST",
      status: "CANCELLED",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "PENDING",
      total: 154.89,
      currency: "RON",
      createdAt: new Date("2026-10-15T00:00:00Z"),
      user: { name: "Client", email: "client@example.test" },
      items: [],
    });
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("reproduces the screenshot's 403 without a token before accessing orders or sending notifications", async () => {
    const response = await PATCH(request(), params);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Security validation failed",
    });
    expect(db.order.findFirst).not.toHaveBeenCalled();
    expect(db.order.update).not.toHaveBeenCalled();
    expect(sendOrderCancellationEmail).not.toHaveBeenCalled();
    expect(releaseCodGuaranteeHoldIfNeeded).not.toHaveBeenCalled();
  });

  it("accepts a token from the actual token endpoint and preserves cancellation notes and notification", async () => {
    const response = await PATCH(request(await freshToken()), params);
    expect(response.status).toBe(200);
    expect((await response.json()).order.status).toBe("Cancelled");
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "OriginalCaseID" },
        data: {
          status: "CANCELLED",
          notes:
            "Existing operational note | Cancellation reason: La cererea clientului",
        },
      })
    );
    expect(sendOrderCancellationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@example.test",
        cancellationReason: "La cererea clientului",
      })
    );
  });

  it.each(["forged", "expired", "different-session"])(
    "rejects a %s token before persistence",
    async kind => {
      const token =
        kind === "forged"
          ? "invalid-token"
          : await generateCsrfToken(
              kind === "different-session" ? "other-admin" : "admin-test",
              kind === "expired" ? -1 : 60
            );
      expect((await PATCH(request(token), params)).status).toBe(403);
      expect(db.order.findFirst).not.toHaveBeenCalled();
      expect(db.order.update).not.toHaveBeenCalled();
      expect(sendOrderCancellationEmail).not.toHaveBeenCalled();
    }
  );

  it.each([null, "CUSTOMER", "SUPPLIER", "VISITOR"])(
    "denies role %s even with a valid security token",
    async role => {
      (auth as jest.Mock).mockResolvedValue(role ? { user: { role } } : null);
      expect((await PATCH(request(await freshToken()), params)).status).toBe(
        403
      );
      expect(db.order.findFirst).not.toHaveBeenCalled();
      expect(db.order.update).not.toHaveBeenCalled();
    }
  );
});
