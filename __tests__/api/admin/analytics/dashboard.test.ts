import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/analytics/dashboard/route";
import { createMocks } from "node-mocks-http";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/cache", () => ({
  getCached: jest.fn(),
  CacheKeys: {
    analytics: jest.fn(() => "analytics:test"),
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      aggregate: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetCached = getCached as jest.MockedFunction<typeof getCached>;
const mockOrderAggregate = db.order.aggregate as jest.MockedFunction<
  typeof db.order.aggregate
>;
const mockUserCount = db.user.count as jest.MockedFunction<
  typeof db.user.count
>;
const mockQueryRaw = db.$queryRaw as jest.MockedFunction<typeof db.$queryRaw>;

describe("/api/admin/analytics/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return analytics data for valid request", async () => {
      // Mock authentication
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      // Mock cache to return analytics data
      const mockAnalyticsData = {
        salesData: {
          daily: 1500,
          weekly: 10500,
          monthly: 42000,
          previousPeriodChange: 12.5,
          trending: "up" as const,
        },
        orderStats: {
          conversionRate: {
            rate: 3.2,
            previousPeriodChange: -0.5,
            trending: "down" as const,
          },
          averageOrderValue: {
            value: 125.99,
            previousPeriodChange: 8.3,
            trending: "up" as const,
          },
          totalCustomers: {
            value: 1250,
            previousPeriodChange: 15.7,
            trending: "up" as const,
          },
        },
        topSellingProducts: [
          {
            name: "STEM Robot Kit",
            price: 89.99,
            sold: 45,
            revenue: 4049.55,
          },
        ],
        salesByCategory: [
          {
            categoryId: "cat_123",
            category: "STEM Toys",
            amount: 12500.99,
            percentage: 35.2,
          },
        ],
        salesChartData: {
          salesData: [
            {
              date: "2024-01-15",
              sales: 1250.99,
            },
          ],
        },
      };

      mockGetCached.mockImplementation(async (key, fetchFn) => {
        return await fetchFn();
      });

      // Mock database queries
      mockOrderAggregate.mockResolvedValue({ _sum: { total: 42000 } });
      mockUserCount.mockResolvedValue(1250);
      mockQueryRaw.mockResolvedValue([]);

      // Create mock request
      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard?period=30",
        nextUrl: {
          searchParams: new URLSearchParams("period=30"),
        } as any,
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toHaveProperty("salesData");
      expect(result).toHaveProperty("orderStats");
      expect(result).toHaveProperty("topSellingProducts");
      expect(result).toHaveProperty("salesByCategory");
      expect(result).toHaveProperty("salesChartData");
    });

    it("should return 403 for unauthorized users", async () => {
      mockAuth.mockResolvedValue(null);

      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard?period=30",
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toBe("Not authorized");
    });

    it("should return 403 for non-admin users", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "CUSTOMER" },
      } as any);

      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard?period=30",
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toBe("Not authorized");
    });

    it("should return 400 for invalid period parameter", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard?period=400",
        nextUrl: {
          searchParams: new URLSearchParams("period=400"),
        } as any,
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Invalid request parameters");
      expect(result.details).toBeDefined();
    });

    it("should use default period of 30 when not provided", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      mockGetCached.mockImplementation(async (key, fetchFn) => {
        return await fetchFn();
      });

      mockOrderAggregate.mockResolvedValue({ _sum: { total: 42000 } });
      mockUserCount.mockResolvedValue(1250);
      mockQueryRaw.mockResolvedValue([]);

      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard",
        nextUrl: {
          searchParams: new URLSearchParams(),
        } as any,
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toHaveProperty("salesData");
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      mockGetCached.mockImplementation(async () => {
        throw new Error("Database connection failed");
      });

      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard?period=30",
        nextUrl: {
          searchParams: new URLSearchParams("period=30"),
        } as any,
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Failed to fetch analytics data");
    });

    it("should validate and return structured analytics data", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      const mockAnalyticsData = {
        salesData: {
          daily: 1500,
          weekly: 10500,
          monthly: 42000,
          previousPeriodChange: 12.5,
          trending: "up" as const,
        },
        orderStats: {
          conversionRate: {
            rate: 3.2,
            previousPeriodChange: -0.5,
            trending: "down" as const,
          },
          averageOrderValue: {
            value: 125.99,
            previousPeriodChange: 8.3,
            trending: "up" as const,
          },
          totalCustomers: {
            value: 1250,
            previousPeriodChange: 15.7,
            trending: "up" as const,
          },
        },
        topSellingProducts: [],
        salesByCategory: [],
        salesChartData: { salesData: [] },
      };

      mockGetCached.mockResolvedValue(mockAnalyticsData);

      const { req } = createMocks<NextRequest>({
        method: "GET",
        url: "http://localhost:3000/api/admin/analytics/dashboard?period=30",
        nextUrl: {
          searchParams: new URLSearchParams("period=30"),
        } as any,
      });

      const response = await GET(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockAnalyticsData);
      expect(result.salesData).toHaveProperty("daily");
      expect(result.salesData).toHaveProperty("weekly");
      expect(result.salesData).toHaveProperty("monthly");
      expect(result.orderStats).toHaveProperty("conversionRate");
      expect(result.orderStats).toHaveProperty("averageOrderValue");
      expect(result.orderStats).toHaveProperty("totalCustomers");
    });
  });
});
