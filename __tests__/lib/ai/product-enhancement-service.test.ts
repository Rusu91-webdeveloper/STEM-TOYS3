/**
 * Product Enhancement Service Tests
 * Unit tests for AI-powered product enhancement
 */

import { ProductEnhancementService } from "@/lib/ai/product-enhancement-service";
import { AIConfig } from "@/lib/ai/config";
import { BasicProduct, EnhancementOptions } from "@/lib/ai/types";

// Mock the AI service factory
jest.mock("@/lib/ai/ai-service-factory", () => ({
  AIServiceFactory: {
    getDefaultService: jest.fn(() => ({
      generateWithSystemPrompt: jest.fn(),
      testConnection: jest.fn(() => Promise.resolve(true)),
    })),
  },
}));

// Mock the cache
jest.mock("@/lib/cache", () => ({
  cache: {
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve()),
  },
}));

// Mock the AI config
jest.mock("@/lib/ai/config", () => ({
  AIConfig: {
    isEnhancementEnabled: jest.fn(() => true),
    isConfigured: jest.fn(() => true),
  },
}));

describe("ProductEnhancementService", () => {
  let service: ProductEnhancementService;
  let mockAIService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductEnhancementService();

    // Get the mocked AI service
    const { AIServiceFactory } = require("@/lib/ai/ai-service-factory");
    mockAIService = AIServiceFactory.getDefaultService();
  });

  describe("enhanceProduct", () => {
    const mockProduct: BasicProduct = {
      name: "Test Robot Kit",
      price: 299.99,
      category: "Robotics",
      description: "A basic robotics kit for learning programming",
    };

    const mockEnhancedDescription =
      "An advanced robotics kit designed to teach children programming fundamentals through hands-on building and coding activities. Perfect for STEM education and developing problem-solving skills.";

    const mockSEOMetadata = {
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
    };

    beforeEach(() => {
      // Mock AI service responses
      mockAIService.generateWithSystemPrompt.mockResolvedValueOnce(
        mockEnhancedDescription
      ).mockResolvedValueOnce(`
          Meta Title: ${mockSEOMetadata.metaTitle}
          Meta Description: ${mockSEOMetadata.metaDescription}
          Keywords: ${mockSEOMetadata.metaKeywords.join(", ")}
        `).mockResolvedValueOnce(`
          Age Group: ELEMENTARY_6_8
          STEM Discipline: TECHNOLOGY
          Product Type: ROBOTICS
        `).mockResolvedValueOnce(`
          PROBLEM_SOLVING
          LOGIC
          CRITICAL_THINKING
        `).mockResolvedValueOnce(`
          Romanian Competencies: Programare, Logica, Rezolvare probleme
          Curriculum Alignment: Matematica, Informatica
          Educational Level: PRIMAR
          Subject Areas: Matematica, Informatica, Tehnologie
          Ministry Approval: true
        `);
    });

    it("should enhance a product with all options enabled", async () => {
      const options: EnhancementOptions = {
        includeRomanianOptimization: true,
        includeSEOMetadata: true,
        includeLearningOutcomes: true,
        includeAgeGroup: true,
        includeStemDiscipline: true,
        includeProductType: true,
      };

      const result = await service.enhanceProduct(mockProduct, options);

      expect(result).toMatchObject({
        name: mockProduct.name,
        price: mockProduct.price,
        category: mockProduct.category,
        enhancedDescription: mockEnhancedDescription,
        metaTitle: mockSEOMetadata.metaTitle,
        metaDescription: mockSEOMetadata.metaDescription,
        metaKeywords: mockSEOMetadata.metaKeywords,
        ageGroup: "ELEMENTARY_6_8",
        stemDiscipline: "TECHNOLOGY",
        productType: "ROBOTICS",
        learningOutcomes: ["PROBLEM_SOLVING", "LOGIC", "CRITICAL_THINKING"],
        romanianCompetencies: ["Programare", "Logica", "Rezolvare probleme"],
        romanianCurriculumAlignment: ["Matematica", "Informatica"],
        romanianEducationalLevel: "PRIMAR",
        romanianSubjectAreas: ["Matematica", "Informatica", "Tehnologie"],
        romanianMinistryApproval: true,
      });
    });

    it("should enhance a product with minimal options", async () => {
      const options: EnhancementOptions = {
        includeRomanianOptimization: false,
        includeSEOMetadata: false,
        includeLearningOutcomes: false,
        includeAgeGroup: false,
        includeStemDiscipline: false,
        includeProductType: false,
      };

      const result = await service.enhanceProduct(mockProduct, options);

      expect(result).toMatchObject({
        name: mockProduct.name,
        price: mockProduct.price,
        category: mockProduct.category,
        enhancedDescription: mockEnhancedDescription,
        // Should have default values for disabled options
        metaTitle: mockProduct.name,
        metaDescription: mockProduct.description?.substring(0, 160) || "",
        metaKeywords: [],
        learningOutcomes: [],
        romanianCompetencies: [],
        romanianCurriculumAlignment: [],
        romanianSubjectAreas: [],
        romanianMinistryApproval: false,
      });
    });

    it("should throw error when AI enhancement is disabled", async () => {
      (AIConfig.isEnhancementEnabled as jest.Mock).mockReturnValue(false);

      await expect(service.enhanceProduct(mockProduct)).rejects.toThrow(
        "AI enhancement is disabled"
      );
    });

    it("should handle AI service errors gracefully", async () => {
      mockAIService.generateWithSystemPrompt.mockRejectedValue(
        new Error("AI service error")
      );

      await expect(service.enhanceProduct(mockProduct)).rejects.toThrow(
        "AI service error"
      );
    });

    it("should use cached result when available", async () => {
      const cachedResult = {
        ...mockProduct,
        enhancedDescription: "Cached description",
        metaTitle: "Cached title",
        metaDescription: "Cached description",
        metaKeywords: ["cached"],
        tags: ["cached"],
        learningOutcomes: [],
        romanianCompetencies: [],
        romanianCurriculumAlignment: [],
        romanianSubjectAreas: [],
        romanianMinistryApproval: false,
      };

      const { cache } = require("@/lib/cache");
      cache.get.mockResolvedValue(cachedResult);

      const result = await service.enhanceProduct(mockProduct);

      expect(result).toEqual(cachedResult);
      expect(mockAIService.generateWithSystemPrompt).not.toHaveBeenCalled();
    });
  });

  describe("testEnhancement", () => {
    it("should return true when enhancement test passes", async () => {
      mockAIService.generateWithSystemPrompt.mockResolvedValue(
        "Test description"
      );

      const result = await service.testEnhancement();

      expect(result).toBe(true);
    });

    it("should return false when enhancement test fails", async () => {
      mockAIService.generateWithSystemPrompt.mockRejectedValue(
        new Error("Test failed")
      );

      const result = await service.testEnhancement();

      expect(result).toBe(false);
    });
  });
});
