/** @jest-environment jsdom */
import {
  trackAcceptedOrder,
  trackConfirmedNetopiaPurchase,
} from "@/lib/analytics/checkout-events";
import { trackEvent } from "@/lib/analytics/ga4";
import {
  buildOrderAnalytics,
  type OrderAnalytics,
} from "@/lib/analytics/order-payload";

jest.mock("@/lib/analytics/ga4", () => ({ trackEvent: jest.fn(() => true) }));
let sequence = 0;
function payload(
  method: OrderAnalytics["payment_method"] = "netopia",
  status = "PENDING"
) {
  return buildOrderAnalytics({
    id: `order-${++sequence}`,
    total: 115,
    tax: 10,
    shipping: 15,
    codFee: 5,
    paymentMethod: method,
    paymentStatus: status,
    items: [
      { productId: "p1", bookId: null, name: "Kit", price: 100, quantity: 1 },
    ],
  })!;
}

beforeEach(() => {
  sessionStorage.clear();
  jest.mocked(trackEvent).mockClear();
});

it("excludes sandbox orders and test card payments", () => {
  trackAcceptedOrder({ ...payload("stripe", "PAID"), test_mode: true });
  trackAcceptedOrder({ ...payload(), test_mode: true });
  expect(trackEvent).not.toHaveBeenCalled();
});

it("uses authoritative merchandise revenue without tax, delivery, fees or personal data", () => {
  const data = payload();
  expect(data.value).toBe(85);
  expect(data.items).toEqual([
    { item_id: "p1", item_name: "Kit", price: 85, quantity: 1 },
  ]);
  expect(Object.keys(data)).not.toEqual(
    expect.arrayContaining(["email", "address", "userId"])
  );
});

it.each(["PENDING", "FAILED", "REFUNDED"])(
  "does not count a %s card payment as a purchase",
  status => {
    trackAcceptedOrder(payload("stripe", status));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("order_placed", expect.any(Object));
  }
);

it("keeps accepted COD orders separate from paid purchases", () => {
  trackAcceptedOrder(payload("cod"));
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(
    "order_placed",
    expect.objectContaining({ payment_method: "cod" })
  );
});

it("counts a verified Stripe payment once", () => {
  const data = payload("stripe", "PAID");
  trackAcceptedOrder(data);
  trackAcceptedOrder(data);
  expect(jest.mocked(trackEvent).mock.calls.map(call => call[0])).toEqual([
    "order_placed",
    "purchase",
  ]);
});

it("requires matching, database-confirmed Netopia payment and suppresses repeat callbacks", () => {
  const data = payload();
  trackAcceptedOrder(data);
  const result = {
    status: "paid",
    source: "database",
    amount: data.order_total,
    currency: "RON",
  };
  trackConfirmedNetopiaPurchase("wrong-order", result);
  trackConfirmedNetopiaPurchase(data.transaction_id, {
    ...result,
    source: "force_complete",
  });
  trackConfirmedNetopiaPurchase(data.transaction_id, {
    ...result,
    status: "refunded",
  });
  trackConfirmedNetopiaPurchase(data.transaction_id, { ...result, amount: 1 });
  expect(trackEvent).toHaveBeenCalledTimes(1);
  trackConfirmedNetopiaPurchase(data.transaction_id, result);
  trackConfirmedNetopiaPurchase(data.transaction_id, result);
  expect(trackEvent).toHaveBeenCalledTimes(2);
  expect(trackEvent).toHaveBeenLastCalledWith(
    "purchase",
    expect.objectContaining({
      payment_status: "PAID",
      transaction_id: data.transaction_id,
    })
  );
});

it("does not treat an arbitrary confirmation-page visit as a purchase", () => {
  trackConfirmedNetopiaPurchase("order-from-url", {
    status: "paid",
    source: "database",
    amount: 115,
    currency: "RON",
  });
  expect(trackEvent).not.toHaveBeenCalled();
});
