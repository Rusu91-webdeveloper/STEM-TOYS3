import { prisma } from "../lib/prisma";
import { DatabaseTemplateService } from "../lib/email/database-template-service";
import { EmailService } from "../lib/email/email-service";

interface TemplateAnalysisResult {
  id: string;
  name: string;
  slug: string;
  variables: string[];
  hasIssues: boolean;
  issues: string[];
  missingVariables: string[];
  unusedVariables: string[];
  variablePattern: string;
}

async function analyzeTemplate(template: any): Promise<TemplateAnalysisResult> {
  // Extract variables mentioned in the template content using regex
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = [...template.content.matchAll(variableRegex)];
  const mentionedVars = matches.map(match => match[1]);

  // Check for potential issues
  const issues: string[] = [];
  const variablePattern =
    mentionedVars.length > 0
      ? mentionedVars[0].includes(".")
        ? "Nested (item.property)"
        : "Simple (item)"
      : "No variables";

  // Check if we're using the {{item.property}} pattern but we should be using {{property}}
  const dotNotationVars = mentionedVars.filter(v => v.includes("."));
  if (dotNotationVars.length > 0) {
    issues.push(
      "Using nested object notation (item.property) - may not be processed correctly"
    );
  }

  // Check for variables defined but not used
  const unusedVariables = template.variables.filter(
    v => !mentionedVars.includes(v)
  );
  if (unusedVariables.length > 0) {
    issues.push(
      `${unusedVariables.length} defined variables not used in template`
    );
  }

  // Check for variables used but not defined
  const missingVariables = mentionedVars.filter(
    v => !template.variables.includes(v)
  );
  if (missingVariables.length > 0) {
    issues.push(
      `${missingVariables.length} variables used but not defined in template metadata`
    );
  }

  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    variables: template.variables,
    hasIssues: issues.length > 0,
    issues,
    missingVariables,
    unusedVariables,
    variablePattern,
  };
}

async function analyzeEndpointUsage(template: any): Promise<string[]> {
  const issues: string[] = [];

  // Find API routes that use this template
  const slug = template.slug;
  const usageInfo = templateUsageMap[slug] || {
    endpoint: "Unknown",
    function: "Unknown",
    service: "Unknown",
  };

  issues.push(`Endpoint: ${usageInfo.endpoint}`);
  issues.push(`Function: ${usageInfo.function}`);
  issues.push(`Service: ${usageInfo.service}`);

  return issues;
}

// Map of known template usages
const templateUsageMap: Record<
  string,
  { endpoint: string; function: string; service: string }
> = {
  welcome: {
    endpoint: "/api/auth/register",
    function: "sendWelcomeEmail",
    service: "DatabaseTemplateService",
  },
  "email-verification": {
    endpoint: "/api/auth/email-verification",
    function: "sendVerificationEmail",
    service: "DatabaseTemplateService",
  },
  "password-reset": {
    endpoint: "/api/auth/password-reset",
    function: "sendPasswordResetEmail",
    service: "DatabaseTemplateService",
  },
  "order-confirmation": {
    endpoint: "/api/checkout/complete",
    function: "sendOrderConfirmationEmail",
    service: "DatabaseTemplateService",
  },
  "return-request-confirmation": {
    endpoint: "/api/returns",
    function: "sendReturnConfirmationEmail",
    service: "DatabaseTemplateService",
  },
  "admin-new-order": {
    endpoint: "/api/checkout/complete",
    function: "sendAdminNewOrderEmail",
    service: "DatabaseTemplateService",
  },
  "supplier-registration-confirmation": {
    endpoint: "/api/supplier/register",
    function: "sendSupplierRegistrationEmail",
    service: "DatabaseTemplateService",
  },
  "supplier-approval": {
    endpoint: "/api/admin/suppliers",
    function: "sendSupplierApprovalEmail",
    service: "DatabaseTemplateService",
  },
  "supplier-rejection": {
    endpoint: "/api/admin/suppliers",
    function: "sendSupplierRejectionEmail",
    service: "DatabaseTemplateService",
  },
};

async function checkEmailTemplates() {
  console.log("🔍 Checking email templates in the database...");

  try {
    // Get all templates
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { category: "asc" },
    });

    console.log(`Found ${templates.length} email templates.`);

    // Analyze each template
    const results = [];
    for (const template of templates) {
      const analysis = await analyzeTemplate(template);
      const endpointIssues = await analyzeEndpointUsage(template);

      results.push({
        ...analysis,
        endpointIssues,
      });

      // Display template information
      console.log(
        `\n===== Template: ${template.name} (${template.slug}) =====`
      );
      console.log(`Category: ${template.category}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Variables defined: [${template.variables.join(", ")}]`);

      // Check variable pattern
      console.log(`Variable pattern: ${analysis.variablePattern}`);

      // Check for issues
      if (analysis.hasIssues) {
        console.log("⚠️ ISSUES FOUND:");
        analysis.issues.forEach(issue => console.log(`  - ${issue}`));

        if (analysis.missingVariables.length > 0) {
          console.log("  Variables used but not defined:");
          analysis.missingVariables.forEach(v => console.log(`    - ${v}`));
        }

        if (analysis.unusedVariables.length > 0) {
          console.log("  Variables defined but not used:");
          analysis.unusedVariables.forEach(v => console.log(`    - ${v}`));
        }
      } else {
        console.log("✅ No issues found");
      }

      // Show endpoint usage
      console.log("📡 Endpoint Usage:");
      endpointIssues.forEach(issue => console.log(`  ${issue}`));

      // Display a few lines of content preview
      const contentPreview = template.content.slice(0, 200) + "...";
      console.log(`\nContent Preview: ${contentPreview}`);
    }

    // Summary
    const templatesWithIssues = results.filter(r => r.hasIssues);
    console.log(`\n===== SUMMARY =====`);
    console.log(`Total templates: ${templates.length}`);
    console.log(`Templates with issues: ${templatesWithIssues.length}`);

    // Categorize issues
    const withNestedNotation = results.filter(
      r => r.variablePattern === "Nested (item.property)"
    );
    console.log(
      `Templates using nested notation (item.property): ${withNestedNotation.length}`
    );
    console.log(
      `Templates using simple notation (item): ${results.filter(r => r.variablePattern === "Simple (item)").length}`
    );

    if (withNestedNotation.length > 0) {
      console.log("\nTemplates that need to be fixed (using nested notation):");
      withNestedNotation.forEach(t => {
        console.log(`  - ${t.name} (${t.slug})`);
      });
    }
  } catch (error) {
    console.error("Error checking email templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkEmailTemplates().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
