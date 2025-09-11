/**
 * Product Enhancement Service
 * Core service for AI-powered product enhancement
 */

import { AIServiceFactory } from "./ai-service-factory";
import { AIConfig } from "./config";
import { cache } from "@/lib/cache";
import { ApiErrors } from "@/lib/api-error-handler";
import {
  BasicProduct,
  EnhancedProduct,
  EnhancementOptions,
  EnhancementResult,
  SEOMetadata,
  RomanianContent,
  AgeGroup,
  StemDiscipline,
  ProductType,
  LearningOutcome,
  RomanianEducationalLevel,
} from "./types";
import { STEM_TOYS_PROMPTS, formatPrompt } from "./prompts/stem-toys-prompts";
import { aiCache, getCachedProductEnhancement } from "./cache";
import { aiRateLimiter } from "./rate-limiter";
import { aiMonitoring } from "./monitoring";
import { aiErrorRecovery } from "./error-recovery";
import { aiMemoryOptimizer } from "./memory-optimizer";

export class ProductEnhancementService {
  private aiService: any = null; // Lazy initialization to save memory
  private defaultOptions: EnhancementOptions = {
    includeRomanianOptimization: true,
    includeSEOMetadata: true,
    includeLearningOutcomes: true,
    includeAgeGroup: true,
    includeStemDiscipline: true,
    includeProductType: true,
  };

  private getAIService() {
    if (!this.aiService) {
      this.aiService = AIServiceFactory.getDefaultService();
    }
    return this.aiService;
  }

  /**
   * Enhance a single product with AI-generated content
   */
  async enhanceProduct(
    product: BasicProduct,
    options?: Partial<EnhancementOptions>
  ): Promise<EnhancedProduct> {
    const startTime = Date.now();
    const enhancementOptions = { ...this.defaultOptions, ...options };
    const provider = AIConfig.getProvider();

    try {
      // Check if AI enhancement is enabled
      if (!AIConfig.isEnhancementEnabled()) {
        throw new Error("AI enhancement is disabled");
      }

      // Check rate limit
      const rateLimitResult = await aiRateLimiter.checkRateLimit(provider);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`
        );
      }

      // Use cached enhancement with fallback
      const enhancedProduct = await getCachedProductEnhancement(
        product,
        async () => {
          // Record the request
          await aiRateLimiter.recordRequest(provider);

          // Generate enhanced content with error recovery
          return await aiErrorRecovery.executeWithRecovery(provider, () =>
            this.performEnhancement(product, enhancementOptions)
          );
        },
        enhancementOptions
      );

      // Record success metrics
      const responseTime = Date.now() - startTime;
      await aiMonitoring.recordRequest(provider, true, responseTime);

      console.log(`Enhanced product: ${product.name} in ${responseTime}ms`);
      return enhancedProduct;
    } catch (error) {
      // Record failure metrics
      const responseTime = Date.now() - startTime;
      await aiMonitoring.recordRequest(provider, false, responseTime);
      await aiMonitoring.recordError(provider, error.constructor.name);

      console.error(`Failed to enhance product ${product.name}:`, error);
      throw error;
    }
  }

  /**
   * Perform the actual enhancement process
   */
  private async performEnhancement(
    product: BasicProduct,
    options: EnhancementOptions
  ): Promise<EnhancedProduct> {
    const enhancedProduct: EnhancedProduct = {
      ...product,
      enhancedDescription: product.description || "",
      metaTitle: product.name,
      metaDescription: product.description?.substring(0, 160) || "",
      metaKeywords: [],
      tags: product.tags || [],
      learningOutcomes: [],
      romanianCompetencies: [],
      romanianCurriculumAlignment: [],
      romanianSubjectAreas: [],
      romanianMinistryApproval: false,
    };

    // Generate enhanced description
    enhancedProduct.enhancedDescription =
      await this.generateDescription(product);

    // Generate SEO metadata
    if (options.includeSEOMetadata) {
      const seoMetadata = await this.generateSEOMetadata(product);
      enhancedProduct.metaTitle = seoMetadata.metaTitle;
      enhancedProduct.metaDescription = seoMetadata.metaDescription;
      enhancedProduct.metaKeywords = seoMetadata.metaKeywords;
    }

    // Generate categorization
    if (
      options.includeAgeGroup ||
      options.includeStemDiscipline ||
      options.includeProductType
    ) {
      const categorization = await this.generateCategorization(product);
      if (options.includeAgeGroup)
        enhancedProduct.ageGroup = categorization.ageGroup;
      if (options.includeStemDiscipline)
        enhancedProduct.stemDiscipline = categorization.stemDiscipline;
      if (options.includeProductType)
        enhancedProduct.productType = categorization.productType;
    }

    // Generate learning outcomes
    if (options.includeLearningOutcomes) {
      enhancedProduct.learningOutcomes =
        await this.generateLearningOutcomes(product);
    }

    // Generate Romanian optimization
    if (options.includeRomanianOptimization) {
      const romanianContent = await this.generateRomanianContent(product);
      enhancedProduct.romanianCompetencies =
        romanianContent.romanianCompetencies;
      enhancedProduct.romanianCurriculumAlignment =
        romanianContent.romanianCurriculumAlignment;
      enhancedProduct.romanianEducationalLevel =
        romanianContent.romanianEducationalLevel;
      enhancedProduct.romanianSubjectAreas =
        romanianContent.romanianSubjectAreas;
      enhancedProduct.romanianMinistryApproval =
        romanianContent.romanianMinistryApproval;
      enhancedProduct.romanianEducationalCertification =
        romanianContent.romanianEducationalCertification;
    }

    // Generate enhanced tags
    enhancedProduct.tags = await this.generateTags(product, enhancedProduct);

    return enhancedProduct;
  }

  /**
   * Generate enhanced product description
   */
  private async generateDescription(product: BasicProduct): Promise<string> {
    const prompt = formatPrompt(STEM_TOYS_PROMPTS.description.user, {
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description || "",
    });

    return this.getAIService().generateWithSystemPrompt(
      STEM_TOYS_PROMPTS.description.system,
      prompt
    );
  }

  /**
   * Generate SEO metadata
   */
  private async generateSEOMetadata(
    product: BasicProduct
  ): Promise<SEOMetadata> {
    const prompt = formatPrompt(STEM_TOYS_PROMPTS.seoMetadata.user, {
      name: product.name,
      category: product.category,
      description: product.description || "",
    });

    const response = await this.getAIService().generateWithSystemPrompt(
      STEM_TOYS_PROMPTS.seoMetadata.system,
      prompt
    );

    // Parse the response to extract metadata
    const lines = response.split("\n").filter(line => line.trim());
    const metaTitle =
      lines
        .find(line => line.toLowerCase().includes("title"))
        ?.split(":")[1]
        ?.trim() || product.name;
    const metaDescription =
      lines
        .find(line => line.toLowerCase().includes("description"))
        ?.split(":")[1]
        ?.trim() ||
      product.description?.substring(0, 160) ||
      "";
    const keywordsLine = lines.find(line =>
      line.toLowerCase().includes("keyword")
    );
    const metaKeywords = keywordsLine
      ? keywordsLine
          .split(":")[1]
          ?.split(",")
          .map(k => k.trim()) || []
      : [];

    return {
      metaTitle: metaTitle.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      metaKeywords: metaKeywords.slice(0, 15),
    };
  }

  /**
   * Generate product categorization
   */
  private async generateCategorization(product: BasicProduct): Promise<{
    ageGroup?: AgeGroup;
    stemDiscipline?: StemDiscipline;
    productType?: ProductType;
  }> {
    const prompt = formatPrompt(STEM_TOYS_PROMPTS.categorization.user, {
      name: product.name,
      category: product.category,
      description: product.description || "",
    });

    const response = await this.getAIService().generateWithSystemPrompt(
      STEM_TOYS_PROMPTS.categorization.system,
      prompt
    );

    // Parse the response to extract categorization
    const lines = response.split("\n").filter(line => line.trim());
    const ageGroupLine = lines.find(line =>
      line.toLowerCase().includes("age group")
    );
    const stemDisciplineLine = lines.find(line =>
      line.toLowerCase().includes("stem discipline")
    );
    const productTypeLine = lines.find(line =>
      line.toLowerCase().includes("product type")
    );

    return {
      ageGroup: ageGroupLine?.split(":")[1]?.trim() as AgeGroup,
      stemDiscipline: stemDisciplineLine
        ?.split(":")[1]
        ?.trim() as StemDiscipline,
      productType: productTypeLine?.split(":")[1]?.trim() as ProductType,
    };
  }

  /**
   * Generate learning outcomes
   */
  private async generateLearningOutcomes(
    product: BasicProduct
  ): Promise<LearningOutcome[]> {
    const prompt = formatPrompt(STEM_TOYS_PROMPTS.learningOutcomes.user, {
      name: product.name,
      category: product.category,
      description: product.description || "",
      ageGroup: "ELEMENTARY_6_8", // Default age group
    });

    const response = await this.getAIService().generateWithSystemPrompt(
      STEM_TOYS_PROMPTS.learningOutcomes.system,
      prompt
    );

    // Parse the response to extract learning outcomes
    const validOutcomes: LearningOutcome[] = [
      "PROBLEM_SOLVING",
      "CREATIVITY",
      "CRITICAL_THINKING",
      "MOTOR_SKILLS",
      "LOGIC",
      "ANALYTICAL_THINKING",
      "COLLABORATION",
      "COMMUNICATION",
    ];

    const outcomes: LearningOutcome[] = [];
    const lines = response.split("\n").filter(line => line.trim());

    for (const line of lines) {
      const outcome = validOutcomes.find(o => line.toUpperCase().includes(o));
      if (outcome && !outcomes.includes(outcome)) {
        outcomes.push(outcome);
      }
    }

    return outcomes.slice(0, 5); // Limit to 5 outcomes
  }

  /**
   * Generate Romanian educational content
   */
  private async generateRomanianContent(
    product: BasicProduct
  ): Promise<RomanianContent> {
    const prompt = formatPrompt(STEM_TOYS_PROMPTS.romanianOptimization.user, {
      name: product.name,
      category: product.category,
      description: product.description || "",
      ageGroup: "ELEMENTARY_6_8", // Default age group
    });

    const response = await this.getAIService().generateWithSystemPrompt(
      STEM_TOYS_PROMPTS.romanianOptimization.system,
      prompt
    );

    // Parse the response to extract Romanian content
    const lines = response.split("\n").filter(line => line.trim());

    const competenciesLine = lines.find(line =>
      line.toLowerCase().includes("competencies")
    );
    const curriculumLine = lines.find(line =>
      line.toLowerCase().includes("curriculum")
    );
    const levelLine = lines.find(line =>
      line.toLowerCase().includes("educational level")
    );
    const subjectsLine = lines.find(line =>
      line.toLowerCase().includes("subject areas")
    );
    const approvalLine = lines.find(line =>
      line.toLowerCase().includes("ministry approval")
    );

    return {
      romanianCompetencies: competenciesLine
        ? competenciesLine
            .split(":")[1]
            ?.split(",")
            .map(c => c.trim()) || []
        : [],
      romanianCurriculumAlignment: curriculumLine
        ? curriculumLine
            .split(":")[1]
            ?.split(",")
            .map(c => c.trim()) || []
        : [],
      romanianEducationalLevel: levelLine
        ?.split(":")[1]
        ?.trim() as RomanianEducationalLevel,
      romanianSubjectAreas: subjectsLine
        ? subjectsLine
            .split(":")[1]
            ?.split(",")
            .map(s => s.trim()) || []
        : [],
      romanianMinistryApproval:
        approvalLine?.toLowerCase().includes("true") || false,
      romanianEducationalCertification: "Certificat MECTS", // Default certification
    };
  }

  /**
   * Generate enhanced tags
   */
  private async generateTags(
    product: BasicProduct,
    enhancedProduct: EnhancedProduct
  ): Promise<string[]> {
    const tags = new Set<string>();

    // Add existing tags
    if (product.tags) {
      product.tags.forEach(tag => tags.add(tag));
    }

    // Add category-based tags
    tags.add(product.category.toLowerCase());
    tags.add("stem");
    tags.add("educational");

    // Add age group tags
    if (enhancedProduct.ageGroup) {
      tags.add(enhancedProduct.ageGroup.toLowerCase().replace(/_/g, "-"));
    }

    // Add STEM discipline tags
    if (enhancedProduct.stemDiscipline) {
      tags.add(enhancedProduct.stemDiscipline.toLowerCase());
    }

    // Add product type tags
    if (enhancedProduct.productType) {
      tags.add(enhancedProduct.productType.toLowerCase().replace(/_/g, "-"));
    }

    // Add learning outcome tags
    enhancedProduct.learningOutcomes.forEach(outcome => {
      tags.add(outcome.toLowerCase().replace(/_/g, "-"));
    });

    // Add Romanian-specific tags
    if (enhancedProduct.romanianMinistryApproval) {
      tags.add("romanian-approved");
      tags.add("mects-certified");
    }

    return Array.from(tags).slice(0, 20); // Limit to 20 tags
  }

  /**
   * Generate cache key for product
   */
  private generateCacheKey(product: BasicProduct): string {
    const productHash = Buffer.from(
      JSON.stringify({
        name: product.name,
        category: product.category,
        description: product.description,
      })
    ).toString("base64");

    return `ai-enhancement:${productHash}`;
  }

  /**
   * Test the enhancement service
   */
  async testEnhancement(): Promise<boolean> {
    try {
      const testProduct: BasicProduct = {
        name: "Test Robot Kit",
        price: 299.99,
        category: "Robotics",
        description: "A basic robotics kit for learning programming",
      };

      await this.enhanceProduct(testProduct);
      return true;
    } catch (error) {
      console.error("Enhancement service test failed:", error);
      return false;
    }
  }
}
