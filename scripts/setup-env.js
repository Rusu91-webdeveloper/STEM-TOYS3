#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

/**
 * Environment Setup Script
 *
 * This script helps you set up your .env.local file by:
 * 1. Reading your current .env.local (if exists) and generating env.example
 * 2. Creating a new .env.local from env.example with placeholder values
 * 3. Generating secure secrets automatically
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

function generateSecretKey() {
  return crypto.randomBytes(32).toString("hex");
}

function maskValue(key, value) {
  // Mask sensitive values but keep structure
  if (
    key.includes("SECRET") ||
    key.includes("PASSWORD") ||
    key.includes("KEY") ||
    key.includes("TOKEN")
  ) {
    if (key === "NEXTAUTH_SECRET") {
      return "your-super-secret-key-minimum-32-characters-long";
    }
    if (key.includes("API_KEY")) {
      return "your_api_key_here";
    }
    if (key.includes("PASSWORD")) {
      return "your_password_here";
    }
    if (key.includes("TOKEN")) {
      return "your_token_here";
    }
    return "your_secret_here";
  }

  // Keep URL structure but mask credentials
  if (key.includes("DATABASE_URL") && value) {
    return value.replace(/(:\/\/[^:]+:)([^@]+)(@)/, "$1****$3");
  }

  // Keep boolean/number values
  if (value === "true" || value === "false" || !isNaN(value)) {
    return value;
  }

  // Keep localhost URLs
  if (value && value.includes("localhost")) {
    return value;
  }

  // Mask production URLs but keep format
  if (value && (value.startsWith("http://") || value.startsWith("https://"))) {
    try {
      const url = new URL(value);
      return `https://your-domain.com`;
    } catch {
      return value;
    }
  }

  return value || `your_${key.toLowerCase()}`;
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const vars = {};
  const lines = content.split("\n");

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith("#") || line.trim() === "") {
      continue;
    }

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      vars[key] = value;
    }
  }

  return vars;
}

function updateEnvExample() {
  const projectRoot = process.cwd();
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envExamplePath = path.join(projectRoot, "env.example");

  if (!fs.existsSync(envLocalPath)) {
    console.log("⚠️  .env.local not found");
    console.log("   Cannot generate env.example from current configuration");
    return false;
  }

  console.log("📖 Reading current .env.local...");
  const currentVars = parseEnvFile(envLocalPath);

  console.log(
    `✅ Found ${Object.keys(currentVars).length} environment variables`
  );

  // Read existing env.example to preserve comments
  let existingExample = "";
  if (fs.existsSync(envExamplePath)) {
    existingExample = fs.readFileSync(envExamplePath, "utf8");
  }

  // Generate new env.example with masked values
  let newExample =
    "# =============================================================================\n";
  newExample += "# STEM TOYS E-COMMERCE - ENVIRONMENT CONFIGURATION\n";
  newExample +=
    "# =============================================================================\n";
  newExample += "# Generated from your current .env.local\n";
  newExample += `# Date: ${new Date().toISOString().split("T")[0]}\n`;
  newExample +=
    "# =============================================================================\n\n";

  // Group variables by prefix for better organization
  const groups = {
    CORE: ["NODE_ENV", "NEXTAUTH_", "CRON_"],
    DATABASE: ["DATABASE_", "DIRECT_URL", "POSTGRES_"],
    REDIS: ["REDIS_"],
    EMAIL: ["EMAIL_", "RESEND_", "BREVO_", "GMAIL_"],
    PAYMENT: ["STRIPE_", "NETOPIA_", "PAYMENT_"],
    AI: ["OPENAI_", "ANTHROPIC_", "AI_"],
    OAUTH: ["GOOGLE_", "FACEBOOK_CLIENT"],
    ANALYTICS: ["GA_", "FACEBOOK_PIXEL", "SENTRY_", "PERFORMANCE_"],
    UPLOAD: ["UPLOADTHING_"],
    SEO: ["GSC_", "SEO_"],
    INNGEST: ["INNGEST_"],
    OTHER: [],
  };

  const categorized = {};
  const allKeys = Object.keys(currentVars);

  // Categorize variables
  for (const key of allKeys) {
    let categorized_group = "OTHER";
    for (const [group, prefixes] of Object.entries(groups)) {
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        categorized_group = group;
        break;
      }
    }
    if (!categorized[categorized_group]) {
      categorized[categorized_group] = [];
    }
    categorized[categorized_group].push(key);
  }

  // Write grouped variables
  const groupTitles = {
    CORE: "CORE APPLICATION",
    DATABASE: "DATABASE CONFIGURATION",
    REDIS: "REDIS CONFIGURATION",
    EMAIL: "EMAIL CONFIGURATION",
    PAYMENT: "PAYMENT PROCESSING",
    AI: "AI SERVICES",
    OAUTH: "OAUTH PROVIDERS",
    ANALYTICS: "ANALYTICS & MONITORING",
    UPLOAD: "FILE UPLOAD",
    SEO: "SEO & SEARCH",
    INNGEST: "BACKGROUND JOBS",
    OTHER: "OTHER CONFIGURATION",
  };

  for (const [group, keys] of Object.entries(categorized)) {
    if (keys.length === 0) continue;

    newExample += `# =============================================================================\n`;
    newExample += `# ${groupTitles[group]}\n`;
    newExample += `# =============================================================================\n`;

    for (const key of keys.sort()) {
      const maskedValue = maskValue(key, currentVars[key]);
      newExample += `${key}=${maskedValue}\n`;
    }

    newExample += "\n";
  }

  // Write env.example
  fs.writeFileSync(envExamplePath, newExample, "utf8");
  console.log(
    "✅ Updated env.example with all current variables (secrets masked)"
  );

  return true;
}

async function createNewEnv() {
  const projectRoot = process.cwd();
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envExamplePath = path.join(projectRoot, "env.example");

  if (!fs.existsSync(envExamplePath)) {
    console.log("❌ env.example not found!");
    console.log("   Run this script with --update-example first");
    return;
  }

  if (fs.existsSync(envLocalPath)) {
    console.log("⚠️  .env.local already exists!");
    const answer = await askQuestion("   Overwrite? (yes/no): ");
    if (answer.toLowerCase() !== "yes") {
      console.log("   Cancelled. Your .env.local is safe.");
      return;
    }
    // Backup existing
    const backupPath = `${envLocalPath}.backup.${Date.now()}`;
    fs.copyFileSync(envLocalPath, backupPath);
    console.log(`   ✅ Backed up to ${path.basename(backupPath)}`);
  }

  // Read env.example
  const exampleContent = fs.readFileSync(envExamplePath, "utf8");

  // Generate secure secrets
  const nextAuthSecret = generateSecretKey();
  const cronSecret = generateSecretKey();

  // Replace placeholders
  let newContent = exampleContent
    .replace(/NEXTAUTH_SECRET=.+/, `NEXTAUTH_SECRET=${nextAuthSecret}`)
    .replace(/CRON_SECRET=.+/, `CRON_SECRET=${cronSecret}`)
    .replace(
      /NEXT_PUBLIC_CRON_SECRET_TOKEN=.+/,
      `NEXT_PUBLIC_CRON_SECRET_TOKEN=${cronSecret}`
    );

  // Write .env.local
  fs.writeFileSync(envLocalPath, newContent, "utf8");

  console.log("\n✅ Created .env.local from env.example");
  console.log("✅ Generated secure NEXTAUTH_SECRET and CRON_SECRET");
  console.log("\n🔍 Next steps:");
  console.log("   1. Edit .env.local and add your actual values:");
  console.log("      - DATABASE_URL (your database connection)");
  console.log("      - EMAIL_PRIMARY_API_KEY (for sending emails)");
  console.log("      - OPENAI_API_KEY (for AI features)");
  console.log("      - Other service API keys as needed");
  console.log("\n   2. Initialize database:");
  console.log("      npx prisma migrate deploy");
  console.log("\n   3. Start development:");
  console.log("      npm run dev");
}

async function main() {
  const args = process.argv.slice(2);

  console.log(
    "\n╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║           Environment Setup Script                           ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝\n"
  );

  if (args.includes("--update-example")) {
    // Mode 1: Update env.example from current .env.local
    console.log("📝 Mode: Update env.example from current .env.local\n");
    const success = updateEnvExample();
    if (success) {
      console.log("\n🎉 env.example updated!");
      console.log("   This file is safe to commit to git (secrets are masked)");
      console.log("   Team members can use it to set up their .env.local");
    }
  } else if (args.includes("--help") || args.includes("-h")) {
    // Show help
    console.log("Usage:");
    console.log(
      "  node scripts/setup-env.js                  - Create .env.local from env.example"
    );
    console.log(
      "  node scripts/setup-env.js --update-example - Update env.example from .env.local"
    );
    console.log(
      "  node scripts/setup-env.js --help           - Show this help"
    );
    console.log("\nExamples:");
    console.log("  # When you clone repo to new machine:");
    console.log("  node scripts/setup-env.js");
    console.log("\n  # After adding new env vars to your .env.local:");
    console.log("  node scripts/setup-env.js --update-example");
  } else {
    // Mode 2: Create .env.local from env.example
    console.log("📝 Mode: Create .env.local from env.example\n");
    await createNewEnv();
  }

  rl.close();
}

// Run the setup
main().catch(error => {
  console.error("❌ Error:", error.message);
  rl.close();
  process.exit(1);
});
