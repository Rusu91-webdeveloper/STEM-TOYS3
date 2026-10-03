import {
  evaluateCodGuaranteePolicy,
  isLockerShippingMethodId,
} from "@/lib/checkout/cod-guarantee-policy";

describe("mandatory COD guarantee policy", () => {
  const originalEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it.each([
    {
      orderTotal: 50,
      priorOrderCount: 0,
      isLockerDelivery: false,
      recipientType: "B2C" as const,
    },
    {
      orderTotal: 193.01,
      priorOrderCount: 0,
      isLockerDelivery: false,
      recipientType: "B2C" as const,
    },
    {
      orderTotal: 200,
      priorOrderCount: 0,
      isLockerDelivery: false,
      recipientType: "B2C" as const,
    },
    {
      orderTotal: 120,
      priorOrderCount: 8,
      isLockerDelivery: false,
      recipientType: "B2C" as const,
    },
    {
      orderTotal: 80,
      priorOrderCount: 4,
      isLockerDelivery: false,
      recipientType: "B2B" as const,
    },
    {
      orderTotal: 80,
      priorOrderCount: 4,
      isLockerDelivery: true,
      recipientType: "B2C" as const,
    },
  ])("never grants an authorization exemption for %j", input => {
    const policy = evaluateCodGuaranteePolicy({
      ...input,
      priorCodRtoCount: 0,
    });
    expect(policy).toMatchObject({
      required: true,
      mode: "always",
      reasons: ["all_cod_orders"],
    });
  });

  it.each(["off", "risk_based", "always", "unknown"])(
    "ignores the retired %s environment override",
    mode => {
      process.env.COD_GUARANTEE_MODE = mode;
      process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE = mode;
      process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL = "99999";
      const policy = evaluateCodGuaranteePolicy({
        orderTotal: 50,
        recipientType: "B2C",
        isLockerDelivery: false,
        priorOrderCount: 10,
        priorCodRtoCount: 0,
      });
      expect(policy.required).toBe(true);
      expect(policy.mode).toBe("always");
    }
  );

  it("detects lockers for the separate prepaid-only delivery rule", () => {
    expect(isLockerShippingMethodId("fancourier:fanbox")).toBe(true);
    expect(isLockerShippingMethodId("easybox-standard")).toBe(true);
    expect(isLockerShippingMethodId("courier-home")).toBe(false);
  });
});
