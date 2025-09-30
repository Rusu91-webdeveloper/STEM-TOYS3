import { DualProviderProductEnhancementService } from "@/lib/ai/dual-provider-product-enhancement-service";

// Mock the AI services
jest.mock("@/lib/ai/ai-service-factory", () => ({
  AIServiceFactory: {
    getService: jest.fn(),
  },
}));

jest.mock("@/lib/config/environment", () => ({
  getAIConfig: () => ({
    primaryProvider: "openai",
    primaryModel: "gpt-5-mini",
    secondaryProvider: "openai",
    secondaryModel: "gpt-4o",
    fallbackModel: "gpt-4o",
  }),
}));

describe("DualProviderProductEnhancementService", () => {
  let service: DualProviderProductEnhancementService;
  let mockPrimaryService: any;
  let mockSecondaryService: any;

  beforeEach(() => {
    // Create mock services
    mockPrimaryService = {
      generateWithSystemPrompt: jest.fn(),
    };
    mockSecondaryService = {
      generateWithSystemPrompt: jest.fn(),
    };

    // Mock the factory to return our mock services
    const { AIServiceFactory } = require("@/lib/ai/ai-service-factory");
    AIServiceFactory.getService.mockImplementation((provider: string) => {
      if (provider === "openai") {
        return mockPrimaryService;
      }
      return mockSecondaryService;
    });

    service = new DualProviderProductEnhancementService();
  });

  describe("enhanceProduct", () => {
    const sampleProduct = {
      name: "LEGO Mindstorms Robot Inventor Kit",
      description: "Advanced robotics kit for building and programming robots",
      price: 349.99,
      category: "Robotics",
      tags: ["robotics", "programming", "lego"],
    };

    it("should successfully enhance a product with valid categorization", async () => {
      // Mock GPT-5-mini returning enhanced data
      mockPrimaryService.generateWithSystemPrompt.mockResolvedValue(`
        ageGroup: "ELEMENTARY_6_8"
        productType: "ROBOTICS"
        romanianEducationalLevel: "GIMNAZIU"
        stemDiscipline: "TECHNOLOGY"
        learningOutcomes: ["PROBLEM_SOLVING", "CREATIVITY"]
      `);

      const result = await service.enhanceProduct(sampleProduct, {
        includeCategorization: true,
        includeAgeGroup: true,
        includeProductType: true,
      });

      expect(result.success).toBe(true);
      expect(result.enhancedProduct).toBeDefined();
      expect(result.enhancedProduct?.ageGroup).toBe("ELEMENTARY_6_8");
      expect(result.enhancedProduct?.productType).toBe("ROBOTICS");
      expect(result.enhancedProduct?.romanianEducationalLevel).toBe("GIMNAZIU");
      expect(result.fallbackUsed).toBe(false);
    });

    it("should fallback to GPT-4o when GPT-5-mini returns empty content", async () => {
      // Mock GPT-5-mini returning empty content
      mockPrimaryService.generateWithSystemPrompt.mockResolvedValueOnce("") // First call returns empty
        .mockResolvedValueOnce(`
          ageGroup: "MIDDLE_SCHOOL_9_12"
          productType: "CONSTRUCTION_SETS"
          romanianEducationalLevel: "LICEU"
          stemDiscipline: "ENGINEERING"
        `); // Second call (fallback) returns data

      const result = await service.enhanceProduct(sampleProduct, {
        includeCategorization: true,
      });

      expect(result.success).toBe(true);
      expect(result.enhancedProduct?.ageGroup).toBe("MIDDLE_SCHOOL_9_12");
      expect(result.enhancedProduct?.productType).toBe("CONSTRUCTION_SETS");
      expect(result.fallbackUsed).toBe(true);
      expect(mockPrimaryService.generateWithSystemPrompt).toHaveBeenCalledTimes(
        2
      );
    });

    it("should auto-assign valid enum values when AI returns invalid data", async () => {
      // Mock AI returning invalid enum values
      mockPrimaryService.generateWithSystemPrompt.mockResolvedValue(`
        ageGroup: "INVALID_AGE"
        productType: "INVALID_TYPE"
        romanianEducationalLevel: "INVALID_LEVEL"
      `);

      const result = await service.enhanceProduct(sampleProduct, {
        includeCategorization: true,
      });

      expect(result.success).toBe(true);
      // Should auto-assign valid values based on product content
      expect(result.enhancedProduct?.ageGroup).toBe("ELEMENTARY_6_8"); // Auto-assigned for robotics
      expect(result.enhancedProduct?.productType).toBe("ROBOTICS"); // Auto-assigned for robotics
      expect(result.enhancedProduct?.romanianEducationalLevel).toBe("GIMNAZIU"); // Auto-assigned for elementary age
    });

    it("should handle AI service errors gracefully", async () => {
      // Mock both services failing
      mockPrimaryService.generateWithSystemPrompt.mockRejectedValue(
        new Error("AI service error")
      );

      const result = await service.enhanceProduct(sampleProduct, {
        includeCategorization: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("AI service error");
      expect(result.enhancedProduct).toEqual(sampleProduct); // Should return original data
    });
  });

  describe("enhanceProductsBatch", () => {
    const sampleProducts = [
      {
        name: "LEGO Robotics Kit",
        description: "Building and programming kit",
        price: 299.99,
      },
      {
        name: "Chemistry Set",
        description: "Science experiment kit",
        price: 89.99,
      },
    ];

    it("should process multiple products in batch", async () => {
      mockPrimaryService.generateWithSystemPrompt.mockResolvedValueOnce(`
          ageGroup: "ELEMENTARY_6_8"
          productType: "ROBOTICS"
          romanianEducationalLevel: "GIMNAZIU"
        `).mockResolvedValueOnce(`
          ageGroup: "MIDDLE_SCHOOL_9_12"
          productType: "EXPERIMENT_KITS"
          romanianEducationalLevel: "LICEU"
        `);

      const results = await service.enhanceProductsBatch(sampleProducts, {
        includeCategorization: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].enhancedProduct?.productType).toBe("ROBOTICS");
      expect(results[1].enhancedProduct?.productType).toBe("EXPERIMENT_KITS");
    });
  });
});
