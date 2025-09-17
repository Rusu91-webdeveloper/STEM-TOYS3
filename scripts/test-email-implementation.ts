import { prisma } from "../lib/prisma";
import { DatabaseTemplateService } from "../lib/email/database-template-service";

/**
 * Test script to verify the improved email template system implementation
 */
async function testEmailImplementation() {
  try {
    console.log(
      "🧪 Testing the improved email template system implementation..."
    );

    // Test 1: Simple variable replacement
    console.log("\n📋 TEST 1: Simple variable replacement");
    const simpleVarTest = DatabaseTemplateService.replaceVariables(
      "Hello {{userName}}!",
      { userName: "John" }
    );
    console.log(`Input: "Hello {{userName}}!"`);
    console.log(`Expected: "Hello John!"`);
    console.log(`Actual: "${simpleVarTest}"`);
    console.log(
      `Result: ${simpleVarTest === "Hello John!" ? "✅ PASS" : "❌ FAIL"}`
    );

    // Test 2: Nested variable replacement
    console.log("\n📋 TEST 2: Nested variable replacement");
    const nestedVarTest = DatabaseTemplateService.replaceVariables(
      "Order #{{order.id}} total: {{order.total}}",
      { order: { id: "12345", total: "$99.99" } }
    );
    console.log(`Input: "Order #{{order.id}} total: {{order.total}}"`);
    console.log(`Expected: "Order #12345 total: $99.99"`);
    console.log(`Actual: "${nestedVarTest}"`);
    console.log(
      `Result: ${nestedVarTest === "Order #12345 total: $99.99" ? "✅ PASS" : "❌ FAIL"}`
    );

    // Test 3: Loop replacement
    console.log("\n📋 TEST 3: Loop replacement");
    const loopTest = DatabaseTemplateService.replaceVariables(
      "Items:{{#each items}}\n- {{name}}: {{quantity}} x {{price}}{{/each}}",
      {
        items: [
          { name: "Product A", quantity: 2, price: "$10.00" },
          { name: "Product B", quantity: 1, price: "$25.00" },
        ],
      }
    );
    const expectedLoopResult =
      "Items:\n- Product A: 2 x $10.00\n- Product B: 1 x $25.00";
    console.log(
      `Input: "Items:{{#each items}}\\n- {{name}}: {{quantity}} x {{price}}{{/each}}"`
    );
    console.log(`Expected: "${expectedLoopResult}"`);
    console.log(`Actual: "${loopTest}"`);
    console.log(
      `Result: ${loopTest === expectedLoopResult ? "✅ PASS" : "❌ FAIL"}`
    );

    // Test 4: Conditional replacement
    console.log("\n📋 TEST 4: Conditional replacement");
    const conditionalTest = DatabaseTemplateService.replaceVariables(
      "Hi {{name}}{{#if hasDiscount}} (You have a discount!){{/if}}",
      { name: "Alice", hasDiscount: true }
    );
    console.log(
      `Input: "Hi {{name}}{{#if hasDiscount}} (You have a discount!){{/if}}"`
    );
    console.log(`Expected: "Hi Alice (You have a discount!)"`);
    console.log(`Actual: "${conditionalTest}"`);
    console.log(
      `Result: ${conditionalTest === "Hi Alice (You have a discount!)" ? "✅ PASS" : "❌ FAIL"}`
    );

    const conditionalTest2 = DatabaseTemplateService.replaceVariables(
      "Hi {{name}}{{#if hasDiscount}} (You have a discount!){{/if}}",
      { name: "Bob", hasDiscount: false }
    );
    console.log(
      `\nInput: "Hi {{name}}{{#if hasDiscount}} (You have a discount!){{/if}}"`
    );
    console.log(`Expected: "Hi Bob"`);
    console.log(`Actual: "${conditionalTest2}"`);
    console.log(
      `Result: ${conditionalTest2 === "Hi Bob" ? "✅ PASS" : "❌ FAIL"}`
    );

    // Test 5: Real template from database
    console.log("\n📋 TEST 5: Real template from database");

    // Get a real template from the database
    const emailVerificationTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: "email-verification" },
    });

    if (emailVerificationTemplate) {
      // Create test data
      const testData = {
        userName: "John Doe",
        verificationLink: "https://example.com/verify?token=abc123",
        expiresIn: "24 ore",
        siteUrl: "https://example.com",
      };

      // Process the subject
      const processedSubject = DatabaseTemplateService.replaceVariables(
        emailVerificationTemplate.subject,
        testData
      );

      console.log(
        `Template: ${emailVerificationTemplate.name} (${emailVerificationTemplate.slug})`
      );
      console.log(
        `Subject: "${emailVerificationTemplate.subject}" → "${processedSubject}"`
      );

      // Process just the first 100 chars of content for display purposes
      const contentPreview = emailVerificationTemplate.content.substring(
        0,
        100
      );
      const processedContentPreview = DatabaseTemplateService.replaceVariables(
        contentPreview,
        testData
      ).substring(0, 100);

      console.log(`Content preview: "${contentPreview}..."`);
      console.log(`Processed preview: "${processedContentPreview}..."`);

      // Check if there are any remaining unprocessed variables
      const remainingVars = processedContentPreview.match(/{{([^}]+)}}/g);
      console.log(
        `Unprocessed variables: ${remainingVars ? remainingVars.join(", ") : "None"}`
      );
      console.log(`Result: ${!remainingVars ? "✅ PASS" : "❌ FAIL"}`);
    } else {
      console.log("❌ Could not find email-verification template");
    }

    console.log("\n✅ Email template implementation tests complete!");
  } catch (error) {
    console.error("❌ Error during tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmailImplementation().catch(console.error);
