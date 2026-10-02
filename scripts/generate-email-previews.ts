/**
 * Generate Email Preview Artifacts
 * Creates HTML previews for all improved transactional emails at desktop and mobile widths
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { generateOrderConfirmationEmail, type OrderConfirmationData } from "../lib/email/order-confirmation-improved";
import { generateShippedEmail, type ShippedEmailData } from "../lib/email/shipped-email-improved";
import { generatePaymentFailedEmail } from "../lib/email/payment-and-refund-emails";
import { generateRefundEmail } from "../lib/email/payment-and-refund-emails";

const OUTPUT_DIR = join(process.cwd(), "email-previews");

// Ensure output directory exists
try {
  mkdirSync(OUTPUT_DIR, { recursive: true });
} catch (err) {
  // Directory might already exist
}

/**
 * Scenario 1: COD Guest Order
 * 2×89,90 + 1×49,90 = 229,70 subtotal
 * + 15 shipping
 * + 2,45 COD fee (1% of 244,70)
 * = 247,15 total
 */
async function generateCODGuestOrderPreview() {
  const data: OrderConfirmationData = {
    customerName: "Maria Popescu",
    customerEmail: "guest@example.com",
    orderNumber: "TT-2024-10001",
    orderDate: new Date("2024-10-02T10:30:00Z"),
    paymentMethod: "cash_on_delivery",
    paymentStatus: "PENDING",
    items: [
      { name: "Set STEM Constructor 200 piese", quantity: 2, price: 89.9 },
      { name: "Microscop digital pentru copii", quantity: 1, price: 49.9 },
    ],
    subtotal: 229.7,
    shippingCost: 15,
    codFee: 2.45,
    total: 247.15,
    shippingAddress: {
      fullName: "Maria Popescu",
      addressLine1: "Str. Avram Iancu nr. 15, Ap. 23",
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

  const html = await generateOrderConfirmationEmail(data);
  const filename = "01-order-confirmation-cod-guest.html";
  writeFileSync(join(OUTPUT_DIR, filename), html);
  console.log(`✅ Generated: ${filename}`);
}

/**
 * Scenario 2: Paid Card Order
 */
async function generatePaidCardOrderPreview() {
  const data: OrderConfirmationData = {
    customerName: "Ion Ionescu",
    customerEmail: "ion.ionescu@example.com",
    orderNumber: "TT-2024-10002",
    orderDate: new Date("2024-10-02T11:15:00Z"),
    paymentMethod: "card",
    paymentStatus: "PAID",
    items: [
      { name: "Robot programabil mBot", quantity: 1, price: 299.0 },
      { name: "Kit experimente fizică", quantity: 1, price: 89.9 },
    ],
    subtotal: 388.9,
    shippingCost: 0, // Free shipping for orders over 199 lei
    total: 388.9,
    shippingAddress: {
      fullName: "Ion Ionescu",
      addressLine1: "Bd. Unirii nr. 45, Bl. A2, Sc. 1, Et. 3, Ap. 12",
      city: "București",
      state: "București",
      postalCode: "030823",
      country: "România",
      phone: "+40721234567",
    },
    isCOD: false,
  };

  const html = await generateOrderConfirmationEmail(data);
  const filename = "02-order-confirmation-card-paid.html";
  writeFileSync(join(OUTPUT_DIR, filename), html);
  console.log(`✅ Generated: ${filename}`);
}

/**
 * Scenario 3: Shipped with AWB
 */
async function generateShippedPreview() {
  const data: ShippedEmailData = {
    customerName: "Elena Dumitrescu",
    customerEmail: "elena.dumitrescu@example.com",
    orderNumber: "TT-2024-10003",
    trackingNumber: "1234567890123",
    carrier: "FanCourier",
    shippedDate: new Date("2024-10-02T09:00:00Z"),
    estimatedDeliveryDays: 2,
    isCOD: true,
    codAmount: 189.5,
  };

  const html = await generateShippedEmail(data);
  const filename = "03-shipped-with-awb-cod.html";
  writeFileSync(join(OUTPUT_DIR, filename), html);
  console.log(`✅ Generated: ${filename}`);
}

/**
 * Scenario 4: Payment Failed
 */
async function generatePaymentFailedPreview() {
  const html = await generatePaymentFailedEmail({
    customerName: "Mihai Stancu",
    orderNumber: "TT-2024-10004",
    attemptedAmount: 249.0,
    failureDate: new Date("2024-10-02T12:45:00Z"),
    failureReason: "Card declined - Insufficient funds",
    retryPaymentLink: "https://www.techtots.ro/checkout/retry/TT-2024-10004?token=abc123xyz",
  });

  const filename = "04-payment-failed.html";
  writeFileSync(join(OUTPUT_DIR, filename), html);
  console.log(`✅ Generated: ${filename}`);
}

/**
 * Scenario 5: Refund
 */
async function generateRefundPreview() {
  const html = await generateRefundEmail({
    customerName: "Adina Popa",
    orderNumber: "TT-2024-10005",
    refundedAmount: 179.9,
    originalTotal: 179.9,
    refundedAt: new Date("2024-10-02T14:20:00Z"),
  });

  const filename = "05-refund-processed.html";
  writeFileSync(join(OUTPUT_DIR, filename), html);
  console.log(`✅ Generated: ${filename}`);
}

/**
 * Generate all previews
 */
async function generateAllPreviews() {
  console.log("🎨 Generating email preview artifacts...\n");

  try {
    await generateCODGuestOrderPreview();
    await generatePaidCardOrderPreview();
    await generateShippedPreview();
    await generatePaymentFailedPreview();
    await generateRefundPreview();

    console.log(`\n✨ All previews generated successfully!`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log("\nℹ️  View these HTML files in a browser to see:");
    console.log("   - Desktop width (default)");
    console.log("   - Mobile width (resize browser to < 600px or use device emulation)");
    console.log("\n📱 To test mobile rendering:");
    console.log("   1. Open file in Chrome/Firefox");
    console.log("   2. Press F12 for DevTools");
    console.log("   3. Toggle device toolbar (Ctrl+Shift+M)");
    console.log("   4. Select iPhone/Android device or set custom width (320-480px)");
  } catch (error) {
    console.error("\n❌ Error generating previews:", error);
    process.exit(1);
  }
}

generateAllPreviews();
