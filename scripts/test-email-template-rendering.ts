import { prisma } from "../lib/prisma";

/**
 * Test function for rendering email templates with different variable formats
 * This script helps ensure that all variables in templates are being properly processed
 */
async function testEmailTemplateRendering() {
  try {
    console.log(
      "🧪 Testing email template rendering with different variable formats..."
    );

    // Get all active email templates
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        content: true,
        variables: true,
      },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${templates.length} email templates to test.`);

    // Import the improved template service
    const { DatabaseTemplateService } = await import(
      "../lib/email/database-template-service-improved"
    );

    for (const template of templates) {
      console.log(
        `\n===== Testing template: ${template.name} (${template.slug}) =====`
      );

      // Create test data based on the template's variables
      const testData = createTestData(template.variables);

      // Test subject replacement
      const processedSubject = DatabaseTemplateService.replaceVariables(
        template.subject,
        testData
      );

      console.log("Subject:");
      console.log(`  Original: ${template.subject}`);
      console.log(`  Processed: ${processedSubject}`);

      // Test first 300 characters of content replacement
      const processedContent = DatabaseTemplateService.replaceVariables(
        template.content,
        testData
      );

      const contentPreview = processedContent.substring(0, 300) + "...";
      console.log("Content preview:");
      console.log(contentPreview);

      // Check if there are any remaining unprocessed variables
      const remainingVars = findUnprocessedVariables(processedContent);
      if (remainingVars.length > 0) {
        console.log("⚠️ Unprocessed variables found:");
        remainingVars.forEach(v => console.log(`  - ${v}`));
      } else {
        console.log("✅ All variables processed successfully");
      }
    }

    console.log("\n✅ Email template rendering test completed!");
  } catch (error) {
    console.error("❌ Error testing email template rendering:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create test data based on the template's variables
 */
function createTestData(variables: string[]): Record<string, any> {
  const data: Record<string, any> = {};

  variables.forEach(variable => {
    // Skip special directive variables
    if (variable.startsWith("#") || variable.startsWith("/")) {
      return;
    }

    if (variable.includes(".")) {
      // Handle nested properties
      const [parent, child] = variable.split(".");
      if (!data[parent]) {
        data[parent] = {};
      }
      data[parent][child] = `TEST_${variable.toUpperCase()}`;
    } else {
      // Simple variables
      switch (variable) {
        case "items":
        case "orderItems":
        case "featuredProducts":
        case "recommendedProducts":
        case "lowStockProducts":
        case "blogPosts":
          // Create array test data for loops
          data[variable] = [
            {
              name: "Test Product 1",
              description: "This is a test product description",
              price: "99.99 RON",
              quantity: 1,
              url: "https://example.com/product/1",
              sku: "TEST-SKU-1",
              originalPrice: "129.99 RON",
              salePrice: "99.99 RON",
              currentStock: 5,
              minStock: 10,
            },
            {
              name: "Test Product 2",
              description: "Another test product description",
              price: "149.99 RON",
              quantity: 2,
              url: "https://example.com/product/2",
              sku: "TEST-SKU-2",
              originalPrice: "199.99 RON",
              salePrice: "149.99 RON",
              currentStock: 3,
              minStock: 10,
            },
          ];
          break;

        case "verificationLink":
        case "resetLink":
        case "trackingUrl":
        case "returnLabelUrl":
        case "reapplyUrl":
        case "resubscribeUrl":
        case "reviewUrl":
        case "returnStatusUrl":
        case "orderTrackingUrl":
        case "retryPaymentUrl":
        case "supportUrl":
        case "orderHistoryUrl":
        case "productsUrl":
        case "blogUrl":
        case "shopUrl":
        case "accountUrl":
        case "unsubscribeUrl":
        case "adminUrl":
        case "adminOrderUrl":
        case "adminSupplierUrl":
        case "adminProductsUrl":
        case "supplierDashboardUrl":
        case "supplierProductsUrl":
          // URLs
          data[variable] = `https://example.com/${variable.replace("Url", "")}`;
          break;

        case "siteUrl":
          data[variable] = "https://example.com";
          break;

        case "tempPassword":
        case "couponCode":
          data[variable] = "TEST123456";
          break;

        default:
          // Generic test data for other variables
          data[variable] = `TEST_${variable.toUpperCase()}`;
      }
    }
  });

  return data;
}

/**
 * Find any unprocessed variables in the content
 */
function findUnprocessedVariables(content: string): string[] {
  const regex = /{{([^}]+)}}/g;
  const matches = Array.from(content.matchAll(regex));
  return matches.map(match => match[0]);
}

// Run the test
testEmailTemplateRendering().catch(console.error);
