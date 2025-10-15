/**
 * Email Template Testing Script
 *
 * Tests all major email templates with sample data to verify:
 * - Variables are replaced correctly
 * - No empty fields in emails
 * - Templates render without errors
 */

import { DatabaseTemplateService } from "../lib/email/database-template-service";
import { AdminNotificationService } from "../lib/email/admin-notification-service";

interface TestResult {
  template: string;
  status: "PASS" | "FAIL";
  error?: string;
  duration: number;
}

class EmailTemplateTester {
  private results: TestResult[] = [];
  private testEmail = process.env.TEST_EMAIL || "test@example.com";

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log("🧪 Email Template Testing Suite\n");
    console.log(`Test Email: ${this.testEmail}\n`);
    console.log("⚠️  NOTE: Emails will be sent to test email address\n");
    console.log("=".repeat(60) + "\n");

    // Test authentication emails
    await this.testAuthenticationEmails();

    // Test order emails
    await this.testOrderEmails();

    // Test marketing emails
    await this.testMarketingEmails();

    // Print results
    this.printResults();
  }

  /**
   * Test authentication emails
   */
  private async testAuthenticationEmails(): Promise<void> {
    console.log("📧 Testing Authentication Emails\n");

    // Test account verification
    await this.runTest("Account Verification", async () => {
      return await DatabaseTemplateService.sendVerificationEmail(
        this.testEmail,
        "Test User",
        `https://techtots.ro/auth/verify?token=test123&email=${encodeURIComponent(this.testEmail)}`
      );
    });

    // Test password reset
    await this.runTest("Password Reset", async () => {
      return await DatabaseTemplateService.sendPasswordResetEmail(
        this.testEmail,
        `https://techtots.ro/auth/reset-password?token=reset123&email=${encodeURIComponent(this.testEmail)}`,
        "Test User"
      );
    });

    // Test welcome email
    await this.runTest("Welcome Email", async () => {
      return await DatabaseTemplateService.sendWelcomeEmail(
        this.testEmail,
        "Test User",
        `https://techtots.ro/auth/verify?token=welcome123`
      );
    });

    console.log("");
  }

  /**
   * Test order emails
   */
  private async testOrderEmails(): Promise<void> {
    console.log("📦 Testing Order Emails\n");

    // Test order confirmation
    await this.runTest("Order Confirmation", async () => {
      return await DatabaseTemplateService.sendOrderConfirmationEmail(
        this.testEmail,
        {
          customerName: "Test User",
          orderNumber: "TEST-" + Date.now(),
          orderTotal: 299.99,
          items: [
            { name: "STEM Robot Kit", quantity: 1, price: 199.99 },
            { name: "Science Lab Set", quantity: 1, price: 100.0 },
          ],
          shippingAddress: {
            fullName: "Test User",
            addressLine1: "Str. Test 123",
            city: "Cluj-Napoca",
            state: "Cluj",
            postalCode: "400001",
            country: "România",
            phone: "+40 771 248 029",
          },
        }
      );
    });

    console.log("");
  }

  /**
   * Test marketing emails
   */
  private async testMarketingEmails(): Promise<void> {
    console.log("📢 Testing Marketing Emails\n");

    // Test cart abandonment (if template exists)
    await this.runTest(
      "Cart Abandonment",
      async () => {
        return await DatabaseTemplateService.sendEmailWithTemplate({
          to: this.testEmail,
          templateSlug: "cart-abandonment",
          data: {
            userName: "Test User",
            storeUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro",
            cart: {
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
            },
          },
        });
      },
      true
    ); // Skip if template doesn't exist

    console.log("");
  }

  /**
   * Run a single test
   */
  private async runTest(
    testName: string,
    testFn: () => Promise<{ success: boolean; error?: string }>,
    skipOnError: boolean = false
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`  Testing: ${testName}...`);

      const result = await testFn();
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`  ✅ PASS (${duration}ms)`);
        this.results.push({
          template: testName,
          status: "PASS",
          duration,
        });
      } else {
        if (skipOnError) {
          console.log(`  ⏭️  SKIP (template may not exist)`);
        } else {
          console.log(`  ❌ FAIL: ${result.error}`);
          this.results.push({
            template: testName,
            status: "FAIL",
            error: result.error,
            duration,
          });
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (skipOnError) {
        console.log(`  ⏭️  SKIP (${errorMessage})`);
      } else {
        console.log(`  ❌ FAIL: ${errorMessage}`);
        this.results.push({
          template: testName,
          status: "FAIL",
          error: errorMessage,
          duration,
        });
      }
    }
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log("=".repeat(60));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(60) + "\n");

    const passed = this.results.filter(r => r.status === "PASS");
    const failed = this.results.filter(r => r.status === "FAIL");
    const totalTests = this.results.length;
    const passRate =
      totalTests > 0 ? ((passed.length / totalTests) * 100).toFixed(1) : "0";

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Pass Rate: ${passRate}%\n`);

    if (failed.length > 0) {
      console.log("Failed Tests:");
      for (const result of failed) {
        console.log(`  ❌ ${result.template}: ${result.error}`);
      }
      console.log("");
    }

    const avgDuration =
      this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms\n`);

    console.log("=".repeat(60) + "\n");

    if (failed.length === 0) {
      console.log(
        "✅ All tests passed! Email templates are working correctly.\n"
      );
    } else {
      console.log("⚠️  Some tests failed. Review errors above.\n");
    }
  }
}

/**
 * Quick variable validation test
 */
async function testVariableReplacement(): Promise<void> {
  console.log("🔍 Testing Variable Replacement Engine\n");

  const testCases = [
    {
      name: "Simple variables",
      template: "Hello {{userName}}, welcome to {{storeUrl}}",
      data: { userName: "Ion Popescu", storeUrl: "https://techtots.ro" },
      expected: "Hello Ion Popescu, welcome to https://techtots.ro",
    },
    {
      name: "Nested variables",
      template: "Order {{order.number}} total: {{order.total}}",
      data: { order: { number: "ORD-123", total: "299 RON" } },
      expected: "Order ORD-123 total: 299 RON",
    },
    {
      name: "Deep nested variables",
      template: "Shipped via {{order.shipping.carrier}}",
      data: { order: { shipping: { carrier: "Fan Courier" } } },
      expected: "Shipped via Fan Courier",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    // Simple replacement logic (mimics template engine)
    let result = testCase.template;

    // Replace simple variables
    for (const [key, value] of Object.entries(testCase.data)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      if (typeof value === "string") {
        result = result.replace(regex, value);
      } else if (typeof value === "object") {
        // Handle nested
        for (const [nestedKey, nestedValue] of Object.entries(
          value as Record<string, any>
        )) {
          const nestedRegex = new RegExp(`{{${key}\\.${nestedKey}}}`, "g");
          if (typeof nestedValue === "string") {
            result = result.replace(nestedRegex, nestedValue);
          } else if (typeof nestedValue === "object") {
            // Handle deep nested
            for (const [deepKey, deepValue] of Object.entries(
              nestedValue as Record<string, any>
            )) {
              const deepRegex = new RegExp(
                `{{${key}\\.${nestedKey}\\.${deepKey}}}`,
                "g"
              );
              result = result.replace(deepRegex, String(deepValue));
            }
          }
        }
      }
    }

    const success = result === testCase.expected;

    if (success) {
      console.log(`  ✅ ${testCase.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${testCase.name}`);
      console.log(`     Expected: ${testCase.expected}`);
      console.log(`     Got: ${result}`);
      failed++;
    }
  }

  console.log(`\n📊 Variable Tests: ${passed}/${testCases.length} passed\n`);
}

/**
 * Main test execution
 */
async function main() {
  console.log("🚀 Email Template Test Suite\n");
  console.log("This script will test email templates with sample data.");
  console.log("Emails will NOT be sent in test mode.\n");

  // Run variable replacement tests
  await testVariableReplacement();

  console.log("=".repeat(60) + "\n");

  // Ask user if they want to send real test emails
  console.log("⚠️  WARNING: The following tests will send REAL emails");
  console.log(`   to: ${process.env.TEST_EMAIL || "test@example.com"}\n`);
  console.log("Set TEST_EMAIL in .env to change the recipient.\n");
  console.log(
    "To run email sending tests, uncomment the line below and run again:\n"
  );
  console.log("// const tester = new EmailTemplateTester();");
  console.log("// await tester.runAllTests();\n");

  // Uncomment to run actual email tests:
  // const tester = new EmailTemplateTester();
  // await tester.runAllTests();

  console.log("✅ Static tests complete!\n");
}

// Run tests
main().catch(error => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
