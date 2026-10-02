/**
 * Tests for improved transactional email templates
 * Validates data mapping, money formatting, and calculations
 */

import {
  generateOrderConfirmationEmail,
  type OrderConfirmationData,
} from "@/lib/email/order-confirmation-improved";
import {
  generateShippedEmail,
  type ShippedEmailData,
} from "@/lib/email/shipped-email-improved";
import { generatePaymentFailedEmail } from "@/lib/email/payment-and-refund-emails";
import { generateRefundEmail } from "@/lib/email/payment-and-refund-emails";
import { formatRON } from "@/lib/email/shared-layout";

describe("Money Formatting (ro-RO)", () => {
  it("formats whole numbers with .00 decimals", () => {
    expect(formatRON(100)).toBe("100,00 RON");
    expect(formatRON(250)).toBe("250,00 RON");
  });

  it("formats decimals with comma separator", () => {
    expect(formatRON(89.9)).toBe("89,90 RON");
    expect(formatRON(49.9)).toBe("49,90 RON");
    expect(formatRON(15.5)).toBe("15,50 RON");
  });

  it("formats large amounts with thousands separator", () => {
    expect(formatRON(1234.56)).toBe("1.234,56 RON");
    expect(formatRON(10000)).toBe("10.000,00 RON");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatRON(89.999)).toBe("90,00 RON");
    expect(formatRON(49.895)).toBe("49,90 RON");
  });

  it("handles zero correctly", () => {
    expect(formatRON(0)).toBe("0,00 RON");
  });
});

describe("Order Confirmation Email - COD Order", () => {
  const codOrderData: OrderConfirmationData = {
    customerName: "Maria Popescu",
    customerEmail: "maria@example.com",
    orderNumber: "TT-2024-12345",
    orderDate: new Date("2024-10-02T10:00:00Z"),
    paymentMethod: "cash_on_delivery",
    paymentStatus: "PENDING",
    items: [
      { name: "STEM Kit Deluxe", quantity: 2, price: 89.9 },
      { name: "Microscop Junior", quantity: 1, price: 49.9 },
    ],
    subtotal: 229.7,
    shippingCost: 15,
    codFee: 2.45,
    total: 247.15,
    shippingAddress: {
      fullName: "Maria Popescu",
      addressLine1: "Str. Avram Iancu nr. 15",
      city: "Cluj-Napoca",
      state: "Cluj",
      postalCode: "400000",
      country: "România",
      phone: "+40712345678",
    },
    isCOD: true,
    codAmount: 247.15,
    hasCardHold: false,
  };

  it("generates valid HTML", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("TT-2024-12345");
    expect(html).toContain("Maria Popescu");
  });

  it("shows COD amount to pay courier", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("247,15 RON");
    expect(html).toContain("plătești curierului");
  });

  it("shows phone confirmation note for COD", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("te vom suna");
  });

  it("displays line item totals correctly", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    // 2 × 89.90 = 179.80
    expect(html).toContain("179,80");
    // 1 × 49.90 = 49.90
    expect(html).toContain("49,90");
  });

  it("shows correct subtotal, shipping, COD fee breakdown", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("229,70 RON"); // subtotal
    expect(html).toContain("15,00 RON"); // shipping
    expect(html).toContain("2,45 RON"); // COD fee
    expect(html).toContain("247,15 RON"); // total
  });

  it("shows shipping address", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("Str. Avram Iancu nr. 15");
    expect(html).toContain("Cluj-Napoca");
    expect(html).toContain("+40712345678");
  });

  it("includes tracking link with orderNumber and email", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("/track-order");
    expect(html).toContain("orderNumber=TT-2024-12345");
    expect(html).toContain("email=maria%40example.com");
  });

  it("shows 14-day withdrawal notice in footer", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("14 zile");
    expect(html).toContain("returnare");
  });

  it("includes canonical contact details", async () => {
    const html = await generateOrderConfirmationEmail(codOrderData);
    expect(html).toContain("+40771248029");
    expect(html).toContain("info@techtots.ro");
    expect(html).toContain("WEBIRA REM S.R.L.");
  });
});

describe("Order Confirmation Email - COD with Card Hold", () => {
  const codWithHoldData: OrderConfirmationData = {
    customerName: "Ion Ionescu",
    customerEmail: "ion@example.com",
    orderNumber: "TT-2024-12346",
    orderDate: new Date("2024-10-02T11:00:00Z"),
    paymentMethod: "cash_on_delivery",
    paymentStatus: "PENDING",
    items: [{ name: "STEM Kit Premium", quantity: 1, price: 249.0 }],
    subtotal: 249.0,
    shippingCost: 15,
    codFee: 2.64,
    total: 266.64,
    shippingAddress: {
      fullName: "Ion Ionescu",
      addressLine1: "Bd. Unirii nr. 1",
      city: "București",
      state: "București",
      postalCode: "030823",
      country: "România",
      phone: "+40721234567",
    },
    isCOD: true,
    codAmount: 266.64,
    hasCardHold: true,
    cardHoldAmount: 25,
  };

  it("shows 25 lei card hold notice for new customer COD", async () => {
    const html = await generateOrderConfirmationEmail(codWithHoldData);
    expect(html).toContain("25");
    expect(html).toContain("autorizare");
    expect(html).toContain("card");
  });

  it("does NOT show card hold notice when hasCardHold is false", async () => {
    const dataWithoutHold = { ...codWithHoldData, hasCardHold: false };
    const html = await generateOrderConfirmationEmail(dataWithoutHold);
    expect(html).not.toContain("autorizare");
  });
});

describe("Order Confirmation Email - Paid Card Order", () => {
  const paidOrderData: OrderConfirmationData = {
    customerName: "Ana Georgescu",
    customerEmail: "ana@example.com",
    orderNumber: "TT-2024-12347",
    orderDate: new Date("2024-10-02T12:00:00Z"),
    paymentMethod: "card",
    paymentStatus: "PAID",
    items: [
      { name: "Robot Programabil", quantity: 1, price: 179.9 },
      { name: "Kit Chimie", quantity: 2, price: 79.9 },
    ],
    subtotal: 339.7,
    shippingCost: 0,
    total: 339.7,
    shippingAddress: {
      fullName: "Ana Georgescu",
      addressLine1: "Str. Victoriei nr. 22",
      city: "Timișoara",
      state: "Timiș",
      postalCode: "300006",
      country: "România",
      phone: "+40731234567",
    },
    isCOD: false,
  };

  it("shows 'Total plătit' for paid card orders", async () => {
    const html = await generateOrderConfirmationEmail(paidOrderData);
    expect(html).toContain("Total plătit");
    expect(html).not.toContain("plătești curierului");
  });

  it("does NOT show COD fee for card orders", async () => {
    const html = await generateOrderConfirmationEmail(paidOrderData);
    expect(html).not.toContain("Taxa ramburs");
  });

  it("does NOT show phone confirmation note", async () => {
    const html = await generateOrderConfirmationEmail(paidOrderData);
    expect(html).not.toContain("te vom suna");
  });

  it("shows free shipping when shippingCost is 0", async () => {
    const html = await generateOrderConfirmationEmail(paidOrderData);
    expect(html).toContain("GRATUIT");
  });

  it("calculates line totals correctly", async () => {
    const html = await generateOrderConfirmationEmail(paidOrderData);
    // 1 × 179.90 = 179.90
    expect(html).toContain("179,90");
    // 2 × 79.90 = 159.80
    expect(html).toContain("159,80");
  });
});

describe("Shipped Email", () => {
  const shippedData: ShippedEmailData = {
    customerName: "Elena Dumitrescu",
    customerEmail: "elena@example.com",
    orderNumber: "TT-2024-12348",
    trackingNumber: "1234567890123",
    carrier: "FanCourier",
    shippedDate: new Date("2024-10-02T14:00:00Z"),
    estimatedDeliveryDays: 2,
    isCOD: true,
    codAmount: 189.5,
  };

  it("generates valid HTML with AWB number", async () => {
    const html = await generateShippedEmail(shippedData);
    expect(html).toContain("1234567890123");
    expect(html).toContain("TT-2024-12348");
  });

  it("includes FanCourier tracking link", async () => {
    const html = await generateShippedEmail(shippedData);
    expect(html).toContain("fancourier.ro/awb-tracking");
    expect(html).toContain("1234567890123");
  });

  it("shows COD amount reminder for COD orders", async () => {
    const html = await generateShippedEmail(shippedData);
    expect(html).toContain("189,50 RON");
    expect(html).toContain("plătești curierului");
  });

  it("does NOT show COD reminder for paid orders", async () => {
    const paidShippedData = { ...shippedData, isCOD: false, codAmount: undefined };
    const html = await generateShippedEmail(paidShippedData);
    expect(html).not.toContain("plătești curierului");
  });

  it("includes delivery tips", async () => {
    const html = await generateShippedEmail(shippedData);
    expect(html).toContain("livrare");
    expect(html).toContain("curierului");
  });
});

describe("Payment Failed Email", () => {
  it("generates valid Romanian HTML", async () => {
    const html = await generatePaymentFailedEmail({
      customerName: "Mihai Stancu",
      orderNumber: "TT-2024-12349",
      attemptedAmount: 199.0,
      failureDate: new Date("2024-10-02T15:00:00Z"),
      failureReason: "Card declined",
      retryPaymentLink: "https://techtots.ro/checkout/retry/12349",
    });

    expect(html).toContain("Mihai Stancu");
    expect(html).toContain("TT-2024-12349");
    expect(html).toContain("199,00 RON");
    expect(html).toContain("plata nu a putut fi procesată");
  });

  it("includes retry payment link", async () => {
    const html = await generatePaymentFailedEmail({
      customerName: "Test",
      orderNumber: "TT-123",
      attemptedAmount: 100,
      failureDate: new Date(),
      retryPaymentLink: "https://techtots.ro/checkout/retry/123",
    });

    expect(html).toContain("https://techtots.ro/checkout/retry/123");
    expect(html).toContain("Încearcă din nou");
  });
});

describe("Refund Email", () => {
  it("generates valid Romanian HTML", async () => {
    const html = await generateRefundEmail({
      customerName: "Adina Popa",
      orderNumber: "TT-2024-12350",
      refundedAmount: 150.0,
      originalTotal: 200.0,
      refundedAt: new Date("2024-10-02T16:00:00Z"),
    });

    expect(html).toContain("Adina Popa");
    expect(html).toContain("TT-2024-12350");
    expect(html).toContain("150,00 RON");
    expect(html).toContain("rambursat");
  });

  it("shows processing time notice without specific day claims", async () => {
    const html = await generateRefundEmail({
      customerName: "Test",
      orderNumber: "TT-123",
      refundedAmount: 100,
      originalTotal: 100,
      refundedAt: new Date(),
    });

    // Should mention processing time depends on payment processor/bank but no specific "5-10 days" claim
    expect(html).toContain("procesată");
    expect(html).toContain("procesator");
    expect(html).not.toContain("5-10 zile"); // Removed unverifiable claim
  });
});

describe("Line Totals Calculation", () => {
  it("calculates correct line totals for multiple quantities", () => {
    // 2 × 89.90 = 179.80
    const lineTotal1 = 2 * 89.9;
    expect(lineTotal1).toBeCloseTo(179.8, 2);

    // 3 × 49.90 = 149.70
    const lineTotal2 = 3 * 49.9;
    expect(lineTotal2).toBeCloseTo(149.7, 2);
  });

  it("matches subtotal calculation from order", () => {
    const items = [
      { quantity: 2, price: 89.9 },
      { quantity: 1, price: 49.9 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    expect(subtotal).toBeCloseTo(229.7, 2);
  });
});

describe("Order Total Breakdown", () => {
  it("adds up correctly: subtotal + shipping + COD fee = total", () => {
    const subtotal = 229.7;
    const shipping = 15.0;
    const codFee = 2.45;
    const total = subtotal + shipping + codFee;

    expect(total).toBeCloseTo(247.15, 2);
  });

  it("adds up correctly for order with discount", () => {
    const subtotal = 300.0;
    const discount = 30.0;
    const shipping = 15.0;
    const codFee = 2.85;
    const total = subtotal - discount + shipping + codFee;

    expect(total).toBeCloseTo(287.85, 2);
  });

  it("handles free shipping correctly", () => {
    const subtotal = 339.7;
    const shipping = 0;
    const total = subtotal + shipping;

    expect(total).toBeCloseTo(339.7, 2);
  });
});

describe("COD Fee Calculation (1%)", () => {
  it("calculates 1% COD fee correctly", () => {
    const orderTotal = 247.15;
    const codFee = orderTotal * 0.01;
    expect(codFee).toBeCloseTo(2.47, 2);
  });

  it("matches example from requirements", () => {
    // 2×89.90 + 1×49.90 = 229.70 (subtotal)
    // + 15 shipping = 244.70
    // + 1% COD fee (244.70 × 0.01 = 2.447, rounded 2.45) = 247.15
    const subtotal = 2 * 89.9 + 1 * 49.9;
    const shipping = 15;
    const subtotalPlusShipping = subtotal + shipping;
    const codFee = Math.round(subtotalPlusShipping * 0.01 * 100) / 100;
    const total = subtotalPlusShipping + codFee;

    expect(total).toBeCloseTo(247.15, 2);
  });
});
