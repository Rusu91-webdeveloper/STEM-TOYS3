import "server-only";
import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import "../env"; // Load environment variables early
import { createAuth } from "@/lib/auth-wrapper";

import { hashAdminPassword, verifyAdminPassword } from "../admin-auth";
import { verifyPassword } from "../auth-utils";
import { db } from "../db";
import { withRetry } from "../db-helpers";
import { logger } from "../logger";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isActive?: boolean;
  role?: string;
  accountLinked?: boolean;
}

let env: Record<string, string | undefined>;
let serviceConfig: Record<string, () => boolean>;

try {
  const config = require("@/lib/config");
  env = config.env;
  serviceConfig = config.serviceConfig;
} catch (error) {
  console.error("Failed to load config in auth.ts:", error);

  // Log environment variables for debugging (without sensitive values)
  console.error("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    VERCEL_URL: process.env.VERCEL_URL,
  });

  // Determine the correct URL based on environment
  let nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!nextAuthUrl) {
    if (process.env.VERCEL_URL) {
      // On Vercel, use the deployment URL
      nextAuthUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === "production") {
      // In production without Vercel, require explicit URL
      console.error("NEXTAUTH_URL must be set in production");
      nextAuthUrl = undefined;
    } else {
      // Development fallback
      nextAuthUrl = "http://localhost:3000";
    }
  }

  // Use fallback values
  env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ?? "development-secret-change-me",
    NEXTAUTH_URL: nextAuthUrl,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_NAME: process.env.ADMIN_NAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  };

  serviceConfig = {
    isGoogleOAuthEnabled: () =>
      !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    isAdminEnvEnabled: () => !!env.ADMIN_EMAIL,
  };
}

// Extend the session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isActive?: boolean;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accountLinked?: boolean;
      error?: string;
    };
  }
}

// Extend the JWT token types
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isActive?: boolean;
    role?: string;
    accountLinked?: boolean;
  }
}

// Function to create a development admin user from environment variables
// ONLY works in development mode for security reasons
const createDevAdminFromEnv = async () => {
  // Prevent environment admin creation in production
  if (env.NODE_ENV === "production") {
    logger.error(
      "Environment admin creation is disabled in production for security reasons"
    );
    return null;
  }

  // Only create if the service config indicates it's enabled
  if (!serviceConfig.isAdminEnvEnabled()) {
    return null;
  }

  logger.warn(
    "🚨 DEVELOPMENT ONLY: Using admin account from environment variables"
  );
  logger.warn("🚨 This feature is disabled in production for security reasons");

  const adminEmail = env.ADMIN_EMAIL!;
  const adminName = env.ADMIN_NAME ?? "Development Admin";
  const adminPasswordHash = env.ADMIN_PASSWORD_HASH;
  const adminPassword = env.ADMIN_PASSWORD;

  if (adminPasswordHash) {
    // Use the pre-hashed password directly
    return {
      id: "admin_env",
      name: adminName,
      email: adminEmail,
      password: adminPasswordHash,
      isActive: true,
      role: "ADMIN",
      passwordIsHashed: true,
    };
  } else if (adminPassword) {
    // Hash the plaintext password
    logger.warn(
      "🚨 Using plaintext ADMIN_PASSWORD - consider using ADMIN_PASSWORD_HASH instead"
    );
    const hashedPassword = await hashAdminPassword(adminPassword);

    return {
      id: "admin_env",
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      isActive: true,
      role: "ADMIN",
    };
  }

  return null;
};

// Initialize auth options
export const authOptions: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // FIXED: Simplified cookie configuration for better compatibility
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    // FIXED: Always include Google provider when credentials are available
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _request) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          logger.warn("Missing credentials for login attempt");
          return null;
        }

        const email = credentials.email;
        const password = credentials.password;

        try {
          // Find user in database
          let user: ExtendedUser | null = null;

          // Check if we should use the development admin account
          const isDevelopmentEnv = process.env.NODE_ENV === "development";
          const useEnvAdmin =
            process.env.USE_ENV_ADMIN === "true" || isDevelopmentEnv;

          // Check if admin credentials from environment should be used (development only)
          if (useEnvAdmin && email === env.ADMIN_EMAIL) {
            logger.info("Attempting development admin login");
            const envAdmin = await createDevAdminFromEnv();
            if (envAdmin) {
              user = envAdmin as ExtendedUser;
            }
          }

          // If no admin user was found or not using environment admin,
          // try to find the user in the database
          if (!user) {
            logger.debug("Looking up user in database", {
              email,
            });
            try {
              const dbUser = await db.user.findUnique({
                where: { email },
              });

              if (dbUser) {
                logger.debug("Found user in database", { userId: dbUser.id });
                user = dbUser as ExtendedUser;
              }
            } catch (dbError) {
              logger.error("Database error during login", dbError);
              return null;
            }
          }

          if (!user) {
            logger.warn("User not found during login attempt", {
              email,
            });
            return null;
          }

          // Verify password
          logger.debug("Checking password for user", { userId: user.id });

          let passwordMatch = false;
          if (user.id === "admin_env") {
            // For environment variable admin - check if we have a hash or need to use custom hashing
            const adminUser = user as ExtendedUser & {
              passwordIsHashed?: boolean;
              password: string;
            };
            if (adminUser.passwordIsHashed) {
              // We have a pre-computed bcrypt hash - use our server-side utility
              passwordMatch = await verifyPassword(
                password,
                adminUser.password
              );
            } else {
              // Use our custom secure hashing for legacy admin passwords
              passwordMatch = await verifyAdminPassword(
                password,
                adminUser.password
              );
            }
          } else {
            // Standard database user with bcrypt hash
            const dbUser = user as ExtendedUser & { password: string };
            passwordMatch = await verifyPassword(password, dbUser.password);
          }

          if (!passwordMatch) {
            logger.warn("Password mismatch during login attempt", {
              userId: user.id,
            });
            return null;
          }

          // Check if user is active (email verified)
          if (!user.isActive) {
            logger.warn("Login attempt with unverified account", {
              userId: user.id,
            });
            throw new Error(
              "Account not verified. Please check your email for verification link."
            );
          }

          logger.info("Authentication successful", {
            userId: user.id,
            role: user.role,
          });

          // Return user without password
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            isActive: user.isActive,
            role: user.role,
          };
        } catch (error) {
          logger.error("Auth error", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          // Check if user already exists - with retries
          let existingUser = null;
          try {
            existingUser = await withRetry(
              () =>
                db.user.findUnique({
                  where: { email: profile.email! },
                }),
              {
                name: "Find Google user",
                maxRetries: 3,
                delayMs: 300,
                logParams: { email: profile.email as string },
              }
            );
          } catch (findError) {
            logger.error("Error finding existing user", {
              error:
                findError instanceof Error
                  ? findError.message
                  : String(findError),
              email: profile.email,
            });

            // Return false to prevent sign-in on database error
            return false;
          }

          if (existingUser) {
            logger.info("Found existing user for Google login", {
              userId: existingUser.id,
              email: profile.email,
              isActive: existingUser.isActive,
            });

            // Store the user ID to be used in the JWT callback
            if (user) {
              user.id = existingUser.id;
            }

            // Check if the user is active
            if (!existingUser.isActive) {
              logger.warn("Login attempt with inactive Google account", {
                userId: existingUser.id,
                email: profile.email,
              });
              return false;
            }

            // If user exists and is active, allow sign-in
            return true;
          }
          // No user with this email exists - create new user for Google authentication
          let newUser: ExtendedUser;
          try {
            const createdUser = await withRetry(
              () =>
                db.user.create({
                  data: {
                    email: profile.email!,
                    name: profile.name ?? "Google User",
                    // For Google users, we don't need a password since they authenticate via Google
                    password: "", // Empty password for Google users
                    isActive: true, // Google-authenticated users are verified by default
                    emailVerified: new Date(),
                    role: "CUSTOMER", // Use the enum value from the Prisma schema
                  },
                }),
              {
                name: "Create Google user",
                maxRetries: 5,
                delayMs: 300,
                logParams: { email: profile.email },
              }
            );

            newUser = createdUser as ExtendedUser;

            logger.info("Created new user from Google login", {
              userId: newUser.id,
              email: profile.email,
            });

            // Store the user ID to be used in the JWT callback
            if (user) {
              user.id = newUser.id;
            }

            // Double check user exists right after creation
            const verifyCreation = await withRetry(
              () =>
                db.user.findUnique({
                  where: { id: newUser.id },
                  select: { id: true },
                }),
              {
                name: "Verify Google user creation",
                maxRetries: 3,
                delayMs: 300,
                logParams: { userId: newUser.id, email: profile.email },
              }
            );

            if (!verifyCreation) {
              logger.error("User created but not found in verification check", {
                userId: newUser.id,
                email: profile.email,
              });
              return false;
            }
          } catch (createError) {
            logger.error("Failed to create user after multiple attempts", {
              error:
                createError instanceof Error
                  ? createError.message
                  : String(createError),
              email: profile.email,
            });
            return false;
          }

          // Force a delay to ensure database operations complete
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          logger.error("Error in Google sign-in flow", {
            error: error instanceof Error ? error.message : String(error),
            email: profile.email,
          });
          return false; // Prevent sign-in on database error
        }
      }

      return true; // Allow sign-in
    },
    session({ session, token }) {
      // Assign token data to session
      if (token) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.isActive = token.isActive ?? false;
        session.user.role = token.role ?? "CUSTOMER";
        session.user.accountLinked = token.accountLinked ?? false;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // If the user has just signed in, add their database id to the token
      if (user) {
        // User object is available on initial sign-in
        token.id = user.id;
        const extendedUser = user as ExtendedUser;
        token.isActive = extendedUser.isActive ?? false;
        token.role = extendedUser.role ?? "CUSTOMER";
        token.accountLinked = (user as ExtendedUser).accountLinked ?? false;
      } else if (token.id) {
        // On subsequent requests, token.id is available, refresh data from DB
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id },
            select: { role: true, isActive: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          logger.error("Error refreshing user data in JWT callback", {
            error: error instanceof Error ? error.message : String(error),
            userId: token.id,
          });
        }
      }

      // For Google auth, add a timestamp when the user is created/updated
      if (account?.provider === "google") {
        token.googleAuthTimestamp = Date.now();
      }

      return token;
    },
  },
  debug: false,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "development-secret-please-change"
      : undefined),
  trustHost: true, // Required for Vercel deployment
};

// Import the wrapper

// For Next Auth v5 - use the wrapper with error handling
let authInstance: any;
try {
  authInstance = createAuth(authOptions);
} catch (error) {
  console.error("Failed to create auth instance:", error);
  // Use a basic fallback for development
  authInstance = {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ user: null }), {
          headers: { "Content-Type": "application/json" },
        }),
      POST: () =>
        new Response(JSON.stringify({ error: "Auth not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
    },
    auth: () => null,
    signIn: () => ({ error: "Auth not configured" }),
    signOut: () => ({ error: "Auth not configured" }),
  };
}

export const { handlers, auth, signIn, signOut } = authInstance;

// Mock users for development purposes
export const mockUsers = [
  {
    id: "mock_user_1",
    name: "Test User",
    email: "test@example.com",
    password: "$2a$12$QduVQePXgFInw8z.j1bBXuwxQPKVzxS4j9FWXD1Afxy3NQbIBMSqy", // hashed 'Password123'
    isActive: true,
    role: "CUSTOMER",
  },
  {
    id: "mock_admin",
    name: "Admin User",
    email: "admin@example.com",
    password: "$2a$12$QduVQePXgFInw8z.j1bBXuwxQPKVzxS4j9FWXD1Afxy3NQbIBMSqy", // hashed 'Password123'
    isActive: true,
    role: "ADMIN",
  },
];
