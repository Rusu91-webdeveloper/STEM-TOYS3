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

  it("defaults to always requiring the guarantee when no mode is configured", () => {
    delete process.env.COD_GUARANTEE_MODE;
    delete process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE;

    const policy = evaluateCodGuaranteePolicy({
      orderTotal: 100,
      recipientType: "B2C",
      isLockerDelivery: false,
      priorOrderCount: 3,
      priorCodRtoCount: 0,
    });

    expect(policy.mode).toBe("always");
    expect(policy.required).toBe(true);
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
