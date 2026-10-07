/** @jest-environment node */
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockCsrf = jest.fn();
const mockFind = jest.fn();
const mockReject = jest.fn();
const mockStripe = jest.fn();
const mockRelease = jest.fn();
jest.mock("@/lib/checkout/release-cod-hold", () => ({
  releaseCodGuaranteeHoldIfNeeded: (...args: unknown[]) => mockRelease(...args),
}));
jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/csrf", () => ({ validateCsrfForRequest: () => mockCsrf() }));
jest.mock("@/lib/db", () => ({
  db: { order: { findFirst: () => mockFind() } },
}));
jest.mock("@/lib/analytics/cod-analytics", () => ({
  markCODOrderAsRejected: (...args: unknown[]) => mockReject(...args),
}));
jest.mock("@/lib/stripe-server", () => ({
  getStripeServerClient: () => mockStripe(),
}));
import { POST } from "@/app/api/admin/orders/[id]/cod-reject/route";

const send = (body: object) =>
  POST(
    new NextRequest("https://shop.test/api/admin/orders/o1/cod-reject", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "o1" }) }
  );
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
  mockRelease.mockResolvedValue({ outcome: "expired" });
  mockCsrf.mockResolvedValue({ valid: true });
  mockFind.mockResolvedValue({
    id: "o1",
    paymentMethod: "cash_on_delivery",
    notes: "COD Guarantee PI: pi_live_authorized",
  });
});
test.each([undefined, false])(
  "records refusal with no capture when capture=%s",
  async captureGuarantee => {
    const response = await send({ reason: "Not collected", captureGuarantee });
    expect(response.status).toBe(200);
    expect((await response.json()).guaranteeCaptured).toBe(false);
    expect(mockReject).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "o1", event: "refusal" })
    );
    expect(mockStripe).not.toHaveBeenCalled();
  }
);
test("rejects old clients requesting automatic capture without changing the order", async () => {
  expect(
    (await send({ reason: "Refused", captureGuarantee: true })).status
  ).toBe(400);
  expect(mockReject).not.toHaveBeenCalled();
  expect(mockStripe).not.toHaveBeenCalled();
});
test.each(["CUSTOMER", null])("denies non-admin callers: %s", async role => {
  mockAuth.mockResolvedValue(role ? { user: { role } } : null);
  expect((await send({ reason: "Refused" })).status).toBe(403);
  expect(mockFind).not.toHaveBeenCalled();
});
test("denies invalid CSRF before reading or mutating the order", async () => {
  mockCsrf.mockResolvedValue({ valid: false });
  expect((await send({ reason: "Refused" })).status).toBe(403);
  expect(mockFind).not.toHaveBeenCalled();
});
test("rejects an invalid reason", async () => {
  expect((await send({ reason: {} })).status).toBe(400);
  expect(mockReject).not.toHaveBeenCalled();
});
test.each(["PAID", "REFUNDED"])(
  "cannot overwrite a settled COD payment: %s",
  async paymentStatus => {
    mockFind.mockResolvedValue({
      id: "o1",
      paymentMethod: "cash_on_delivery",
      paymentStatus,
    });
    expect((await send({ reason: "Refused" })).status).toBe(409);
    expect(mockReject).not.toHaveBeenCalled();
    expect(mockRelease).not.toHaveBeenCalled();
  }
);
