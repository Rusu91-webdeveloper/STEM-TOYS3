/**
 * Pure function extracted from PaymentForm's codGuaranteeAmount useMemo.
 * Calculates the COD guarantee amount based on shipping method.
 */
export function calculateCodGuaranteeAmount(
  selectedPaymentMethod: string | undefined,
  shippingMethod: { codGuaranteeHoldPrice?: number | null } | undefined
): number {
  if (selectedPaymentMethod !== "cash_on_delivery") {
    return 0;
  }

  if (!shippingMethod?.codGuaranteeHoldPrice) {
    return 0;
  }

  const holdPrice = shippingMethod.codGuaranteeHoldPrice;
  return Math.round(holdPrice * 100) / 100;
}

describe("PaymentForm COD guarantee calculation", () => {
  it("returns 19.99 when shippingMethod has codGuaranteeHoldPrice: 19.99", () => {
    const result = calculateCodGuaranteeAmount("cash_on_delivery", {
      codGuaranteeHoldPrice: 19.99,
    });

    expect(result).toBe(19.99);
  });

  it("returns 0 when payment method is not COD", () => {
    const result = calculateCodGuaranteeAmount("stripe_new", {
      codGuaranteeHoldPrice: 19.99,
    });

    expect(result).toBe(0);
  });

  it("returns 0 when codGuaranteeHoldPrice is null", () => {
    const result = calculateCodGuaranteeAmount("cash_on_delivery", {
      codGuaranteeHoldPrice: null,
    });

    expect(result).toBe(0);
  });

  it("returns 0 when codGuaranteeHoldPrice is undefined", () => {
    const result = calculateCodGuaranteeAmount("cash_on_delivery", {
      codGuaranteeHoldPrice: undefined,
    });

    expect(result).toBe(0);
  });

  it("returns 0 when shippingMethod is undefined", () => {
    const result = calculateCodGuaranteeAmount("cash_on_delivery", undefined);

    expect(result).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateCodGuaranteeAmount("cash_on_delivery", {
      codGuaranteeHoldPrice: 19.999,
    });

    expect(result).toBe(20);
  });
});
