/**
 * @jest-environment node
 */

import {
  paymentIntentMetadataMatchesActor,
  paymentIntentMetadataOrderId,
} from "@/lib/checkout/payment-intent-ownership";

describe("payment intent ownership", () => {
  it("matches a logged-in shopper by metadata user id", () => {
    expect(
      paymentIntentMetadataMatchesActor(
        { userId: "user_1" },
        { kind: "user", userId: "user_1" }
      )
    ).toBe(true);
    expect(
      paymentIntentMetadataMatchesActor(
        { userId: "user_other" },
        { kind: "user", userId: "user_1" }
      )
    ).toBe(false);
    expect(
      paymentIntentMetadataMatchesActor(
        { guestEmail: "buyer@example.com" },
        { kind: "user", userId: "user_1" }
      )
    ).toBe(false);
  });

  it("matches a guest by checkout email", () => {
    expect(
      paymentIntentMetadataMatchesActor(
        { guestEmail: "guest@example.com" },
        { kind: "guest", email: "Guest@Example.com" }
      )
    ).toBe(true);
    expect(
      paymentIntentMetadataMatchesActor(
        { guestEmail: "other@example.com" },
        { kind: "guest", email: "guest@example.com" }
      )
    ).toBe(false);
    expect(
      paymentIntentMetadataMatchesActor(
        {},
        { kind: "guest", email: "guest@example.com" }
      )
    ).toBe(false);
  });

  it("reads an existing order id from metadata", () => {
    expect(paymentIntentMetadataOrderId({ orderId: " ord_1 " })).toBe("ord_1");
    expect(paymentIntentMetadataOrderId({ orderId: "  " })).toBeNull();
    expect(paymentIntentMetadataOrderId(undefined)).toBeNull();
  });
});
