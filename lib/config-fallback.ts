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
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/nextcommerce_dev",

  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? generateDevSecret() : undefined),

  // Node environment
  NODE_ENV: process.env.NODE_ENV || "development",

  // Optional services - return undefined if not set
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
  UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,

  // Admin defaults for development
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@example.com",
  ADMIN_NAME: process.env.ADMIN_NAME || "Admin User",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  USE_ENV_ADMIN: process.env.USE_ENV_ADMIN || "true",
};

// Apply fallback only in development
export function applyDevelopmentFallbacks() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  // Apply fallbacks to process.env
  Object.entries(developmentFallbackConfig).forEach(([key, value]) => {
    if (value !== undefined && !process.env[key]) {
      process.env[key] = value;
    }
  });

  console.log("🔧 Development fallback configuration applied");
  console.log("⚠️  Please create a .env.local file for proper configuration");
}
