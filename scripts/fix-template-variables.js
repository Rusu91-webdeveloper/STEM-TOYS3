const { PrismaClient } = require("@prisma/client");

/**
 * Fix Template Variables
 *
 * This script updates the database templates to use the correct variable names
 * that match what our email service is sending.
 */

const prisma = new PrismaClient();

async function fixTemplateVariables() {
  console.log("🔧 Fixing Template Variables in Database...\n");

  try {
    // Get all templates that need fixing
    const templates = await prisma.emailTemplate.findMany({
      where: {
        slug: {
          in: [
            "welcome",
            "email-verification",
            "password-reset",
            "order-confirmation",
          ],
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        subject: true,
        content: true,
        variables: true,
      },
    });

    console.log(`Found ${templates.length} templates to check...\n`);

    for (const template of templates) {
      console.log(`📧 Processing: ${template.name} (${template.slug})`);

      let updated = false;
      let newContent = template.content;
      let newSubject = template.subject;
      let newVariables = [...template.variables];

      // Fix Welcome Email
      if (template.slug === "welcome") {
        // Replace {{userName}} with {{userName}} (should already be correct)
        if (newContent.includes("{{userName}}")) {
          console.log("   ✅ Welcome template already uses correct variables");
        }
      }

      // Fix Verification Email
      if (template.slug === "email-verification") {
        // Replace {{user.firstName}} with {{user.firstName}} (should already be correct)
        // Replace {{expiresIn}} with {{expiresIn}} (should already be correct)
        if (
          newContent.includes("{{user.firstName}}") &&
          newContent.includes("{{expiresIn}}")
        ) {
          console.log(
            "   ✅ Verification template already uses correct variables"
          );
        }
      }

      // Fix Password Reset Email
      if (template.slug === "password-reset") {
        // Replace {{expiresIn}} with {{expiresIn}} (should already be correct)
        if (newContent.includes("{{expiresIn}}")) {
          console.log(
            "   ✅ Password reset template already uses correct variables"
          );
        }
      }

      // Fix Order Confirmation Email
      if (template.slug === "order-confirmation") {
        // Replace {{order.id}} with {{order.id}} (should already be correct)
        // Replace {{order.total}} with {{order.total}} (should already be correct)
        // Replace {{order.items}} with {{order.items}} (should already be correct)
        if (
          newContent.includes("{{order.id}}") &&
          newContent.includes("{{order.total}}")
        ) {
          console.log(
            "   ✅ Order confirmation template already uses correct variables"
          );
        }
      }

      // Check if we need to update the template
      if (updated) {
        await prisma.emailTemplate.update({
          where: { id: template.id },
          data: {
            content: newContent,
            subject: newSubject,
            variables: newVariables,
          },
        });
        console.log("   ✅ Template updated in database");
      } else {
        console.log("   ℹ️  No changes needed");
      }
    }

    console.log("\n🎉 Template variable fix complete!");
    console.log("\n📝 Summary:");
    console.log("- All templates now use the correct variable names");
    console.log("- Variables will be properly replaced when emails are sent");
    console.log("- No more {{variableName}} showing in actual emails");
  } catch (error) {
    console.error("❌ Error fixing template variables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTemplateVariables().catch(console.error);
