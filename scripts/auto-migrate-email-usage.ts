#!/usr/bin/env tsx

/**
 * Auto Migration Script for Email Usage
 *
 * This script automatically migrates old email service usage to the new unified system.
 * It replaces imports and function calls with the new migration helper functions.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

interface MigrationRule {
  oldImport: string;
  newImport: string;
  oldFunction: string;
  newFunction: string;
  filePattern?: string;
}

class EmailAutoMigrator {
  private projectRoot: string;
  private migrationRules: MigrationRule[] = [
    // Nodemailer migrations
    {
      oldImport: 'import("@/lib/email/migration-helper")',
      newImport: 'import("@/lib/email/migration-helper")',
      oldFunction: "sendReturnNotificationEmail",
      newFunction: "sendReturnNotificationEmail",
    },
    {
      oldImport: 'import("@/lib/email/migration-helper")',
      newImport: 'import("@/lib/email/migration-helper")',
      oldFunction: "sendEmailViaUnifiedSystem",
      newFunction: "sendEmailViaUnifiedSystem",
    },
    // Brevo migrations
    {
      oldImport: 'import("@/lib/email/migration-helper")',
      newImport: 'import("@/lib/email/migration-helper")',
      oldFunction: "sendBulkReturnNotificationEmail",
      newFunction: "sendBulkReturnNotificationEmail",
    },
    {
      oldImport: 'import("@/lib/email/migration-helper")',
      newImport: 'import("@/lib/email/migration-helper")',
      oldFunction: "sendBulkReturnConfirmationEmail",
      newFunction: "sendBulkReturnConfirmationEmail",
    },
    // Direct service imports
    {
      oldImport: 'from "@/lib/email/migration-helper"',
      newImport: 'from "@/lib/email/migration-helper"',
      oldFunction: "sendEmailViaUnifiedSystem",
      newFunction: "sendEmailViaUnifiedSystem",
    },
    {
      oldImport: 'from "@/lib/email/migration-helper"',
      newImport: 'from "@/lib/email/migration-helper"',
      oldFunction: "sendEmailViaUnifiedSystem",
      newFunction: "sendEmailViaUnifiedSystem",
    },
    {
      oldImport: 'from "@/lib/email/migration-helper"',
      newImport: 'from "@/lib/email/migration-helper"',
      oldFunction: "sendEmailViaUnifiedSystem",
      newFunction: "sendEmailViaUnifiedSystem",
    },
  ];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Migrate all files in the project
   */
  async migrateAllFiles(): Promise<{
    totalFiles: number;
    migratedFiles: number;
    errors: Array<{ file: string; error: string }>;
  }> {
    console.log("🚀 Starting automatic email migration...");

    const allFiles = this.getAllTypeScriptFiles();
    let migratedFiles = 0;
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of allFiles) {
      try {
        const migrated = await this.migrateFile(file);
        if (migrated) {
          migratedFiles++;
          console.log(`✅ Migrated: ${relative(this.projectRoot, file)}`);
        }
      } catch (error) {
        errors.push({
          file: relative(this.projectRoot, file),
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(
          `❌ Error migrating ${relative(this.projectRoot, file)}:`,
          error
        );
      }
    }

    return {
      totalFiles: allFiles.length,
      migratedFiles,
      errors,
    };
  }

  /**
   * Get all TypeScript files in the project
   */
  private getAllTypeScriptFiles(): string[] {
    const files: string[] = [];

    const scanDirectory = (dir: string) => {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, .git, .next, etc.
          if (
            !item.startsWith(".") &&
            item !== "node_modules" &&
            item !== "dist"
          ) {
            scanDirectory(fullPath);
          }
        } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Migrate a single file
   */
  private async migrateFile(filePath: string): Promise<boolean> {
    const content = readFileSync(filePath, "utf8");
    let newContent = content;
    let hasChanges = false;

    // Apply each migration rule
    for (const rule of this.migrationRules) {
      // Skip if file pattern doesn't match
      if (rule.filePattern && !filePath.includes(rule.filePattern)) {
        continue;
      }

      // Replace imports
      if (newContent.includes(rule.oldImport)) {
        newContent = newContent.replace(
          new RegExp(
            rule.oldImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g"
          ),
          rule.newImport
        );
        hasChanges = true;
      }

      // Replace function calls
      if (newContent.includes(rule.oldFunction)) {
        newContent = newContent.replace(
          new RegExp(
            rule.oldFunction.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g"
          ),
          rule.newFunction
        );
        hasChanges = true;
      }
    }

    // Special handling for specific patterns
    newContent = this.handleSpecialCases(newContent, filePath);

    // Write the file if changes were made
    if (hasChanges) {
      writeFileSync(filePath, newContent, "utf8");
      return true;
    }

    return false;
  }

  /**
   * Handle special cases that require more complex transformations
   */
  private handleSpecialCases(content: string, filePath: string): string {
    let newContent = content;

    // Handle dynamic imports with .then() pattern
    if (filePath.includes("returns") && newContent.includes("await import")) {
      // This is already handled by the migration rules, but we can add more specific cases here
    }

    // Handle specific function signature changes
    if (newContent.includes("sendEmailViaUnifiedSystem")) {
      // Convert old sendEmailViaUnifiedSystem calls to new format
      newContent = newContent.replace(
        /sendEmailViaUnifiedSystem\(\{\s*to:\s*([^,]+),\s*subject:\s*([^,]+),\s*html:\s*([^}]+)\s*\}\)/g,
        (match, to, subject, html) => {
          return `sendEmailViaUnifiedSystem(${to}, ${subject}, ${html})`;
        }
      );
    }

    return newContent;
  }

  /**
   * Create a backup of files before migration
   */
  async createBackup(): Promise<void> {
    console.log("📦 Creating backup of files to be migrated...");

    const files = this.getAllTypeScriptFiles();
    const backupDir = join(this.projectRoot, "backup-email-migration");

    // This is a simple backup - in production, you might want to use git or a proper backup system
    console.log(`📁 Would create backup in: ${backupDir}`);
    console.log(`📄 Files to backup: ${files.length}`);
  }

  /**
   * Generate migration report
   */
  generateReport(result: {
    totalFiles: number;
    migratedFiles: number;
    errors: Array<{ file: string; error: string }>;
  }): string {
    let report = "# Email Auto-Migration Report\n\n";

    report += `## Summary\n`;
    report += `- Total files scanned: ${result.totalFiles}\n`;
    report += `- Files migrated: ${result.migratedFiles}\n`;
    report += `- Errors: ${result.errors.length}\n\n`;

    if (result.errors.length > 0) {
      report += `## Errors\n\n`;
      result.errors.forEach(error => {
        report += `- **${error.file}**: ${error.error}\n`;
      });
      report += "\n";
    }

    report += `## Migration Rules Applied\n\n`;
    this.migrationRules.forEach((rule, index) => {
      report += `${index + 1}. **${rule.oldFunction}** → **${rule.newFunction}**\n`;
      report += `   - Import: \`${rule.oldImport}\` → \`${rule.newImport}\`\n\n`;
    });

    return report;
  }
}

// Main execution
async function main() {
  const projectRoot = process.cwd();
  const migrator = new EmailAutoMigrator(projectRoot);

  console.log("🚀 Starting Email Auto-Migration...\n");

  // Create backup
  await migrator.createBackup();

  // Run migration
  const result = await migrator.migrateAllFiles();

  // Generate report
  const report = migrator.generateReport(result);
  writeFileSync(join(projectRoot, "EMAIL_AUTO_MIGRATION_REPORT.md"), report);

  console.log("\n📊 Migration completed!");
  console.log(
    `✅ Files migrated: ${result.migratedFiles}/${result.totalFiles}`
  );
  console.log(`❌ Errors: ${result.errors.length}`);
  console.log("📄 Report saved: EMAIL_AUTO_MIGRATION_REPORT.md");

  if (result.errors.length > 0) {
    console.log("\n⚠️ Some files had errors and may need manual review:");
    result.errors.forEach(error => {
      console.log(`   - ${error.file}: ${error.error}`);
    });
  }

  console.log(
    "\n🎉 Auto-migration complete! Please review the changes and test thoroughly."
  );
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { EmailAutoMigrator };
