/**
 * AI Bulk Upload Integration Tests
 * End-to-end tests for AI-enhanced bulk upload functionality
 */

import { NextRequest } from "next/server";
import { POST as bulkUploadPOST } from "@/app/api/admin/products/bulk-upload/route";
import { POST as aiEnhancePOST } from "@/app/api/admin/products/ai-enhance/route";
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

jest.mock("@/lib/db", () => ({
  db: {
    category: {
      findFirst: jest.fn().mockResolvedValue({
        id: "category-1",
        name: "Robotics",
        slug: "robotics",
      }),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: "product-1",
        name: "Test Robot Kit",
        slug: "test-robot-kit",
      }),
    },
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
            enhancedDescription:
              "An advanced robotics kit designed to teach children programming fundamentals through hands-on building and coding activities. Perfect for STEM education and developing problem-solving skills.",
            metaTitle: "Test Robot Kit - Learn Programming with Robotics",
            metaDescription:
              "Advanced robotics kit for children to learn programming through hands-on activities. Perfect for STEM education.",
            metaKeywords: [
              "robotics",
              "programming",
              "STEM",
              "educational",
              "coding",
            ],
            tags: ["robotics", "programming", "STEM", "educational"],
            ageGroup: "ELEMENTARY_6_8",
            stemDiscipline: "TECHNOLOGY",
            productType: "ROBOTICS",
            learningOutcomes: ["PROBLEM_SOLVING", "LOGIC", "CRITICAL_THINKING"],
            romanianCompetencies: [
              "Programare",
              "Logica",
              "Rezolvare probleme",
            ],
            romanianCurriculumAlignment: ["Matematica", "Informatica"],
            romanianEducationalLevel: "PRIMAR",
            romanianSubjectAreas: ["Matematica", "Informatica", "Tehnologie"],
            romanianMinistryApproval: true,
            romanianEducationalCertification: "Certificat MECTS",
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

describe("AI Bulk Upload Integration", () => {
  const mockAdminUser = {
    id: "admin-1",
    email: "admin@test.com",
    role: "ADMIN",
  };

  const mockProducts = [
    {
      name: "Test Robot Kit",
      description: "A basic robotics kit for learning programming",
      price: 299.99,
      category: "Robotics",
      stockQuantity: 50,
      tags: ["robotics", "programming"],
      isActive: true,
      featured: false,
    },
  ];

  const mockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AI Enhancement API", () => {
    it("should enhance products successfully", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: mockProducts,
        options: {
          includeRomanianOptimization: true,
          includeSEOMetadata: true,
          includeLearningOutcomes: true,
        },
      });

      const response = await aiEnhancePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.enhancedProducts).toHaveLength(1);
      expect(data.enhancedProducts[0]).toMatchObject({
        name: "Test Robot Kit",
        enhancedDescription: expect.stringContaining("advanced robotics kit"),
        metaTitle: expect.stringContaining("Test Robot Kit"),
        ageGroup: "ELEMENTARY_6_8",
        stemDiscipline: "TECHNOLOGY",
        productType: "ROBOTICS",
        learningOutcomes: expect.arrayContaining(["PROBLEM_SOLVING"]),
        romanianCompetencies: expect.arrayContaining(["Programare"]),
        romanianMinistryApproval: true,
      });
    });
  });

  describe("Enhanced Bulk Upload API", () => {
    it("should upload products with AI enhancement", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: mockProducts,
        aiEnhancement: {
          enabled: true,
          options: {
            includeRomanianOptimization: true,
            includeSEOMetadata: true,
            includeLearningOutcomes: true,
            includeAgeGroup: true,
            includeStemDiscipline: true,
            includeProductType: true,
          },
        },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(1);
      expect(data.failed).toBe(0);
      expect(data.aiEnhancement).toMatchObject({
        enabled: true,
        summary: {
          total: 1,
          successful: 1,
          failed: 0,
          successRate: "100.0%",
        },
      });
    });

    it("should upload products without AI enhancement when disabled", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: mockProducts,
        aiEnhancement: {
          enabled: false,
        },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(1);
      expect(data.failed).toBe(0);
      expect(data.aiEnhancement).toMatchObject({
        enabled: false,
        reason: "AI enhancement not requested",
      });
    });

    it("should handle AI enhancement failure gracefully", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const {
        BatchEnhancementService,
      } = require("@/lib/ai/batch-enhancement-service");
      BatchEnhancementService.mockImplementation(() => ({
        enhanceProductsBatch: jest
          .fn()
          .mockRejectedValue(new Error("AI service unavailable")),
      }));

      const request = mockRequest({
        products: mockProducts,
        aiEnhancement: {
          enabled: true,
          options: {
            includeRomanianOptimization: true,
          },
        },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(1);
      expect(data.failed).toBe(0);
      expect(data.aiEnhancement).toMatchObject({
        enabled: false,
        reason: "AI enhancement failed or not configured",
      });
    });

    it("should merge AI-enhanced data with original products", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: [
          {
            name: "Test Robot Kit",
            description: "A basic robotics kit for learning programming",
            price: 299.99,
            category: "Robotics",
            stockQuantity: 50,
            tags: ["robotics", "programming"],
            isActive: true,
            featured: false,
            // Original Romanian fields
            romanianCompetencies: ["Original competency"],
            romanianMinistryApproval: false,
          },
        ],
        aiEnhancement: {
          enabled: true,
          options: {
            includeRomanianOptimization: true,
            includeSEOMetadata: true,
          },
        },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(1);
      expect(data.aiEnhancement.enabled).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = mockRequest({
        products: mockProducts,
        aiEnhancement: { enabled: true },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });

    it("should handle validation errors", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const request = mockRequest({
        products: [
          {
            name: "", // Invalid: empty name
            description: "Short", // Invalid: too short
            price: -1, // Invalid: negative price
            category: "", // Invalid: empty category
            stockQuantity: 50,
            isActive: true,
            featured: false,
          },
        ],
        aiEnhancement: { enabled: true },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
    });

    it("should handle AI service configuration errors", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });
      (AIConfig.isConfigured as jest.Mock).mockReturnValue(false);

      const request = mockRequest({
        products: mockProducts,
        aiEnhancement: { enabled: true },
      });

      const response = await bulkUploadPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Should still work without AI
      expect(data.aiEnhancement.enabled).toBe(false);
    });
  });

  describe("Performance", () => {
    it("should process multiple products efficiently", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const multipleProducts = Array.from({ length: 10 }, (_, i) => ({
        name: `Test Robot Kit ${i + 1}`,
        description: "A basic robotics kit for learning programming",
        price: 299.99,
        category: "Robotics",
        stockQuantity: 50,
        tags: ["robotics", "programming"],
        isActive: true,
        featured: false,
      }));

      const request = mockRequest({
        products: multipleProducts,
        aiEnhancement: {
          enabled: true,
          options: {
            includeRomanianOptimization: true,
            includeSEOMetadata: true,
          },
        },
      });

      const startTime = Date.now();
      const response = await bulkUploadPOST(request);
      const endTime = Date.now();

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(10);
      expect(data.failed).toBe(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
