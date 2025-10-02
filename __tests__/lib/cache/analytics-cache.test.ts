import {
  invalidateAnalyticsCache,
  invalidateAnalyticsCacheForPeriods,
  invalidateAnalyticsPageCache,
  invalidateAnalyticsOnOrderChange,
  invalidateAnalyticsOnProductChange,
  invalidateAnalyticsOnUserChange,
} from "@/lib/cache/analytics-cache";

// Mock the cache module
jest.mock("@/lib/cache", () => ({
  invalidateCachePattern: jest.fn(),
}));

import { invalidateCachePattern } from "@/lib/cache";

const mockInvalidateCachePattern =
  invalidateCachePattern as jest.MockedFunction<typeof invalidateCachePattern>;

describe("Analytics Cache Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("invalidateAnalyticsCache", () => {
    it("should invalidate all analytics-related cache patterns", async () => {
      mockInvalidateCachePattern.mockResolvedValue();

      await invalidateAnalyticsCache();

      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("analytics:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("dashboard:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(2);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Cache error"));

      // Should not throw despite the error
      await expect(invalidateAnalyticsCache()).resolves.not.toThrow();
    });
  });

  describe("invalidateAnalyticsCacheForPeriods", () => {
    it("should invalidate cache for specific periods", async () => {
      mockInvalidateCachePattern.mockResolvedValue();

      await invalidateAnalyticsCacheForPeriods([7, 30, 90]);

      expect(mockInvalidateCachePattern).toHaveBeenCalledWith(
        "analytics:admin:7"
      );
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith(
        "analytics:admin:30"
      );
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith(
        "analytics:admin:90"
      );
      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(3);
    });

    it("should handle empty periods array", async () => {
      await invalidateAnalyticsCacheForPeriods([]);

      expect(mockInvalidateCachePattern).not.toHaveBeenCalled();
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Cache error"));

      await expect(
        invalidateAnalyticsCacheForPeriods([30])
      ).resolves.not.toThrow();
    });
  });

  describe("invalidateAnalyticsPageCache", () => {
    it("should invalidate page-level analytics cache", async () => {
      mockInvalidateCachePattern.mockResolvedValue();

      await invalidateAnalyticsPageCache();

      expect(mockInvalidateCachePattern).toHaveBeenCalledWith(
        "analytics:page:*"
      );
      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(1);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Cache error"));

      await expect(invalidateAnalyticsPageCache()).resolves.not.toThrow();
    });
  });

  describe("invalidateAnalyticsOnOrderChange", () => {
    it("should invalidate all relevant caches when orders change", async () => {
      mockInvalidateCachePattern.mockResolvedValue();

      await invalidateAnalyticsOnOrderChange();

      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("analytics:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("dashboard:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("orders:*");
      // Note: This calls invalidateAnalyticsCache internally which calls 2 more patterns
      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(5);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Cache error"));

      await expect(invalidateAnalyticsOnOrderChange()).resolves.not.toThrow();
    });
  });

  describe("invalidateAnalyticsOnProductChange", () => {
    it("should invalidate analytics and product caches when products change", async () => {
      mockInvalidateCachePattern.mockResolvedValue();

      await invalidateAnalyticsOnProductChange();

      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("analytics:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("products:*");
      // Note: This calls invalidateAnalyticsCache internally which calls 2 more patterns
      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(4);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Cache error"));

      await expect(invalidateAnalyticsOnProductChange()).resolves.not.toThrow();
    });
  });

  describe("invalidateAnalyticsOnUserChange", () => {
    it("should invalidate analytics and user caches when users change", async () => {
      mockInvalidateCachePattern.mockResolvedValue();

      await invalidateAnalyticsOnUserChange();

      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("analytics:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("users:*");
      expect(mockInvalidateCachePattern).toHaveBeenCalledWith("customers:*");
      // Note: This calls invalidateAnalyticsCache internally which calls 2 more patterns
      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(5);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Cache error"));

      await expect(invalidateAnalyticsOnUserChange()).resolves.not.toThrow();
    });
  });

  describe("Error handling across all functions", () => {
    it("should not throw errors when cache operations fail", async () => {
      mockInvalidateCachePattern.mockRejectedValue(new Error("Network error"));

      await expect(invalidateAnalyticsCache()).resolves.not.toThrow();
      await expect(
        invalidateAnalyticsCacheForPeriods([30])
      ).resolves.not.toThrow();
      await expect(invalidateAnalyticsPageCache()).resolves.not.toThrow();
      await expect(invalidateAnalyticsOnOrderChange()).resolves.not.toThrow();
      await expect(invalidateAnalyticsOnProductChange()).resolves.not.toThrow();
      await expect(invalidateAnalyticsOnUserChange()).resolves.not.toThrow();
    });

    it("should continue execution even when some cache invalidations fail", async () => {
      mockInvalidateCachePattern
        .mockResolvedValueOnce() // analytics:* succeeds
        .mockRejectedValueOnce(new Error("Second call fails")) // dashboard:* fails
        .mockResolvedValueOnce() // orders:* succeeds
        .mockResolvedValueOnce() // analytics:* (from invalidateAnalyticsCache) succeeds
        .mockResolvedValueOnce(); // dashboard:* (from invalidateAnalyticsCache) succeeds

      await expect(invalidateAnalyticsOnOrderChange()).resolves.not.toThrow();

      expect(mockInvalidateCachePattern).toHaveBeenCalledTimes(5);
    });
  });
});
