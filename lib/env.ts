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

  // **PERFORMANCE**: Skip file loading in production - rely on system env vars
  if (process.env.NODE_ENV === "production") {
    environmentLoaded = true;
    return;
  }

  const projectRoot = process.cwd();

  // **PERFORMANCE**: Only load .env.local in development to reduce I/O
  const envFiles = [".env.local"];

  for (const envFile of envFiles) {
    const envPath = join(projectRoot, envFile);
    try {
      const result = config({ path: envPath });
      if (result.parsed) {
        // **PERFORMANCE**: Only log once per session to reduce console noise
        if (process.env.NODE_ENV === "development" && !globalThis.envLoaded) {
          console.log(`✅ Loaded environment variables from ${envFile}`);
          globalThis.envLoaded = true;
        }
      }
    } catch (error) {
      // File doesn't exist or can't be read - this is OK
      // **PERFORMANCE**: Skip logging for missing files
    }
  }

  // **PERFORMANCE**: Skip manual parsing in development - rely on config() above
  // Only verify critical variables exist
  const criticalVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];
  const missing = criticalVars.filter(varName => !process.env[varName]);

  if (missing.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(
      `⚠️  Missing critical environment variables: ${missing.join(", ")}`
    );
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
  NEXTAUTH_URL:
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "production"
        ? "https://stem-toys-3.vercel.app"
        : "http://localhost:3000"),
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
