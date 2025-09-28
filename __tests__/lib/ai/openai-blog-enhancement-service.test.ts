/**
 * OpenAI Blog Enhancement Service Tests
 * Tests for the AI blog generation service using OpenAI only
 */

import { OpenAIBlogEnhancementService } from "@/lib/ai/openai-blog-enhancement-service";
import { BaseAIService } from "@/lib/ai/base-ai-service";
import { AIServiceFactory } from "@/lib/ai/ai-service-factory";

// Mock dependencies
jest.mock("@/lib/ai/base-ai-service");
jest.mock("@/lib/ai/ai-service-factory");

const mockAIServiceFactory = AIServiceFactory as jest.Mocked<
  typeof AIServiceFactory
>;

describe("OpenAIBlogEnhancementService", () => {
  let service: OpenAIBlogEnhancementService;
  let mockService: jest.Mocked<BaseAIService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AI service
    mockService = {
      generateResponse: jest.fn(),
    } as any;

    mockAIServiceFactory.getService.mockReturnValue(mockService);

    service = new OpenAIBlogEnhancementService();
  });

  describe("Initialization", () => {
    it("should initialize with default config", async () => {
      expect(service).toBeDefined();

      // Trigger service initialization by calling a method that uses initService
      const mockPrompt = { prompt: "test" };
      try {
        await service.generateBlog(mockPrompt, {});
      } catch (error) {
        // Expected to fail due to mocking, but should have called initService
      }

      expect(mockAIServiceFactory.getService).toHaveBeenCalledWith("openai");
    });

    it("should initialize with custom config", () => {
      const customConfig = {
        model: "gpt-4o-mini",
      };

      service = new OpenAIBlogEnhancementService(customConfig);

      expect(service).toBeDefined();
      expect(mockAIServiceFactory.getService).toHaveBeenCalledWith("openai");
    });
  });

  describe("Blog Generation", () => {
    const mockPrompt = {
      prompt: "Generate a blog about STEM toys in 2025",
      targetStemCategory: "SCIENCE" as const,
      targetAudience: "Romanian parents",
      tone: "educational" as const,
      includeCallToAction: true,
      keywordFocus: [],
    };

    const mockOptions = {
      includeSEO: true,
      includeCoverImage: true,
      targetStemCategory: "SCIENCE" as const,
      saveToDatabase: false,
    };

    beforeEach(() => {
      // Mock title generation
      mockService.generateResponse.mockResolvedValueOnce(
        "Jucăriile STEM în 2025: Revoluția Educației Digitale"
      );

      // Mock content generation
      mockService.generateResponse.mockResolvedValueOnce(`
# Jucăriile STEM în 2025: Revoluția Educației Digitale

## Introducere

În era digitală în care trăim, jucăriile STEM (Science, Technology, Engineering, Mathematics) reprezintă viitorul educației pentru copii. Aceste jucării interactive nu doar că distrează, ci și dezvoltă abilități esențiale pentru secolul XXI.

## Beneficiile Educaționale

Jucăriile STEM încurajează:

- Gândirea critică și analitică
- Rezolvarea creativă a problemelor
- Dezvoltarea abilităților motorii fine
- Înțelegerea conceptelor științifice de bază

## Concluzie

Investiția în jucăriile STEM este o investiție în viitorul copilului dumneavoastră. Alegeți jucării de calitate care să inspire și să educe în același timp.

## Contactați-ne

Descoperiți colecția noastră completă de jucării STEM!
      `);

      // Mock SEO metadata generation
      mockService.generateResponse
        .mockResolvedValueOnce(`Meta Title: Jucăriile STEM în 2025: Revoluția Educației Digitale
Meta Description: Descoperiți cum jucăriile STEM revoluționează educația copiilor în 2025. Beneficii, tipuri și recomandări pentru dezvoltarea abilităților esențiale.
Focus Keyword: jucării STEM 2025
Secondary Keywords: educație STEM, jucării educaționale, dezvoltare copii, robotică copii
Long-tail Keywords: jucării STEM pentru copii, beneficii jucării educaționale, cum aleg jucării STEM, dezvoltarea cognitivă copii`);

      // Mock content refinement
      mockService.generateResponse.mockResolvedValueOnce(`
# Jucăriile STEM în 2025: Revoluția Educației Digitale

## Introducere

În era digitală în care trăim, jucăriile STEM (Science, Technology, Engineering, Mathematics) reprezintă viitorul educației pentru copii. Aceste jucării interactive nu doar că distrează, ci și dezvoltă abilități esențiale pentru secolul XXI.

## Beneficiile Educaționale

Jucăriile STEM încurajează:

- Gândirea critică și analitică
- Rezolvarea creativă a problemelor
- Dezvoltarea abilităților motorii fine
- Înțelegerea conceptelor științifice de bază

## Concluzie

Investiția în jucăriile STEM este o investiție în viitorul copilului dumneavoastră. Alegeți jucării de calitate care să inspire și să educe în același timp.

## Contactați-ne

Descoperiți colecția noastră completă de jucării STEM!
      `);

      // Mock excerpt generation
      mockService.generateResponse.mockResolvedValueOnce(
        "Descoperiți cum jucăriile STEM revoluționează educația copiilor în 2025. Beneficii esențiale pentru dezvoltarea cognitivă și pregătirea pentru viitor."
      );
    });

    it("should generate a complete blog successfully", async () => {
      const result = await service.generateBlog(mockPrompt, mockOptions);

      expect(result.success).toBe(true);
      expect(result.generatedBlog).toBeDefined();
      expect(result.generatedBlog!.title).toBe(
        "Jucăriile STEM în 2025: Revoluția Educației Digitale"
      );
      expect(result.generatedBlog!.stemCategory).toBe("SCIENCE");
      expect(result.generatedBlog!.language).toBe("ro");
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it("should include SEO metadata when requested", async () => {
      const result = await service.generateBlog(mockPrompt, mockOptions);

      expect(result.generatedBlog!.seoMetadata).toBeDefined();
      expect(result.generatedBlog!.seoMetadata.metaTitle).toBeDefined();
      expect(result.generatedBlog!.seoMetadata.metaDescription).toBeDefined();
      expect(result.generatedBlog!.seoMetadata.metaKeywords).toBeDefined();
      expect(result.seoScore).toBeDefined();
    });

    it("should calculate reading time correctly", async () => {
      const result = await service.generateBlog(mockPrompt, mockOptions);

      expect(result.generatedBlog!.readingTime).toBeDefined();
      expect(result.generatedBlog!.readingTime).toBeGreaterThan(0);
    });

    it("should generate appropriate tags", async () => {
      const result = await service.generateBlog(mockPrompt, mockOptions);

      expect(result.generatedBlog!.tags).toBeDefined();
      expect(Array.isArray(result.generatedBlog!.tags)).toBe(true);
      expect(result.generatedBlog!.tags.length).toBeGreaterThan(0);
    });

    it("should validate generated blog schema", async () => {
      const result = await service.generateBlog(mockPrompt, mockOptions);

      expect(result.generatedBlog!.title.length).toBeGreaterThan(10);
      expect(result.generatedBlog!.content.length).toBeGreaterThan(100);
      expect(result.generatedBlog!.excerpt.length).toBeGreaterThan(50);
      expect(result.generatedBlog!.slug).toBeDefined();
    });
  });

  describe("Progress Tracking", () => {
    it("should call progress callback during generation", async () => {
      const mockProgressCallback = jest.fn();

      const mockPrompt = {
        prompt: "Test prompt",
      };

      // Mock services for quick response
      mockService.generateResponse.mockResolvedValue("Test Title");
      mockService.generateResponse.mockResolvedValue("Test content");
      mockService.generateResponse.mockResolvedValue(
        "Meta Title: Test\nMeta Description: Test"
      );

      await service.generateBlog(mockPrompt, {}, mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalled();
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: expect.any(String),
          progress: expect.any(Number),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle AI service failures gracefully", async () => {
      mockService.generateResponse.mockRejectedValue(
        new Error("AI service unavailable")
      );

      const result = await service.generateBlog({ prompt: "Test prompt" }, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("AI service unavailable");
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it("should handle invalid prompt", async () => {
      const result = await service.generateBlog({ prompt: "" }, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("SEO Analysis", () => {
    it("should calculate SEO score", async () => {
      mockService.generateResponse
        .mockResolvedValueOnce("Test Title with STEM keywords")
        .mockResolvedValueOnce(
          "Long enough content for testing SEO analysis and keyword optimization in Romanian language"
        )
        .mockResolvedValueOnce(
          "Meta Title: Test Title\nMeta Description: Test description\nFocus Keyword: STEM"
        )
        .mockResolvedValueOnce("Refined content")
        .mockResolvedValueOnce("Test excerpt for SEO");

      const result = await service.generateBlog(
        { prompt: "Test STEM blog" },
        { includeSEO: true }
      );

      expect(result.seoScore).toBeDefined();
      expect(result.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.seoScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Utility Methods", () => {
    it("should calculate word count correctly", () => {
      const content =
        "Acesta este un test pentru a calcula numărul de cuvinte în limba română.";
      const wordCount = (service as any).calculateWordCount(content);
      expect(wordCount).toBe(12);
    });

    it("should generate valid slug", () => {
      const title = "Jucăriile STEM în 2025: Revoluția!";
      const slug = (service as any).generateSlug(title);
      expect(slug).toBe("jucariile-stem-in-2025-revolutia");
    });

    it("should extract keywords from content", () => {
      const content =
        "Jucăriile STEM sunt importante pentru educația copiilor. Copiii învață știință, tehnologie și matematică.";
      const keywords = (service as any).extractKeywords(content);
      expect(keywords).toBeDefined();
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
    });
  });
});
