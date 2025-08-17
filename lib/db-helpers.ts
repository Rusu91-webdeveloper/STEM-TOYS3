import { db } from "./db";
import { logger } from "./logger";

/**
 * Utility function to perform database operations with retries
 * Useful for handling transient database connectivity issues
 *
 * @param operation The database operation function to execute
 * @param options Configuration options for retries
 * @returns The result of the database operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    name: string;
    maxRetries?: number;
    delayMs?: number;
    logParams?: Record<string, any>;
  }
): Promise<T> {
  const { name, maxRetries = 3, delayMs = 500, logParams = {} } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try the operation
      const result = await operation();

      // If not the first attempt, log the successful retry
      if (attempt > 0) {
        logger.info(`${name} succeeded on retry ${attempt}`, logParams);
      }

      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`${name} failed on attempt ${attempt + 1}/${maxRetries}`, {
        ...logParams,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // If we get here, all attempts failed
  logger.error(`${name} failed after ${maxRetries} attempts`, {
    ...logParams,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError;
}

/**
 * Find a user by ID with retry logic to handle transient database issues
 *
 * @param userId The user ID to find
 * @param options Additional options for the retry logic
 * @returns The user or null if not found
 */
export async function findUserWithRetry(
  userId: string,
  options: {
    maxRetries?: number;
    delayMs?: number;
    select?: Record<string, boolean>;
  } = {}
) {
  const { maxRetries = 3, delayMs = 500, select = { id: true } } = options;

  try {
    return await withRetry(
      () =>
        db.user.findUnique({
          where: { id: userId },
          select,
        }),
      {
        name: "findUserWithRetry",
        maxRetries,
        delayMs,
        logParams: { userId },
      }
    );
  } catch (error) {
    logger.error("Error in findUserWithRetry", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Verify that a user exists in the database with multiple retries
 *
 * @param userId The user ID to check
 * @param options Additional options for verification
 * @returns True if the user exists, false otherwise
 */
export async function verifyUserExists(
  userId: string,
  options: {
    maxRetries?: number;
    delayMs?: number;
  } = {}
): Promise<boolean> {
  const { maxRetries = 3, delayMs = 500 } = options;

  try {
    const user = await findUserWithRetry(userId, { maxRetries, delayMs });
    return Boolean(user);
  } catch (error) {
    logger.error("Error verifying user existence", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
