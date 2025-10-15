/**
 * Email Template Validator
 * Systematically validates all email templates against database schema and runtime variables
 */

import * as fs from "fs";
import * as path from "path";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  content: string;
  category: string;
  variables: string[];
}

interface EmailTrigger {
  id: string;
  name: string;
  type: string;
  actionData: {
    templateId?: string;
    subject?: string;
  };
}

interface VariableUsage {
  variable: string;
  templates: string[];
  format: "simple" | "nested" | "conditional" | "loop";
  count: number;
}

interface ValidationIssue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  templateId: string;
  templateName: string;
  variable: string;
  issue: string;
  expectedSource: string;
  actualAvailability:
    | "not_found"
    | "wrong_structure"
    | "inconsistent"
    | "available";
  impact: string;
  suggestedFix: string;
}

class EmailTemplateValidator {
  private templates: EmailTemplate[] = [];
  private triggers: EmailTrigger[] = [];
  private variableUsages: Map<string, VariableUsage> = new Map();
  private validationIssues: ValidationIssue[] = [];

  // Database schema fields (from Prisma schema)
  private databaseSchema = {
    User: [
      "id",
      "name",
      "email",
      "role",
      "emailVerified",
      "isActive",
      "createdAt",
      "updatedAt",
      "phone",
      "segment",
      "lifecycleStage",
      "lastActivityAt",
      "lifetimeValue",
      "tags",
    ],
    Order: [
      "id",
      "orderNumber",
      "userId",
      "total",
      "subtotal",
      "tax",
      "shippingCost",
      "discountAmount",
      "couponCode",
      "status",
      "paymentStatus",
      "paymentMethod",
      "createdAt",
      "updatedAt",
      "deliveredAt",
      "trackingNumber",
      "carrier",
      "estimatedDelivery",
    ],
    Product: [
      "id",
      "name",
      "slug",
      "description",
      "price",
      "compareAtPrice",
      "sku",
      "images",
      "categoryId",
      "tags",
      "isActive",
      "featured",
      "stockQuantity",
    ],
    StoreSettings: [
      "id",
      "storeName",
      "storeUrl",
      "storeDescription",
      "contactEmail",
      "contactPhone",
      "currency",
      "timezone",
      "metaTitle",
      "metaDescription",
    ],
    Address: [
      "id",
      "name",
      "fullName",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
    ],
  };

  /**
   * Extract all variables from a template string
   */
  private extractVariables(content: string): string[] {
    const variables = new Set<string>();

    // Match {{variable}} or {{object.property}}
    const simpleRegex = /\{\{([^}#\/][^}]*)\}\}/g;
    let match;

    while ((match = simpleRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (variable && !variable.startsWith("#") && !variable.startsWith("/")) {
        variables.add(variable);
      }
    }

    // Match conditionals {{#if variable}}
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}/g;
    while ((match = conditionalRegex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }

    // Match loops {{#each items}}
    const loopRegex = /\{\{#each\s+([^}]+)\}\}/g;
    while ((match = loopRegex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  /**
   * Categorize variable format
   */
  private categorizeVariable(
    variable: string
  ): "simple" | "nested" | "conditional" | "loop" {
    if (variable.includes(".")) return "nested";
    if (variable.startsWith("this.")) return "loop";
    return "simple";
  }

  /**
   * Load templates from JSON file
   */
  async loadTemplates(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    this.templates = data.map((template: any) => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      content: template.content,
      category: template.category,
      variables: template.variables || [],
    }));

    console.log(`✅ Loaded ${this.templates.length} templates`);
  }

  /**
   * Load triggers from JSON file
   */
  async loadTriggers(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, "utf-8");
    this.triggers = JSON.parse(content);

    console.log(`✅ Loaded ${this.triggers.length} triggers`);
  }

  /**
   * Extract all variables from all templates
   */
  extractAllVariables(): void {
    console.log("\n📊 Extracting variables from templates...\n");

    for (const template of this.templates) {
      // Extract from subject
      const subjectVars = this.extractVariables(template.subject);

      // Extract from content
      const contentVars = this.extractVariables(template.content);

      // Combine all variables
      const allVars = [...new Set([...subjectVars, ...contentVars])];

      // Track usage
      for (const variable of allVars) {
        if (!this.variableUsages.has(variable)) {
          this.variableUsages.set(variable, {
            variable,
            templates: [],
            format: this.categorizeVariable(variable),
            count: 0,
          });
        }

        const usage = this.variableUsages.get(variable)!;
        usage.templates.push(template.name);
        usage.count++;
      }
    }

    console.log(
      `✅ Found ${this.variableUsages.size} unique variables across all templates`
    );
  }

  /**
   * Validate a variable against database schema and runtime variables
   */
  private validateVariable(
    variable: string,
    templateId: string,
    templateName: string,
    category: string
  ): void {
    const parts = variable.split(".");
    const rootVar = parts[0];

    // Known runtime variables that should be passed
    const knownRuntimeVars = [
      "userName",
      "userEmail",
      "verificationLink",
      "expiresIn",
      "siteUrl",
      "storeUrl",
      "resetUrl",
      "confirmationUrl",
      "trackingUrl",
      "reviewUrl",
      "unsubscribeUrl",
      "currentYear",
      "loginDate",
      "device",
      "location",
      "browser",
      "resetPasswordUrl",
      "deliveryDate",
      "newDeliveryDate",
      "delayReason",
      "rescheduleUrl",
    ];

    // Check if it's a nested variable
    if (parts.length > 1) {
      const objectName = parts[0];
      const propertyName = parts[1];

      // Validate against database schema
      if (
        objectName === "user" &&
        !this.databaseSchema.User.includes(propertyName)
      ) {
        this.addIssue({
          severity: "HIGH",
          templateId,
          templateName,
          variable,
          issue: `Property 'user.${propertyName}' does not exist in User model`,
          expectedSource: "User database model",
          actualAvailability: "not_found",
          impact: "Will display empty value in email",
          suggestedFix: `Use 'userName' instead of 'user.name', or ensure User.${propertyName} exists in schema`,
        });
      } else if (
        objectName === "order" &&
        propertyName !== "number" &&
        propertyName !== "total" &&
        propertyName !== "date" &&
        propertyName !== "customerName" &&
        !propertyName.startsWith("shipping")
      ) {
        this.addIssue({
          severity: "HIGH",
          templateId,
          templateName,
          variable,
          issue: `Nested order property may not be passed: order.${propertyName}`,
          expectedSource: "Order runtime variable",
          actualAvailability: "wrong_structure",
          impact: "May display empty if not included in runtime data",
          suggestedFix: `Verify order object includes ${propertyName} when template is called`,
        });
      } else if (objectName === "settings") {
        this.addIssue({
          severity: "CRITICAL",
          templateId,
          templateName,
          variable,
          issue: `Using 'settings.${propertyName}' but no StoreSettings object is passed to templates`,
          expectedSource: "StoreSettings model",
          actualAvailability: "not_found",
          impact:
            "WILL CAUSE EMPTY VALUES - settings object not passed to email templates",
          suggestedFix: `Use 'storeUrl', 'storeName', etc. directly, or update email service to pass settings object`,
        });
      }
    } else {
      // Simple variable - check if it's known
      if (
        !knownRuntimeVars.includes(variable) &&
        !this.databaseSchema.User.includes(variable) &&
        variable !== "customer" &&
        variable !== "subscriber" &&
        !variable.endsWith("Url") &&
        !variable.endsWith("Date") &&
        !variable.startsWith("export") &&
        !variable.startsWith("return") &&
        !variable.startsWith("payment") &&
        !variable.startsWith("refund") &&
        !variable.startsWith("cancellation") &&
        !variable.startsWith("delivery") &&
        !variable.startsWith("customs") &&
        !variable.startsWith("ticket") &&
        !variable.startsWith("contact") &&
        !variable.startsWith("complaint") &&
        !variable.startsWith("feedback") &&
        !variable.startsWith("survey") &&
        !variable.startsWith("testimonial") &&
        !variable.startsWith("points") &&
        !variable.startsWith("vip") &&
        !variable.startsWith("tier") &&
        !variable.startsWith("stats") &&
        !variable.startsWith("sale") &&
        !variable.startsWith("product") &&
        !variable.startsWith("savings") &&
        !variable.startsWith("cart") &&
        !variable.startsWith("stock") &&
        !variable.startsWith("invoice") &&
        !variable.startsWith("issue")
      ) {
        this.addIssue({
          severity: "MEDIUM",
          templateId,
          templateName,
          variable,
          issue: `Unknown variable '${variable}' - not in standard runtime variables`,
          expectedSource: "Runtime variable",
          actualAvailability: "inconsistent",
          impact: "May work if passed, but not documented",
          suggestedFix: `Document this variable or use standard naming convention`,
        });
      }
    }
  }

  /**
   * Add validation issue
   */
  private addIssue(issue: ValidationIssue): void {
    this.validationIssues.push(issue);
  }

  /**
   * Validate all templates
   */
  validateTemplates(): void {
    console.log("\n🔍 Validating templates...\n");

    for (const template of this.templates) {
      const variables = [
        ...this.extractVariables(template.subject),
        ...this.extractVariables(template.content),
      ];

      for (const variable of variables) {
        this.validateVariable(
          variable,
          template.id,
          template.name,
          template.category
        );
      }
    }

    console.log(
      `✅ Validation complete. Found ${this.validationIssues.length} issues.`
    );
  }

  /**
   * Cross-reference templates with triggers
   */
  crossReferenceTriggers(): void {
    console.log("\n🔗 Cross-referencing triggers with templates...\n");

    let matchCount = 0;
    let missingCount = 0;

    for (const trigger of this.triggers) {
      if (trigger.actionData.templateId) {
        const template = this.templates.find(
          t => t.id === trigger.actionData.templateId
        );
        if (template) {
          matchCount++;
        } else {
          missingCount++;
          this.addIssue({
            severity: "CRITICAL",
            templateId: trigger.actionData.templateId,
            templateName: trigger.name,
            variable: "N/A",
            issue: `Trigger references non-existent template ID: ${trigger.actionData.templateId}`,
            expectedSource: "EmailTemplate database",
            actualAvailability: "not_found",
            impact: "Trigger will fail to send email",
            suggestedFix: `Update trigger to reference correct template ID or create missing template`,
          });
        }
      }
    }

    console.log(`✅ ${matchCount} triggers matched to templates`);
    console.log(`⚠️  ${missingCount} triggers reference missing templates`);
  }

  /**
   * Generate reports
   */
  generateReports(): void {
    console.log("\n📝 Generating reports...\n");

    // 1. Variable Inventory Report
    this.generateVariableInventory();

    // 2. Validation Matrix
    this.generateValidationMatrix();

    // 3. Issue Report
    this.generateIssueReport();

    // 4. Fix Recommendations
    this.generateFixRecommendations();
  }

  private generateVariableInventory(): void {
    const report: string[] = [
      "# Variable Inventory Report",
      "",
      `Total unique variables: ${this.variableUsages.size}`,
      "",
      "## All Variables by Usage Count",
      "",
    ];

    const sorted = Array.from(this.variableUsages.values()).sort(
      (a, b) => b.count - a.count
    );

    report.push("| Variable | Format | Usage Count | Templates |");
    report.push("|----------|--------|-------------|-----------|");

    for (const usage of sorted) {
      report.push(
        `| ${usage.variable} | ${usage.format} | ${usage.count} | ${usage.templates.slice(0, 3).join(", ")}${usage.templates.length > 3 ? "..." : ""} |`
      );
    }

    fs.writeFileSync(
      path.join(__dirname, "../email-validation-reports/variable-inventory.md"),
      report.join("\n")
    );

    console.log("✅ Generated Variable Inventory Report");
  }

  private generateValidationMatrix(): void {
    const report: string[] = [
      "# Validation Matrix",
      "",
      "## Templates with Issues",
      "",
    ];

    const templateIssues = new Map<string, ValidationIssue[]>();

    for (const issue of this.validationIssues) {
      if (!templateIssues.has(issue.templateId)) {
        templateIssues.set(issue.templateId, []);
      }
      templateIssues.get(issue.templateId)!.push(issue);
    }

    report.push("| Template | Critical | High | Medium | Low |");
    report.push("|----------|----------|------|--------|-----|");

    for (const [templateId, issues] of templateIssues) {
      const critical = issues.filter(i => i.severity === "CRITICAL").length;
      const high = issues.filter(i => i.severity === "HIGH").length;
      const medium = issues.filter(i => i.severity === "MEDIUM").length;
      const low = issues.filter(i => i.severity === "LOW").length;

      const template = this.templates.find(t => t.id === templateId);
      const name = template?.name || issues[0].templateName;

      report.push(`| ${name} | ${critical} | ${high} | ${medium} | ${low} |`);
    }

    fs.writeFileSync(
      path.join(__dirname, "../email-validation-reports/validation-matrix.md"),
      report.join("\n")
    );

    console.log("✅ Generated Validation Matrix");
  }

  private generateIssueReport(): void {
    const report: string[] = [
      "# Email Template Validation Issues",
      "",
      `Total Issues Found: ${this.validationIssues.length}`,
      "",
    ];

    const bySeverity = {
      CRITICAL: this.validationIssues.filter(i => i.severity === "CRITICAL"),
      HIGH: this.validationIssues.filter(i => i.severity === "HIGH"),
      MEDIUM: this.validationIssues.filter(i => i.severity === "MEDIUM"),
      LOW: this.validationIssues.filter(i => i.severity === "LOW"),
    };

    for (const [severity, issues] of Object.entries(bySeverity)) {
      if (issues.length === 0) continue;

      report.push(`## ${severity} Priority (${issues.length} issues)`);
      report.push("");

      for (const issue of issues) {
        report.push(`### ${issue.templateName}`);
        report.push(`- **Variable**: \`${issue.variable}\``);
        report.push(`- **Issue**: ${issue.issue}`);
        report.push(`- **Impact**: ${issue.impact}`);
        report.push(`- **Fix**: ${issue.suggestedFix}`);
        report.push("");
      }
    }

    fs.writeFileSync(
      path.join(__dirname, "../email-validation-reports/issue-report.md"),
      report.join("\n")
    );

    console.log("✅ Generated Issue Report");
  }

  private generateFixRecommendations(): void {
    const report: string[] = [
      "# Fix Recommendations",
      "",
      "## Summary",
      "",
      `- **CRITICAL**: ${this.validationIssues.filter(i => i.severity === "CRITICAL").length} issues`,
      `- **HIGH**: ${this.validationIssues.filter(i => i.severity === "HIGH").length} issues`,
      `- **MEDIUM**: ${this.validationIssues.filter(i => i.severity === "MEDIUM").length} issues`,
      `- **LOW**: ${this.validationIssues.filter(i => i.severity === "LOW").length} issues`,
      "",
      "## Prioritized Fix List",
      "",
    ];

    // Group by template
    const byTemplate = new Map<string, ValidationIssue[]>();
    for (const issue of this.validationIssues) {
      if (!byTemplate.has(issue.templateName)) {
        byTemplate.set(issue.templateName, []);
      }
      byTemplate.get(issue.templateName)!.push(issue);
    }

    // Sort by severity
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sortedTemplates = Array.from(byTemplate.entries()).sort((a, b) => {
      const maxSeverityA = Math.min(
        ...a[1].map(i => priorityOrder[i.severity])
      );
      const maxSeverityB = Math.min(
        ...b[1].map(i => priorityOrder[i.severity])
      );
      return maxSeverityA - maxSeverityB;
    });

    for (const [templateName, issues] of sortedTemplates) {
      const maxSeverity = issues.reduce(
        (max, i) =>
          priorityOrder[i.severity] < priorityOrder[max] ? i.severity : max,
        issues[0].severity
      );

      report.push(`### ${maxSeverity}: ${templateName}`);
      report.push("");
      report.push("**Issues:**");
      for (const issue of issues) {
        report.push(
          `- [${issue.severity}] ${issue.variable}: ${issue.suggestedFix}`
        );
      }
      report.push("");
    }

    report.push("## Code Changes Required");
    report.push("");
    report.push("### 1. Email Service Updates");
    report.push("");
    report.push("**File**: `lib/email/template-service.ts`");
    report.push("- Add StoreSettings loading and pass as variables");
    report.push(
      "- Standardize variable structure for order, user, payment objects"
    );
    report.push("");
    report.push("### 2. Template Content Fixes");
    report.push("");
    report.push(
      "**Action**: Update templates in database to use correct variable names"
    );
    report.push(
      "- Replace `{{settings.X}}` with `{{storeX}}` or pass settings object"
    );
    report.push(
      "- Replace `{{user.name}}` with `{{userName}}` for consistency"
    );
    report.push("");
    report.push("### 3. Trigger Configuration");
    report.push("");
    report.push(
      "**Action**: Update EmailTrigger actionData to include required variables"
    );
    report.push("");

    fs.writeFileSync(
      path.join(
        __dirname,
        "../email-validation-reports/fix-recommendations.md"
      ),
      report.join("\n")
    );

    console.log("✅ Generated Fix Recommendations");
  }

  /**
   * Run full validation
   */
  async run(templatesPath: string, triggersPath: string): Promise<void> {
    console.log("🚀 Starting Email Template Validation\n");

    // Create reports directory
    const reportsDir = path.join(__dirname, "../email-validation-reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Load data
    await this.loadTemplates(templatesPath);
    await this.loadTriggers(triggersPath);

    // Extract variables
    this.extractAllVariables();

    // Validate
    this.validateTemplates();

    // Cross-reference
    this.crossReferenceTriggers();

    // Generate reports
    this.generateReports();

    console.log(
      "\n✅ Validation complete! Check email-validation-reports/ for results.\n"
    );
  }
}

// Run the validator
const validator = new EmailTemplateValidator();
const templatesPath = "/Users/emanuelrusu/Downloads/EmailTemplate (1).json";
const triggersPath = "/Users/emanuelrusu/Downloads/EmailTrigger (1).json";

validator.run(templatesPath, triggersPath).catch(console.error);
