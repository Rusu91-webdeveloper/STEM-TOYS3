/**
 * @jest-environment node
 */

import { formatCodGuaranteeAuthorizationNote } from "@/lib/checkout/cod-guarantee";

describe("order email integration with COD guarantee", () => {
  it("formats authorization note with correct amount", () => {
    const authNote = formatCodGuaranteeAuthorizationNote({
      paymentIntentId: "pi_test_123",
      amount: 19.99,
      authorizedAt: "2026-10-02T10:00:00Z",
    });
    
    expect(authNote).toContain("19.99");
    expect(authNote).toContain("pi_test_123");
    
    const formattedAmount = (19.99).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formattedAmount).toBe("19,99");
  });
});
