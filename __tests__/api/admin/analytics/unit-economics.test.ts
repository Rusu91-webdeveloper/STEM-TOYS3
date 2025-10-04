import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/admin/analytics/unit-economics/route";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/cache", () => ({
  getCached: jest.fn(),
  invalidateCachePattern: jest.fn(),
  CacheKeys: {
    analytics: jest.fn((key: string) => `analytics:${key}`),
  },
}));

jest.mock("@/lib/utils/unit-economics", () => ({
  fetchAllProductsProfitability: jest.fn(),
  generateUnitEconomicsSummary: jest.fn(),
  fetchProductProfitability: jest.fn(),
}));

jest.mock("@/lib/validations/unit-economics", () => ({
  validateUnitEconomicsRequest: jest.fn((data: any) => data),
  validateUnitEconomicsSummary: jest.fn((data: any) => data),
  validateProductProfitability: jest.fn((data: any) => data),
}));

import { auth } from "@/lib/auth";
import { getCached } from "@/lib/cache";
import {
  fetchAllProductsProfitability,
  generateUnitEconomicsSummary,
  fetchProductProfitability,
} from "@/lib/utils/unit-economics";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetCached = getCached as jest.MockedFunction<typeof getCached>;
const mockFetchAllProductsProfitability =
  fetchAllProductsProfitability as jest.MockedFunction<
    typeof fetchAllProductsProfitability
  >;
const mockGenerateUnitEconomicsSummary =
  generateUnitEconomicsSummary as jest.MockedFunction<
    typeof generateUnitEconomicsSummary
  >;
const mockFetchProductProfitability =
  fetchProductProfitability as jest.MockedFunction<
    typeof fetchProductProfitability
  >;

describe("/api/admin/analytics/unit-economics", () => {
  const mockAdminUser = {
    id: "admin_123",
    email: "admin@test.com",
    role: "ADMIN" as const,
  };

  const mockCustomerUser = {
    id: "customer_123",
    email: "customer@test.com",
    role: "CUSTOMER" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/analytics/unit-economics", () => {
    it("should return 403 for unauthenticated user", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Not authorized");
    });

    it("should return 403 for non-admin user", async () => {
      mockAuth.mockResolvedValue({
        user: mockCustomerUser,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Not authorized");
    });

    it("should return unit economics summary for admin user", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const mockSummary = {
        totalProducts: 10,
        profitableProducts: 8,
        unprofitableProducts: 2,
        totalMonthlyRevenue: 10000,
        totalMonthlyCosts: 7000,
        totalMonthlyProfit: 3000,
        overallProfitMargin: 30,
        averageOrderValue: 150,
        averageCustomerAcquisitionCost: 25,
        averageLifetimeValue: 125,
        averageLtvToCacRatio: 5,
        productsToDiscontinue: ["prod_1"],
      };

      const mockProducts = [
        {
          productId: "prod_1",
          name: "Product 1",
          sellingPrice: 100,
          profitMargin: 20,
          isProfitable: true,
          riskLevel: "LOW" as const,
        },
      ];

      mockGetCached.mockResolvedValue({
        type: "summary",
        data: {
          summary: mockSummary,
          products: mockProducts,
        },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.type).toBe("summary");
      expect(data.data.summary).toEqual(mockSummary);
      expect(data.data.products).toEqual(mockProducts);
    });

    it("should return single product data when productId is provided", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const mockProduct = {
        productId: "prod_123",
        name: "Test Product",
        sellingPrice: 100,
        profitMargin: 25,
        isProfitable: true,
        riskLevel: "LOW" as const,
      };

      mockGetCached.mockResolvedValue({
        type: "product",
        data: mockProduct,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics?productId=prod_123"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.type).toBe("product");
      expect(data.data).toEqual(mockProduct);
    });

    it("should handle cache miss and fetch from database", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const mockSummary = {
        totalProducts: 5,
        profitableProducts: 4,
        unprofitableProducts: 1,
        totalMonthlyRevenue: 5000,
        totalMonthlyCosts: 3500,
        totalMonthlyProfit: 1500,
        overallProfitMargin: 30,
        averageOrderValue: 100,
        averageCustomerAcquisitionCost: 20,
        averageLifetimeValue: 80,
        averageLtvToCacRatio: 4,
        productsToDiscontinue: [],
      };

      const mockProducts = [];

      mockGetCached.mockResolvedValue(null);
      mockGenerateUnitEconomicsSummary.mockResolvedValue(mockSummary);
      mockFetchAllProductsProfitability.mockResolvedValue(mockProducts);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockGenerateUnitEconomicsSummary).toHaveBeenCalled();
      expect(mockFetchAllProductsProfitability).toHaveBeenCalled();
    });

    it("should handle product not found error", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      mockGetCached.mockRejectedValue(new Error("Product not found"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics?productId=nonexistent"
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Product not found");
    });

    it("should handle validation errors", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      mockGetCached.mockRejectedValue(new Error("Invalid request parameters"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics?timeRange=invalid"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request parameters");
    });

    it("should handle server errors", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      mockGetCached.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics"
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch unit economics data");
    });
  });

  describe("POST /api/admin/analytics/unit-economics", () => {
    it("should return 403 for unauthenticated user", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics",
        {
          method: "POST",
          body: JSON.stringify({ timeRange: "30d", reportType: "summary" }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Not authorized");
    });

    it("should generate summary report", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const mockReport = {
        totalProducts: 10,
        profitableProducts: 8,
        totalMonthlyRevenue: 10000,
      };

      mockGenerateUnitEconomicsSummary.mockResolvedValue(mockReport);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics",
        {
          method: "POST",
          body: JSON.stringify({ timeRange: "30d", reportType: "summary" }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.reportType).toBe("summary");
      expect(data.report).toEqual(mockReport);
    });

    it("should generate products report", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const mockReport = [
        {
          productId: "prod_1",
          name: "Product 1",
          profitMargin: 25,
        },
      ];

      mockFetchAllProductsProfitability.mockResolvedValue(mockReport);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics",
        {
          method: "POST",
          body: JSON.stringify({ timeRange: "30d", reportType: "products" }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.reportType).toBe("products");
      expect(data.report).toEqual(mockReport);
    });

    it("should handle invalid report type", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics",
        {
          method: "POST",
          body: JSON.stringify({ timeRange: "30d", reportType: "invalid" }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe(
        "Invalid report type. Must be 'summary' or 'products'"
      );
    });

    it("should handle missing report type", async () => {
      mockAuth.mockResolvedValue({
        user: mockAdminUser,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/analytics/unit-economics",
        {
          method: "POST",
          body: JSON.stringify({ timeRange: "30d" }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe(
        "Invalid report type. Must be 'summary' or 'products'"
      );
    });
  });
});
