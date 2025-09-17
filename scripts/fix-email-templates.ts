import { prisma } from "../lib/prisma";

async function updateTemplates() {
  try {
    console.log("🔧 Starting email template fixes...");

    // 1. Fix the email-verification template with nested notation issue
    const emailVerificationTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: "email-verification" },
    });

    if (emailVerificationTemplate) {
      console.log("📧 Fixing email-verification template...");

      // Replace {{user.firstName}} with {{userName}}
      let updatedContent = emailVerificationTemplate.content.replace(
        /{{user\.firstName}}/g,
        "{{userName}}"
      );

      // Update the template
      await prisma.emailTemplate.update({
        where: { id: emailVerificationTemplate.id },
        data: {
          content: updatedContent,
          variables: ["userName", "verificationLink", "expiresIn", "siteUrl"],
          updatedAt: new Date(),
        },
      });
      console.log("✅ Fixed email-verification template");
    }

    // 2. Fix the order-confirmation template with nested notation issue
    const orderConfirmationTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: "order-confirmation" },
    });

    if (orderConfirmationTemplate) {
      console.log("📧 Fixing order-confirmation template...");

      // Replace {{order.id}} with {{orderNumber}} and add proper loop variables
      let updatedContent = orderConfirmationTemplate.content
        .replace(/{{order\.id}}/g, "{{orderNumber}}")
        .replace(/{{#each order\.items}}/g, "{{#each items}}")
        .replace(/{{\/each}}/g, "{{/each}}");

      // Update the template
      await prisma.emailTemplate.update({
        where: { id: orderConfirmationTemplate.id },
        data: {
          content: updatedContent,
          variables: [
            "customerName",
            "orderNumber",
            "orderDate",
            "orderTotal",
            "items",
            "siteUrl",
          ],
          updatedAt: new Date(),
        },
      });
      console.log("✅ Fixed order-confirmation template");
    }

    // 3. Fix the admin-new-order template
    const adminNewOrderTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: "admin-new-order" },
    });

    if (adminNewOrderTemplate) {
      console.log("📧 Fixing admin-new-order template...");

      // Update the template variables
      await prisma.emailTemplate.update({
        where: { id: adminNewOrderTemplate.id },
        data: {
          variables: [
            "orderNumber",
            "customerName",
            "customerEmail",
            "orderTotal",
            "orderDate",
            "paymentStatus",
            "orderItems",
            "shippingAddress",
            "adminOrderUrl",
            "siteUrl",
            "#each orderItems",
            "name",
            "quantity",
            "price",
            "sku",
            "/each",
          ],
          updatedAt: new Date(),
        },
      });
      console.log("✅ Fixed admin-new-order template");
    }

    // 4. Fix other templates with loop issues (for example coupon-expiry-reminder)
    const couponExpiryTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: "coupon-expiry-reminder" },
    });

    if (couponExpiryTemplate) {
      console.log("📧 Fixing coupon-expiry-reminder template...");

      // Update the template variables
      await prisma.emailTemplate.update({
        where: { id: couponExpiryTemplate.id },
        data: {
          variables: [
            "customerName",
            "couponCode",
            "discountValue",
            "expiryDate",
            "shopUrl",
            "recommendedProducts",
            "siteUrl",
            "#each recommendedProducts",
            "name",
            "description",
            "price",
            "url",
            "/each",
          ],
          updatedAt: new Date(),
        },
      });
      console.log("✅ Fixed coupon-expiry-reminder template");
    }

    // 5. Fix all templates with unused siteUrl variable
    // This is fine as the siteUrl is a standard variable available in all templates
    console.log(
      "📧 Note: The siteUrl variable is included in all templates for standard usage"
    );

    console.log("✅ All email template fixes completed!");
  } catch (error) {
    console.error("❌ Error updating templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Also update the database-template-service.ts replaceVariables function to better handle nested variables
async function suggestCodeUpdates() {
  console.log(`
🔧 Suggested code update for lib/email/database-template-service.ts:

Replace the current replaceVariables function with this improved version that supports nested objects:

\`\`\`typescript
static replaceVariables(content: string, data: Record<string, any>): string {
  let processedContent = content;

  // Step 1: Process simple variables in the format {{variableName}}
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(\`{{${key}}}\`, "g");
    processedContent = processedContent.replace(regex, String(value || ""));
  });

  // Step 2: Process nested object variables in the format {{object.property}}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        const regex = new RegExp(\`{{${key}\\.${nestedKey}}}\`, "g");
        processedContent = processedContent.replace(regex, String(nestedValue || ""));
      }
    }
  }

  // Step 3: Process loops
  const loopRegex = /{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g;
  let match;
  
  // We need to use a while loop because the content may have multiple loops
  let lastProcessedContent = "";
  while (processedContent !== lastProcessedContent) {
    lastProcessedContent = processedContent;
    
    processedContent = processedContent.replace(
      loopRegex,
      (fullMatch, iteratorName, loopContent) => {
        const items = data[iteratorName];
        
        if (!Array.isArray(items) || items.length === 0) {
          return ""; // Empty string if the array doesn't exist or is empty
        }
        
        return items.map(item => {
          let itemContent = loopContent;
          
          // Replace item properties
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(\`{{${key}}}\`, "g");
            itemContent = itemContent.replace(regex, String(value || ""));
          }
          
          return itemContent;
        }).join("");
      }
    );
  }

  // Step 4: Process conditionals
  const conditionalRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
  processedContent = processedContent.replace(
    conditionalRegex,
    (fullMatch, conditionName, conditionalContent) => {
      const condition = data[conditionName];
      return condition ? conditionalContent : "";
    }
  );

  return processedContent;
}
\`\`\`
  `);
}

// Run the script
updateTemplates()
  .then(suggestCodeUpdates)
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });
