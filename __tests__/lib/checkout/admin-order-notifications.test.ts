import { shouldSendImmediateAdminOrderNotification } from "@/lib/checkout/admin-order-notifications";

describe("shouldSendImmediateAdminOrderNotification", () => {
  it("sends immediately for COD orders", () => {
    expect(
      shouldSendImmediateAdminOrderNotification({
        isCODPayment: true,
        isNetopiaPayment: false,
        requiresOnlineAuthorization: false,
      })
    ).toBe(true);
  });

  it("defers Netopia orders until the webhook confirms payment", () => {
    expect(
      shouldSendImmediateAdminOrderNotification({
        isCODPayment: false,
        isNetopiaPayment: true,
        requiresOnlineAuthorization: false,
      })
    ).toBe(false);
  });

  it("defers Stripe-backed orders while authorization is still pending", () => {
    expect(
      shouldSendImmediateAdminOrderNotification({
        isCODPayment: false,
        isNetopiaPayment: false,
        requiresOnlineAuthorization: true,
        stripePaymentIntentStatus: "processing",
      })
    ).toBe(false);
  });

  it("allows immediate notification once Stripe already succeeded", () => {
    expect(
      shouldSendImmediateAdminOrderNotification({
        isCODPayment: false,
        isNetopiaPayment: false,
        requiresOnlineAuthorization: true,
        stripePaymentIntentStatus: "succeeded",
      })
    ).toBe(true);
  });

  it("allows immediate notification for zero-total or already-paid orders", () => {
    expect(
      shouldSendImmediateAdminOrderNotification({
        isCODPayment: false,
        isNetopiaPayment: false,
        requiresOnlineAuthorization: false,
      })
    ).toBe(true);
  });
});
