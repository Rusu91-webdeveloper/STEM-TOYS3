import {
  canRetryCustomerOrderPayment,
  getCustomerOrderStatusKey,
  isAwaitingPaymentOrder,
} from "@/lib/orders/customer-order-display";

describe("customer order display helpers", () => {
  it("maps pending Netopia orders to awaiting payment", () => {
    const order = {
      status: "PENDING_REVIEW",
      paymentStatus: "PENDING",
      paymentMethod: "netopia_card",
    };

    expect(isAwaitingPaymentOrder(order)).toBe(true);
    expect(getCustomerOrderStatusKey(order)).toBe("awaiting_payment");
    expect(canRetryCustomerOrderPayment(order)).toBe(true);
  });

  it("maps pending Stripe orders to awaiting payment without retry CTA", () => {
    const order = {
      status: "PROCESSING",
      paymentStatus: "PENDING",
      paymentMethod: "stripe_new",
    };

    expect(isAwaitingPaymentOrder(order)).toBe(true);
    expect(getCustomerOrderStatusKey(order)).toBe("awaiting_payment");
    expect(canRetryCustomerOrderPayment(order)).toBe(false);
  });

  it("keeps paid orders on their operational status", () => {
    const order = {
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentMethod: "netopia_card",
    };

    expect(isAwaitingPaymentOrder(order)).toBe(false);
    expect(getCustomerOrderStatusKey(order)).toBe("processing");
    expect(canRetryCustomerOrderPayment(order)).toBe(false);
  });

  it("does not show awaiting payment for cancelled orders", () => {
    const order = {
      status: "CANCELLED",
      paymentStatus: "PENDING",
      paymentMethod: "netopia_card",
    };

    expect(isAwaitingPaymentOrder(order)).toBe(false);
    expect(getCustomerOrderStatusKey(order)).toBe("cancelled");
  });
});
