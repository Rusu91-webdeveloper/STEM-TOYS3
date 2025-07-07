import { z } from "zod";

import { applyDevelopmentFallbacks } from "./config-fallback";

// Define the environment schema with all required variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters long")
    .optional()
    .refine(
      val => {
        // In production, NEXTAUTH_SECRET is required
        if (process.env.NODE_ENV === "production" && !val) {
          return false;
        }
        return true;
      },
      {
        message: "NEXTAUTH_SECRET is required in production",
      }
    ),

  // OAuth Providers (required if being used)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Optional admin environment variables (only for development)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_NAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  USE_ENV_ADMIN: z.string().optional(),

  // Stripe (required for payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email service
  RESEND_API_KEY: z.string().optional(),

  // Upload service
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // Logger configuration
  DISABLE_PINO: z.string().optional(),
  ENABLE_PINO: z.string().optional(),
  LOG_LEVEL: z.string().optional(),

  // Cache configuration
  DISABLE_REDIS: z.string().optional(),
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_TIMEOUT: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z.string().optional(),
  CSRF_SECRET_KEY: z.string().optional(),
});

// Refined schema with custom validation logic
const envSchemaRefined = envSchema
  .refine(
    data => {
      // If Google OAuth is configured, both client ID and secret are required
      if (data.GOOGLE_CLIENT_ID || data.GOOGLE_CLIENT_SECRET) {
        return data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET;
      }
      return true;
    },
    {
      message:
        "Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required when using Google OAuth",
      path: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    }
  )
  .refine(
    data => {
      // If admin environment variables are used, validate they're only in development
      if (
        (data.ADMIN_EMAIL || data.ADMIN_PASSWORD || data.ADMIN_PASSWORD_HASH) &&
        data.NODE_ENV === "production"
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Admin environment variables should not be used in production",
      path: ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH"],
    }
  );

export type Env = z.infer<typeof envSchema>;

// Validate and parse environment variables
function validateEnv(): Env {
  // Apply development fallbacks before validation
  if (process.env.NODE_ENV !== "production") {
    applyDevelopmentFallbacks();
  }

  try {
    const validatedEnv = envSchemaRefined.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        err => `${err.path.join(".")}: ${err.message}`
      );

      console.error("❌ Environment variable validation failed:");
      errorMessages.forEach(msg => console.error(`  - ${msg}`));

      console.error(
        "\n💡 Please check your .env file and ensure all required variables are set."
      );

      // In production, this should cause the app to fail to start
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }

      // In development, throw the error to be caught by the calling code
      throw new Error("Environment variable validation failed");
    }
    throw error;
  }
}

// Lazy load environment variables to ensure they're loaded after Next.js initializes
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

// Export a getter for backwards compatibility
export const env = new Proxy({} as Env, {
  get(target, prop) {
    const value = getEnv()[prop as keyof Env];
    ensureConfigLogged();
    return value;
  },
});

// Initialize and log config on first access (but only once)
let hasLoggedConfig = false;
function ensureConfigLogged() {
  if (!hasLoggedConfig && _env && _env.NODE_ENV === "development") {
    hasLoggedConfig = true;
    // Use setTimeout to ensure this happens after the current execution context
    setTimeout(() => {
      logConfigStatus();
    }, 0);
  }
}

// Helper function to check if required services are configured
export const serviceConfig = {
  isGoogleOAuthEnabled: () => {
    if (!_env) return false;
    return !!(_env.GOOGLE_CLIENT_ID && _env.GOOGLE_CLIENT_SECRET);
  },
  isStripeEnabled: () => {
    if (!_env) return false;
    return !!(_env.STRIPE_SECRET_KEY && _env.STRIPE_PUBLISHABLE_KEY);
  },
  isEmailEnabled: () => {
    if (!_env) return false;
    return !!_env.RESEND_API_KEY;
  },
  isUploadEnabled: () => {
    if (!_env) return false;
    return !!(_env.UPLOADTHING_SECRET && _env.UPLOADTHING_APP_ID);
  },
  isAdminEnvEnabled: () => {
    if (!_env) return false;
    const hasPassword = Boolean(_env.ADMIN_PASSWORD);
    const hasPasswordHash = Boolean(_env.ADMIN_PASSWORD_HASH);
    const hasAuth = hasPassword || hasPasswordHash;
    return Boolean(_env.ADMIN_EMAIL) && hasAuth;
  },
  isRedisEnabled: () => {
    if (!_env) return false;
    const hasRedisUrl = Boolean(_env.REDIS_URL);
    const hasUpstashUrl = Boolean(_env.UPSTASH_REDIS_REST_URL);
    const hasRedisConfig = hasRedisUrl || hasUpstashUrl;
    return hasRedisConfig && _env.DISABLE_REDIS !== "true";
  },
  isPinoEnabled: () => {
    if (!_env) return false;
    const isProductionOrExplicitlyEnabled =
      _env.NODE_ENV === "production" || _env.ENABLE_PINO === "true";
    return _env.DISABLE_PINO !== "true" && isProductionOrExplicitlyEnabled;
  },
  isEmailServiceEnabled: () => !!process.env.BREVO_API_KEY || !!process.env.BREVO_SMTP_KEY,
} as const;

// Log configuration status (only in development)
export function logConfigStatus() {
  // Only log if environment has been initialized
  if (!_env) return;

  if (_env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🔧 Service Configuration:");
    // eslint-disable-next-line no-console
    console.log(
      `  - Google OAuth: ${serviceConfig.isGoogleOAuthEnabled() ? "✅" : "❌"}`
    );
    // eslint-disable-next-line no-console
    console.log(`  - Stripe: ${serviceConfig.isStripeEnabled() ? "✅" : "❌"}`);
    // eslint-disable-next-line no-console
    console.log(`  - Email: ${serviceConfig.isEmailEnabled() ? "✅" : "❌"}`);
    // eslint-disable-next-line no-console
    console.log(`  - Upload: ${serviceConfig.isUploadEnabled() ? "✅" : "❌"}`);
    // eslint-disable-next-line no-console
    console.log(
      `  - Admin Env: ${serviceConfig.isAdminEnvEnabled() ? "✅" : "❌"}`
    );
    // eslint-disable-next-line no-console
    console.log(`  - Redis: ${serviceConfig.isRedisEnabled() ? "✅" : "❌"}`);
    // eslint-disable-next-line no-console
    console.log(
      `  - Pino Logger: ${serviceConfig.isPinoEnabled() ? "✅" : "❌"}`
    );
    // eslint-disable-next-line no-console
    console.log(
      `  - Email Service: ${serviceConfig.isEmailServiceEnabled() ? "✅" : "❌"}`
    );
  }
}
