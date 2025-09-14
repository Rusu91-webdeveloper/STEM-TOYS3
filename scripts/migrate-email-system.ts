#!/usr/bin/env tsx

/**
 * Email System Migration Script
 *
 * This script helps migrate from the old email services to the new unified system.
 * It provides utilities to:
 * 1. Audit current email service usage
 * 2. Generate migration reports
 * 3. Test the new unified system
 * 4. Create migration plans
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

interface EmailServiceUsage {
  file: string;
  line: number;
  service: string;
  function: string;
  context: string;
}

interface MigrationReport {
  totalFiles: number;
  oldServices: EmailServiceUsage[];
  newServiceUsage: EmailServiceUsage[];
  migrationPlan: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
}

class EmailMigrationAuditor {
  private projectRoot: string;
  private oldServices = [
    "nodemailer",
    "brevo",
    "resend",
    "email-service",
    "marketing-email-service",
  ];
  private newServices = ["unified-service", "queue-system", "template-engine"];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Audit the entire codebase for email service usage
   */
  async auditCodebase(): Promise<MigrationReport> {
    console.log("🔍 Auditing codebase for email service usage...");

    const oldServiceUsage = await this.findServiceUsage(this.oldServices);
    const newServiceUsage = await this.findServiceUsage(this.newServices);

    const totalFiles = this.countFiles();

    const migrationPlan = this.generateMigrationPlan(oldServiceUsage);

    return {
      totalFiles,
      oldServices: oldServiceUsage,
      newServiceUsage: newServiceUsage,
      migrationPlan,
    };
  }

  /**
   * Find all files using specific email services
   */
  private async findServiceUsage(
    services: string[]
  ): Promise<EmailServiceUsage[]> {
    const usage: EmailServiceUsage[] = [];

    for (const service of services) {
      const files = this.findFilesUsingService(service);
      for (const file of files) {
        const usages = this.extractServiceUsage(file, service);
        usage.push(...usages);
      }
    }

    return usage;
  }

  /**
   * Find files that import or use a specific service
   */
  private findFilesUsingService(service: string): string[] {
    const files: string[] = [];

    try {
      // Use grep to find files containing the service
      const result = execSync(
        `grep -r "import.*${service}\\|from.*${service}\\|require.*${service}" ${this.projectRoot} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l`,
        { encoding: "utf8", cwd: this.projectRoot }
      );

      if (result.trim()) {
        files.push(...result.trim().split("\n"));
      }
    } catch (error) {
      // grep returns non-zero exit code when no matches found
      console.log(`No files found using ${service}`);
    }

    return files;
  }

  /**
   * Extract specific usage details from a file
   */
  private extractServiceUsage(
    filePath: string,
    service: string
  ): EmailServiceUsage[] {
    const usages: EmailServiceUsage[] = [];

    try {
      const content = readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (line.includes(service)) {
          // Extract function calls
          const functionMatches = line.match(/(\w+)\s*\(/g);
          if (functionMatches) {
            functionMatches.forEach(match => {
              const functionName = match.replace(/\s*\(/, "");
              usages.push({
                file: relative(this.projectRoot, filePath),
                line: index + 1,
                service,
                function: functionName,
                context: line.trim(),
              });
            });
          }
        }
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }

    return usages;
  }

  /**
   * Count total files in the project
   */
  private countFiles(): number {
    let count = 0;

    const countFilesRecursive = (dir: string) => {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!item.startsWith(".") && item !== "node_modules") {
            countFilesRecursive(fullPath);
          }
        } else if (
          item.endsWith(".ts") ||
          item.endsWith(".tsx") ||
          item.endsWith(".js") ||
          item.endsWith(".jsx")
        ) {
          count++;
        }
      }
    };

    countFilesRecursive(this.projectRoot);
    return count;
  }

  /**
   * Generate a migration plan based on usage patterns
   */
  private generateMigrationPlan(oldServiceUsage: EmailServiceUsage[]): {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  } {
    const filesByService = new Map<string, string[]>();

    // Group files by service
    oldServiceUsage.forEach(usage => {
      if (!filesByService.has(usage.service)) {
        filesByService.set(usage.service, []);
      }
      const files = filesByService.get(usage.service)!;
      if (!files.includes(usage.file)) {
        files.push(usage.file);
      }
    });

    return {
      phase1: [
        "Update API routes to use /api/email/v2",
        "Replace direct service calls with queue system",
        "Update authentication flows",
      ],
      phase2: [
        "Migrate marketing email templates",
        "Update order confirmation emails",
        "Replace newsletter sending",
      ],
      phase3: [
        "Remove old service files",
        "Update tests",
        "Clean up unused imports",
      ],
    };
  }

  /**
   * Generate a detailed migration report
   */
  generateReport(report: MigrationReport): string {
    let output = "# Email System Migration Report\n\n";

    output += `## Summary\n`;
    output += `- Total files scanned: ${report.totalFiles}\n`;
    output += `- Files using old services: ${new Set(report.oldServices.map(u => u.file)).size}\n`;
    output += `- Files using new services: ${new Set(report.newServiceUsage.map(u => u.file)).size}\n\n`;

    output += `## Old Service Usage\n\n`;
    const servicesByFile = new Map<string, EmailServiceUsage[]>();
    report.oldServices.forEach(usage => {
      if (!servicesByFile.has(usage.file)) {
        servicesByFile.set(usage.file, []);
      }
      servicesByFile.get(usage.file)!.push(usage);
    });

    servicesByFile.forEach((usages, file) => {
      output += `### ${file}\n`;
      usages.forEach(usage => {
        output += `- Line ${usage.line}: ${usage.function} (${usage.service})\n`;
        output += `  \`${usage.context}\`\n\n`;
      });
    });

    output += `## Migration Plan\n\n`;
    output += `### Phase 1: Core API Migration\n`;
    report.migrationPlan.phase1.forEach(step => {
      output += `- [ ] ${step}\n`;
    });

    output += `\n### Phase 2: Template Migration\n`;
    report.migrationPlan.phase2.forEach(step => {
      output += `- [ ] ${step}\n`;
    });

    output += `\n### Phase 3: Cleanup\n`;
    report.migrationPlan.phase3.forEach(step => {
      output += `- [ ] ${step}\n`;
    });

    return output;
  }

  /**
   * Test the new unified email system
   */
  async testNewSystem(): Promise<boolean> {
    console.log("🧪 Testing new unified email system...");

    try {
      // Test API endpoint
      const response = await fetch("http://localhost:3000/api/email/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "test@example.com",
          template: "test-template",
          variables: { name: "Test User" },
          subject: "Test Email",
          html: "<p>This is a test email</p>",
        }),
      });

      if (response.ok) {
        console.log("✅ New email API is working");
        return true;
      } else {
        console.log("❌ New email API test failed");
        return false;
      }
    } catch (error) {
      console.log("❌ Could not test new email API:", error);
      return false;
    }
  }
}

// Main execution
async function main() {
  const projectRoot = process.cwd();
  const auditor = new EmailMigrationAuditor(projectRoot);

  console.log("🚀 Starting Email System Migration Audit...\n");

  // Run audit
  const report = await auditor.auditCodebase();

  // Generate report
  const reportContent = auditor.generateReport(report);
  writeFileSync(join(projectRoot, "EMAIL_MIGRATION_REPORT.md"), reportContent);

  console.log("📊 Migration report generated: EMAIL_MIGRATION_REPORT.md");

  // Test new system
  const testPassed = await auditor.testNewSystem();

  if (testPassed) {
    console.log("\n✅ New email system is ready for migration!");
  } else {
    console.log("\n⚠️ New email system needs attention before migration.");
  }

  console.log("\n📋 Next steps:");
  console.log("1. Review EMAIL_MIGRATION_REPORT.md");
  console.log("2. Start with Phase 1 migration");
  console.log("3. Test each phase before proceeding");
  console.log("4. Update environment variables");
  console.log("5. Deploy and monitor");
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { EmailMigrationAuditor };
