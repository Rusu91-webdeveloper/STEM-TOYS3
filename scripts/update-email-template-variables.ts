/**
 * Email Template Variable Standardization Script
 *
 * This script updates all email templates to use consistent variable naming:
 * - Replace {{user.name}} with {{userName}}
 * - Replace {{user.email}} with {{userEmail}}
 * - Ensure consistency across all templates
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TemplateUpdate {
  id: string;
  name: string;
  slug: string;
  oldVariables: string[];
  newVariables: string[];
  subjectChanged: boolean;
  contentChanged: boolean;
}

async function updateTemplateVariables() {
  console.log("🔄 Email Template Variable Standardization\n");
  console.log(
    "This script will update inconsistent variable naming across all templates.\n"
  );

  const updates: TemplateUpdate[] = [];

  try {
    // Get all templates that use user.name or user.email
    const templates = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { content: { contains: "{{user.name}}" } },
          { subject: { contains: "{{user.name}}" } },
          { content: { contains: "{{user.email}}" } },
          { subject: { contains: "{{user.email}}" } },
        ],
      },
    });

    console.log(
      `📊 Found ${templates.length} templates with user.* variables\n`
    );

    for (const template of templates) {
      console.log(`\n📧 Processing: ${template.name} (${template.slug})`);

      const oldVariables: string[] = [];
      const newVariables: string[] = [];

      let updatedSubject = template.subject;
      let updatedContent = template.content;
      let subjectChanged = false;
      let contentChanged = false;

      // Replace user.name with userName
      if (template.subject.includes("{{user.name}}")) {
        oldVariables.push("user.name");
        newVariables.push("userName");
        updatedSubject = template.subject.replace(
          /\{\{user\.name\}\}/g,
          "{{userName}}"
        );
        subjectChanged = true;
        console.log("   ✓ Subject: user.name → userName");
      }

      if (template.content.includes("{{user.name}}")) {
        if (!oldVariables.includes("user.name")) oldVariables.push("user.name");
        if (!newVariables.includes("userName")) newVariables.push("userName");
        updatedContent = template.content.replace(
          /\{\{user\.name\}\}/g,
          "{{userName}}"
        );
        contentChanged = true;
        console.log("   ✓ Content: user.name → userName");
      }

      // Replace user.email with userEmail
      if (template.subject.includes("{{user.email}}")) {
        oldVariables.push("user.email");
        newVariables.push("userEmail");
        updatedSubject = updatedSubject.replace(
          /\{\{user\.email\}\}/g,
          "{{userEmail}}"
        );
        subjectChanged = true;
        console.log("   ✓ Subject: user.email → userEmail");
      }

      if (template.content.includes("{{user.email}}")) {
        if (!oldVariables.includes("user.email"))
          oldVariables.push("user.email");
        if (!newVariables.includes("userEmail")) newVariables.push("userEmail");
        updatedContent = updatedContent.replace(
          /\{\{user\.email\}\}/g,
          "{{userEmail}}"
        );
        contentChanged = true;
        console.log("   ✓ Content: user.email → userEmail");
      }

      // Update the template if changes were made
      if (subjectChanged || contentChanged) {
        // Update variables array
        let updatedVariables = [...template.variables];

        // Remove old variables
        updatedVariables = updatedVariables.filter(
          v => !oldVariables.includes(v)
        );

        // Add new variables if not present
        for (const newVar of newVariables) {
          if (!updatedVariables.includes(newVar)) {
            updatedVariables.push(newVar);
          }
        }

        await prisma.emailTemplate.update({
          where: { id: template.id },
          data: {
            subject: updatedSubject,
            content: updatedContent,
            variables: updatedVariables,
            updatedAt: new Date(),
          },
        });

        updates.push({
          id: template.id,
          name: template.name,
          slug: template.slug,
          oldVariables,
          newVariables,
          subjectChanged,
          contentChanged,
        });

        console.log(`   ✅ Updated in database`);
      } else {
        console.log("   ℹ️  No changes needed");
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 UPDATE SUMMARY");
    console.log("=".repeat(60) + "\n");

    console.log(`Templates analyzed: ${templates.length}`);
    console.log(`Templates updated: ${updates.length}`);
    console.log(`Templates unchanged: ${templates.length - updates.length}\n`);

    if (updates.length > 0) {
      console.log("Updated Templates:");
      for (const update of updates) {
        console.log(`\n  📧 ${update.name}`);
        console.log(`     Slug: ${update.slug}`);
        console.log(
          `     Changed: ${update.oldVariables.join(", ")} → ${update.newVariables.join(", ")}`
        );
        console.log(`     Subject: ${update.subjectChanged ? "Yes" : "No"}`);
        console.log(`     Content: ${update.contentChanged ? "Yes" : "No"}`);
      }
    }

    console.log("\n✅ Email template variable standardization complete!\n");

    // Recommendations
    console.log("📝 NEXT STEPS:\n");
    console.log("1. Test a few emails to verify templates still work");
    console.log("2. Check email sending logs for any errors");
    console.log(
      "3. Update email service code if needed to pass userName instead of user.name"
    );
    console.log(
      "4. Consider running regression tests on critical email paths\n"
    );
  } catch (error) {
    console.error("\n❌ Error updating templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateTemplateVariables().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
