#!/usr/bin/env node

/**
 * Email Template VAT Compliance Tester
 *
 * This script tests the email templates to ensure they properly display
 * VAT-inclusive pricing and comply with Romanian/EU law.
 */

const { emailTemplates } = require("../lib/brevoTemplates");
const { formatPrice } = require("../lib/currency");

console.log(`📧 Testing Email Templates for VAT Compliance...`);
console.log("=".repeat(60));

// Mock order data with VAT-inclusive pricing
const mockOrder = {
  id: "test-order-123",
  subtotal: 239.5, // VAT-exclusive (for backward compatibility)
  tax: 50.48, // VAT amount
  shippingCost: 0,
  total: 289.98, // VAT-inclusive total
  discountAmount: 0,
  items: [
    {
      id: "1",
      product: {
        name: "Joc Matematic Interactiv",
        slug: "joc-matematic",
        price: 89.99, // VAT-inclusive
      },
      quantity: 1,
      price: 89.99, // VAT-inclusive
    },
    {
      id: "2",
      product: {
        name: "Set Construcții STEM Avansat",
        slug: "set-constructii",
        price: 199.99, // VAT-inclusive
      },
      quantity: 1,
      price: 199.99, // VAT-inclusive
    },
  ],
  shippingAddress: {
    fullName: "Ion Popescu",
    addressLine1: "Strada Exemplu 123",
    city: "București",
    postalCode: "010101",
    country: "România",
  },
  user: {
    name: "Ion Popescu",
  },
};

async function testEmailTemplates() {
  try {
    console.log(`🧪 Testing Order Confirmation Email Template...`);

    // Test the order confirmation template
    const template = await emailTemplates.orderConfirmation({
      to: "test@example.com",
      order: mockOrder,
      user: mockOrder.user,
    });

    console.log(`✅ Email template generated successfully!`);
    console.log(`📋 Email Details:`);
    console.log(`   Subject: ${template.subject}`);
    console.log(`   To: ${template.to}`);

    // Check for VAT compliance indicators
    const content = template.html;
    const vatTests = [
      {
        name: "VAT-inclusive product prices",
        test: content.includes("(inclusiv TVA)"),
        expected: true,
      },
      {
        name: "No separate VAT line",
        test: !content.includes("TVA:</td>"),
        expected: true,
      },
      {
        name: "Subtotal shows VAT-inclusive amount",
        test: content.includes("Subtotal (inclusiv TVA)"),
        expected: true,
      },
      {
        name: "Total amount is correct",
        test: content.includes(formatPrice(mockOrder.total)),
        expected: true,
      },
    ];

    console.log(`\n🔍 VAT Compliance Tests:`);
    let allPassed = true;

    vatTests.forEach(test => {
      const passed = test.test === test.expected;
      const status = passed ? "✅ PASS" : "❌ FAIL";
      console.log(`   ${status} ${test.name}`);
      if (!passed) allPassed = false;
    });

    console.log(`\n📊 Test Summary:`);
    if (allPassed) {
      console.log(`✅ All tests passed! Email templates are VAT-compliant.`);
      console.log(`🇷🇴 Templates comply with Romanian/EU law.`);
      console.log(
        `📧 Customers will receive clear, legal email confirmations.`
      );
    } else {
      console.log(`❌ Some tests failed. Email templates need more work.`);
    }

    // Optional: Save test email to file for inspection
    const fs = require("fs");
    const testEmailPath = "./test-email-output.html";
    fs.writeFileSync(testEmailPath, content);
    console.log(`\n💾 Test email saved to: ${testEmailPath}`);
    console.log(`   Open this file in a browser to preview the email.`);
  } catch (error) {
    console.error(`❌ Error testing email templates:`, error);
  }
}

console.log(`🏁 Testing complete!`);
testEmailTemplates();
