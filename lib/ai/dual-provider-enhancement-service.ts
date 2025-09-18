/**
 * Dual Provider Enhancement Service
 *
 * This service implements a two-stage AI enhancement pipeline:
 * 1. Use Gemini (free tier) for initial bulk data generation
 * 2. Use OpenAI to analyze and improve the Gemini-generated content
 *
 * This approach optimizes for cost while maintaining quality by:
 * - Using Gemini's free quota for the majority of the work
 * - Using OpenAI selectively for refinement and validation
 */

import { BaseAIService } from "./base-ai-service";
import { AIServiceFactory } from "./ai-service-factory";
import { AIConfig } from "./config";
import { ApiErrors } from "@/lib/api-error-handler";
import { aiMonitoring } from "./monitoring";
import {
  BasicProduct,
  EnhancedProduct,
  EnhancementOptions,
  EnhancementProgress,
} from "./types";

/**
 * Configuration for the dual-provider pipeline
 */
export interface DualProviderConfig {
  // Primary provider (bulk generation)
  primaryProvider: "gemini" | "openai" | "anthropic";
  primaryModel: string;

  // Secondary provider (refinement)
  secondaryProvider: "openai" | "gemini" | "anthropic";
  secondaryModel: string;

  // What the secondary provider should focus on
  refinementOptions: {
    validateContent: boolean; // Check if content meets guidelines
    improveSEO: boolean; // Enhance SEO metadata
    fixGrammar: boolean; // Fix grammar and language issues
    ensureDbCompatibility: boolean; // Ensure content fits database schema
  };
}

export class DualProviderEnhancementService {
  private primaryService: BaseAIService | null = null;
  private secondaryService: BaseAIService | null = null;

  private defaultConfig: DualProviderConfig = {
    primaryProvider: "gemini",
    primaryModel: "gemini-1.5-pro",
    secondaryProvider: "openai",
    secondaryModel: "gpt-3.5-turbo",
    refinementOptions: {
      validateContent: true,
      improveSEO: true,
      fixGrammar: true,
      ensureDbCompatibility: true,
    },
  };

  constructor(private config?: Partial<DualProviderConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Initialize the services for both providers
   */
  private initServices() {
    if (!this.primaryService) {
      try {
        this.primaryService = AIServiceFactory.getService(
          this.config!.primaryProvider
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize primary AI service: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (!this.secondaryService) {
      try {
        this.secondaryService = AIServiceFactory.getService(
          this.config!.secondaryProvider
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize secondary AI service: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Enhance a product using the dual-provider pipeline
   */
  async enhanceProduct(
    product: BasicProduct,
    options?: Partial<EnhancementOptions>
  ): Promise<EnhancedProduct> {
    console.log(
      `Starting dual-provider enhancement for product: ${product.name}`
    );
    const startTime = Date.now();

    try {
      // Initialize services
      this.initServices();

      // STEP 1: Initial generation with primary provider (e.g., Gemini)
      console.log(
        `Stage 1: Generating initial content with ${this.config!.primaryProvider}`
      );
      const initialEnhancement = await this.generateInitialContent(
        product,
        options
      );

      // STEP 2: Refinement with secondary provider (e.g., OpenAI)
      console.log(
        `Stage 2: Refining content with ${this.config!.secondaryProvider}`
      );
      const finalEnhancement = await this.refineContent(
        product,
        initialEnhancement,
        options
      );

      // Record metrics
      const totalTime = Date.now() - startTime;
      await aiMonitoring.recordRequest(
        "dual-provider",
        true,
        totalTime,
        undefined,
        undefined
      );

      console.log(`Dual-provider enhancement completed in ${totalTime}ms`);
      return finalEnhancement;
    } catch (error) {
      console.error(
        `Dual-provider enhancement failed for ${product.name}:`,
        error
      );

      // Record failure
      await aiMonitoring.recordRequest(
        "dual-provider",
        false,
        Date.now() - startTime,
        undefined,
        undefined
      );

      throw error;
    }
  }

  /**
   * Generate initial content using the primary provider
   */
  private async generateInitialContent(
    product: BasicProduct,
    options?: Partial<EnhancementOptions>
  ): Promise<EnhancedProduct> {
    // Create system prompt for initial generation
    const systemPrompt = this.createInitialGenerationPrompt(options);

    // Convert product to JSON for the prompt
    const productJson = JSON.stringify(product, null, 2);

    // Build user prompt
    const userPrompt = `Generate enhanced product data for the following STEM toy product:
    
${productJson}

Please provide all required fields for a complete product entry.`;

    // Generate content
    const response = await this.primaryService!.generateWithSystemPrompt(
      systemPrompt,
      userPrompt,
      { model: this.config!.primaryModel }
    );

    // Parse the response
    try {
      // Try to extract JSON from response
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) ||
        response.match(/```\n([\s\S]*?)\n```/) ||
        response.match(/\{[\s\S]*\}/);

      const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      const parsedResponse = JSON.parse(jsonContent);

      // Convert to EnhancedProduct format
      return this.normalizeToEnhancedProduct(product, parsedResponse);
    } catch (error) {
      console.error("Failed to parse primary provider response:", error);
      console.log("Raw response:", response);

      // Fallback: Return basic product with minimal enhancements
      return {
        ...product,
        enhancedDescription: response.substring(0, 1000),
        metaTitle: product.name,
        metaDescription: response.substring(0, 160),
        metaKeywords: [],
        tags: product.tags || [],
        learningOutcomes: [],
      };
    }
  }

  /**
   * Refine content using the secondary provider
   */
  private async refineContent(
    originalProduct: BasicProduct,
    initialEnhancement: EnhancedProduct,
    options?: Partial<EnhancementOptions>
  ): Promise<EnhancedProduct> {
    // Create system prompt for refinement
    const systemPrompt = this.createRefinementPrompt(options);

    // Convert products to JSON for the prompt
    const originalJson = JSON.stringify(originalProduct, null, 2);
    const enhancedJson = JSON.stringify(initialEnhancement, null, 2);

    // Build user prompt
    const userPrompt = `I need you to analyze and improve the AI-enhanced product data.

Original product data:
\`\`\`json
${originalJson}
\`\`\`

Initial AI-enhanced data from ${this.config!.primaryProvider}:
\`\`\`json
${enhancedJson}
\`\`\`

Please review the enhanced data, check for any issues, and provide an improved version that follows database schema requirements, has excellent SEO, proper grammar, and maintains factual accuracy.`;

    // Generate refined content
    const response = await this.secondaryService!.generateWithSystemPrompt(
      systemPrompt,
      userPrompt,
      { model: this.config!.secondaryModel }
    );

    // Parse the response
    try {
      // Try to extract JSON from response
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) ||
        response.match(/```\n([\s\S]*?)\n```/) ||
        response.match(/\{[\s\S]*\}/);

      const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      const parsedResponse = JSON.parse(jsonContent);

      // Convert to EnhancedProduct format and merge with initial enhancement
      return {
        ...initialEnhancement,
        ...this.normalizeToEnhancedProduct(originalProduct, parsedResponse),
        dualProviderEnhancement: true,
        refinements: parsedResponse.refinements || [],
      };
    } catch (error) {
      console.error("Failed to parse secondary provider response:", error);
      console.log("Raw response:", response);

      // Fallback: Return the initial enhancement
      return {
        ...initialEnhancement,
        dualProviderEnhancement: true,
        refinements: ["Error parsing refinement response"],
      };
    }
  }

  /**
   * Create system prompt for initial generation
   */
  private createInitialGenerationPrompt(
    options?: Partial<EnhancementOptions>
  ): string {
    // Check if Romanian language output is requested
    const useRomanian = options?.includeRomanianOptimization === true;

    return `You are an AI specialized in enhancing STEM toy product data for an e-commerce platform ${useRomanian ? "in Romania" : ""}.

Your task is to generate enhanced product information based on basic data provided.

${useRomanian ? "IMPORTANT: All product descriptions, titles, and metadata should be generated in Romanian language. Only the JSON field names should remain in English." : ""}

Please follow these guidelines:

1. Create a detailed, engaging product description (300-500 words) ${useRomanian ? "in Romanian language" : ""}
2. Generate SEO metadata (title, description, keywords) ${useRomanian ? "in Romanian language" : ""}
3. Identify appropriate tags and categories ${useRomanian ? "in Romanian language" : ""}
4. Determine learning outcomes and educational benefits
5. ${useRomanian ? "Ensure full optimization for Romanian market and curriculum alignment" : "If needed, optimize for Romanian market and curriculum alignment"}
6. Suggest appropriate age groups and STEM disciplines

Return your response as a JSON object with the following structure:
{
  "name": "Product Name",
  "enhancedDescription": "Detailed product description...",
  "metaTitle": "SEO-optimized title (60-70 characters)",
  "metaDescription": "SEO-optimized description (150-160 characters)",
  "metaKeywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...],
  "learningOutcomes": ["PROBLEM_SOLVING", "CREATIVITY", ...],
  "ageGroup": "AGE_GROUP_CODE",
  "stemDiscipline": "STEM_DISCIPLINE_CODE",
  "productType": "PRODUCT_TYPE_CODE",
  "romanianCompetencies": ["competency1", ...],
  "romanianCurriculumAlignment": ["alignment1", ...],
  "romanianEducationalLevel": "EDUCATIONAL_LEVEL_CODE",
  "romanianSubjectAreas": ["area1", ...]
}

Use valid JSON format and ensure all fields are properly formatted.`;
  }

  /**
   * Create system prompt for refinement
   */
  private createRefinementPrompt(
    options?: Partial<EnhancementOptions>
  ): string {
    // Check if Romanian language is being used
    const useRomanian = options?.includeRomanianOptimization === true;

    return `You are an expert AI reviewer specializing in STEM educational products${useRomanian ? " for the Romanian market" : ""}.

Your task is to analyze and improve AI-generated product data for a STEM toy e-commerce platform.
You'll review both the original product data and the initially enhanced version from another AI.

${useRomanian ? "IMPORTANT: All content is in Romanian language and must remain in Romanian. Your improvements should also be in Romanian language. Only the JSON field names should remain in English." : ""}

Focus on these key areas:
${
  this.config!.refinementOptions.validateContent
    ? "- CONTENT VALIDATION: Ensure all content is factually accurate, appropriate, and relevant to the product."
    : ""
}
${
  this.config!.refinementOptions.improveSEO
    ? "- SEO OPTIMIZATION: Improve metadata for better search visibility. Titles should be 60-70 characters, descriptions 150-160 characters, and keywords relevant and specific."
    : ""
}
${
  this.config!.refinementOptions.fixGrammar
    ? "- GRAMMAR & CLARITY: Fix any grammatical issues, improve readability, and ensure professional tone."
    : ""
}
${
  this.config!.refinementOptions.ensureDbCompatibility
    ? "- DATABASE COMPATIBILITY: Ensure all field formats match required database schema (correct data types, valid enum values, etc.)."
    : ""
}

REQUIRED OUTPUT FORMAT:
Return your improved version as a valid JSON object with the same structure as the original, plus a "refinements" array listing your key improvements:

{
  [all product fields with improvements],
  "refinements": [
    "Description: Improved readability and added specific educational benefits",
    "SEO: Enhanced keywords for better search visibility",
    etc.
  ]
}

Focus on substantial improvements rather than minor stylistic changes. Be especially careful with technical details and educational claims.`;
  }

  /**
   * Normalize response to EnhancedProduct format
   */
  private normalizeToEnhancedProduct(
    originalProduct: BasicProduct,
    enhancement: any
  ): EnhancedProduct {
    // Create base enhanced product
    const enhancedProduct: EnhancedProduct = {
      ...originalProduct,
      enhancedDescription:
        enhancement.enhancedDescription ||
        enhancement.description ||
        originalProduct.description ||
        "",
      metaTitle: enhancement.metaTitle || originalProduct.name,
      metaDescription:
        enhancement.metaDescription ||
        originalProduct.description?.substring(0, 160) ||
        "",
      metaKeywords: enhancement.metaKeywords || [],
      tags: enhancement.tags || originalProduct.tags || [],
      learningOutcomes: enhancement.learningOutcomes || [],
    };

    // Add optional fields if present in enhancement
    if (enhancement.ageGroup) enhancedProduct.ageGroup = enhancement.ageGroup;
    if (enhancement.stemDiscipline)
      enhancedProduct.stemDiscipline = enhancement.stemDiscipline;
    if (enhancement.productType)
      enhancedProduct.productType = enhancement.productType;

    // Romanian-specific fields
    if (enhancement.romanianCompetencies)
      enhancedProduct.romanianCompetencies = enhancement.romanianCompetencies;
    if (enhancement.romanianCurriculumAlignment)
      enhancedProduct.romanianCurriculumAlignment =
        enhancement.romanianCurriculumAlignment;
    if (enhancement.romanianEducationalLevel)
      enhancedProduct.romanianEducationalLevel =
        enhancement.romanianEducationalLevel;
    if (enhancement.romanianSubjectAreas)
      enhancedProduct.romanianSubjectAreas = enhancement.romanianSubjectAreas;
    if (enhancement.romanianMinistryApproval !== undefined)
      enhancedProduct.romanianMinistryApproval =
        enhancement.romanianMinistryApproval;
    if (enhancement.romanianEducationalCertification)
      enhancedProduct.romanianEducationalCertification =
        enhancement.romanianEducationalCertification;

    return enhancedProduct;
  }

  /**
   * Enhance multiple products in parallel
   */
  async enhanceProducts(
    products: BasicProduct[],
    options?: Partial<EnhancementOptions>,
    onProgress?: (progress: EnhancementProgress) => void
  ): Promise<EnhancedProduct[]> {
    const startTime = Date.now();
    const results: EnhancedProduct[] = [];
    const errors: Array<{ product: string; error: string }> = [];
    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Process products sequentially to avoid rate limiting
    for (const product of products) {
      try {
        const enhancedProduct = await this.enhanceProduct(product, options);
        results.push(enhancedProduct);
        processed++;
        successful++;

        // Report progress
        if (onProgress) {
          onProgress({
            total: products.length,
            processed,
            successful,
            failed,
            errors: errors,
            startTime,
            estimatedTimeRemaining: this.calculateEstimatedTime(
              startTime,
              processed,
              products.length
            ),
          });
        }
      } catch (error) {
        console.error(`Failed to enhance product ${product.name}:`, error);

        // Add to errors array
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          product: product.name,
          error: errorMessage,
        });

        // Add basic product with error flag
        results.push({
          ...product,
          enhancedDescription: product.description || "",
          metaTitle: product.name,
          metaDescription: product.description?.substring(0, 160) || "",
          metaKeywords: [],
          tags: product.tags || [],
          learningOutcomes: [],
          error: true,
          errorMessage: errorMessage,
        });

        processed++;
        failed++;

        // Report progress
        if (onProgress) {
          onProgress({
            total: products.length,
            processed,
            successful,
            failed,
            errors: errors,
            startTime,
            estimatedTimeRemaining: this.calculateEstimatedTime(
              startTime,
              processed,
              products.length
            ),
          });
        }
      }
    }

    return results;
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(
    startTime: number,
    processed: number,
    total: number
  ): number | undefined {
    if (processed === 0) return undefined;

    const elapsed = Date.now() - startTime;
    const averageTimePerItem = elapsed / processed;
    const remaining = total - processed;

    return averageTimePerItem * remaining;
  }

  /**
   * Get the current configuration
   */
  getConfig(): DualProviderConfig {
    return this.config as DualProviderConfig;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DualProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reset services to ensure they're recreated with new config
    this.primaryService = null;
    this.secondaryService = null;
  }
}
