/**
 * @jest-environment node
 */

import { parseCodGuaranteeEvidence } from "@/lib/checkout/cod-guarantee";
import { generateOrderConfirmationEmail } from "@/lib/email/order-confirmation-improved";

describe("order email integration with COD guarantee", () => {
  it("renders exact hold amount from authorization note", async () => {
    const authNote = "COD Guarantee authorized at 2026-10-02T10:00:00Z - PI: pi_test_123 - Amount: 19.99 RON";
    
    const evidence = parseCodGuaranteeEvidence(authNote);
    expect(evidence.authorizedAmount).toBe(19.99);

    const html = await generateOrderConfirmationEmail({
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      orderNumber: "ORD-123",
      orderDate: new Date("2026-10-02T10:00:00Z"),
      paymentMethod: "cash_on_delivery",
      paymentStatus: "PENDING",
      items: [
        { name: "Test Product", quantity: 1, price: 100.0 },
      ],
      subtotal: 100.0,
      shippingCost: 19.99,
      codFee: 3.15,
      total: 123.14,
      shippingAddress: {
        fullName: "Test Customer",
        addressLine1: "Test Street 1",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        country: "România",
        phone: "0712345678",
      },
      isCOD: true,
      codAmount: 123.14,
      hasCardHold: true,
      cardHoldAmount: 19.99,
    });

    expect(html).toContain("19,99");
    expect(html).toContain("blocat temporar");
  });
});
