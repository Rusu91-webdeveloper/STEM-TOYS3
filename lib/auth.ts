import NextAuth from "next-auth";
import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin-auth";
import { withRetry, verifyUserExists } from "@/lib/db-helpers";
import { env, serviceConfig } from "@/lib/config";

// Extended user type that includes our custom fields
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isActive?: boolean;
  role?: string;
}

interface Credentials {
  email: string;
  password: string;
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
  const adminName = env.ADMIN_NAME || "Development Admin";
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
  },
  // Secure cookie settings
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
    ...(serviceConfig.isGoogleOAuthEnabled()
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
      async authorize(
        credentials: Record<"email" | "password", string> | undefined
      ) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn("Missing credentials for login attempt");
          return null;
        }

        try {
          // Find user in database
          let user: any = null;

          // Check if we should use the development admin account
          const isDevelopmentEnv = process.env.NODE_ENV === "development";
          const useEnvAdmin =
            process.env.USE_ENV_ADMIN === "true" || isDevelopmentEnv;

          // Check if admin credentials from environment should be used (development only)
          if (useEnvAdmin && credentials.email === env.ADMIN_EMAIL) {
            logger.info("Attempting development admin login");
            const envAdmin = await createDevAdminFromEnv();
            if (envAdmin) {
              user = envAdmin;
            }
          }

          // If no admin user was found or not using environment admin,
          // try to find the user in the database
          if (!user) {
            logger.debug("Looking up user in database", {
              email: credentials.email,
            });
            try {
              user = await db.user.findUnique({
                where: { email: credentials.email },
              });

              if (user) {
                logger.debug("Found user in database", { userId: user.id });
              }
            } catch (dbError) {
              logger.error("Database error during login", dbError);
              return null;
            }
          }

          if (!user) {
            logger.warn("User not found during login attempt", {
              email: credentials.email,
            });
            return null;
          }

          // Verify password
          logger.debug("Checking password for user", { userId: user.id });

          let passwordMatch = false;
          if (user.passwordIsHashed) {
            // Direct comparison for pre-hashed admin password
            passwordMatch = user.password === credentials.password;
          } else if (user.id === "admin_env") {
            // For environment variable admin using our secure hashing
            passwordMatch = await verifyAdminPassword(
              credentials.password,
              user.password as string
            );
          } else {
            // Standard database user with bcrypt hash
            passwordMatch = await compare(
              credentials.password,
              user.password as string
            );
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
          }

          if (existingUser) {
            // User already exists with this email
            logger.info(
              "User already exists with this email, signing in as existing user",
              {
                userId: existingUser.id,
                email: profile.email as string,
              }
            );

            // Check if this is a regular account (non-empty password) trying to sign in with Google
            const isRegularAccount =
              existingUser.password && existingUser.password !== "";

            if (isRegularAccount) {
              // For security, still link the account but inform the user through an error
              logger.warn("Regular user attempting to sign in with Google", {
                userId: existingUser.id,
                email: profile.email as string,
              });

              // Update existing user to mark as active and store Google credentials
              // but preserve their role and other important fields
              await withRetry(
                () =>
                  db.user.update({
                    where: { id: existingUser!.id },
                    data: {
                      name: profile.name || existingUser!.name,
                      isActive: true,
                      emailVerified: new Date(),
                      // Do NOT change role - preserve the existing user's role
                      // role is intentionally omitted to keep the original value
                    },
                  }),
                {
                  name: "Update Google user",
                  maxRetries: 5,
                  delayMs: 300,
                  logParams: {
                    userId: existingUser.id,
                    email: profile.email as string,
                  },
                }
              );

              // Store the user ID to be used in the JWT callback
              if (user) {
                user.id = existingUser.id;
              }

              // We'll display a message on the client side about account linking
              // Add a custom property to pass through to jwt callback
              (user as any).accountLinked = true;
            } else {
              // This is a Google account - regular update flow
              await withRetry(
                () =>
                  db.user.update({
                    where: { id: existingUser!.id },
                    data: {
                      name: profile.name || existingUser!.name,
                      isActive: true, // Ensure Google-authenticated users are active
                      emailVerified: new Date(),
                    },
                  }),
                {
                  name: "Update Google user",
                  maxRetries: 5,
                  delayMs: 300,
                  logParams: {
                    userId: existingUser.id,
                    email: profile.email as string,
                  },
                }
              );

              logger.info("Updated existing user from Google login", {
                userId: existingUser.id,
                email: profile.email as string,
              });

              // Store the user ID to be used in the JWT callback
              if (user) {
                user.id = existingUser.id;
              }
            }
          } else {
            // No user with this email exists - create new user for Google authentication
            let newUser: any;
            try {
              newUser = await withRetry(
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
                logger.error(
                  "User created but not found in verification check",
                  {
                    userId: newUser.id,
                    email: profile.email,
                  }
                );
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
          }

          // Force a delay to ensure database operations complete
          await new Promise((resolve) => setTimeout(resolve, 1500));
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
    async session({ session, token }) {
      // Assign token data to session
      if (token) {
        session.user.id = token.id || token.sub || "";
        session.user.isActive = token.isActive || false;
        session.user.role = token.role || "CUSTOMER";
        session.user.accountLinked = token.accountLinked || false;

        // For Google-linked accounts, double-check the role from the database
        // This ensures admin privileges are preserved after Google sign-in
        if (token.accountLinked && session.user.id) {
          try {
            // Only make this additional check for accounts marked as linked
            const dbUser = await db.user.findUnique({
              where: { id: session.user.id },
              select: { role: true },
            });

            if (dbUser && dbUser.role) {
              // Make sure to use the latest role from DB
              session.user.role = dbUser.role;
            }
          } catch (error) {
            logger.error("Error verifying role in session callback", {
              error: error instanceof Error ? error.message : String(error),
              userId: session.user.id,
            });
            // Continue with existing role on error
          }
        }

        // For middleware and API routes, add token data to session
        // This makes googleAuthTimestamp accessible in the middleware
        (session as any).token = {
          googleAuthTimestamp: token.googleAuthTimestamp,
        };
      }

      // Skip database verification for fresh Google auth sessions
      // This gives time for the user creation in the database to complete
      const isRecentGoogleAuth =
        token.googleAuthTimestamp &&
        Date.now() - (token.googleAuthTimestamp as number) < 120000; // 2 minute grace period (increased)

      if (isRecentGoogleAuth) {
        logger.info("Bypassing database check for fresh Google auth session", {
          userId: session.user.id,
        });
        return session;
      }

      // Verify that the user still exists in the database using our retry helper
      try {
        if (session.user.id) {
          // Special handling for environment-based admin accounts (development only)
          // These accounts don't exist in the database but are valid in development
          if (session.user.id === "admin_env") {
            // Check if admin env is enabled and we're in development
            if (
              env.NODE_ENV === "development" &&
              serviceConfig.isAdminEnvEnabled()
            ) {
              logger.info("Session validated for development admin user", {
                userId: session.user.id,
              });
              return session;
            } else {
              logger.warn("Environment admin session invalid in production", {
                userId: session.user.id,
              });
              return {
                ...session,
                user: {
                  ...session.user,
                  error: "AdminEnvDisabled",
                },
                expires: "0",
              };
            }
          }

          const userExists = await verifyUserExists(session.user.id, {
            maxRetries: 3,
            delayMs: 500,
          });

          // If user doesn't exist in database, invalidate the session
          if (!userExists) {
            logger.warn("Session requested for deleted user", {
              userId: session.user.id,
            });
            // Set an error flag so middleware can detect and handle this
            return {
              ...session,
              user: {
                ...session.user,
                error: "UserNotFound",
              },
              expires: "0",
            };
          }
        }
      } catch (error) {
        logger.error("Error verifying user existence during session", {
          error: error instanceof Error ? error.message : String(error),
          userId: session.user?.id,
        });
        // Continue in case of database error to avoid blocking access
      }

      return session;
    },
    async jwt({ token, user, account, profile }) {
      // If the user has just signed in, add their database id to the token
      if (user) {
        token.id = user.id;
        // Use type assertion to handle the custom fields safely
        const extendedUser = user as ExtendedUser;
        token.isActive = extendedUser.isActive || false;
        token.role = extendedUser.role || "CUSTOMER";

        // Capture account linking information if present
        token.accountLinked = (user as any).accountLinked || false;

        // For Google auth, add a timestamp when the user is created/updated
        // This helps identify fresh Google auth sessions
        if (account?.provider === "google") {
          token.googleAuthTimestamp = Date.now();

          // For linked accounts (especially ADMIN), verify the role directly from the database
          if ((user as any).accountLinked) {
            try {
              const dbUser = await db.user.findUnique({
                where: { id: user.id },
                select: { role: true },
              });

              if (dbUser && dbUser.role) {
                // Use the role from the database to ensure admins keep their privileges
                token.role = dbUser.role;
                logger.info(
                  "Updated user role from database during Google auth",
                  {
                    userId: user.id,
                    role: dbUser.role,
                  }
                );
              }
            } catch (error) {
              logger.error("Error fetching user role during Google auth", {
                error: error instanceof Error ? error.message : String(error),
                userId: user.id,
              });
            }
          }
        }
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// For Next Auth v5
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

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
