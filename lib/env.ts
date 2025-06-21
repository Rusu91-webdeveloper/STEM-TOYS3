/**
 * Utility functions for handling environment variables
 */

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
