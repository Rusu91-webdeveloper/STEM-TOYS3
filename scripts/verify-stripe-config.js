#!/usr/bin/env node
require("dotenv").config({ path: ".env.local" });
/**
 * Stripe Configuration Verification Script
 *
 * Run this script to verify your Stripe environment variables are correctly configured.
 *
 * Usage: node scripts/verify-stripe-config.js
 */

const requiredEnvVars = {
  // Server-side (required for payment processing)
  STRIPE_SECRET_KEY: {
    pattern: /^sk_(test|live)_/,
    description: "Stripe Secret Key (server-side)",
    required: true,
  },

  // Client-side (required for Payment Element)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    pattern: /^pk_(test|live)_/,
    description: "Stripe Publishable Key (client-side)",
    required: true,
  },

  // Webhook (required for webhook verification)
  STRIPE_WEBHOOK_SECRET: {
    pattern: /^whsec_/,
    description: "Stripe Webhook Secret",
    required: true,
  },

  // Currency (optional, defaults to RON)
  STRIPE_DEFAULT_CURRENCY: {
    pattern: /^ron$/i,
    description: "Default Currency (should be 'ron' for Romania)",
    required: false,
    default: "ron",
  },

  // Feature flag (optional, defaults to false)
  NEXT_PUBLIC_STRIPE_ENABLED: {
    pattern: /^(true|false)$/i,
    description: "Stripe Enabled Flag",
    required: false,
    default: "false",
  },
};

const optionalEnvVars = {
  NEXT_PUBLIC_STRIPE_CURRENCY: {
    pattern: /^ron$/i,
    description: "Stripe Currency (client-side)",
  },
};

function checkEnvironmentVariable(name, config) {
  const value = process.env[name];
  const isRequired = config.required !== false;

  // Check if variable exists
  if (!value) {
    if (isRequired) {
      return {
        name,
        status: "missing",
        error: `Required environment variable ${name} is not set`,
        severity: "error",
      };
    } else {
      const defaultValue = config.default || "not set";
      return {
        name,
        status: "optional",
        message: `Optional variable ${name} is not set (using default: ${defaultValue})`,
        severity: "info",
      };
    }
  }

  // Check pattern if provided
  if (config.pattern && !config.pattern.test(value)) {
    return {
      name,
      status: "invalid",
      error: `Invalid format for ${name}. Expected pattern: ${config.pattern}`,
      severity: "error",
      value: value.substring(0, 10) + "...",
    };
  }

  // Check environment mode consistency
  if (name === "STRIPE_SECRET_KEY") {
    const isTest = value.startsWith("sk_test_");
    const isLive = value.startsWith("sk_live_");
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && isTest) {
      return {
        name,
        status: "warning",
        warning: "Using TEST key in PRODUCTION environment!",
        severity: "warning",
      };
    }

    if (!isProduction && isLive) {
      return {
        name,
        status: "warning",
        warning: "Using LIVE key in development environment",
        severity: "warning",
      };
    }
  }

  if (name === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") {
    const isTest = value.startsWith("pk_test_");
    const isLive = value.startsWith("pk_live_");
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && isTest) {
      return {
        name,
        status: "warning",
        warning: "Using TEST key in PRODUCTION environment!",
        severity: "warning",
      };
    }
  }

  return {
    name,
    status: "valid",
    message: `${config.description} is correctly configured`,
    severity: "success",
    value:
      name.includes("SECRET") || name.includes("WEBHOOK")
        ? value.substring(0, 15) + "..."
        : value.substring(0, 20) + "...",
  };
}

function main() {
  console.log("🔍 Stripe Configuration Verification\n");
  console.log("Environment:", process.env.NODE_ENV || "development");
  console.log("─".repeat(60) + "\n");

  const results = [];
  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  for (const [name, config] of Object.entries(requiredEnvVars)) {
    const result = checkEnvironmentVariable(name, config);
    results.push(result);

    if (result.severity === "error") {
      hasErrors = true;
    } else if (result.severity === "warning") {
      hasWarnings = true;
    }
  }

  // Check optional variables
  for (const [name, config] of Object.entries(optionalEnvVars)) {
    const result = checkEnvironmentVariable(name, {
      ...config,
      required: false,
    });
    if (result.status !== "optional") {
      results.push(result);
    }
  }

  // Print results
  for (const result of results) {
    const icon =
      {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
      }[result.severity] || "ℹ️";

    console.log(`${icon} ${result.name}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
    if (result.error) {
      console.log(`   ${result.error}`);
    }
    if (result.warning) {
      console.log(`   ${result.warning}`);
    }
    if (result.value) {
      console.log(`   Value: ${result.value}`);
    }
    console.log();
  }

  // Summary
  console.log("─".repeat(60));

  if (hasErrors) {
    console.log(
      "\n❌ Configuration has ERRORS. Please fix them before proceeding.\n"
    );
    process.exit(1);
  } else if (hasWarnings) {
    console.log("\n⚠️  Configuration has WARNINGS. Please review them.\n");
    process.exit(0);
  } else {
    console.log(
      "\n✅ All Stripe environment variables are correctly configured!\n"
    );

    // Additional checks
    const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
    if (stripeEnabled) {
      console.log("✅ Stripe is ENABLED in your application");
    } else {
      console.log(
        "ℹ️  Stripe is DISABLED. Set NEXT_PUBLIC_STRIPE_ENABLED=true to enable it."
      );
    }

    const currency = process.env.STRIPE_DEFAULT_CURRENCY || "ron";
    if (currency.toLowerCase() === "ron") {
      console.log("✅ Currency is set to RON (Romania)");
    } else {
      console.log(`ℹ️  Currency is set to ${currency.toUpperCase()}`);
    }

    console.log();
    process.exit(0);
  }
}

// Run the check
main();
