/**
 * AI Enhancement API Tests
 * Integration tests for AI enhancement API endpoint
 */

import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/admin/products/ai-enhance/route";
import { auth } from "@/lib/auth";
import { AIConfig } from "@/lib/ai/config";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/auth/admin", () => ({
  isAdmin: jest.fn(user => user?.role === "ADMIN"),
}));

jest.mock("@/lib/ai/config", () => ({
  AIConfig: {
    isEnhancementEnabled: jest.fn(() => true),
    isConfigured: jest.fn(() => true),
    getProvider: jest.fn(() => "openai"),
    getModel: jest.fn(() => "gpt-4"),
    validateConfig: jest.fn(() => ({ isValid: true, errors: [] })),
  },
}));

jest.mock("@/lib/ai/batch-enhancement-service", () => ({
  BatchEnhancementService: jest.fn().mockImplementation(() => ({
    enhanceProductsBatch: jest.fn().mockResolvedValue({
      results: [
        {
          success: true,
          enhancedProduct: {
            name: "Test Robot Kit",
            price: 299.99,
            category: "Robotics",
            description: "A basic robotics kit for learning programming",
            enhancedDescription: "Enhanced description",
            metaTitle: "Enhanced title",
            metaDescription: "Enhanced meta description",
            metaKeywords: ["enhanced", "keywords"],
            tags: ["enhanced", "tags"],
            learningOutcomes: ["PROBLEM_SOLVING"],
            romanianCompetencies: ["Programare"],
            romanianCurriculumAlignment: ["Matematica"],
            romanianSubjectAreas: ["Informatica"],
            romanianMinistryApproval: true,
          },
          processingTime: 1000,
        },
      ],
      summary: {
        total: 1,
        successful: 1,
        failed: 0,
        successRate: 100,
        totalProcessingTime: 1000,
        averageProcessingTime: 1000,
      },
      errors: [],
    }),
  })),
}));

describe("/api/admin/products/ai-enhance", () => {
  const mockAdminUser = {
    id: "admin-1",
    email: "admin@test.com",
    role: "ADMIN",
  };

  const mockCustomerUser = {
    id: "customer-1",
    email: "customer@test.com",
    role: "CUSTOMER",
  };

  const mockProducts = [
    {
      name: "Test Robot Kit",
      price: 299.99,
      category: "Robotics",
      description: "A basic robotics kit for learning programming",
    },
  ];

  const mockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe("POST", () => {
    it("should enhance products successfully for admin user", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: mockProducts,
        options: {
          includeRomanianOptimization: true,
          includeSEOMetadata: true,
          includeLearningOutcomes: true,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.enhancedProducts).toHaveLength(1);
      expect(data.summary.total).toBe(1);
      expect(data.summary.successful).toBe(1);
      expect(data.summary.failed).toBe(0);
    });

    it("should return 403 for non-admin user", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockCustomerUser });

      const request = mockRequest({
        products: mockProducts,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });

    it("should return 403 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = mockRequest({
        products: mockProducts,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });

    it("should return 503 when AI enhancement is disabled", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });
      (AIConfig.isEnhancementEnabled as jest.Mock).mockReturnValue(false);

      const request = mockRequest({
        products: mockProducts,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe("AI enhancement disabled");
    });

    it("should return 503 when AI service is not configured", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });
      (AIConfig.isConfigured as jest.Mock).mockReturnValue(false);

      const request = mockRequest({
        products: mockProducts,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe("AI service not configured");
    });

    it("should return 400 for invalid request body", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: [], // Empty products array
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
    });

    it("should return 400 for invalid product data", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: [
          {
            name: "", // Invalid: empty name
            price: -1, // Invalid: negative price
            category: "", // Invalid: empty category
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
    });

    it("should handle batch enhancement errors", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const {
        BatchEnhancementService,
      } = require("@/lib/ai/batch-enhancement-service");
      BatchEnhancementService.mockImplementation(() => ({
        enhanceProductsBatch: jest
          .fn()
          .mockRejectedValue(new Error("Enhancement failed")),
      }));

      const request = mockRequest({
        products: mockProducts,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Enhancement failed");
    });
  });

  describe("GET", () => {
    it("should return AI service status for admin user", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        configured: true,
        enabled: true,
        provider: "openai",
        model: "gpt-4",
        validation: {
          isValid: true,
          errors: [],
        },
      });
    });

    it("should return 403 for non-admin user", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockCustomerUser });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });

    it("should return 403 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });
  });
});
