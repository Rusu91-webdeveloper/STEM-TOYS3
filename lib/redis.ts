import { Redis } from "@upstash/redis";

// Get Redis timeout from environment variables with a default of 2 seconds
const REDIS_TIMEOUT = parseInt(process.env.REDIS_TIMEOUT ?? "2000", 10);

// Create Redis client with connection info from environment variables
export const redis = new Redis({
  url: process.env.REDIS_URL ?? "",
  token: process.env.REDIS_TOKEN ?? "",
  automaticDeserialization: true,
});

// Check if Redis is configured
export const isRedisConfigured = !!(
  process.env.REDIS_URL && process.env.REDIS_TOKEN
);

// Use a memory fallback when Redis is not available
const memoryCache = new Map<string, { value: string; expiry: number }>();

/**
 * Execute a Redis operation with a timeout to prevent hanging in case of Redis issues
 * @param operation The async Redis operation to execute
 * @param fallbackFn Function to call if the operation times out or fails
 * @returns Result of the operation or fallback
 */
async function withTimeout<T>(
  operation: Promise<T>,
  fallbackFn: () => T
): Promise<T> {
  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Redis operation timed out after ${REDIS_TIMEOUT}ms`));
      }, REDIS_TIMEOUT);
    });

    // Race the operation against the timeout
    return await Promise.race([operation, timeoutPromise]);
  } catch (error) {
    console.error("Redis operation failed or timed out:", error);
    // Execute fallback function if operation fails or times out
    return fallbackFn();
  }
}

// Helper functions for cart caching
export async function getCartFromCache(userId: string): Promise<string | null> {
  try {
    if (!isRedisConfigured) {
      // Redis not configured, using memory cache fallback
      // Use memory cache fallback
      const item = memoryCache.get(`cart:${userId}`);
      if (item && item.expiry > Date.now()) {
        return item.value;
      }
      return null;
    }

    // Use Redis with timeout
    return await withTimeout<string | null>(redis.get(`cart:${userId}`), () => {
      // Redis timeout, falling back to memory cache
      // Fallback to memory cache on timeout
      const item = memoryCache.get(`cart:${userId}`);
      return item && item.expiry > Date.now() ? item.value : null;
    });
  } catch (error) {
    console.error("Redis get error, using memory fallback:", error);
    // Fallback to memory cache on Redis error
    const item = memoryCache.get(`cart:${userId}`);
    return item && item.expiry > Date.now() ? item.value : null;
  }
}

export async function setCartInCache(
  userId: string,
  cart: unknown,
  expirationSeconds = 600
): Promise<boolean> {
  const cartString = JSON.stringify(cart);

  try {
    if (!isRedisConfigured) {
      // Redis not configured, using memory cache for cart storage
      // Use memory cache fallback
      memoryCache.set(`cart:${userId}`, {
        value: cartString,
        expiry: Date.now() + expirationSeconds * 1000,
      });
      return true;
    }

    // Use Redis with timeout
    return await withTimeout<boolean>(
      redis
        .set(`cart:${userId}`, cartString, {
          ex: expirationSeconds,
        })
        .then(() => true),
      () => {
        // Redis set timeout, falling back to memory cache
        // Fallback to memory cache on timeout
        memoryCache.set(`cart:${userId}`, {
          value: cartString,
          expiry: Date.now() + expirationSeconds * 1000,
        });
        return true; // Return true since we successfully used fallback
      }
    );
  } catch (error) {
    console.error("Redis set error, using memory fallback:", error);
    // Fallback to memory cache on Redis error
    memoryCache.set(`cart:${userId}`, {
      value: cartString,
      expiry: Date.now() + expirationSeconds * 1000,
    });
    return true; // Return true since we successfully used fallback
  }
}

export async function invalidateCartCache(userId: string): Promise<boolean> {
  try {
    if (!isRedisConfigured) {
      // Redis not configured, clearing memory cache
      // Use memory cache fallback
      memoryCache.delete(`cart:${userId}`);
      return true;
    }

    // Use Redis with timeout
    return await withTimeout<boolean>(
      redis.del(`cart:${userId}`).then(count => count > 0),
      () => {
        // Redis delete timeout, clearing memory cache
        // Fallback to memory cache on timeout
        memoryCache.delete(`cart:${userId}`);
        return true; // Return true since we successfully used fallback
      }
    );
  } catch (error) {
    console.error("Redis del error, clearing memory fallback:", error);
    // Fallback to memory cache on Redis error
    memoryCache.delete(`cart:${userId}`);
    return true; // Return true since we successfully used fallback
  }
}
