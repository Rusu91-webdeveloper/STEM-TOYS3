/**
 * @jest-environment node
 */

import { parseCodGuaranteeEvidence, formatCodGuaranteeAuthorizationNote } from "@/lib/checkout/cod-guarantee";

describe("order email integration with COD guarantee", () => {
  it("formats and parses authorization note correctly", () => {
    const authNote = formatCodGuaranteeAuthorizationNote({
      paymentIntentId: "pi_test_123",
      amount: 19.99,
      timestamp: new Date("2026-10-02T10:00:00Z"),
    });
    
    const evidence = parseCodGuaranteeEvidence(authNote);
    expect(evidence.authorizedAmount).toBe(19.99);
    expect(evidence.paymentIntentId).toBe("pi_test_123");
    
    const formattedAmount = (19.99).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formattedAmount).toBe("19,99");
  });
});
