import { z } from "zod";

// Define the environment schema with all required variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters long"),

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
});

// Refined schema with custom validation logic
const envSchemaRefined = envSchema
  .refine(
    (data) => {
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
    (data) => {
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
  try {
    return envSchemaRefined.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      console.error("❌ Environment variable validation failed:");
      errorMessages.forEach((msg) => console.error(`  - ${msg}`));

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

// Export the validated environment variables
export const env = validateEnv();

// Helper function to check if required services are configured
export const serviceConfig = {
  isGoogleOAuthEnabled: () =>
    !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  isStripeEnabled: () =>
    !!(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY),
  isEmailEnabled: () => !!env.RESEND_API_KEY,
  isUploadEnabled: () => !!(env.UPLOADTHING_SECRET && env.UPLOADTHING_APP_ID),
  isAdminEnvEnabled: () =>
    !!(env.ADMIN_EMAIL && (env.ADMIN_PASSWORD || env.ADMIN_PASSWORD_HASH)),
} as const;

// Log configuration status (only in development)
if (env.NODE_ENV === "development") {
  console.log("🔧 Service Configuration:");
  console.log(
    `  - Google OAuth: ${serviceConfig.isGoogleOAuthEnabled() ? "✅" : "❌"}`
  );
  console.log(`  - Stripe: ${serviceConfig.isStripeEnabled() ? "✅" : "❌"}`);
  console.log(`  - Email: ${serviceConfig.isEmailEnabled() ? "✅" : "❌"}`);
  console.log(`  - Upload: ${serviceConfig.isUploadEnabled() ? "✅" : "❌"}`);
  console.log(
    `  - Admin Env: ${serviceConfig.isAdminEnvEnabled() ? "✅" : "❌"}`
  );
}
