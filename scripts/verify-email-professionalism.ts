import { prisma } from "../lib/prisma";
import { DatabaseTemplateService } from "../lib/email/database-template-service";

/**
 * This script verifies that all email templates are now professional and have proper structure
 */
async function verifyEmailProfessionalism() {
  console.log("🔍 Verifying email template professionalism and structure...\n");

  try {
    // Get all email templates
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    console.log(`Found ${templates.length} email templates to verify.\n`);

    // Create test data for rendering
    const testData = {
      // Common variables
      customerName: "John Doe",
      userName: "John Doe",
      orderNumber: "ORD-12345",
      siteUrl: "https://example.com",
      currentYear: new Date().getFullYear(),
      unsubscribeUrl: "https://example.com/unsubscribe",
      isMarketing: true,

      // Add other necessary variables
      verificationLink: "https://example.com/verify",
      resetLink: "https://example.com/reset",
      expiresIn: "24 ore",
    };

    // Check each template
    let passedCount = 0;
    let failedCount = 0;

    for (const template of templates) {
      console.log(
        `\n===== Verifying template: ${template.name} (${template.slug}) =====`
      );

      // Verify basic structure
      const hasDoctype = template.content.includes("<!DOCTYPE html>");
      const hasHtmlTag = template.content.includes("<html");
      const hasHeadTag = template.content.includes("<head");
      const hasBodyTag = template.content.includes("<body");
      const hasMetaCharset = template.content.includes("<meta charset=");
      const hasViewportMeta = template.content.includes("viewport");
      const hasTitle = template.content.includes("<title");

      // Verify professional elements
      const hasLogo = template.content.includes("TechTots_LOGO.png");
      const hasFooter = template.content.includes("<footer");
      const hasContactInfo = template.content.includes("contact@techtots.ro");
      const hasSocialLinks =
        template.content.includes("facebook.com") &&
        template.content.includes("instagram.com");
      const hasLegalLinks =
        template.content.includes("privacy") &&
        template.content.includes("terms");
      const hasUnsubscribe =
        template.category === "marketing"
          ? template.content.includes("Dezabonare")
          : true;

      // Verify styling
      const hasResponsiveDesign =
        template.content.includes("width=device-width");
      const hasFontStyling = template.content.includes("font-family");
      const hasProperSpacing =
        template.content.includes("line-height") ||
        template.content.includes("margin") ||
        template.content.includes("padding");

      // Check success criteria
      const structureResults = {
        "DOCTYPE declaration": hasDoctype,
        "HTML tag": hasHtmlTag,
        "Head tag": hasHeadTag,
        "Body tag": hasBodyTag,
        "Meta charset tag": hasMetaCharset,
        "Viewport meta tag": hasViewportMeta,
        "Title tag": hasTitle,
      };

      const professionalResults = {
        "Company logo": hasLogo,
        "Footer section": hasFooter,
        "Contact information": hasContactInfo,
        "Social media links": hasSocialLinks,
        "Legal links": hasLegalLinks,
        "Unsubscribe link (if marketing)": hasUnsubscribe,
      };

      const stylingResults = {
        "Responsive design": hasResponsiveDesign,
        "Font styling": hasFontStyling,
        "Proper spacing": hasProperSpacing,
      };

      // Display results
      console.log("\nStructure check:");
      let structurePassed = true;
      Object.entries(structureResults).forEach(([check, passed]) => {
        console.log(`${passed ? "✅" : "❌"} ${check}`);
        if (!passed) structurePassed = false;
      });

      console.log("\nProfessional elements check:");
      let professionalPassed = true;
      Object.entries(professionalResults).forEach(([check, passed]) => {
        console.log(`${passed ? "✅" : "❌"} ${check}`);
        if (!passed) professionalPassed = false;
      });

      console.log("\nStyling check:");
      let stylingPassed = true;
      Object.entries(stylingResults).forEach(([check, passed]) => {
        console.log(`${passed ? "✅" : "❌"} ${check}`);
        if (!passed) stylingPassed = false;
      });

      // Test variable replacement
      console.log("\nVariable replacement check:");
      try {
        const processedContent = DatabaseTemplateService.replaceVariables(
          template.content,
          testData
        );

        // Check for remaining variables
        const remainingVars = processedContent.match(/{{([^}]+)}}/g);

        if (remainingVars && remainingVars.length > 0) {
          console.log(
            `❌ Template still has unreplaced variables: ${remainingVars.join(", ")}`
          );
          console.log("Additional data may be needed for these variables.");
        } else {
          console.log("✅ All variables properly replaced");
        }
      } catch (error) {
        console.error("❌ Error testing variable replacement:", error);
      }

      // Final verdict
      const allPassed = structurePassed && professionalPassed && stylingPassed;

      if (allPassed) {
        console.log("\n✅ Template passes all professionalism checks!");
        passedCount++;
      } else {
        console.log(
          "\n⚠️ Template needs further improvements to meet professional standards"
        );
        failedCount++;
      }
    }

    // Final summary
    console.log(`\n===== SUMMARY =====`);
    console.log(`Total templates: ${templates.length}`);
    console.log(`Passed all checks: ${passedCount}`);
    console.log(`Need improvements: ${failedCount}`);

    const passPercentage = Math.round((passedCount / templates.length) * 100);
    console.log(`Overall professionalism score: ${passPercentage}%`);

    console.log("\n✅ Email template verification complete!");
  } catch (error) {
    console.error("❌ Error verifying templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyEmailProfessionalism().catch(console.error);
