/**
 * Analytics Cache Management
 * Handles cache invalidation for analytics data when related data changes
 */

import { invalidateCachePattern } from "@/lib/cache";

/**
 * Invalidate all analytics caches
 * Should be called when order data changes that affects analytics calculations
 */
export async function invalidateAnalyticsCache(): Promise<void> {
  try {
    // Invalidate all analytics-related cache patterns
    await Promise.all([
      invalidateCachePattern("analytics:*"),
      // Also invalidate dashboard caches that might contain analytics data
      invalidateCachePattern("dashboard:*"),
    ]);

    console.log("✅ Analytics cache invalidated successfully");
  } catch (error) {
    console.error("❌ Error invalidating analytics cache:", error);
    // Don't throw - cache invalidation failures shouldn't break the main operation
  }
}

/**
 * Invalidate analytics cache for specific time periods
 * Useful for more targeted cache invalidation
 */
export async function invalidateAnalyticsCacheForPeriods(
  periods: number[]
): Promise<void> {
  try {
    const patterns = periods.map(period => `analytics:admin:${period}`);
    await Promise.all(patterns.map(pattern => invalidateCachePattern(pattern)));

    console.log(
      `✅ Analytics cache invalidated for periods: ${periods.join(", ")}`
    );
  } catch (error) {
    console.error("❌ Error invalidating analytics cache for periods:", error);
  }
}

/**
 * Invalidate analytics cache for page-level caches
 * Useful when page-level analytics need to be refreshed
 */
export async function invalidateAnalyticsPageCache(): Promise<void> {
  try {
    await invalidateCachePattern("analytics:page:*");
    console.log("✅ Analytics page cache invalidated successfully");
  } catch (error) {
    console.error("❌ Error invalidating analytics page cache:", error);
  }
}

/**
 * Invalidate analytics cache when orders are modified
 * This is the most common case - when order status, creation, or updates occur
 */
export async function invalidateAnalyticsOnOrderChange(): Promise<void> {
  try {
    // Invalidate all analytics caches since order changes affect all time periods
    await invalidateAnalyticsCache();

    // Also invalidate related caches
    await Promise.all([
      invalidateCachePattern("orders:*"),
      invalidateCachePattern("dashboard:*"),
    ]);

    console.log("✅ Analytics cache invalidated due to order changes");
  } catch (error) {
    console.error(
      "❌ Error invalidating analytics cache on order change:",
      error
    );
  }
}

/**
 * Invalidate analytics cache when products are modified
 * Affects top-selling products and category sales
 */
export async function invalidateAnalyticsOnProductChange(): Promise<void> {
  try {
    await invalidateAnalyticsCache();
    await invalidateCachePattern("products:*");

    console.log("✅ Analytics cache invalidated due to product changes");
  } catch (error) {
    console.error(
      "❌ Error invalidating analytics cache on product change:",
      error
    );
  }
}

/**
 * Invalidate analytics cache when users/customers are modified
 * Affects customer analytics
 */
export async function invalidateAnalyticsOnUserChange(): Promise<void> {
  try {
    await invalidateAnalyticsCache();
    await invalidateCachePattern("users:*");
    await invalidateCachePattern("customers:*");

    console.log("✅ Analytics cache invalidated due to user changes");
  } catch (error) {
    console.error(
      "❌ Error invalidating analytics cache on user change:",
      error
    );
  }
}
