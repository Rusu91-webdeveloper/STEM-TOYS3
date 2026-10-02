import { chromium } from "playwright";
import { generateOrderConfirmationEmail } from "../lib/email/order-confirmation-improved";
import { generateShippedEmail } from "../lib/email/shipped-email-improved";
import {
  generatePaymentFailedEmail,
  generateRefundEmail,
} from "../lib/email/payment-and-refund-emails";

interface EmailScenario {
  name: string;
  filename: string;
  generate: () => Promise<string>;
}

const scenarios: EmailScenario[] = [
  {
    name: "COD Guest Order",
    filename: "cod-guest",
    generate: () =>
      generateOrderConfirmationEmail({
        customerName: "Ana Pop",
        customerEmail: "ana@example.com",
        orderNumber: "TT-2024-10001",
        orderDate: new Date("2024-10-02T10:30:00Z"),
        paymentMethod: "cash_on_delivery",
        total: 249.99,
        items: [
          {
            name: "STEM Puzzle 3D",
            quantity: 2,
            price: 99.99,
            imageUrl: "https://via.placeholder.com/100",
          },
          {
            name: "Kit Roboțel Solar",
            quantity: 1,
            price: 50.01,
            imageUrl: "https://via.placeholder.com/100",
          },
        ],
        shippingAddress: {
          fullName: "Ana Pop",
          addressLine1: "Str. Exemplu 123",
          city: "București",
          postalCode: "010101",
          country: "România",
          phone: "+40712345678",
        },
        hasCardHold: false,
      }),
  },
  {
    name: "COD with Card Hold",
    filename: "cod-with-hold",
    generate: () =>
      generateOrderConfirmationEmail({
        customerName: "Mihai Ionescu",
        customerEmail: "mihai@example.com",
        orderNumber: "TT-2024-10002",
        orderDate: new Date("2024-10-02T11:00:00Z"),
        paymentMethod: "cash_on_delivery",
        total: 349.99,
        items: [
          {
            name: "Kit Experimente Chimie",
            quantity: 1,
            price: 349.99,
            imageUrl: "https://via.placeholder.com/100",
          },
        ],
        shippingAddress: {
          fullName: "Mihai Ionescu",
          addressLine1: "Bd. Unirii 45",
          city: "Cluj-Napoca",
          postalCode: "400000",
          country: "România",
          phone: "+40723456789",
        },
        hasCardHold: true,
        cardHoldAmount: 50.0,
      }),
  },
  {
    name: "Card Paid Order",
    filename: "card-paid",
    generate: () =>
      generateOrderConfirmationEmail({
        customerName: "Elena Popescu",
        customerEmail: "elena@example.com",
        orderNumber: "TT-2024-10003",
        orderDate: new Date("2024-10-02T12:00:00Z"),
        paymentMethod: "card",
        total: 159.99,
        items: [
          {
            name: "Set Constructor Meccano",
            quantity: 1,
            price: 159.99,
            imageUrl: "https://via.placeholder.com/100",
          },
        ],
        shippingAddress: {
          fullName: "Elena Popescu",
          addressLine1: "Aleea Trandafirilor 7",
          city: "Timișoara",
          postalCode: "300000",
          country: "România",
          phone: "+40734567890",
        },
        hasCardHold: false,
      }),
  },
  {
    name: "Shipped COD Order",
    filename: "shipped-cod",
    generate: () =>
      generateShippedEmail({
        customerName: "Andrei Gheorghe",
        customerEmail: "andrei@example.com",
        orderNumber: "TT-2024-10004",
        trackingNumber: "RO123456789",
        carrier: "Fan Courier",
        shippedDate: new Date("2024-10-03T10:00:00Z"),
        isCOD: true,
        codAmount: 99.99,
      }),
  },
  {
    name: "Payment Failed",
    filename: "payment-failed",
    generate: () =>
      generatePaymentFailedEmail({
        customerName: "Maria Stancu",
        customerEmail: "maria@example.com",
        orderNumber: "TT-2024-10005",
        amount: 199.99,
      }),
  },
  {
    name: "Refund Processed",
    filename: "refund",
    generate: () =>
      generateRefundEmail({
        customerName: "George Dumitrescu",
        orderNumber: "TT-2024-10006",
        refundedAmount: 150.0,
        originalTotal: 200.0,
        refundedAt: new Date("2024-10-02T14:00:00Z"),
      }),
  },
];

async function testEmailMobile() {
  const browser = await chromium.launch({ headless: true });
  const results: Array<{
    name: string;
    scrollWidth600: number;
    scrollWidth390: number;
  }> = [];

  for (const scenario of scenarios) {
    console.log(`\n📧 Testing: ${scenario.name}`);
    const html = await scenario.generate();

    // Test at 600px
    const page600 = await browser.newPage({
      viewport: { width: 600, height: 844 },
    });
    await page600.setContent(html, { waitUntil: "networkidle" });
    const scrollWidth600 = await page600.evaluate(
      () => document.documentElement.scrollWidth
    );
    await page600.screenshot({
      path: `/opt/cursor/artifacts/email-previews/${scenario.filename}-600px.png`,
      fullPage: true,
    });
    await page600.close();

    // Test at 390px
    const page390 = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await page390.setContent(html, { waitUntil: "networkidle" });
    const scrollWidth390 = await page390.evaluate(
      () => document.documentElement.scrollWidth
    );
    await page390.screenshot({
      path: `/opt/cursor/artifacts/email-previews/${scenario.filename}-390px.png`,
      fullPage: true,
    });
    await page390.close();

    results.push({
      name: scenario.name,
      scrollWidth600,
      scrollWidth390,
    });

    console.log(`  ✓ 600px: scrollWidth = ${scrollWidth600}`);
    console.log(`  ✓ 390px: scrollWidth = ${scrollWidth390}`);
    console.log(
      `  ${scrollWidth390 <= 390 ? "✅ PASS" : "❌ FAIL"} (390px <= 390)`
    );
  }

  await browser.close();

  console.log("\n" + "=".repeat(60));
  console.log("MOBILE RESPONSIVENESS TEST RESULTS");
  console.log("=".repeat(60));
  results.forEach((r) => {
    const status = r.scrollWidth390 <= 390 ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${status} ${r.name.padEnd(25)} 600px: ${r.scrollWidth600}px, 390px: ${r.scrollWidth390}px`
    );
  });
  console.log("=".repeat(60));

  const allPass = results.every((r) => r.scrollWidth390 <= 390);
  console.log(
    allPass
      ? "\n✅ All emails pass mobile responsiveness test!"
      : "\n❌ Some emails fail mobile responsiveness test"
  );

  process.exit(allPass ? 0 : 1);
}

testEmailMobile().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
