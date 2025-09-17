import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../lib/email";
import { DatabaseTemplateService } from "../lib/email/database-template-service";

/**
 * This script tests the email endpoints by mocking email sending
 * It doesn't actually send emails but verifies that the endpoint functions work correctly
 * with the improved template service
 */
async function testEmailEndpoints() {
  console.log(
    "🧪 Testing email endpoints with the improved template service...\n"
  );

  // Mock the sendEmailViaUnifiedSystem function
  const originalModule = await import("../lib/nodemailer");
  const originalFunction = originalModule.sendEmailViaUnifiedSystem;

  // Store captured email data for inspection
  const capturedEmails: any[] = [];

  // Mock implementation
  originalModule.sendEmailViaUnifiedSystem = async (options: any) => {
    console.log(`📧 Would send email to: ${options.to}`);
    console.log(`📑 Subject: ${options.subject}`);
    console.log(`📝 Content preview: ${options.html.substring(0, 100)}...\n`);

    // Store for later inspection
    capturedEmails.push({
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // Return mock success response
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  };

  try {
    // Test 1: Welcome Email
    console.log("📋 TEST 1: Welcome Email");
    const welcomeResult = await sendWelcomeEmail(
      "test1@example.com",
      "Test User"
    );
    console.log(`Result: ${welcomeResult ? "✅ PASS" : "❌ FAIL"}`);

    // Test 2: Verification Email
    console.log("\n📋 TEST 2: Verification Email");
    const verificationResult = await sendVerificationEmail(
      "test2@example.com",
      "Test User",
      "test-verification-token"
    );
    console.log(`Result: ${verificationResult ? "✅ PASS" : "❌ FAIL"}`);

    // Test 3: Password Reset Email
    console.log("\n📋 TEST 3: Password Reset Email");
    const resetResult = await sendPasswordResetEmail(
      "test3@example.com",
      "test-reset-token"
    );
    console.log(`Result: ${resetResult ? "✅ PASS" : "❌ FAIL"}`);

    // Test 4: Direct DatabaseTemplateService test - Order Confirmation
    console.log("\n📋 TEST 4: Order Confirmation Email");
    const orderResult =
      await DatabaseTemplateService.sendOrderConfirmationEmail(
        "test4@example.com",
        {
          customerName: "Test Customer",
          orderNumber: "ORD-12345",
          orderTotal: 199.99,
          items: [
            { name: "Test Product 1", quantity: 2, price: 49.99 },
            { name: "Test Product 2", quantity: 1, price: 99.99 },
          ],
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            postalCode: "12345",
          },
        }
      );
    console.log(`Result: ${orderResult.success ? "✅ PASS" : "❌ FAIL"}`);

    // Verify captured emails for variable replacements
    console.log("\n📋 Checking variable replacements in captured emails...");
    let allVariablesReplaced = true;

    for (let i = 0; i < capturedEmails.length; i++) {
      const email = capturedEmails[i];
      const hasUnreplacedVariables =
        email.html.includes("{{") && email.html.includes("}}");

      if (hasUnreplacedVariables) {
        console.log(`❌ Email #${i + 1} has unreplaced variables!`);
        allVariablesReplaced = false;

        // Find and list all unreplaced variables
        const unreplacedVars = email.html.match(/{{([^}]+)}}/g);
        if (unreplacedVars) {
          console.log(`   Unreplaced variables: ${unreplacedVars.join(", ")}`);
        }
      } else {
        console.log(`✅ Email #${i + 1} has all variables properly replaced`);
      }
    }

    console.log(
      `\nVariable replacement check: ${allVariablesReplaced ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log("\n✅ Email endpoint tests complete!");
  } catch (error) {
    console.error("❌ Error during tests:", error);
  } finally {
    // Restore the original function
    originalModule.sendEmailViaUnifiedSystem = originalFunction;
  }
}

// Run the test
testEmailEndpoints().catch(console.error);
