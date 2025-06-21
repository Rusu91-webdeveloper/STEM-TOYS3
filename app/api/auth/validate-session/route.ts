import { auth } from "@/lib/auth";
import { verifyUserExists } from "@/lib/db-helpers";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

// **PERFORMANCE**: In-memory cache for validation results
const validationCache = new Map<
  string,
  { valid: boolean; timestamp: number; reason?: string }
>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
const MAX_CACHE_SIZE = 1000; // Prevent memory leaks

/**
 * **OPTIMIZED** API route to validate a user's session against the database
 * Now includes caching and performance optimizations
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();

    // If no session, return false immediately
    if (!session || !session.user || !session.user.id) {
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

    // **PERFORMANCE**: Check cache first
    const cached = validationCache.get(userId);
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

    // **PERFORMANCE**: Clean up cache if it gets too large
    if (validationCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(validationCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      // Remove oldest 25% of entries
      const toRemove = entries.slice(0, Math.floor(entries.length * 0.25));
      toRemove.forEach(([key]) => validationCache.delete(key));
    }

    // Special handling for environment-based admin accounts
    if (userId === "admin_env" && process.env.ADMIN_EMAIL) {
      logger.info("Session validated for environment admin user", { userId });
      const result = { valid: true, reason: "admin-env" };
      validationCache.set(userId, { ...result, timestamp: Date.now() });

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

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 200 * attempts));
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
      const userExists = await verifyUserExists(userId, {
        maxRetries: 1, // Reduced retries for established sessions
        delayMs: 200,
      });

      validationResult = userExists
        ? { valid: true, reason: "verified" }
        : { valid: false, reason: "user-not-found" };
    }

    // **PERFORMANCE**: Cache the result
    validationCache.set(userId, {
      valid: validationResult.valid,
      reason: validationResult.reason,
      timestamp: Date.now(),
    });

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

    const response = NextResponse.json({
      valid: false,
      reason: "server-error",
    });

    // **PERFORMANCE**: Don't cache server errors
    response.headers.set("Cache-Control", "no-cache");
    return response;
  }
}
