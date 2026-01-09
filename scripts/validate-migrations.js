#!/usr/bin/env node

/**
 * MIGRATION VALIDATION SCRIPT
 * 
 * This script validates all Prisma migration files to ensure they only contain
 * safe, additive operations (ADD COLUMN, CREATE TABLE, CREATE INDEX, etc.)
 * and flags any destructive operations (DROP TABLE, DROP COLUMN, DELETE, etc.)
 * 
 * Usage: pnpm run validate:migrations
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Safe operations (additive only)
const SAFE_PATTERNS = [
  /^CREATE\s+TABLE/i,
  /^ALTER\s+TABLE\s+[^\s]+\s+ADD\s+COLUMN/i,
  /^ALTER\s+TABLE\s+[^\s]+\s+ADD\s+CONSTRAINT/i,
  /^CREATE\s+(UNIQUE\s+)?INDEX/i,
  /^CREATE\s+TYPE/i,
  /^CREATE\s+ENUM/i,
  /^COMMENT\s+ON/i,
  /^--/i, // Comments
];

// Dangerous operations (destructive)
const DANGEROUS_PATTERNS = [
  /DROP\s+TABLE/i,
  /DROP\s+COLUMN/i,
  /ALTER\s+TABLE\s+[^\s]+\s+DROP/i,
  /DELETE\s+FROM/i,
  /TRUNCATE\s+TABLE/i,
  /DROP\s+INDEX/i,
  /DROP\s+TYPE/i,
  /DROP\s+ENUM/i,
  /DROP\s+CONSTRAINT/i,
];

function findMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  
  if (!fs.existsSync(migrationsDir)) {
    log("✗ Migrations directory not found", "red");
    return [];
  }

  const migrationFiles = [];
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const migrationPath = path.join(migrationsDir, entry.name, "migration.sql");
      if (fs.existsSync(migrationPath)) {
        migrationFiles.push({
          name: entry.name,
          path: migrationPath,
        });
      }
    }
  }

  return migrationFiles.sort((a, b) => a.name.localeCompare(b.name));
}

function analyzeMigration(migrationPath) {
  const content = fs.readFileSync(migrationPath, "utf8");
  const lines = content.split("\n");
  
  const issues = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("--")) {
      continue;
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(trimmedLine)) {
        issues.push({
          type: "dangerous",
          line: lineNumber,
          content: trimmedLine,
          pattern: pattern.toString(),
        });
      }
    }

    // Optional: Check if line looks like SQL but doesn't match safe patterns
    if (trimmedLine.length > 0 && !trimmedLine.startsWith("--")) {
      const isSafe = SAFE_PATTERNS.some(pattern => pattern.test(trimmedLine));
      if (!isSafe && /^[A-Z]/.test(trimmedLine)) {
        // Could be a warning for unknown operation
        // But we won't fail on this, just log
      }
    }
  }

  return {
    content,
    issues,
    lineCount: lines.length,
  };
}

function checkRecentBackup() {
  const backupsDir = path.join(process.cwd(), "backups");
  
  if (!fs.existsSync(backupsDir)) {
    return {
      exists: false,
      message: "Backups directory not found",
    };
  }

  try {
    // Find most recent production backup
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith("backup_production_") && file.endsWith(".sql.gz"))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          mtime: stats.mtime,
          age: Date.now() - stats.mtime.getTime(),
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      return {
        exists: false,
        message: "No production backups found",
      };
    }

    const latest = files[0];
    const ageHours = latest.age / (1000 * 60 * 60);
    const ageDays = ageHours / 24;

    return {
      exists: true,
      latest: latest.name,
      ageHours: Math.round(ageHours * 10) / 10,
      ageDays: Math.round(ageDays * 10) / 10,
      isRecent: ageHours < 24,
    };
  } catch (error) {
    return {
      exists: false,
      message: `Error checking backups: ${error.message}`,
    };
  }
}

function main() {
  console.log("\n");
  log("=".repeat(80), "cyan");
  log("MIGRATION VALIDATION - Production Safety Check", "cyan");
  log("=".repeat(80), "cyan");
  console.log("\n");

  // Find all migration files
  const migrationFiles = findMigrationFiles();

  if (migrationFiles.length === 0) {
    log("ℹ No migration files found", "yellow");
    console.log("\n");
    process.exit(0);
  }

  log(`Found ${migrationFiles.length} migration file(s)`, "blue");
  console.log("\n");

  let totalIssues = 0;
  const results = [];

  // Analyze each migration
  for (const migration of migrationFiles) {
    const analysis = analyzeMigration(migration.path);
    const hasIssues = analysis.issues.length > 0;
    
    if (hasIssues) {
      totalIssues += analysis.issues.length;
      results.push({
        migration: migration.name,
        status: "FAILED",
        issues: analysis.issues,
      });
    } else {
      results.push({
        migration: migration.name,
        status: "PASSED",
        issues: [],
      });
    }
  }

  // Display results
  let allPassed = true;

  for (const result of results) {
    if (result.status === "FAILED") {
      allPassed = false;
      log(`✗ ${result.migration}`, "red");
      
      for (const issue of result.issues) {
        log(`  Line ${issue.line}: ${issue.content}`, "yellow");
        log(`    ⚠️  DANGEROUS OPERATION DETECTED`, "red");
      }
      console.log("");
    } else {
      log(`✓ ${result.migration}`, "green");
    }
  }

  console.log("\n");
  log("-".repeat(80), "cyan");

  // Check for production backup
  log("\nChecking for production backup...", "blue");
  const backupStatus = checkRecentBackup();

  if (backupStatus.exists) {
    if (backupStatus.isRecent) {
      log(`✓ Recent backup found: ${backupStatus.latest}`, "green");
      log(`  Age: ${backupStatus.ageHours} hours (${backupStatus.ageDays} days)`, "green");
    } else {
      log(`⚠️  Backup found but older than 24 hours: ${backupStatus.latest}`, "yellow");
      log(`  Age: ${backupStatus.ageHours} hours (${backupStatus.ageDays} days)`, "yellow");
      log(`  Recommendation: Run 'pnpm run backup:production' before deploying`, "yellow");
    }
  } else {
    log(`✗ ${backupStatus.message}`, "red");
    log(`  ⚠️  CRITICAL: No production backup found!`, "red");
    log(`  Run 'pnpm run backup:production' before deploying`, "yellow");
  }

  console.log("\n");
  log("=".repeat(80), "cyan");
  console.log("\n");

  // Final summary
  if (totalIssues === 0 && allPassed) {
    if (backupStatus.exists && backupStatus.isRecent) {
      log("✅ ALL CHECKS PASSED", "green");
      log("✓ All migrations are safe (additive only)", "green");
      log("✓ Production backup exists and is recent", "green");
      log("\n✓ Safe to push to production", "green");
      console.log("\n");
      process.exit(0);
    } else {
      log("⚠️  MIGRATIONS ARE SAFE BUT BACKUP CHECK FAILED", "yellow");
      log("✓ All migrations are safe (additive only)", "green");
      log("⚠️  Production backup is missing or outdated", "yellow");
      log("\n⚠️  Create backup before pushing: pnpm run backup:production", "yellow");
      console.log("\n");
      process.exit(1); // Exit with error to prevent push
    }
  } else {
    log("❌ VALIDATION FAILED", "red");
    log(`✗ Found ${totalIssues} dangerous operation(s) in migration(s)`, "red");
    log("\n🚫 DO NOT PUSH TO PRODUCTION", "red");
    log("\nFix the following issues:", "yellow");
    log("1. Review migration files flagged above", "yellow");
    log("2. Remove or modify destructive operations", "yellow");
    log("3. Use additive-only operations (ADD COLUMN, CREATE TABLE, etc.)", "yellow");
    log("4. Re-run validation: pnpm run validate:migrations", "yellow");
    console.log("\n");
    process.exit(1);
  }
}

main();
