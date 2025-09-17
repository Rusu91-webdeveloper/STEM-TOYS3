import { prisma } from "../lib/prisma";

/**
 * Script to update email templates with professional footer and structure
 */
async function updateEmailTemplateStructure() {
  console.log("🔧 Updating email templates with professional structure...\n");

  try {
    // Get all email templates
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { category: "asc" },
    });

    console.log(`Found ${templates.length} email templates to update.\n`);

    // Process each template
    let updatedCount = 0;

    for (const template of templates) {
      console.log(
        `\n===== Processing template: ${template.name} (${template.slug}) =====`
      );

      // Skip if template already has a proper footer
      if (
        template.content.includes("contact@techtots.ro") &&
        template.content.includes("Politica de confidențialitate") &&
        template.content.includes("facebook.com/techtots")
      ) {
        console.log("✅ Template already has proper footer. Skipping.");
        continue;
      }

      // Check if the template has the basic structure
      const hasProperStructure =
        template.content.includes("<!DOCTYPE html>") &&
        template.content.includes("<html") &&
        template.content.includes("<head") &&
        template.content.includes("<body");

      if (!hasProperStructure) {
        console.log(
          "⚠️ Template is missing proper HTML structure. Adding required elements."
        );
      }

      // Process the template - add footer and fix structure if needed
      let updatedContent = template.content;
      let updatedSubject = template.subject;

      // If the content doesn't already have a footer
      if (!updatedContent.includes("</footer>")) {
        // Check if we need to add the footer before or after the closing body tag
        if (updatedContent.includes("</body>")) {
          // Add footer before closing body tag
          updatedContent = updatedContent.replace(
            "</body>",
            generateFooterHTML(template.category === "marketing") + "\n</body>"
          );
        } else {
          // Just append footer at the end
          updatedContent =
            updatedContent +
            "\n" +
            generateFooterHTML(template.category === "marketing");
        }
      }

      // If the template doesn't have proper HTML structure, wrap it
      if (!hasProperStructure) {
        // Extract any content that's not part of HTML structure
        let mainContent = updatedContent;

        // If it already has some HTML structure, try to extract just the body content
        if (updatedContent.includes("<body")) {
          const bodyMatch = updatedContent.match(
            /<body[^>]*>([\s\S]*?)<\/body>/i
          );
          if (bodyMatch && bodyMatch[1]) {
            mainContent = bodyMatch[1];
          }
        }

        // Remove any existing footer from the main content if we've already added it
        if (mainContent.includes("<!-- Footer -->")) {
          mainContent = mainContent.replace(
            /<!-- Footer -->[\s\S]*?(<\/footer>|$)/,
            ""
          );
        }

        // Now wrap with proper structure
        updatedContent = generateFullTemplateHTML(
          template.subject.replace(" - TechTots", ""),
          mainContent,
          template.category === "marketing"
        );
      }

      // Ensure subject has branding
      if (
        !updatedSubject.includes("TechTots") &&
        !updatedSubject.includes("Tech Tots")
      ) {
        updatedSubject = `${updatedSubject} - TechTots`;
      }

      // Update the variables array to include new template variables
      const updatedVariables = [...template.variables];

      // Add footer-related variables if they don't exist
      const footerVars = ["siteUrl", "currentYear"];
      if (template.category === "marketing") {
        footerVars.push("unsubscribeUrl", "isMarketing");
      }

      footerVars.forEach(variable => {
        if (!updatedVariables.includes(variable)) {
          updatedVariables.push(variable);
        }
      });

      // Update the template
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          content: updatedContent,
          subject: updatedSubject,
          variables: updatedVariables,
          updatedAt: new Date(),
        },
      });

      console.log("✅ Template updated with professional structure!");
      updatedCount++;
    }

    console.log(`\n===== SUMMARY =====`);
    console.log(`Total templates: ${templates.length}`);
    console.log(`Templates updated: ${updatedCount}`);
    console.log(
      `Templates already up to standard: ${templates.length - updatedCount}`
    );

    console.log("\n✅ Email template structure update complete!");
  } catch (error) {
    console.error("❌ Error updating templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate footer HTML for email templates
 */
function generateFooterHTML(isMarketing: boolean = false): string {
  return `
  <!-- Footer -->
  <footer style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
    <p>© {{currentYear}} TechTots. Toate drepturile rezervate.</p>
    
    <!-- Contact Information -->
    <p>
      Email: contact@techtots.ro<br>
      Telefon: +40 712 345 678<br>
      Adresă: Strada Exemplu 123, Sector 1, București, România
    </p>
    
    <!-- Social Media Links -->
    <div style="margin: 15px 0;">
      <a href="https://facebook.com/techtots" style="text-decoration: none; margin: 0 5px; color: #3b5998;">Facebook</a>
      <a href="https://instagram.com/techtots" style="text-decoration: none; margin: 0 5px; color: #e1306c;">Instagram</a>
      <a href="https://linkedin.com/company/techtots" style="text-decoration: none; margin: 0 5px; color: #0077b5;">LinkedIn</a>
    </div>
    
    <!-- Legal Links -->
    <p>
      <a href="{{siteUrl}}/privacy" style="color: #666; margin: 0 5px;">Politica de confidențialitate</a> |
      <a href="{{siteUrl}}/terms" style="color: #666; margin: 0 5px;">Termeni și condiții</a>
      ${
        isMarketing
          ? `| 
      <a href="{{unsubscribeUrl}}" style="color: #666; margin: 0 5px;">Dezabonare</a>`
          : ""
      }
    </p>
  </footer>`;
}

/**
 * Generate complete HTML template
 */
function generateFullTemplateHTML(
  title: string,
  content: string,
  isMarketing: boolean = false
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TechTots</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <!-- Header with Logo -->
  <header style="text-align: center; margin-bottom: 20px;">
    <img src="{{siteUrl}}/TechTots_LOGO.png" alt="TechTots Logo" style="max-width: 180px;" />
  </header>

  <!-- Main Content -->
  <main style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    ${content}
  </main>
  
${generateFooterHTML(isMarketing)}
</body>
</html>`;
}

// Run the update script
updateEmailTemplateStructure().catch(console.error);
