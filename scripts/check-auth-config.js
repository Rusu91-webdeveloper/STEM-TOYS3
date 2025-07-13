#!/usr/bin/env node

/**
 * Authentication Configuration Checker
 * Validates that all required environment variables are properly set
 */

const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envFiles = [".env.local", ".env"];
  let envFound = false;

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      log(`✅ Found ${file}`, colors.green);
      envFound = true;
      break;
    }
  }

  if (!envFound) {
    log("❌ No .env file found (.env.local or .env)", colors.red);
    log("💡 Create .env.local from .env.example", colors.yellow);
  }

  return envFound;
}

function checkEnvironmentVariable(name, required = true) {
  const value = process.env[name];
  const exists = !!value;

  if (exists) {
    if (name.includes("SECRET") || name.includes("PASSWORD")) {
      log(`✅ ${name}: Present (${value.length} characters)`, colors.green);
    } else if (name === "DATABASE_URL") {
      log(`✅ ${name}: ${value.substring(0, 20)}...`, colors.green);
    } else {
      log(`✅ ${name}: ${value}`, colors.green);
    }
  } else {
    const symbol = required ? "🔴" : "⚠️";
    const colorCode = required ? colors.red : colors.yellow;
    log(
      `${symbol} ${name}: ${required ? "MISSING (REQUIRED)" : "Not set (optional)"}`,
      colorCode
    );
  }

  return exists;
}

function validateNextAuthUrl() {
  const url = process.env.NEXTAUTH_URL;
  if (!url) return false;

  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost = url.includes("localhost");

  if (isProduction && isLocalhost) {
    log("❌ NEXTAUTH_URL should not use localhost in production", colors.red);
    return false;
  }

  if (!isProduction && !isLocalhost) {
    log("⚠️ NEXTAUTH_URL uses production URL in development", colors.yellow);
  }

  return true;
}

function validateNextAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;

  if (secret.length < 32) {
    log("⚠️ NEXTAUTH_SECRET should be at least 32 characters", colors.yellow);
    return false;
  }

  if (
    secret === "development-secret-please-change" ||
    secret.includes("change")
  ) {
    log("❌ NEXTAUTH_SECRET is using default/example value", colors.red);
    return false;
  }

  return true;
}

function generateRecommendations(results) {
  log("\n" + "=".repeat(50), colors.blue);
  log("🔧 RECOMMENDATIONS", colors.bold + colors.blue);
  log("=".repeat(50), colors.blue);

  const recommendations = [];

  if (!results.hasNextAuthUrl) {
    recommendations.push("Add NEXTAUTH_URL to your environment variables");
    if (process.env.NODE_ENV === "production") {
      recommendations.push(
        "Set NEXTAUTH_URL to https://stem-toys-3.vercel.app for production"
      );
    } else {
      recommendations.push(
        "Set NEXTAUTH_URL to http://localhost:3000 for development"
      );
    }
  }

  if (!results.hasNextAuthSecret) {
    recommendations.push(
      "Add NEXTAUTH_SECRET with a secure 32+ character string"
    );
  }

  if (!results.hasGoogleClientId || !results.hasGoogleClientSecret) {
    recommendations.push(
      "Add Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)"
    );
  }

  if (!results.hasDatabaseUrl) {
    recommendations.push(
      "Add DATABASE_URL with your database connection string"
    );
  }

  if (results.hasGoogleClientId && results.hasNextAuthUrl) {
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
    recommendations.push(
      `Ensure this URL is in your Google OAuth redirect URIs: ${callbackUrl}`
    );
  }

  if (recommendations.length === 0) {
    log("✅ All critical configurations look good!", colors.green);
    log("🎉 Your authentication should work properly", colors.green);
  } else {
    recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, colors.yellow);
    });
  }

  return recommendations;
}

function main() {
  // Load environment variables
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config({ path: ".env" });

  log("🔍 Authentication Configuration Checker", colors.bold + colors.blue);
  log("=" * 50, colors.blue);

  // Check for .env file
  checkEnvFile();

  log("\n📋 CRITICAL ENVIRONMENT VARIABLES", colors.bold);
  log("-".repeat(40));

  const results = {
    hasNextAuthUrl: checkEnvironmentVariable("NEXTAUTH_URL", true),
    hasNextAuthSecret: checkEnvironmentVariable("NEXTAUTH_SECRET", true),
    hasGoogleClientId: checkEnvironmentVariable("GOOGLE_CLIENT_ID", true),
    hasGoogleClientSecret: checkEnvironmentVariable(
      "GOOGLE_CLIENT_SECRET",
      true
    ),
    hasDatabaseUrl: checkEnvironmentVariable("DATABASE_URL", true),
  };

  log("\n📋 OPTIONAL ENVIRONMENT VARIABLES", colors.bold);
  log("-".repeat(40));

  checkEnvironmentVariable("STRIPE_SECRET_KEY", false);
  checkEnvironmentVariable("RESEND_API_KEY", false);
  checkEnvironmentVariable("UPLOADTHING_SECRET", false);

  log("\n🔍 VALIDATION CHECKS", colors.bold);
  log("-".repeat(40));

  const validations = {
    nextAuthUrlValid: validateNextAuthUrl(),
    nextAuthSecretValid: validateNextAuthSecret(),
  };

  // Environment info
  log("\n🌍 ENVIRONMENT INFO", colors.bold);
  log("-".repeat(40));
  log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  log(`Platform: ${process.env.VERCEL ? "Vercel" : "Local"}`);
  if (process.env.VERCEL_URL) {
    log(`Vercel URL: ${process.env.VERCEL_URL}`);
  }

  // Generate recommendations
  generateRecommendations(results);

  // Exit with appropriate code
  const criticalIssues = Object.values(results).filter(v => !v).length;
  const validationIssues = Object.values(validations).filter(v => !v).length;

  if (criticalIssues > 0 || validationIssues > 0) {
    log(
      `\n❌ Found ${criticalIssues + validationIssues} issues that need attention`,
      colors.red
    );
    process.exit(1);
  } else {
    log("\n✅ Configuration looks good! 🎉", colors.green);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariable,
  validateNextAuthUrl,
  validateNextAuthSecret,
};
