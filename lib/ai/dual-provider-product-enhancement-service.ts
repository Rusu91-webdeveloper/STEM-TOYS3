/**
 * Dual Provider Product Enhancement Service
 *
 * This service implements a two-stage AI enhancement pipeline for product enhancement:
 * 1. Use GPT-5-mini (primary) for initial product data processing
 * 2. Use GPT-4o (fallback) when GPT-5-mini fails or returns empty content
 *
 * This approach ensures reliable product enhancement with proper categorization.
 */

import { AIServiceFactory } from "./ai-service-factory";
import { BaseAIService } from "./base-ai-service";
import { AIConfig } from "./config";
import { getAIConfig } from "@/lib/config/environment";
import { simpleAIMonitoring } from "./monitoring-simple";
import {
  PRODUCT_STRUCTURE_PROMPT,
  formatPrompt,
} from "./prompts/stem-toys-prompts";

import {
  ProductEnhancementPrompt,
  ProductEnhancementOptions,
  ProductEnhancementResult,
  ProductEnhancementProgress,
} from "./product-types";

import { SEOPerfectionValidator } from "./seo-perfection-validator";

/**
 * Configuration for the product enhancement pipeline
 */
export interface ProductEnhancementConfig {
  primaryProvider: "openai" | "gemini" | "anthropic";
  primaryModel: string;
  secondaryProvider: "openai" | "gemini" | "anthropic";
  secondaryModel: string;
  romanianOptimization: boolean;
  seoOptimization: boolean;
  contentQualityChecks: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export class DualProviderProductEnhancementService {
  private primaryService: BaseAIService | null = null;
  private secondaryService: BaseAIService | null = null;

  constructor(private config?: Partial<ProductEnhancementConfig>) {
    // Get global AI configuration
    const globalProvider = AIConfig.getProvider();
    const globalModel = AIConfig.getModel();

    // Dynamic configuration from environment variables
    const dynamicDefaults: ProductEnhancementConfig = {
      primaryProvider: getAIConfig().primaryProvider as
        | "openai"
        | "gemini"
        | "anthropic",
      primaryModel: getAIConfig().primaryModel,
      secondaryProvider: getAIConfig().secondaryProvider as
        | "openai"
        | "gemini"
        | "anthropic",
      secondaryModel: getAIConfig().secondaryModel,
      romanianOptimization: true,
      seoOptimization: true,
      contentQualityChecks: true,
      maxRetries: 3,
      timeoutMs: 60000, // 60 seconds for product processing
    };

    this.config = { ...dynamicDefaults, ...config };
  }

  /**
   * Initialize the services for both providers
   */
  private initServices() {
    // Initialize services silently for production
    if (!this.primaryService) {
      try {
        const primaryProvider = this.config!.primaryProvider;
        if (!primaryProvider) {
          throw new Error("Primary provider not configured");
        }
        this.primaryService = AIServiceFactory.getService(primaryProvider);

        // Set the model on the primary service
        if (this.primaryService && "model" in this.primaryService) {
          (this.primaryService as any).model = this.config!.primaryModel;
          console.log(
            "🔧 Primary service model set to:",
            this.config!.primaryModel
          );
        }
      } catch (error) {
        console.error(
          `Failed to create primary service (${this.config!.primaryProvider}):`,
          error
        );
        throw new Error(
          `Failed to initialize primary AI service (${this.config!.primaryProvider}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (!this.secondaryService) {
      try {
        const secondaryProvider = this.config!.secondaryProvider;
        if (!secondaryProvider) {
          throw new Error("Secondary provider not configured");
        }
        this.secondaryService = AIServiceFactory.getService(secondaryProvider);

        // Set the model on the secondary service
        if (this.secondaryService && "model" in this.secondaryService) {
          (this.secondaryService as any).model = this.config!.secondaryModel;
          console.log(
            "🔧 Secondary service model set to:",
            this.config!.secondaryModel
          );
        }
      } catch (error) {
        console.error(
          `Failed to create secondary service (${this.config!.secondaryProvider}):`,
          error
        );
        throw new Error(
          `Failed to initialize secondary AI service (${this.config!.secondaryProvider}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Enhance a single product with AI
   */
  async enhanceProduct(
    productData: any,
    options: ProductEnhancementOptions,
    onProgress?: (progress: ProductEnhancementProgress) => void
  ): Promise<ProductEnhancementResult> {
    const startTime = Date.now();

    try {
      // Initialize services
      await this.initServices();

      // Update progress
      onProgress?.({
        stage: "analyzing_product",
        progress: 20,
        currentStep: "Analyzing product data and preparing enhancement",
        estimatedTimeRemaining: 20000,
      });

      // Create enhancement prompt
      const enhancementPrompt = this.buildEnhancementPrompt(
        productData,
        options
      );

      onProgress?.({
        stage: "enhancing_product",
        progress: 60,
        currentStep:
          "Enhancing product with AI categorization and optimization",
        estimatedTimeRemaining: 30000,
      });

      // Generate enhanced product data
      const enhancedData =
        await this.generateEnhancedProductData(enhancementPrompt);

      onProgress?.({
        stage: "finalizing",
        progress: 90,
        currentStep: "Finalizing product enhancement",
        estimatedTimeRemaining: 5000,
      });

      // Validate and clean the enhanced data
      let validatedData = this.validateEnhancedData(enhancedData, productData);

      // ===== SEO PERFECTION VALIDATION & AUTO-FIX =====
      console.log("\n🔍 Validating SEO quality for 100/100 score...");

      const seoData = {
        metaTitle: validatedData.metadata?.seo?.metaTitle,
        metaDescription: validatedData.metadata?.seo?.metaDescription,
        metaKeywords: validatedData.metadata?.seo?.metaKeywords,
        tags: validatedData.tags,
        description: validatedData.description,
        learningOutcomes: validatedData.metadata?.learningOutcomes,
        romanianCompetencies: validatedData.metadata?.romanianCompetencies,
        romanianCurriculumAlignment:
          validatedData.metadata?.romanianCurriculumAlignment,
        attributes: validatedData.attributes,
      };

      let seoValidation = SEOPerfectionValidator.validate(seoData);

      console.log(`📊 Initial SEO Score: ${seoValidation.score}/100`);

      // If not perfect, try auto-fix
      if (seoValidation.score < 100) {
        console.log("🔧 Auto-fixing SEO issues...");
        const fixedSEOData = SEOPerfectionValidator.autoFix(seoData);

        // Apply fixes back to validated data
        if (validatedData.metadata?.seo) {
          validatedData.metadata.seo.metaTitle = fixedSEOData.metaTitle;
          validatedData.metadata.seo.metaDescription =
            fixedSEOData.metaDescription;
          validatedData.metadata.seo.metaKeywords = fixedSEOData.metaKeywords;
        }
        validatedData.tags = fixedSEOData.tags;

        // Re-validate after fixes
        seoValidation = SEOPerfectionValidator.validate({
          ...fixedSEOData,
          description: validatedData.description,
          learningOutcomes: validatedData.metadata?.learningOutcomes,
          romanianCompetencies: validatedData.metadata?.romanianCompetencies,
          romanianCurriculumAlignment:
            validatedData.metadata?.romanianCurriculumAlignment,
          attributes: validatedData.attributes,
        });

        console.log(`📊 After Auto-Fix SEO Score: ${seoValidation.score}/100`);
      }

      // Log final validation report
      if (seoValidation.score === 100) {
        console.log("🎉 PERFECT! SEO Score: 100/100 - Top rankings expected!");
      } else {
        console.warn(SEOPerfectionValidator.generateReport(seoValidation));
      }

      onProgress?.({
        stage: "complete",
        progress: 100,
        currentStep: "Product enhancement completed successfully",
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        enhancedProduct: validatedData,
        processingTime,
        fallbackUsed: this.config!.primaryModel !== "gpt-4o", // Mark if fallback was used
        seoScore: seoValidation.score, // Add SEO score to result
      };
    } catch (error) {
      console.error("Product enhancement failed:", error);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
        enhancedProduct: productData, // Return original data as fallback
      };
    }
  }

  /**
   * Build enhancement prompt for the product
   */
  private buildEnhancementPrompt(
    productData: any,
    options: ProductEnhancementOptions
  ): ProductEnhancementPrompt {
    return {
      productData: JSON.stringify(productData, null, 2),
      includeCategorization: options.includeCategorization ?? true,
      includeRomanianOptimization: options.includeRomanianOptimization ?? true,
      includeLearningOutcomes: options.includeLearningOutcomes ?? true,
      includeStemDiscipline: options.includeStemDiscipline ?? true,
      includeAgeGroup: options.includeAgeGroup ?? true,
      includeProductType: options.includeProductType ?? true,
    };
  }

  /**
   * Generate enhanced product data using dual-provider approach
   */
  private async generateEnhancedProductData(
    prompt: ProductEnhancementPrompt
  ): Promise<any> {
    const formattedPrompt = formatPrompt(PRODUCT_STRUCTURE_PROMPT.user, prompt);

    let response;
    try {
      // Try primary service (GPT-5-mini)
      response = await this.primaryService!.generateWithSystemPrompt(
        PRODUCT_STRUCTURE_PROMPT.system,
        formattedPrompt
      );

      // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
      if (!response || response.trim().length === 0) {
        console.warn(
          "⚠️ GPT-5-mini returned empty content - triggering fallback to GPT-4o for product enhancement"
        );

        // Create a fresh OpenAI service instance for fallback with GPT-4o
        const { OpenAIService } = await import("./openai-service");
        const fallbackService = new OpenAIService(getAIConfig().fallbackModel);

        response = await fallbackService.generateWithSystemPrompt(
          PRODUCT_STRUCTURE_PROMPT.system,
          formattedPrompt
        );
      }
    } catch (primaryError) {
      // If primary service throws an error (not just empty content), try GPT-4o as fallback
      console.warn(
        "⚠️ Primary model threw error, trying GPT-4o fallback:",
        primaryError instanceof Error
          ? primaryError.message
          : String(primaryError)
      );

      // Create a fresh OpenAI service instance for fallback with GPT-4o
      const { OpenAIService } = await import("./openai-service");
      const fallbackService = new OpenAIService(getAIConfig().fallbackModel);

      response = await fallbackService.generateWithSystemPrompt(
        PRODUCT_STRUCTURE_PROMPT.system,
        formattedPrompt
      );
    }

    // Debug enhancement (only on fallback)
    if (this.config!.primaryModel !== "gpt-4o") {
      console.log("🔍 Product Enhancement Debug (fallback used):");
      console.log("- Response content length:", response?.length || 0);
      console.log(
        "- Response preview (first 800 chars):",
        response?.substring(0, 800) || ""
      );
    }

    return this.parseEnhancementResponse(response || "");
  }

  /**
   * Parse the AI enhancement response
   */
  private parseEnhancementResponse(response: string): any {
    try {
      // First, try to extract JSON from markdown code blocks
      let jsonStr = response;

      // Remove markdown code blocks if present
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      // Try to parse as JSON
      const parsed = JSON.parse(jsonStr.trim());

      console.log(`🔍 Product Enhancement Debug (JSON parsed successfully):`);
      console.log(
        `- Has tags: ${Array.isArray(parsed.tags) ? parsed.tags.length : 0}`
      );
      console.log(`- Has metadata.seo: ${!!parsed.metadata?.seo}`);
      console.log(`- Has attributes.specs: ${!!parsed.attributes?.specs}`);
      console.log(
        `- Has learningOutcomes: ${Array.isArray(parsed.learningOutcomes) ? parsed.learningOutcomes.length : 0}`
      );

      return parsed || {};
    } catch (error) {
      console.warn(
        "⚠️ JSON parsing failed, using fallback extraction:",
        error instanceof Error ? error.message : "Unknown error"
      );

      // If not JSON, try to extract key-value pairs
      const result: any = {};

      // Extract age group
      const ageGroupMatch = response.match(
        /ageGroup["\s]*:[\s]*["']([^"']+)["']/i
      );
      if (ageGroupMatch) {
        result.ageGroup = ageGroupMatch[1];
      }

      // Extract product type
      const productTypeMatch = response.match(
        /productType["\s]*:[\s]*["']([^"']+)["']/i
      );
      if (productTypeMatch) {
        result.productType = productTypeMatch[1];
      }

      // Extract Romanian educational level
      const educationalLevelMatch = response.match(
        /romanianEducationalLevel["\s]*:[\s]*["']([^"']+)["']/i
      );
      if (educationalLevelMatch) {
        result.romanianEducationalLevel = educationalLevelMatch[1];
      }

      // Extract stem discipline
      const stemDisciplineMatch = response.match(
        /stemDiscipline["\s]*:[\s]*["']([^"']+)["']/i
      );
      if (stemDisciplineMatch) {
        result.stemDiscipline = stemDisciplineMatch[1];
      }

      // Extract learning outcomes
      const learningOutcomesMatch = response.match(
        /learningOutcomes["\s]*:[\s]*\[(.*?)\]/is
      );
      if (learningOutcomesMatch) {
        result.learningOutcomes = learningOutcomesMatch[1]
          .split(",")
          .map(outcome => outcome.trim().replace(/['"]/g, ""))
          .filter(outcome => outcome.length > 0);
      }

      // Extract tags
      const tagsMatch = response.match(/tags["\s]*:[\s]*\[(.*?)\]/is);
      if (tagsMatch) {
        result.tags = tagsMatch[1]
          .split(",")
          .map(tag => tag.trim().replace(/['"]/g, ""))
          .filter(tag => tag.length > 0);
      }

      // Extract description if enhanced
      const descMatch = response.match(
        /description["\s]*:[\s]*["'](.*?)["']/is
      );
      if (descMatch) {
        result.description = descMatch[1];
      }

      console.log("📝 Fallback extraction results:", {
        ageGroup: !!result.ageGroup,
        productType: !!result.productType,
        tags: result.tags?.length || 0,
        learningOutcomes: result.learningOutcomes?.length || 0,
      });

      return result;
    }
  }

  /**
   * Validate enhanced data and ensure it meets schema requirements
   */
  private validateEnhancedData(enhancedData: any, originalData: any): any {
    const validated = { ...originalData, ...enhancedData };

    // Validate and ensure age group is one of the allowed values
    const validAgeGroups = [
      "TODDLERS_1_3",
      "PRESCHOOL_3_5",
      "ELEMENTARY_6_8",
      "MIDDLE_SCHOOL_9_12",
      "TEENS_13_PLUS",
    ];
    if (!validated.ageGroup || !validAgeGroups.includes(validated.ageGroup)) {
      // Auto-assign based on product name/description if not valid
      validated.ageGroup = this.autoAssignAgeGroup(validated);
    }

    // Validate and ensure product type is one of the allowed values
    const validProductTypes = [
      "ROBOTICS",
      "PUZZLES",
      "CONSTRUCTION_SETS",
      "EXPERIMENT_KITS",
      "BOARD_GAMES",
    ];
    if (
      !validated.productType ||
      !validProductTypes.includes(validated.productType)
    ) {
      // Auto-assign based on product name/description if not valid
      validated.productType = this.autoAssignProductType(validated);
    }

    // Validate Romanian educational level
    const validEducationalLevels = [
      "GRADINITA",
      "PRIMAR",
      "GIMNAZIU",
      "LICEU",
      "UNIVERSITATE",
    ];
    if (
      !validated.romanianEducationalLevel ||
      !validEducationalLevels.includes(validated.romanianEducationalLevel)
    ) {
      // Auto-assign based on age group if not valid
      validated.romanianEducationalLevel = this.autoAssignEducationalLevel(
        validated.ageGroup
      );
    }

    // Validate stem discipline
    const validStemDisciplines = [
      "SCIENCE",
      "TECHNOLOGY",
      "ENGINEERING",
      "MATHEMATICS",
      "GENERAL",
    ];
    if (
      !validated.stemDiscipline ||
      !validStemDisciplines.includes(validated.stemDiscipline)
    ) {
      validated.stemDiscipline = "GENERAL";
    }

    // Validate learning outcomes
    const validLearningOutcomes = [
      "PROBLEM_SOLVING",
      "CREATIVITY",
      "CRITICAL_THINKING",
      "MOTOR_SKILLS",
      "LOGIC",
      "ANALYTICAL_THINKING",
      "COLLABORATION",
      "COMMUNICATION",
      "DIGITAL_LITERACY",
      "CODING_THINKING",
    ];
    if (Array.isArray(validated.learningOutcomes)) {
      validated.learningOutcomes = validated.learningOutcomes.filter(outcome =>
        validLearningOutcomes.includes(outcome)
      );
    } else {
      validated.learningOutcomes = [];
    }

    return validated;
  }

  /**
   * Auto-assign age group based on product analysis
   */
  private autoAssignAgeGroup(product: any): string {
    const text = `${product.name} ${product.description}`.toLowerCase();

    if (
      text.includes("toddlers") ||
      text.includes("1-3") ||
      text.includes("copii mici")
    ) {
      return "TODDLERS_1_3";
    }
    if (
      text.includes("preschool") ||
      text.includes("3-5") ||
      text.includes("grădiniță")
    ) {
      return "PRESCHOOL_3_5";
    }
    if (
      text.includes("elementary") ||
      text.includes("6-8") ||
      text.includes("școală primară")
    ) {
      return "ELEMENTARY_6_8";
    }
    if (
      text.includes("middle") ||
      text.includes("9-12") ||
      text.includes("gimnaziu")
    ) {
      return "MIDDLE_SCHOOL_9_12";
    }
    if (
      text.includes("teens") ||
      text.includes("13+") ||
      text.includes("adolescenți")
    ) {
      return "TEENS_13_PLUS";
    }

    // Default to preschool for STEM toys
    return "PRESCHOOL_3_5";
  }

  /**
   * Auto-assign product type based on product analysis
   */
  private autoAssignProductType(product: any): string {
    const text = `${product.name} ${product.description}`.toLowerCase();

    if (
      text.includes("robot") ||
      text.includes("arduino") ||
      text.includes("micro:bit")
    ) {
      return "ROBOTICS";
    }
    if (
      text.includes("puzzle") ||
      text.includes("tangram") ||
      text.includes("brain")
    ) {
      return "PUZZLES";
    }
    if (
      text.includes("construct") ||
      text.includes("lego") ||
      text.includes("building")
    ) {
      return "CONSTRUCTION_SETS";
    }
    if (
      text.includes("experiment") ||
      text.includes("science kit") ||
      text.includes("chemistry")
    ) {
      return "EXPERIMENT_KITS";
    }
    if (text.includes("board game") || text.includes("joc de societate")) {
      return "BOARD_GAMES";
    }

    // Default to construction sets for STEM toys
    return "CONSTRUCTION_SETS";
  }

  /**
   * Auto-assign Romanian educational level based on age group
   */
  private autoAssignEducationalLevel(ageGroup: string): string {
    switch (ageGroup) {
      case "TODDLERS_1_3":
        return "GRADINITA";
      case "PRESCHOOL_3_5":
        return "GRADINITA";
      case "ELEMENTARY_6_8":
        return "PRIMAR";
      case "MIDDLE_SCHOOL_9_12":
        return "GIMNAZIU";
      case "TEENS_13_PLUS":
        return "LICEU";
      default:
        return "GRADINITA";
    }
  }

  /**
   * Enhance multiple products in batch
   */
  async enhanceProductsBatch(
    products: any[],
    options: ProductEnhancementOptions,
    onProgress?: (progress: ProductEnhancementProgress) => void
  ): Promise<ProductEnhancementResult[]> {
    const results: ProductEnhancementResult[] = [];
    const startTime = Date.now();

    console.log(
      `Starting dual-provider batch enhancement for ${products.length} products`
    );

    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(
        `Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} products)`
      );

      onProgress?.({
        stage: "processing_batch",
        progress: Math.round(((batchIndex + 1) / batches.length) * 100),
        currentStep: `Processing batch ${batchIndex + 1} of ${batches.length}`,
        estimatedTimeRemaining:
          (batches.length - batchIndex - 1) * batch.length * 20000,
      });

      // Process products sequentially within batch
      for (const product of batch) {
        try {
          const result = await this.enhanceProduct(product, options);
          results.push(result);
        } catch (error) {
          console.error(`Failed to enhance product ${product.name}:`, error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            processingTime: 0,
            enhancedProduct: product, // Return original as fallback
          });
        }
      }

      // Small delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `Completed dual-provider batch enhancement in ${(totalTime / 1000).toFixed(2)}s`
    );

    return results;
  }
}
