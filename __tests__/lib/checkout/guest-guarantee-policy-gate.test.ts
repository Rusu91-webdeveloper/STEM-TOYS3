/**
 * @jest-environment node
 */

import { guestGuaranteePolicyRejection } from "@/lib/checkout/guest-guarantee-policy-gate";

jest.mock("@/lib/checkout/cod-guarantee-risk", () => ({
  resolveCodGuaranteeCustomerStats: jest.fn(() =>
    Promise.resolve({
      priorOrderCount: 0,
      priorCodRtoCount: 0,
    })
  ),
}));

describe("guestGuaranteePolicyRejection", () => {
  const previousMode = process.env.COD_GUARANTEE_MODE;

  afterEach(() => {
    if (previousMode === undefined) {
      delete process.env.COD_GUARANTEE_MODE;
    } else {
      process.env.COD_GUARANTEE_MODE = previousMode;
    }
  });

  it("allows a guarantee for a low-value guest order even with a legacy risk setting", async () => {
    process.env.COD_GUARANTEE_MODE = "risk_based";
    const {
      resolveCodGuaranteeCustomerStats,
    } = require("@/lib/checkout/cod-guarantee-risk");

    const response = await guestGuaranteePolicyRejection({
      guestEmail: "guest@example.com",
      orderTotal: 120,
      shippingMethodId: "fancourier:standard",
      recipientType: "B2C",
    });
    expect(response).toBeNull();
    expect(resolveCodGuaranteeCustomerStats).toHaveBeenCalledWith({
      guestEmail: "guest@example.com",
      phone: undefined,
    });
  });

  it("allows the intent when that same policy requires a guarantee", async () => {
    process.env.COD_GUARANTEE_MODE = "risk_based";

    const response = await guestGuaranteePolicyRejection({
      guestEmail: "guest@example.com",
      orderTotal: 420,
      shippingMethodId: "fancourier:standard",
      recipientType: "B2C",
    });

    expect(response).toBeNull();
  });

  it("rejects locker delivery without creating a guarantee", async () => {
    process.env.COD_GUARANTEE_MODE = "always";

    const response = await guestGuaranteePolicyRejection({
      guestEmail: "guest@example.com",
      orderTotal: 420,
      shippingMethodId: "fancourier:fanbox",
      recipientType: "B2C",
    });

    expect(response?.status).toBe(400);
    expect((await response?.json()).error).toBe("COD_NOT_ALLOWED_FOR_LOCKER");
  });
});
