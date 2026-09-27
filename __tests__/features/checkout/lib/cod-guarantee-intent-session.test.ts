import {
  displayedCodGuaranteeAmount,
  shouldCreateCodGuaranteeIntent,
} from "@/features/checkout/lib/cod-guarantee-intent-session";

describe("COD guarantee intent session", () => {
  it("creates the first intent for a checkout session", () => {
    expect(
      shouldCreateCodGuaranteeIntent({
        clientSecret: null,
        paymentIntentId: undefined,
        serverAmountMinor: null,
        requestedAmountMinor: 1999,
        sessionRequestedAmountMinor: null,
      })
    ).toBe(true);
  });

  it("does not create again when the server amount differs from the client estimate", () => {
    expect(
      shouldCreateCodGuaranteeIntent({
        clientSecret: "cs_test",
        paymentIntentId: "pi_test",
        serverAmountMinor: 2500,
        requestedAmountMinor: 1999,
        sessionRequestedAmountMinor: 1999,
      })
    ).toBe(false);
  });

  it("requests an update when the checkout estimate changes", () => {
    expect(
      shouldCreateCodGuaranteeIntent({
        clientSecret: "cs_test",
        paymentIntentId: "pi_test",
        serverAmountMinor: 2500,
        requestedAmountMinor: 2999,
        sessionRequestedAmountMinor: 1999,
      })
    ).toBe(true);
  });

  it("displays the server amount instead of the client shipping estimate", () => {
    expect(displayedCodGuaranteeAmount(2500)).toBe(25);
    expect(displayedCodGuaranteeAmount(null)).toBeNull();
    expect(displayedCodGuaranteeAmount(0)).toBeNull();
  });
});
