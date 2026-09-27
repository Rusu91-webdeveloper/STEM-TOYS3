import {
  evaluateCodGuaranteePolicy,
  isLockerShippingMethodId,
} from "@/lib/checkout/cod-guarantee-policy";

describe("cod guarantee policy", () => {
  const originalMode = process.env.COD_GUARANTEE_MODE;
  const originalPublicMode = process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE;

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.COD_GUARANTEE_MODE;
    } else {
      process.env.COD_GUARANTEE_MODE = originalMode;
    }

    if (originalPublicMode === undefined) {
      delete process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE;
    } else {
      process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE = originalPublicMode;
    }
  });

  it("defaults to risk_based and requires a guarantee for a new customer at 200 lei", () => {
    delete process.env.COD_GUARANTEE_MODE;
    delete process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE;
    delete process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL;

    const below = evaluateCodGuaranteePolicy({
      orderTotal: 199,
      recipientType: "B2C",
      isLockerDelivery: false,
      priorOrderCount: 0,
      priorCodRtoCount: 0,
    });
    const atThreshold = evaluateCodGuaranteePolicy({
      orderTotal: 200,
      recipientType: "B2C",
      isLockerDelivery: false,
      priorOrderCount: 0,
      priorCodRtoCount: 0,
    });
    const returning = evaluateCodGuaranteePolicy({
      orderTotal: 200,
      recipientType: "B2C",
      isLockerDelivery: false,
      priorOrderCount: 2,
      priorCodRtoCount: 0,
    });

    expect(below.mode).toBe("risk_based");
    expect(below.required).toBe(false);
    expect(below.thresholds.newCustomerMinTotal).toBe(200);
    expect(below.thresholds.highOrderValue).toBe(500);
    expect(below.thresholds.b2bMinTotal).toBe(700);
    expect(below.thresholds.codRtoCount).toBe(1);
    expect(atThreshold.required).toBe(true);
    expect(atThreshold.reasons).toContain("new_customer_high_value");
    expect(returning.required).toBe(false);
  });

  it("lets COD_GUARANTEE_MODE and the new-customer env override the code defaults", () => {
    process.env.COD_GUARANTEE_MODE = "always";
    process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL = "350";

    const forced = evaluateCodGuaranteePolicy({
      orderTotal: 100,
      recipientType: "B2C",
      isLockerDelivery: false,
      priorOrderCount: 3,
      priorCodRtoCount: 0,
    });

    expect(forced.mode).toBe("always");
    expect(forced.required).toBe(true);
    expect(forced.thresholds.newCustomerMinTotal).toBe(350);

    delete process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL;
  });

  it("does not require a guarantee for locker delivery even when mode is always", () => {
    process.env.COD_GUARANTEE_MODE = "always";

    const policy = evaluateCodGuaranteePolicy({
      orderTotal: 1000,
      recipientType: "B2C",
      isLockerDelivery: true,
      priorOrderCount: 0,
      priorCodRtoCount: 2,
    });

    expect(policy.required).toBe(false);
  });

  it("detects locker shipping methods by id", () => {
    expect(isLockerShippingMethodId("sameday-fanbox")).toBe(true);
    expect(isLockerShippingMethodId("easybox-standard")).toBe(true);
    expect(isLockerShippingMethodId("courier-home")).toBe(false);
  });
});
