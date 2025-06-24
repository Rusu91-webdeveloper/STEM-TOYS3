/**
 * Fallback configuration for development when environment variables are missing
 */

import crypto from "crypto";

// Generate a temporary secret for development
const generateDevSecret = () => {
  const secret = crypto.randomBytes(32).toString("base64");
  console.warn("⚠️  Using auto-generated NEXTAUTH_SECRET for development");
  console.warn("📝 Add this to your .env.local file:");
  console.warn(`NEXTAUTH_SECRET="${secret}"`);
  return secret;
};

export const developmentFallbackConfig = {
  // Database
  DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5432/nextcommerce_dev",

  // NextAuth - Only generate secret if not already set
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: undefined, // Will be generated only if needed

  // Node environment
  NODE_ENV: "development",

  // Admin defaults for development
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_NAME: "Admin User",
  ADMIN_PASSWORD: "admin123",
  USE_ENV_ADMIN: "true",
};

// Apply fallback only in development
export function applyDevelopmentFallbacks() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  let appliedAnyFallback = false;

  // Apply fallbacks to process.env
  Object.entries(developmentFallbackConfig).forEach(([key, value]) => {
    if (value !== undefined && !process.env[key]) {
      process.env[key] = value;
      appliedAnyFallback = true;
    }
  });

  // Special handling for NEXTAUTH_SECRET - only generate if not set
  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "development") {
    process.env.NEXTAUTH_SECRET = generateDevSecret();
    appliedAnyFallback = true;
  }

  if (appliedAnyFallback) {
    console.log("🔧 Development fallback configuration applied");
    console.log("⚠️  Some environment variables were missing from .env.local");
  }
}
