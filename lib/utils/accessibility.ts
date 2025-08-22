import { Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

export interface AccessibilityViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: any[];
  inapplicable: any[];
  incomplete: any[];
  timestamp: string;
  url: string;
  testEngine: {
    name: string;
    version: string;
  };
  testRunner: {
    name: string;
  };
  testEnvironment: {
    userAgent: string;
    windowWidth: number;
    windowHeight: number;
    orientationAngle: number;
    orientationType: string;
  };
  url: string;
  timestamp: string;
}

export interface AccessibilityTestConfig {
  tags?: string[];
  rules?: string[];
  includeNotices?: boolean;
  includeWarnings?: boolean;
  resultTypes?: ("violations" | "passes" | "inapplicable" | "incomplete")[];
}

/**
 * Run axe-core accessibility audit on a page
 */
export async function runAccessibilityAudit(
  page: Page,
  config: AccessibilityTestConfig = {}
): Promise<AccessibilityReport> {
  const {
    tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    rules = [],
    includeNotices = false,
    includeWarnings = false,
    resultTypes = ["violations", "passes", "inapplicable", "incomplete"],
  } = config;

  const builder = new AxeBuilder({ page }).withTags(tags);

  // Add specific rules if provided
  if (rules.length > 0) {
    builder.withRules(rules);
  }

  // Include notices and warnings if requested
  if (includeNotices) {
    builder.includeNotices();
  }
  if (includeWarnings) {
    builder.includeWarnings();
  }

  // Set result types
  builder.resultTypes(resultTypes);

  const results = await builder.analyze();

  return {
    violations: results.violations,
    passes: results.passes,
    inapplicable: results.inapplicable,
    incomplete: results.incomplete,
    timestamp: new Date().toISOString(),
    url: page.url(),
    testEngine: results.testEngine,
    testRunner: results.testRunner,
    testEnvironment: results.testEnvironment,
  };
}

/**
 * Check if a page meets WCAG 2.1 AA standards
 */
export async function checkWCAGCompliance(page: Page): Promise<{
  compliant: boolean;
  violations: AccessibilityViolation[];
  score: number;
}> {
  const report = await runAccessibilityAudit(page, {
    tags: ["wcag2aa"],
    resultTypes: ["violations"],
  });

  const totalChecks = report.violations.length;
  const criticalViolations = report.violations.filter(
    v => v.impact === "critical"
  );
  const seriousViolations = report.violations.filter(
    v => v.impact === "serious"
  );
  const moderateViolations = report.violations.filter(
    v => v.impact === "moderate"
  );
  const minorViolations = report.violations.filter(v => v.impact === "minor");

  // Calculate compliance score (0-100)
  const score = Math.max(
    0,
    100 -
      criticalViolations.length * 25 -
      seriousViolations.length * 15 -
      moderateViolations.length * 10 -
      minorViolations.length * 5
  );

  // Consider compliant if score >= 90 and no critical violations
  const compliant = score >= 90 && criticalViolations.length === 0;

  return {
    compliant,
    violations: report.violations,
    score,
  };
}

/**
 * Generate accessibility report in different formats
 */
export function generateAccessibilityReport(
  report: AccessibilityReport,
  format: "json" | "html" | "text" = "json"
): string {
  switch (format) {
    case "json":
      return JSON.stringify(report, null, 2);

    case "html":
      return generateHTMLReport(report);

    case "text":
      return generateTextReport(report);

    default:
      return JSON.stringify(report, null, 2);
  }
}

/**
 * Generate HTML accessibility report
 */
function generateHTMLReport(report: AccessibilityReport): string {
  const violations = report.violations;
  const totalViolations = violations.length;

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Accessibility Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .violation { margin: 20px 0; padding: 15px; border-left: 4px solid #ff4444; background: #fff5f5; }
        .impact-critical { border-left-color: #ff0000; }
        .impact-serious { border-left-color: #ff6600; }
        .impact-moderate { border-left-color: #ffaa00; }
        .impact-minor { border-left-color: #ffcc00; }
        .node { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }
        .summary { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Accessibility Report</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
        <p><strong>Total Violations:</strong> ${totalViolations}</p>
      </div>
  `;

  if (totalViolations === 0) {
    html += `
      <div class="summary">
        <h2>✅ No Accessibility Violations Found</h2>
        <p>This page passes all accessibility checks!</p>
      </div>
    `;
  } else {
    violations.forEach(violation => {
      html += `
        <div class="violation impact-${violation.impact}">
          <h3>${violation.id}: ${violation.description}</h3>
          <p><strong>Impact:</strong> ${violation.impact}</p>
          <p><strong>Help:</strong> ${violation.help}</p>
          <p><strong>Tags:</strong> ${violation.tags.join(", ")}</p>
          <p><a href="${violation.helpUrl}" target="_blank">Learn more</a></p>
          <h4>Affected Elements (${violation.nodes.length}):</h4>
          ${violation.nodes
            .map(
              node => `
            <div class="node">
              <p><strong>HTML:</strong> <code>${node.html}</code></p>
              <p><strong>Target:</strong> <code>${node.target.join(" ")}</code></p>
              <p><strong>Issue:</strong> ${node.failureSummary}</p>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    });
  }

  html += `
    </body>
    </html>
  `;

  return html;
}

/**
 * Generate text accessibility report
 */
function generateTextReport(report: AccessibilityReport): string {
  const violations = report.violations;
  const totalViolations = violations.length;

  let text = `
ACCESSIBILITY REPORT
===================

URL: ${report.url}
Timestamp: ${report.timestamp}
Total Violations: ${totalViolations}

`;

  if (totalViolations === 0) {
    text += `✅ No accessibility violations found!\n`;
  } else {
    violations.forEach((violation, index) => {
      text += `
${index + 1}. ${violation.id}: ${violation.description}
   Impact: ${violation.impact}
   Help: ${violation.help}
   Tags: ${violation.tags.join(", ")}
   Help URL: ${violation.helpUrl}
   
   Affected Elements (${violation.nodes.length}):
`;

      violation.nodes.forEach((node, nodeIndex) => {
        text += `   ${nodeIndex + 1}. HTML: ${node.html}\n`;
        text += `      Target: ${node.target.join(" ")}\n`;
        text += `      Issue: ${node.failureSummary}\n\n`;
      });
    });
  }

  return text;
}

/**
 * Check specific accessibility patterns
 */
export async function checkAccessibilityPatterns(page: Page): Promise<{
  headingStructure: boolean;
  imageAltText: boolean;
  formLabels: boolean;
  colorContrast: boolean;
  keyboardNavigation: boolean;
  semanticHTML: boolean;
}> {
  const results = {
    headingStructure: false,
    imageAltText: false,
    formLabels: false,
    colorContrast: false,
    keyboardNavigation: false,
    semanticHTML: false,
  };

  // Check heading structure
  const h1Count = await page.locator("h1").count();
  results.headingStructure = h1Count === 1;

  // Check image alt text
  const images = await page.locator("img").all();
  const imagesWithAlt = await Promise.all(
    images.map(async img => {
      const alt = await img.getAttribute("alt");
      return alt !== null;
    })
  );
  results.imageAltText = imagesWithAlt.every(hasAlt => hasAlt);

  // Check form labels
  const inputs = await page
    .locator('input:not([type="hidden"]), select, textarea')
    .all();
  const inputsWithLabels = await Promise.all(
    inputs.map(async input => {
      const id = await input.getAttribute("id");
      if (!id) return false;

      const label = await page.locator(`label[for="${id}"]`).count();
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      return label > 0 || ariaLabel || ariaLabelledBy;
    })
  );
  results.formLabels = inputsWithLabels.every(hasLabel => hasLabel);

  // Check color contrast
  const contrastReport = await runAccessibilityAudit(page, {
    tags: ["wcag2aa"],
    rules: ["color-contrast"],
  });
  results.colorContrast = contrastReport.violations.length === 0;

  // Check keyboard navigation
  await page.keyboard.press("Tab");
  const focusedElement = await page.evaluate(() => document.activeElement);
  results.keyboardNavigation = focusedElement !== null;

  // Check semantic HTML
  const semanticElements = await page
    .locator("main, nav, header, footer, section, article, aside")
    .count();
  results.semanticHTML = semanticElements > 0;

  return results;
}
