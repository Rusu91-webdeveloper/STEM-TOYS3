/** @jest-environment jsdom */
import { saveCookieConsent } from "@/lib/analytics/consent";
import { buildOrderAnalytics } from "@/lib/analytics/order-payload";

let meta: typeof import("@/lib/analytics/meta-events");
const item = {
  item_id: "kit-1",
  item_name: "Kit STEM",
  price: 49.99,
  quantity: 2,
};
const originalId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
function order(
  method: "stripe" | "netopia" | "cod" = "stripe",
  status = "PAID"
) {
  return buildOrderAnalytics({
    id: "paid-1",
    total: 124.97,
    tax: 10,
    shipping: 19.99,
    codFee: 5,
    paymentMethod: method,
    paymentStatus: status,
    items: [
      {
        productId: item.item_id,
        bookId: null,
        name: item.item_name,
        price: item.price,
        quantity: 2,
      },
    ],
  })!;
}

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "787839287564208";
  window.fbq = jest.fn();
  meta = require("@/lib/analytics/meta-events");
});
afterAll(() => {
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = originalId;
});

it("never captures or replays actions before advertising consent", () => {
  expect(meta.trackMetaAddToCart(item)).toBe(false);
  saveCookieConsent({ analytics: true, marketing: false });
  expect(meta.trackMetaAddToCart(item)).toBe(false);
  saveCookieConsent({ analytics: false, marketing: true });
  meta.markMetaPixelReady();
  expect(window.fbq).not.toHaveBeenCalled();
});

it("waits for our Pixel initialization even when another fbq is present", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  expect(meta.trackMetaProductView({ ...item, quantity: 1 })).toBe(true);
  expect(window.fbq).not.toHaveBeenCalled();
  meta.markMetaPixelReady();
  meta.flushMetaEvents();
  expect(window.fbq).toHaveBeenCalledTimes(1);
  expect(window.fbq).toHaveBeenCalledWith(
    "trackSingle",
    "787839287564208",
    "ViewContent",
    expect.objectContaining({
      content_ids: ["kit-1"],
      value: 49.99,
      currency: "RON",
    }),
    undefined
  );
});

it("sends actual item quantities, rounded RON value and only product metadata", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.markMetaPixelReady();
  meta.trackMetaAddToCart({
    ...item,
    email: "private@example.test",
  } as typeof item);
  expect(window.fbq).toHaveBeenCalledWith(
    "trackSingle",
    "787839287564208",
    "AddToCart",
    {
      content_type: "product",
      content_ids: ["kit-1"],
      contents: [{ id: "kit-1", quantity: 2, item_price: 49.99 }],
      content_name: "Kit STEM",
      value: 99.98,
      currency: "RON",
      num_items: 2,
    },
    undefined
  );
});

it("tracks checkout with all products and quantities", () => {
  saveCookieConsent({ analytics: true, marketing: true });
  meta.markMetaPixelReady();
  meta.trackMetaCheckout([
    item,
    { ...item, item_id: "book-1", price: 20, quantity: 1 },
  ]);
  expect(window.fbq).toHaveBeenCalledWith(
    "trackSingle",
    "787839287564208",
    "InitiateCheckout",
    expect.objectContaining({
      content_ids: ["kit-1", "book-1"],
      num_items: 3,
      value: 119.98,
    }),
    undefined
  );
});

it("drops pending activity after withdrawal or a consent revision change", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.trackMetaAddToCart(item);
  saveCookieConsent({ analytics: false, marketing: false });
  meta.markMetaPixelReady();
  saveCookieConsent({ analytics: false, marketing: true });
  meta.flushMetaEvents();
  expect(window.fbq).not.toHaveBeenCalled();
  meta.trackMetaAddToCart(item);
  expect(window.fbq).toHaveBeenCalledTimes(1);
});

it("does not replay across a changed revision even without an intermediate flush", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.trackMetaPurchase(order());
  saveCookieConsent({ analytics: false, marketing: true });
  meta.trackMetaPurchase(order());
  meta.markMetaPixelReady();
  expect(window.fbq).toHaveBeenCalledTimes(1);
});

it.each(["PENDING", "FAILED", "REFUNDED"])(
  "rejects a %s card payment as Purchase",
  status => {
    saveCookieConsent({ analytics: false, marketing: true });
    meta.markMetaPixelReady();
    expect(meta.trackMetaPurchase(order("stripe", status))).toBe(false);
    expect(window.fbq).not.toHaveBeenCalled();
  }
);

it("rejects test payments and COD, including the unverified DELIVERED/PAID shortcut", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.markMetaPixelReady();
  expect(meta.trackMetaPurchase({ ...order(), test_mode: true })).toBe(false);
  expect(meta.trackMetaPurchase(order("cod", "PENDING"))).toBe(false);
  expect(meta.trackMetaPurchase(order("cod", "PAID"))).toBe(false);
  expect(window.fbq).not.toHaveBeenCalled();
});

it("deduplicates queued and sent purchases, including a document/module reload", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.trackMetaPurchase(order());
  meta.trackMetaPurchase(order());
  meta.markMetaPixelReady();
  meta.trackMetaPurchase(order());
  expect(window.fbq).toHaveBeenCalledTimes(1);
  expect(window.fbq).toHaveBeenCalledWith(
    "trackSingle",
    "787839287564208",
    "Purchase",
    expect.objectContaining({ value: 89.98, currency: "RON" }),
    { eventID: "purchase:paid-1" }
  );
  expect(
    sessionStorage.getItem("techtots:meta:787839287564208:purchase:paid-1")
  ).toBe("1");
  // Jest resets global mock-call history as well as the module registry.
  jest.resetModules();
  window.fbq = jest.fn();
  meta = require("@/lib/analytics/meta-events");
  meta.markMetaPixelReady();
  meta.trackMetaPurchase(order());
  expect(window.fbq).not.toHaveBeenCalled();
});

it("requires valid configuration, prices, quantities and items", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.markMetaPixelReady();
  expect(meta.trackMetaCheckout([])).toBe(false);
  expect(meta.trackMetaAddToCart({ ...item, quantity: 0 })).toBe(false);
  expect(meta.trackMetaAddToCart({ ...item, quantity: 1.5 })).toBe(false);
  expect(meta.trackMetaAddToCart({ ...item, price: NaN })).toBe(false);
  expect(meta.trackMetaAddToCart({ ...item, item_id: "" })).toBe(false);
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = "123456789012345";
  expect(meta.trackMetaAddToCart(item)).toBe(false);
  expect(window.fbq).not.toHaveBeenCalled();
});

it("bounds the deferred queue", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  for (let i = 0; i < 50; i++) expect(meta.trackMetaAddToCart(item)).toBe(true);
  expect(meta.trackMetaAddToCart(item)).toBe(false);
  meta.markMetaPixelReady();
  expect(window.fbq).toHaveBeenCalledTimes(50);
});

it("does not interrupt checkout when the SDK or browser storage fails", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  meta.markMetaPixelReady();
  const originalGet = Storage.prototype.getItem;
  const get = jest.spyOn(Storage.prototype, "getItem");
  get.mockImplementation(function (this: Storage, key: string) {
    if (this === sessionStorage) throw new Error("blocked");
    return originalGet.call(this, key);
  });
  window.fbq = jest.fn(() => {
    throw new Error("blocked SDK");
  });
  expect(() => meta.trackMetaPurchase(order())).not.toThrow();
  get.mockRestore();
});
