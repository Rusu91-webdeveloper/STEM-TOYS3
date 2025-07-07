import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { verifyUserExists } from "@/lib/db-helpers";
import { logger } from "@/lib/logger";
import { getCached, cache, CacheKeys } from "@/lib/cache";

/**
 * **OPTIMIZED** API route to validate a user's session against the database
 * Now includes caching and performance optimizations
 */
export async function GET(_request: NextRequest) {
  try {
    // FIXED: Check if database is configured first
    if (!process.env.DATABASE_URL) {
      logger.error("Database not configured - session validation failed");
      return NextResponse.json(
        {
          valid: false,
          reason: "database-not-configured",
          error: "DATABASE_URL environment variable not found",
        },
        { status: 500 }
      );
    }

    // Get current session
    const session = await auth();

    // If no session, return false immediately
    if (!session?.user?.id) {
      const response = NextResponse.json({
        valid: false,
        reason: "no-session",
      });
      // **PERFORMANCE**: Cache negative results briefly
      response.headers.set("Cache-Control", "private, max-age=30");
      return response;
    }

    // Extract user ID for clarity
    const userId = session.user.id;
    const cacheKey = CacheKeys.user(userId) + ":session-validation";
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    // **PERFORMANCE**: Check distributed cache first
    const cached = await cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info("Session validation cache hit", { userId });
      const response = NextResponse.json({
        valid: cached.valid,
        reason: cached.reason,
        cached: true,
      });
      // Set appropriate cache headers
      response.headers.set("Cache-Control", "private, max-age=60");
      return response;
    }

    // Special handling for environment-based admin accounts
    if (userId === "admin_env" && process.env.ADMIN_EMAIL) {
      logger.info("Session validated for environment admin user", { userId });
      const result = { valid: true, reason: "admin-env" };
      await cache.set(
        cacheKey,
        { ...result, timestamp: Date.now() },
        CACHE_DURATION
      );
      const response = NextResponse.json(result);
      response.headers.set("Cache-Control", "private, max-age=300"); // 5 minutes for admin
      return response;
    }

    // Check if this is a fresh Google auth session
    const tokenData = (session as any).token || {};
    const isRecentGoogleAuth =
      tokenData.googleAuthTimestamp &&
      Date.now() - tokenData.googleAuthTimestamp < 120000;

    let validationResult: {
      valid: boolean;
      reason?: string;
      isRecentAuth?: boolean;
    };

    if (isRecentGoogleAuth) {
      logger.info(
        "Validating fresh Google auth session with extended verification",
        { userId }
      );

      // **PERFORMANCE**: Optimized retry logic for fresh auth
      let userExists = false;
      let attempts = 0;
      const maxAttempts = 3; // Reduced from 5

      while (!userExists && attempts < maxAttempts) {
        try {
          userExists = await verifyUserExists(userId, {
            maxRetries: 2, // Reduced from 3
            delayMs: 300 * (attempts + 1), // Reduced delays
          });

          if (userExists) {
            logger.info(
              `User verified on attempt ${attempts + 1} in validation endpoint`,
              { userId }
            );
            break;
          }
        } catch (dbError) {
          logger.error("Database error during user verification", {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            userId,
            attempt: attempts + 1,
          });

          // If it's a database configuration error, return error immediately
          if (
            dbError instanceof Error &&
            (dbError.message.includes(
              "Environment variable not found: DATABASE_URL"
            ) ||
              dbError.message.includes("PrismaClientInitializationError"))
          ) {
            return NextResponse.json(
              {
                valid: false,
                reason: "database-error",
                error: dbError.message,
              },
              { status: 500 }
            );
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempts));
        }
      }

      validationResult = userExists
        ? { valid: true, reason: "fresh-auth-verified" }
        : {
            valid: false,
            reason: "user-not-found-extended",
            isRecentAuth: true,
          };
    } else {
      // **PERFORMANCE**: Standard verification with timeout
      try {
        const userExists = await verifyUserExists(userId, {
          maxRetries: 1, // Reduced retries for established sessions
          delayMs: 200,
        });

        validationResult = userExists
          ? { valid: true, reason: "verified" }
          : { valid: false, reason: "user-not-found" };
      } catch (dbError) {
        logger.error("Database error during standard user verification", {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          userId,
        });

        // If it's a database configuration error, return error immediately
        if (
          dbError instanceof Error &&
          (dbError.message.includes(
            "Environment variable not found: DATABASE_URL"
          ) ||
            dbError.message.includes("PrismaClientInitializationError"))
        ) {
          return NextResponse.json(
            {
              valid: false,
              reason: "database-error",
              error: dbError.message,
            },
            { status: 500 }
          );
        }

        // For other database errors, assume invalid
        validationResult = { valid: false, reason: "database-error" };
      }
    }

    // **PERFORMANCE**: Cache the result in distributed cache
    await cache.set(
      cacheKey,
      {
        valid: validationResult.valid,
        reason: validationResult.reason,
        timestamp: Date.now(),
      },
      CACHE_DURATION
    );

    if (!validationResult.valid) {
      logger.warn("Session validation failed", {
        userId,
        reason: validationResult.reason,
      });
    }

    const response = NextResponse.json(validationResult);

    // **PERFORMANCE**: Set cache headers based on result
    if (validationResult.valid) {
      response.headers.set("Cache-Control", "private, max-age=120"); // 2 minutes for valid sessions
    } else {
      response.headers.set("Cache-Control", "private, max-age=30"); // 30 seconds for invalid
    }

    return response;
  } catch (error) {
    logger.error("Error validating session", {
      error: error instanceof Error ? error.message : String(error),
    });

    // FIXED: Return proper error response for database issues
    const isDatabaseError =
      error instanceof Error &&
      (error.message.includes("Environment variable not found: DATABASE_URL") ||
        error.message.includes("PrismaClientInitializationError") ||
        error.message.includes("database"));

    const response = NextResponse.json(
      {
        valid: false,
        reason: isDatabaseError ? "database-error" : "server-error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );

    // **PERFORMANCE**: Don't cache server errors
    response.headers.set("Cache-Control", "no-cache");
    return response;
  }
}
