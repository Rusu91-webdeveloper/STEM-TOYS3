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
import {
  BasicProduct,
  EnhancedProduct,
  EnhancementOptions,
  EnhancementProgress,
} from "./types";
import { AISchemaValidator } from "./schema-validator";

// Use simplified monitoring to avoid dependency issues
import { simpleAIMonitoring } from "./monitoring-simple";

const aiMonitoring = simpleAIMonitoring;

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
    secondaryModel: "gpt-4o-mini", // Upgraded from gpt-3.5-turbo for better performance
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
    console.log(
      `Initializing dual-provider services: primary=${this.config!.primaryProvider}, secondary=${this.config!.secondaryProvider}`
    );

    if (!this.primaryService) {
      try {
        console.log(
          `Creating primary service: ${this.config!.primaryProvider}`
        );
        this.primaryService = AIServiceFactory.getService(
          this.config!.primaryProvider
        );
        console.log(
          `Primary service created successfully: ${this.config!.primaryProvider}`
        );
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
        console.log(
          `Creating secondary service: ${this.config!.secondaryProvider}`
        );
        this.secondaryService = AIServiceFactory.getService(
          this.config!.secondaryProvider
        );
        console.log(
          `Secondary service created successfully: ${this.config!.secondaryProvider}`
        );
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

      let finalEnhancement: EnhancedProduct;
      let usedFallback = false;

      try {
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
        finalEnhancement = await this.refineContent(
          product,
          initialEnhancement,
          options
        );
      } catch (primaryError) {
        // Check if this is a rate limit/quota error from primary provider
        if (this.isQuotaError(primaryError)) {
          console.log(
            `Primary provider (${this.config!.primaryProvider}) quota exceeded, falling back to ${this.config!.secondaryProvider} for full enhancement`
          );
          usedFallback = true;

          // Use secondary provider for full enhancement
          finalEnhancement = await this.generateWithSecondaryProvider(
            product,
            options
          );

          // Mark that fallback was used
          finalEnhancement.fallbackUsed = true;
          finalEnhancement.fallbackReason = `Primary provider quota exceeded: ${this.getErrorMessage(primaryError)}`;
        } else {
          // Re-throw if not a quota error
          throw primaryError;
        }
      }

      // Record metrics
      const totalTime = Date.now() - startTime;
      await aiMonitoring.recordRequest(
        usedFallback ? "dual-provider-fallback" : "dual-provider",
        true,
        totalTime,
        undefined,
        undefined
      );

      // Validate the final enhancement against database schema
      const validation =
        AISchemaValidator.validateEnhancedProduct(finalEnhancement);

      if (!validation.isValid) {
        console.warn(
          `Schema validation failed for ${product.name}:`,
          validation.errors
        );

        // Use corrected product if available
        if (validation.correctedProduct) {
          console.log(`Using corrected product data for ${product.name}`);
          finalEnhancement = {
            ...validation.correctedProduct,
            fallbackUsed: finalEnhancement.fallbackUsed || true,
            fallbackReason:
              finalEnhancement.fallbackReason ||
              "Schema validation corrections applied",
          };
        }
      }

      console.log(
        `Dual-provider enhancement completed in ${totalTime}ms${usedFallback ? " (used fallback)" : ""}`
      );
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
   * Check if error is a quota/rate limit error
   */
  private isQuotaError(error: any): boolean {
    const errorMessage = this.getErrorMessage(error).toLowerCase();
    return (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("limit exceeded") ||
      errorMessage.includes("billing") ||
      errorMessage.includes("free tier")
    );
  }

  /**
   * Get error message safely
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    return String(error);
  }

  /**
   * Generate content using secondary provider for full enhancement
   */
  private async generateWithSecondaryProvider(
    product: BasicProduct,
    options?: Partial<EnhancementOptions>
  ): Promise<EnhancedProduct> {
    console.log(
      `Generating full enhancement with secondary provider for: ${product.name}`
    );

    // First, try to research the product online for better context
    const productContext = await this.researchProductOnline(product);

    // Create system prompt for full generation
    const systemPrompt = this.createFullGenerationPrompt(options);

    // Build comprehensive user prompt with research context
    const userPrompt = this.buildEnhancedUserPrompt(
      product,
      productContext,
      options
    );

    console.log("Sending request to OpenAI with enhanced context...");

    // Generate content with secondary provider
    const response = await this.secondaryService!.generateWithSystemPrompt(
      systemPrompt,
      userPrompt,
      { model: this.config!.secondaryModel }
    );

    console.log("Received response from OpenAI, parsing...");
    console.log("Raw response length:", response.length);
    console.log("Raw response preview:", response.substring(0, 200) + "...");

    // Parse the response with improved error handling
    try {
      const parsedResponse = this.parseAIResponse(response);
      console.log("Successfully parsed AI response");

      // Convert to EnhancedProduct format with rich content
      const enhancedProduct = this.createRichEnhancedProduct(
        product,
        parsedResponse,
        options
      );

      return {
        ...enhancedProduct,
        generatedByFallback: true,
      };
    } catch (error) {
      console.error("Failed to parse secondary provider response:", error);
      console.log("Attempting to create enhanced product from raw response...");

      // Enhanced fallback: Try to extract useful information from raw response
      return this.createEnhancedProductFromRawResponse(
        product,
        response,
        options
      );
    }
  }

  /**
   * Research product online for better context
   */
  private async researchProductOnline(product: BasicProduct): Promise<string> {
    try {
      // Simple product research - in a real implementation, you might use web scraping
      // For now, we'll create context based on the product name and category
      const searchTerms = `${product.name} ${product.category} STEM educational toy specifications features`;

      return `Product Research Context:
- Product Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price}
- Description: ${product.description || "Basic educational kit for learning"}

Based on similar products in this category, this appears to be an educational STEM toy designed for hands-on learning. 
It likely includes components for building, programming, or experimenting, suitable for developing technical skills.`;
    } catch (error) {
      console.log("Product research failed, using basic context:", error);
      return `Basic product information: ${product.name} - ${product.category} educational kit.`;
    }
  }

  /**
   * Build enhanced user prompt with research context
   */
  private buildEnhancedUserPrompt(
    product: BasicProduct,
    context: string,
    options?: Partial<EnhancementOptions>
  ): string {
    const useRomanian = options?.includeRomanianOptimization === true;

    return `Generate complete enhanced product data for this STEM educational toy.

PRODUCT INFORMATION:
${JSON.stringify(product, null, 2)}

RESEARCH CONTEXT:
${context}

REQUIREMENTS:
${useRomanian ? "- ALL content must be in ROMANIAN language (descriptions, titles, keywords, etc.)" : "- Content should be in English unless specified otherwise"}
- Create a detailed, engaging product description (400-600 words) highlighting educational benefits
- Generate comprehensive SEO metadata (title, description, keywords)
- Identify specific learning outcomes and educational benefits
- Suggest appropriate age groups and STEM disciplines
- Include Romanian curriculum alignment if applicable
- Create relevant product tags and categories

DATABASE SCHEMA CONSTRAINTS (CRITICAL - Must use exact values):
- ageGroup: Must be one of: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- stemDiscipline: Must be one of: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- productType: Must be one of: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- learningOutcomes: Must be array containing only: "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
- romanianEducationalLevel: Must be one of: "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"

RETURN FORMAT: Valid JSON object with these fields:
{
  "enhancedDescription": "Detailed product description in ${useRomanian ? "Romanian" : "English"}",
  "metaTitle": "SEO-optimized title (60-70 characters)",
  "metaDescription": "SEO description (150-160 characters)", 
  "metaKeywords": ["keyword1", "keyword2", "keyword3", ...],
  "tags": ["tag1", "tag2", "tag3", ...],
  "learningOutcomes": ["PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"],
  "ageGroup": "ELEMENTARY_6_8",
  "stemDiscipline": "TECHNOLOGY",
  "productType": "EXPERIMENT_KITS",
  "romanianCompetencies": ["competency1", ...],
  "romanianCurriculumAlignment": ["alignment1", ...],
  "romanianEducationalLevel": "PRIMAR",
  "romanianSubjectAreas": ["area1", ...]
}

CRITICAL: Use ONLY the exact enum values specified above. Invalid values will cause database errors.

Generate comprehensive, educational content that would help parents and educators understand the value of this STEM toy.`;
  }

  /**
   * Parse AI response with multiple fallback strategies
   */
  private parseAIResponse(response: string): any {
    // Strategy 1: Try to find JSON in code blocks
    let jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Strategy 2: Try to find JSON in any code blocks
    jsonMatch = response.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Strategy 3: Try to find JSON object in the response
    jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Strategy 4: Try to parse the entire response as JSON
    return JSON.parse(response);
  }

  /**
   * Create rich enhanced product from parsed AI response
   */
  private createRichEnhancedProduct(
    product: BasicProduct,
    aiResponse: any,
    options?: Partial<EnhancementOptions>
  ): EnhancedProduct {
    return {
      ...product,
      // CRITICAL: Explicitly preserve original data that should not be changed by AI
      stockQuantity: product.stockQuantity || 0,
      price: product.price,
      sku: product.sku,
      images: product.images || [],
      // AI-enhanced fields
      enhancedDescription:
        aiResponse.enhancedDescription ||
        aiResponse.description ||
        product.description ||
        "",
      metaTitle: aiResponse.metaTitle || product.name,
      metaDescription:
        aiResponse.metaDescription ||
        aiResponse.enhancedDescription?.substring(0, 160) ||
        "",
      metaKeywords: aiResponse.metaKeywords || aiResponse.keywords || [],
      tags: aiResponse.tags || product.tags || [],
      learningOutcomes: aiResponse.learningOutcomes || [
        "PROBLEM_SOLVING",
        "CREATIVITY",
      ],
      ageGroup: aiResponse.ageGroup,
      stemDiscipline: aiResponse.stemDiscipline,
      productType: aiResponse.productType,
      romanianCompetencies: aiResponse.romanianCompetencies || [],
      romanianCurriculumAlignment: aiResponse.romanianCurriculumAlignment || [],
      romanianEducationalLevel: aiResponse.romanianEducationalLevel,
      romanianSubjectAreas: aiResponse.romanianSubjectAreas || [],
      romanianMinistryApproval: aiResponse.romanianMinistryApproval || false,
      romanianEducationalCertification:
        aiResponse.romanianEducationalCertification,
    };
  }

  /**
   * Create enhanced product from raw response when JSON parsing fails
   */
  private createEnhancedProductFromRawResponse(
    product: BasicProduct,
    rawResponse: string,
    options?: Partial<EnhancementOptions>
  ): EnhancedProduct {
    console.log("Creating enhanced product from raw response");

    // Extract useful information from the raw response
    const lines = rawResponse.split("\n").filter(line => line.trim());

    // Try to find a description
    let enhancedDescription = product.description || "";
    const descriptionLines = lines.filter(
      line =>
        line.length > 50 &&
        !line.includes("{") &&
        !line.includes("}") &&
        !line.includes("JSON") &&
        !line.includes("```")
    );

    if (descriptionLines.length > 0) {
      enhancedDescription = descriptionLines
        .slice(0, 3)
        .join(" ")
        .substring(0, 1000);
    } else if (rawResponse.length > 100) {
      enhancedDescription = rawResponse.substring(0, 1000);
    }

    // Generate basic Romanian content if requested
    const useRomanian = options?.includeRomanianOptimization === true;

    return {
      ...product,
      // CRITICAL: Explicitly preserve original data that should not be changed by AI
      stockQuantity: product.stockQuantity || 0,
      price: product.price,
      sku: product.sku,
      images: product.images || [],
      // AI-enhanced fields with fallback values
      enhancedDescription: enhancedDescription,
      metaTitle: useRomanian
        ? `${product.name} - Kit Educational STEM`
        : `${product.name} - Educational STEM Kit`,
      metaDescription: enhancedDescription.substring(0, 160),
      metaKeywords: useRomanian
        ? ["stem", "educativ", "kit", "arduino", "electronică", "programare"]
        : [
            "stem",
            "educational",
            "kit",
            "arduino",
            "electronics",
            "programming",
          ],
      tags: useRomanian
        ? ["STEM", "Educativ", "Electronică", "Programare"]
        : ["STEM", "Educational", "Electronics", "Programming"],
      learningOutcomes: [
        "PROBLEM_SOLVING",
        "CREATIVITY",
        "CRITICAL_THINKING",
        "MOTOR_SKILLS",
      ],
      ageGroup: "ELEMENTARY_6_8",
      stemDiscipline: "TECHNOLOGY",
      productType: "EXPERIMENT_KITS", // Fixed to use valid enum value
      romanianCompetencies: useRomanian
        ? ["Gândire computațională", "Rezolvarea problemelor"]
        : [],
      romanianCurriculumAlignment: useRomanian
        ? ["Tehnologia informației", "Științe"]
        : [],
      romanianEducationalLevel: "PRIMAR", // Fixed to use valid enum value
      romanianSubjectAreas: useRomanian
        ? ["Tehnologia informației", "Matematică", "Științe"]
        : [],
      generatedByFallback: true,
      parseError: true,
    };
  }

  /**
   * Create system prompt for full generation (used when primary provider fails)
   */
  private createFullGenerationPrompt(
    options?: Partial<EnhancementOptions>
  ): string {
    const useRomanian = options?.includeRomanianOptimization === true;

    return `You are an AI specialized in enhancing STEM toy product data for an e-commerce platform${useRomanian ? " in Romania" : ""}.

Your task is to generate COMPLETE enhanced product information based on basic data provided.

${useRomanian ? "IMPORTANT: All product descriptions, titles, and metadata should be generated in Romanian language. Only the JSON field names should remain in English." : ""}

Please follow these comprehensive guidelines:

1. Create a detailed, engaging product description (400-600 words) that:
   - Highlights educational benefits
   - Explains how the product works
   - Describes learning outcomes
   - Mentions age appropriateness
   - Includes usage scenarios
   ${useRomanian ? "- Written in fluent Romanian" : ""}

2. Generate comprehensive SEO metadata:
   - Title (60-70 characters, keyword-rich)
   - Description (150-160 characters, compelling)
   - Keywords (8-12 relevant terms)
   ${useRomanian ? "- All in Romanian language" : ""}

3. Identify and categorize using EXACT database values:
   - Appropriate tags and categories
   - Learning outcomes: ONLY "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
   - Age groups: ONLY "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
   - STEM disciplines: ONLY "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
   - Product types: ONLY "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"

4. ${useRomanian ? "Romanian market optimization:" : "If applicable, include Romanian market optimization:"}
   - Curriculum alignment with Romanian education system
   - Key competencies developed
   - Educational level: ONLY "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"
   - Subject area connections

DATABASE SCHEMA CONSTRAINTS (CRITICAL):
- Use ONLY the exact enum values listed above
- Invalid values will cause database insertion failures
- All enum fields must use the specified values exactly

Return your response as a complete JSON object with all required fields properly formatted.
Ensure the content is engaging, educational, and market-appropriate.`;
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

DATABASE SCHEMA CONSTRAINTS (CRITICAL - Must use exact values):
- ageGroup: Must be one of: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- stemDiscipline: Must be one of: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- productType: Must be one of: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- learningOutcomes: Must be array containing only: "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
- romanianEducationalLevel: Must be one of: "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"

Return your response as a JSON object with the following structure:
{
  "name": "Product Name",
  "enhancedDescription": "Detailed product description...",
  "metaTitle": "SEO-optimized title (60-70 characters)",
  "metaDescription": "SEO-optimized description (150-160 characters)",
  "metaKeywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...],
  "learningOutcomes": ["PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"],
  "ageGroup": "ELEMENTARY_6_8",
  "stemDiscipline": "TECHNOLOGY", 
  "productType": "EXPERIMENT_KITS",
  "romanianCompetencies": ["competency1", ...],
  "romanianCurriculumAlignment": ["alignment1", ...],
  "romanianEducationalLevel": "PRIMAR",
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
      // CRITICAL: Explicitly preserve original data that should not be changed by AI
      stockQuantity: originalProduct.stockQuantity || 0,
      price: originalProduct.price,
      sku: originalProduct.sku,
      images: originalProduct.images || [],
      // AI-enhanced fields
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
    let fallbackUsed = 0;

    // Process products sequentially to avoid rate limiting
    for (const product of products) {
      try {
        const enhancedProduct = await this.enhanceProduct(product, options);
        results.push(enhancedProduct);
        processed++;
        successful++;

        // Track if fallback was used
        if (
          enhancedProduct.fallbackUsed ||
          enhancedProduct.generatedByFallback
        ) {
          fallbackUsed++;
        }

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
            fallbackUsed,
          });
        }
      } catch (error) {
        console.error(`Failed to enhance product ${product.name}:`, error);

        // Add to errors array
        const errorMessage = this.getErrorMessage(error);
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
            fallbackUsed,
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
