#!/usr/bin/env node

/**
 * DATABASE SAFETY CHECKER
 *
 * This script checks if you're about to modify production database
 * and prevents accidental changes
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const env = {};
    content.split("\n").forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        env[key] = value;
      }
    });
    return env;
  } catch (error) {
    return null;
  }
}

function isProductionDatabase(databaseUrl) {
  if (!databaseUrl) return false;

  // Check for production indicators
  const productionIndicators = [
    "neon.tech",
    "railway.app",
    "vercel-storage.com",
    "planetscale.com",
    "supabase.co",
    "render.com",
    "production",
    "prod",
  ];

  return productionIndicators.some(indicator =>
    databaseUrl.toLowerCase().includes(indicator)
  );
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n");
  log("=".repeat(80), "yellow");
  log("DATABASE SAFETY CHECK", "yellow");
  log("=".repeat(80), "yellow");
  console.log("\n");

  // Load environment variables
  const envLocalPath = path.join(process.cwd(), ".env.local");
  const envLocal = loadEnvFile(envLocalPath);

  if (!envLocal) {
    log("✗ .env.local file not found", "red");
    process.exit(1);
  }

  const databaseUrl = envLocal.DATABASE_URL || process.env.DATABASE_URL;
  const nodeEnv = envLocal.NODE_ENV || process.env.NODE_ENV || "development";

  if (!databaseUrl) {
    log("✗ DATABASE_URL not found", "red");
    process.exit(1);
  }

  // Check if this is a production database
  const isProduction = isProductionDatabase(databaseUrl);

  // Mask password in URL for display
  const maskedUrl = databaseUrl.replace(/(:\/\/[^:]+:)([^@]+)(@)/, "$1****$3");

  log(`Environment: ${nodeEnv}`, nodeEnv === "production" ? "red" : "green");
  log(`Database URL: ${maskedUrl}`, "blue");
  console.log("\n");

  if (isProduction && nodeEnv === "development") {
    log(
      "⚠️  WARNING: PRODUCTION DATABASE DETECTED IN DEVELOPMENT MODE!",
      "red"
    );
    log("=".repeat(80), "red");
    console.log("\n");
    log(
      "You are about to run a command that may modify your PRODUCTION database!",
      "yellow"
    );
    log("This is EXTREMELY DANGEROUS and can cause data loss!", "yellow");
    console.log("\n");
    log("Recommendations:", "yellow");
    log("1. Use a separate local database for development", "green");
    log("2. Set DATABASE_URL_LOCAL for local development", "green");
    log("3. Keep DATABASE_URL_PRODUCTION for production only", "green");
    console.log("\n");

    const answer = await askQuestion(
      `${colors.red}Type 'I UNDERSTAND THE RISK' to continue: ${colors.reset}`
    );

    if (answer !== "I UNDERSTAND THE RISK") {
      log("\n✓ Command cancelled - Your production data is safe!", "green");
      process.exit(1);
    }

    log("\n⚠️  Proceeding with production database...", "yellow");
  } else if (isProduction) {
    log("✓ Production database detected (expected in production)", "yellow");
  } else {
    log("✓ Local database detected - Safe to proceed", "green");
  }

  console.log("\n");
}

main().catch(error => {
  log(`Error: ${error.message}`, "red");
  process.exit(1);
});
