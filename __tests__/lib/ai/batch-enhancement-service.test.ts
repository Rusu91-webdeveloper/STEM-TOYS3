/**
 * Batch Enhancement Service Tests
 * Unit tests for batch AI enhancement processing
 */

import { BatchEnhancementService } from "@/lib/ai/batch-enhancement-service";
import { ProductEnhancementService } from "@/lib/ai/product-enhancement-service";
import { AIConfig } from "@/lib/ai/config";
import {
  BasicProduct,
  EnhancementOptions,
  EnhancementProgress,
} from "@/lib/ai/types";

// Mock the ProductEnhancementService
jest.mock("@/lib/ai/product-enhancement-service", () => ({
  ProductEnhancementService: jest.fn().mockImplementation(() => ({
    enhanceProduct: jest.fn(),
  })),
}));

// Mock the AI config
jest.mock("@/lib/ai/config", () => ({
  AIConfig: {
    isEnhancementEnabled: jest.fn(() => true),
    isConfigured: jest.fn(() => true),
  },
}));

describe("BatchEnhancementService", () => {
  let service: BatchEnhancementService;
  let mockEnhancementService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BatchEnhancementService();

    // Get the mocked enhancement service
    const {
      ProductEnhancementService,
    } = require("@/lib/ai/product-enhancement-service");
    mockEnhancementService = new ProductEnhancementService();
  });

  describe("enhanceProductsBatch", () => {
    const mockProducts: BasicProduct[] = [
      {
        name: "Test Robot Kit 1",
        price: 299.99,
        category: "Robotics",
        description: "A basic robotics kit for learning programming",
      },
      {
        name: "Test Puzzle Set 2",
        price: 149.99,
        category: "Puzzles",
        description: "Educational puzzle set for problem solving",
      },
      {
        name: "Test Construction Set 3",
        price: 199.99,
        category: "Construction",
        description: "Building blocks for creativity",
      },
    ];

    const mockEnhancedProduct = {
      name: "Test Robot Kit 1",
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
    };

    beforeEach(() => {
      mockEnhancementService.enhanceProduct.mockResolvedValue(
        mockEnhancedProduct
      );
    });

    it("should enhance multiple products successfully", async () => {
      const result = await service.enhanceProductsBatch(mockProducts);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.successRate).toBe(100);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it("should handle partial failures", async () => {
      mockEnhancementService.enhanceProduct
        .mockResolvedValueOnce(mockEnhancedProduct)
        .mockRejectedValueOnce(new Error("Enhancement failed"))
        .mockResolvedValueOnce(mockEnhancedProduct);

      const result = await service.enhanceProductsBatch(mockProducts);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.successRate).toBeCloseTo(66.67, 1);
      expect(result.results.filter(r => r.success)).toHaveLength(2);
      expect(result.results.filter(r => !r.success)).toHaveLength(1);
    });

    it("should call progress callback with correct data", async () => {
      const progressCallback = jest.fn();

      await service.enhanceProductsBatch(
        mockProducts,
        undefined,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
      const lastCall =
        progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
      expect(lastCall.total).toBe(3);
      expect(lastCall.processed).toBe(3);
      expect(lastCall.successful).toBe(3);
      expect(lastCall.failed).toBe(0);
    });

    it("should throw error when AI enhancement is disabled", async () => {
      (AIConfig.isEnhancementEnabled as jest.Mock).mockReturnValue(false);

      await expect(service.enhanceProductsBatch(mockProducts)).rejects.toThrow(
        "AI enhancement is disabled"
      );
    });

    it("should process products in batches with custom settings", async () => {
      const result = await service.enhanceProductsWithCustomSettings(
        mockProducts,
        2, // batch size
        500, // delay
        undefined,
        undefined
      );

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
    });

    it("should retry failed products", async () => {
      mockEnhancementService.enhanceProduct
        .mockRejectedValueOnce(new Error("First attempt failed"))
        .mockResolvedValueOnce(mockEnhancedProduct)
        .mockResolvedValueOnce(mockEnhancedProduct)
        .mockResolvedValueOnce(mockEnhancedProduct); // Retry success

      const result = await service.enhanceProductsWithRetry(mockProducts, 1);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
    });

    it("should return processing statistics", () => {
      const stats = service.getProcessingStats();

      expect(stats).toMatchObject({
        defaultBatchSize: expect.any(Number),
        defaultDelayMs: expect.any(Number),
        estimatedTimePerProduct: expect.any(Number),
      });
    });
  });

  describe("testBatchEnhancement", () => {
    it("should return true when batch enhancement test passes", async () => {
      mockEnhancementService.enhanceProduct.mockResolvedValue({
        name: "Test Robot Kit 1",
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
      });

      const result = await service.testBatchEnhancement();

      expect(result).toBe(true);
    });

    it("should return false when batch enhancement test fails", async () => {
      mockEnhancementService.enhanceProduct.mockRejectedValue(
        new Error("Test failed")
      );

      const result = await service.testBatchEnhancement();

      expect(result).toBe(false);
    });
  });
});
