/** @jest-environment jsdom */
import { createOrder } from "@/features/checkout/lib/checkoutApi";
import { saveCookieConsent } from "@/lib/analytics/consent";
import { markMetaPixelReady } from "@/lib/analytics/meta-events";
import { buildOrderAnalytics } from "@/lib/analytics/order-payload";

const originalId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
let sequence = 0;
function analytics(method: "cod" | "stripe" = "stripe", status = "PAID") {
  return buildOrderAnalytics({
    id: `verified-${++sequence}`,
    total: 119.99,
    tax: 0,
    shipping: 19.99,
    codFee: 0,
    paymentMethod: method,
    paymentStatus: status,
    items: [
      {
        productId: "server-kit",
        bookId: null,
        name: "Kit",
        price: 100,
        quantity: 1,
      },
    ],
  });
}
function respond(data: unknown, status = 200) {
  global.fetch = jest.fn(input =>
    Promise.resolve({
      ok: status === 200,
      status,
      statusText: "Rejected",
      json: () =>
        Promise.resolve(
          String(input).includes("csrf-token")
            ? { csrfToken: "test-csrf" }
            : data
        ),
    } as Response)
  );
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "787839287564208";
  saveCookieConsent({ analytics: false, marketing: true });
  window.fbq = jest.fn();
  markMetaPixelReady();
});
afterAll(() => {
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = originalId;
});

it("uses successful server order pricing rather than submitted client prices", async () => {
  const data = analytics();
  respond({ success: true, analytics: data });
  await createOrder({ total: 1, items: [{ id: "fake-client-id", price: 1 }] });
  expect(window.fbq).toHaveBeenCalledWith(
    "trackSingle",
    "787839287564208",
    "Purchase",
    expect.objectContaining({
      content_ids: ["server-kit"],
      value: 100,
      currency: "RON",
    }),
    { eventID: `purchase:${data!.transaction_id}` }
  );
});

it("does not count accepted COD, failed or test payments as Purchase", async () => {
  for (const data of [
    analytics("cod", "PENDING"),
    analytics("stripe", "FAILED"),
    { ...analytics(), test_mode: true },
  ]) {
    respond({ success: true, analytics: data });
    await createOrder({});
  }
  expect(window.fbq).not.toHaveBeenCalled();
});

it("does not turn a failed order response into a purchase", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  respond({ success: false, message: "Rejected", analytics: analytics() }, 400);
  await expect(createOrder({})).rejects.toThrow("Rejected");
  expect(window.fbq).not.toHaveBeenCalled();
  log.mockRestore();
});

it("deduplicates repeated successful responses for the same paid order", async () => {
  respond({ success: true, analytics: analytics() });
  await createOrder({});
  await createOrder({});
  expect(window.fbq).toHaveBeenCalledTimes(1);
});
