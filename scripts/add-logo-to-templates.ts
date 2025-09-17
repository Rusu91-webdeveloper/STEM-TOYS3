import { prisma } from "../lib/prisma";

/**
 * Script to add the company logo to all email templates
 */
async function addLogoToTemplates() {
  console.log("🖼️ Adding company logo to all email templates...\n");

  try {
    // Get all email templates
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    console.log(`Found ${templates.length} email templates to update.\n`);

    // Process each template
    let updatedCount = 0;

    for (const template of templates) {
      console.log(
        `\n===== Processing template: ${template.name} (${template.slug}) =====`
      );

      // Skip if template already has the logo
      if (template.content.includes("TechTots_LOGO.png")) {
        console.log("✅ Template already has logo. Skipping.");
        continue;
      }

      // Check if the template has a header section
      const hasHeader = template.content.includes("<header");

      // Update the template content to include the logo
      let updatedContent = template.content;

      if (hasHeader) {
        // Replace the existing header with one that includes the logo
        updatedContent = updatedContent.replace(
          /<header[^>]*>[\s\S]*?<\/header>/i,
          `<header style="text-align: center; margin-bottom: 20px;">
    <img src="{{siteUrl}}/TechTots_LOGO.png" alt="TechTots Logo" style="max-width: 180px;" />
  </header>`
        );
      } else {
        // Add a new header with logo after the opening body tag
        updatedContent = updatedContent.replace(
          /<body([^>]*)>/i,
          `<body$1>\n  <!-- Header with Logo -->
  <header style="text-align: center; margin-bottom: 20px;">
    <img src="{{siteUrl}}/TechTots_LOGO.png" alt="TechTots Logo" style="max-width: 180px;" />
  </header>`
        );
      }

      // Update the template
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          content: updatedContent,
          updatedAt: new Date(),
        },
      });

      console.log("✅ Template updated with logo!");
      updatedCount++;
    }

    console.log(`\n===== SUMMARY =====`);
    console.log(`Total templates: ${templates.length}`);
    console.log(`Templates updated: ${updatedCount}`);
    console.log(
      `Templates already had logo: ${templates.length - updatedCount}`
    );

    console.log("\n✅ Email template logo update complete!");
  } catch (error) {
    console.error("❌ Error updating templates with logo:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update script
addLogoToTemplates().catch(console.error);
