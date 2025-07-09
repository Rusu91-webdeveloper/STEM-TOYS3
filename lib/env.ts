/**
 * Utility functions for handling environment variables
 */

import { join } from "path";

import { config } from "dotenv";

// Cache flag to prevent repeated loading
let environmentLoaded = false;

/**
 * Retrieves an environment variable and ensures it exists
 *
 * @param key - The environment variable key
 * @param errorMessage - Custom error message (optional)
 * @param isDevelopmentOnly - If true, allows empty values in development mode
 * @returns The environment variable value
 * @throws Error if the environment variable is not set (except in development if isDevelopmentOnly is true)
 */
export function getRequiredEnvVar(
  key: string,
  errorMessage?: string,
  isDevelopmentOnly = false
): string {
  const value = process.env[key];
  const isProduction = process.env.NODE_ENV === "production";

  // Check if value is missing
  if (!value) {
    // In production, never allow missing required variables
    if (isProduction) {
      throw new Error(
        errorMessage ||
          `Required environment variable ${key} is not set in production. Please check your environment configuration.`
      );
    }

    // In development, we can be more lenient if specified
    if (isDevelopmentOnly) {
      console.warn(
        `WARNING: Using development placeholder for ${key}. This would throw an error in production.`
      );
      return `dev-placeholder-${key}-${Date.now()}`;
    }

    // Otherwise, throw an error even in development
    throw new Error(
      errorMessage ||
        `Required environment variable ${key} is not set. Please check your environment configuration.`
    );
  }

  return value;
}

/**
 * Logs a warning if an environment variable is not set
 *
 * @param key - The environment variable key
 * @param warningMessage - Custom warning message (optional)
 * @returns The environment variable value or undefined
 */
export function getOptionalEnvVar(
  key: string,
  warningMessage?: string
): string | undefined {
  const value = process.env[key];

  if (!value) {
    console.warn(
      warningMessage || `Optional environment variable ${key} is not set.`
    );
  }

  return value;
}

// Function to load environment variables from multiple sources
function loadEnvironmentVariables() {
  // Skip if already loaded
  if (environmentLoaded) {
    return;
  }

  const projectRoot = process.cwd();

  // Load environment files in order of precedence
  const envFiles = [".env.local", ".env.development", ".env"];

  for (const envFile of envFiles) {
    const envPath = join(projectRoot, envFile);
    try {
      const result = config({ path: envPath });
      if (result.parsed) {
        console.log(`✅ Loaded environment variables from ${envFile}`);
      }
    } catch {
      // File doesn't exist or can't be read - this is OK
      console.log(`ℹ️  Environment file ${envFile} not found or unreadable`);
    }
  }

  // Verify critical environment variables are loaded
  const criticalVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];
  const missing = criticalVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing critical environment variables: ${missing.join(", ")}`
    );

    // Try to load from .env.local manually if still missing
    if (!process.env.DATABASE_URL) {
      try {
        const fs = require("fs");
        const envLocalPath = join(projectRoot, ".env.local");
        const content = fs.readFileSync(envLocalPath, "utf8");

        // Parse DATABASE_URL specifically
        const dbMatch = content.match(/DATABASE_URL=(.+)/);
        if (dbMatch) {
          process.env.DATABASE_URL = dbMatch[1].replace(/["']/g, "").trim();
          console.log("✅ Manually loaded DATABASE_URL from .env.local");
        }

        // Parse NEXTAUTH_SECRET specifically
        const authMatch = content.match(/NEXTAUTH_SECRET=(.+)/);
        if (authMatch) {
          process.env.NEXTAUTH_SECRET = authMatch[1]
            .replace(/["']/g, "")
            .trim();
          console.log("✅ Manually loaded NEXTAUTH_SECRET from .env.local");
        }

        // Parse Google OAuth credentials
        const googleIdMatch = content.match(/GOOGLE_CLIENT_ID=(.+)/);
        if (googleIdMatch) {
          process.env.GOOGLE_CLIENT_ID = googleIdMatch[1]
            .replace(/["']/g, "")
            .trim();
        }

        const googleSecretMatch = content.match(/GOOGLE_CLIENT_SECRET=(.+)/);
        if (googleSecretMatch) {
          process.env.GOOGLE_CLIENT_SECRET = googleSecretMatch[1]
            .replace(/["']/g, "")
            .trim();
        }
      } catch (error) {
        console.error(
          "❌ Failed to manually load environment variables:",
          error
        );
      }
    }
  } else {
    console.log("✅ All critical environment variables are loaded");
  }

  // Mark as loaded to prevent repeated loading
  environmentLoaded = true;
}

// Load environment variables immediately when this module is imported
loadEnvironmentVariables();

// Export the loader function for manual use if needed
export { loadEnvironmentVariables };

// Export commonly used environment variables with fallbacks
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
} as const;

// Validate that critical variables are available
const missingCritical = Object.entries(env)
  .filter(
    ([key, value]) =>
      ["DATABASE_URL", "NEXTAUTH_SECRET"].includes(key) && !value
  )
  .map(([key]) => key);

if (missingCritical.length > 0) {
  console.error(
    `❌ Critical environment variables missing: ${missingCritical.join(", ")}`
  );
  console.error(
    "Please check your .env.local file and restart the application"
  );
}
