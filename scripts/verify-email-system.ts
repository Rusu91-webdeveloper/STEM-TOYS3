import { prisma } from "../lib/prisma";
import { DatabaseTemplateService } from "../lib/email/database-template-service";

/**
 * This script validates that the email system is working correctly
 * by checking that all templates can be properly processed.
 */
async function verifyEmailSystem() {
  console.log("🔍 Verifying the email template system...\n");

  try {
    // Get all email templates
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${templates.length} active email templates.`);

    // Create test data for all possible variables
    const testData = {
      // User data
      userName: "Test User",
      name: "Test User",
      email: "test@example.com",
      user: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      },

      // Order data
      orderNumber: "ORD-12345",
      orderDate: "2023-09-17",
      orderTotal: "199.99 RON",
      order: {
        id: "ORD-12345",
        total: "199.99 RON",
        items: [
          { name: "Test Product 1", quantity: 2, price: "49.99 RON" },
          { name: "Test Product 2", quantity: 1, price: "99.99 RON" },
        ],
      },
      items: [
        { name: "Test Product 1", quantity: 2, price: "49.99 RON" },
        { name: "Test Product 2", quantity: 1, price: "99.99 RON" },
      ],

      // Links
      verificationLink: "https://example.com/verify?token=abc123",
      resetLink: "https://example.com/reset?token=xyz789",
      siteUrl: "https://example.com",

      // Other common variables
      expiresIn: "24 ore",
      companyName: "Test Company",
      contactPersonName: "Test Contact",

      // Variables for conditionals
      hasDiscount: true,
      updateReason: "Test reason",
      refundAmount: "99.99 RON",
      tempPassword: "temp123",
      rejectionReason: "Test rejection reason",
      trackingUrl: "https://example.com/track",

      // And many other possible variables...
    };

    // Test each template
    let successCount = 0;
    let failureCount = 0;

    for (const template of templates) {
      console.log(`\n📝 Testing template: ${template.name} (${template.slug})`);

      try {
        // Process the subject
        const processedSubject = DatabaseTemplateService.replaceVariables(
          template.subject,
          testData
        );

        // Process the content
        const processedContent = DatabaseTemplateService.replaceVariables(
          template.content,
          testData
        );

        // Check for unreplaced variables in subject
        const subjectUnreplacedVars = processedSubject.match(/{{([^}]+)}}/g);
        if (subjectUnreplacedVars) {
          console.log(
            `❌ Subject has unreplaced variables: ${subjectUnreplacedVars.join(", ")}`
          );
          failureCount++;
          continue;
        }

        // Check for unreplaced variables in content
        const contentUnreplacedVars = processedContent.match(/{{([^}]+)}}/g);
        if (contentUnreplacedVars) {
          console.log(
            `❌ Content has unreplaced variables: ${contentUnreplacedVars.join(", ")}`
          );
          failureCount++;
          continue;
        }

        console.log(`✅ All variables properly replaced in template`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing template ${template.slug}:`, error);
        failureCount++;
      }
    }

    // Final summary
    console.log(`\n===== SUMMARY =====`);
    console.log(`Total templates: ${templates.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);

    // Test functionality for specific email types that have endpoints
    console.log(`\n===== TESTING KEY ENDPOINTS =====`);

    // Test the welcome email template function
    try {
      const welcomeResult = await DatabaseTemplateService.sendWelcomeEmail(
        "test@example.com",
        "Test User"
      );

      console.log(
        `Welcome email: ${welcomeResult.success ? "✅ PASS" : "❌ FAIL"}`
      );
    } catch (error) {
      console.error("❌ Error with welcome email endpoint:", error);
    }

    // Test the verification email template function
    try {
      const verifyResult = await DatabaseTemplateService.sendVerificationEmail(
        "test@example.com",
        "Test User",
        "https://example.com/verify?token=abc123"
      );

      console.log(
        `Verification email: ${verifyResult.success ? "✅ PASS" : "❌ FAIL"}`
      );
    } catch (error) {
      console.error("❌ Error with verification email endpoint:", error);
    }

    // Test the order confirmation email template function
    try {
      const orderResult =
        await DatabaseTemplateService.sendOrderConfirmationEmail(
          "test@example.com",
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

      console.log(
        `Order confirmation email: ${orderResult.success ? "✅ PASS" : "❌ FAIL"}`
      );
    } catch (error) {
      console.error("❌ Error with order confirmation email endpoint:", error);
    }

    console.log(`\n✅ Email system verification complete!`);
  } catch (error) {
    console.error("❌ Fatal error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyEmailSystem().catch(console.error);
