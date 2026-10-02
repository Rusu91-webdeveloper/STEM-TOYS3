/**
 * Generate email preview artifacts with Playwright
 * Outputs HTML and screenshots to /opt/cursor/artifacts/email-previews/
 */

import { chromium } from 'playwright';
import { generateOrderConfirmationEmail } from '@/lib/email/order-confirmation-improved';
import { generateShippedEmail } from '@/lib/email/shipped-email-improved';
import { generatePaymentFailedEmail, generateRefundEmail } from '@/lib/email/payment-and-refund-emails';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const ARTIFACT_DIR = '/opt/cursor/artifacts/email-previews';

interface EmailScenario {
  name: string;
  filename: string;
  generator: () => Promise<string>;
}

async function main() {
  console.log('🚀 Starting email preview generation...\n');

  // Ensure artifact directory exists
  await mkdir(ARTIFACT_DIR, { recursive: true });

  // Define 6 scenarios
  const scenarios: EmailScenario[] = [
    {
      name: 'COD Guest Order',
      filename: '01-cod-guest',
      generator: async () => generateOrderConfirmationEmail({
        customerName: "Ion Popescu",
        customerEmail: "ion.popescu@example.com",
        orderNumber: "TEST-COD-001",
        orderDate: new Date('2026-10-02'),
        paymentMethod: "cash_on_delivery",
        paymentStatus: "PENDING",
        items: [
          { name: "Set LEGO Classic 900 piese", quantity: 1, price: 189.99 },
          { name: "Carte educativă - Explorarea Spațiului", quantity: 2, price: 45.00 },
        ],
        subtotal: 279.99,
        shippingCost: 15.00,
        codFee: 5.00,
        total: 299.99,
        shippingAddress: {
          fullName: "Ion Popescu",
          addressLine1: "Str. Moților 12",
          city: "Cluj-Napoca",
          postalCode: "400001",
          country: "România",
          phone: "+40712345678",
        },
        isCOD: true,
        codAmount: 299.99,
        hasCardHold: false,
      }),
    },
    {
      name: 'COD with 25 lei Card Hold',
      filename: '02-cod-hold',
      generator: async () => generateOrderConfirmationEmail({
        customerName: "Maria Ionescu",
        customerEmail: "maria.ionescu@example.com",
        orderNumber: "TEST-COD-002",
        orderDate: new Date('2026-10-02'),
        paymentMethod: "cash_on_delivery",
        paymentStatus: "PENDING",
        items: [
          { name: "Robot educativ programabil", quantity: 1, price: 329.99 },
        ],
        subtotal: 329.99,
        shippingCost: 15.00,
        codFee: 5.00,
        total: 349.99,
        shippingAddress: {
          fullName: "Maria Ionescu",
          addressLine1: "Bd. Eroilor 25",
          city: "București",
          postalCode: "050001",
          country: "România",
          phone: "+40723456789",
        },
        isCOD: true,
        codAmount: 349.99,
        hasCardHold: true,
        cardHoldAmount: 25.00,
      }),
    },
    {
      name: 'Card Paid Order',
      filename: '03-card-paid',
      generator: async () => generateOrderConfirmationEmail({
        customerName: "Alex Dumitrescu",
        customerEmail: "alex.dumitrescu@example.com",
        orderNumber: "TEST-CARD-001",
        orderDate: new Date('2026-10-02'),
        paymentMethod: "stripe_new",
        paymentStatus: "PAID",
        items: [
          { name: "Puzzle educativ 500 piese", quantity: 2, price: 75.00 },
          { name: "Joc de societate - Catan", quantity: 1, price: 159.99 },
        ],
        subtotal: 309.99,
        shippingCost: 15.00,
        total: 324.99,
        shippingAddress: {
          fullName: "Alex Dumitrescu",
          addressLine1: "Str. Libertății 8",
          city: "Timișoara",
          postalCode: "300001",
          country: "România",
          phone: "+40734567890",
        },
        isCOD: false,
      }),
    },
    {
      name: 'Shipped COD Order',
      filename: '04-shipped-cod',
      generator: async () => generateShippedEmail({
        customerName: "Elena Popescu",
        customerEmail: "elena.popescu@example.com",
        orderNumber: "TEST-SHIP-001",
        trackingNumber: "FAN123456789RO",
        carrier: "FanCourier",
        shippedDate: new Date('2026-10-02'),
        estimatedDeliveryDays: 2,
        isCOD: true,
        codAmount: 249.99,
      }),
    },
    {
      name: 'Payment Failed',
      filename: '05-payment-failed',
      generator: async () => generatePaymentFailedEmail({
        customerName: "Cristian Marin",
        customerEmail: "cristian.marin@example.com",
        orderNumber: "TEST-FAIL-001",
        amount: 199.99,
        failureReason: "Fonduri insuficiente pe card",
      }),
    },
    {
      name: 'Refund Processed',
      filename: '06-refund',
      generator: async () => generateRefundEmail({
        customerName: "Andreea Stan",
        orderNumber: "TEST-REF-001",
        refundedAmount: 299.99,
        originalTotal: 299.99,
        refundedAt: new Date('2026-10-02'),
      }),
    },
  ];

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Generate each scenario
  for (const scenario of scenarios) {
    console.log(`📧 Generating: ${scenario.name}`);

    // Generate HTML
    const html = await scenario.generator();
    const htmlPath = join(ARTIFACT_DIR, `${scenario.filename}.html`);
    await writeFile(htmlPath, html);
    console.log(`   ✓ HTML saved: ${htmlPath}`);

    // Check for NaN, undefined, or missing CUI/J20
    if (html.includes('NaN') || html.includes('undefined')) {
      console.error(`   ❌ ERROR: Contains NaN or undefined!`);
    }
    if (!html.includes('CUI:') || !html.includes('J20')) {
      console.error(`   ❌ ERROR: Missing CUI or J20 line!`);
    }

    // Screenshot at 600px
    const page600 = await context.newPage();
    await page600.setViewportSize({ width: 600, height: 1000 });
    await page600.setContent(html);
    const screenshot600Path = join(ARTIFACT_DIR, `${scenario.filename}-600px.png`);
    await page600.screenshot({ path: screenshot600Path, fullPage: true });
    console.log(`   ✓ Screenshot 600px: ${screenshot600Path}`);
    await page600.close();

    // Screenshot at 390px
    const page390 = await context.newPage();
    await page390.setViewportSize({ width: 390, height: 844 });
    await page390.setContent(html);
    const screenshot390Path = join(ARTIFACT_DIR, `${scenario.filename}-390px.png`);
    await page390.screenshot({ path: screenshot390Path, fullPage: true });
    console.log(`   ✓ Screenshot 390px: ${screenshot390Path}`);
    await page390.close();

    console.log('');
  }

  await browser.close();

  console.log(`✅ All email previews generated in ${ARTIFACT_DIR}`);
  console.log('📂 Files created:');
  console.log('   - 6 HTML files');
  console.log('   - 12 PNG screenshots (600px and 390px for each)');
}

main().catch(console.error);
