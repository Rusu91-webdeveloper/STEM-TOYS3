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
            // Mark as AI-enhanced for status handling
            aiEnhanced: true,
            requiresApproval: true,
          };
        } else {
          // Mark as AI-enhanced for status handling
          finalEnhancement = {
            ...finalEnhancement,
            aiEnhanced: true,
            requiresApproval: true,
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

CRITICAL DATABASE SCHEMA REQUIREMENTS (MUST FOLLOW EXACTLY):
- ageGroup: ONE OF: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- stemDiscipline: ONE OF: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- productType: ONE OF: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- learningOutcomes: ARRAY FROM: "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
- romanianEducationalLevel: ONE OF: "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"

AGE GROUP DETERMINATION RULES (ANALYZE ORIGINAL DESCRIPTION):
- If description contains "ages 12+", "ages 12-16", "ages 13+", "adolescents", "teens", "teenagers" → "TEENS_13_PLUS"
- If description contains "ages 9-12", "ages 10-14", "middle school", "ages 9+", "ages 10+" → "MIDDLE_SCHOOL_9_12"
- If description contains "ages 6-8", "ages 6-12", "elementary", "ages 6+", "primary school" → "ELEMENTARY_6_8"
- If description contains "ages 3-5", "preschool", "ages 3-6" → "PRESCHOOL_3_5"
- If description contains "ages 1-3", "toddlers", "ages 1-4" → "TODDLERS_1_3"
- DEFAULT: "ELEMENTARY_6_8" (most common for STEM toys)

STEM DISCIPLINE CLASSIFICATION RULES:
- SCIENCE: Chemistry, biology, physics, geology, astronomy, fossils, experiments, nature study, scientific methods
- TECHNOLOGY: Programming, coding, electronics, circuits, computers, digital, software, apps, robotics
- ENGINEERING: Building, construction, design, mechanics, structures, problem-solving, invention
- MATHEMATICS: Numbers, patterns, logic puzzles, geometry, calculations, mathematical thinking
- GENERAL: Mixed disciplines or unclear from description

PRODUCT TYPE CLASSIFICATION RULES:
- ROBOTICS: Robots, programmable robots, robot kits, robot building
- PUZZLES: Logic puzzles, brain teasers, problem-solving puzzles
- CONSTRUCTION_SETS: Building sets, construction toys, building blocks, model kits
- EXPERIMENT_KITS: Science experiments, chemistry sets, electronic kits, discovery kits
- BOARD_GAMES: Strategy games, educational games, learning games on boards

CONTENT LENGTH GUIDELINES BY PRODUCT TYPE:
- ROBOTICS: 500-700 words (complex programming and building concepts need detailed explanation)
- CONSTRUCTION_SETS: 400-600 words (building instructions and design concepts)
- EXPERIMENT_KITS: 450-650 words (safety instructions, experimental procedures, scientific concepts)
- PUZZLES: 350-500 words (shorter, focused on problem-solving strategies)
- BOARD_GAMES: 350-500 words (rules, gameplay mechanics, educational objectives)

REQUIREMENTS:
${useRomanian ? "- ALL content must be in ROMANIAN language (descriptions, titles, keywords, etc.)" : "- Content should be in English unless specified otherwise"}
- Create a detailed, engaging product description using CONTENT LENGTH GUIDELINES above highlighting educational benefits
- Generate comprehensive SEO metadata (title, description, keywords)
- Identify specific learning outcomes and educational benefits
- Apply the exact AGE GROUP DETERMINATION RULES above based on original description
- Apply the exact STEM DISCIPLINE CLASSIFICATION RULES above based on product content
- Apply the exact PRODUCT TYPE CLASSIFICATION RULES above based on product nature
- Include Romanian curriculum alignment if applicable
- Create relevant product tags and categories

ANALYSIS STEPS (FOLLOW EXACTLY):
1. Read the original product description carefully
2. Apply age group determination rules to select EXACT enum value
3. Apply STEM discipline classification rules to select EXACT enum value
4. Apply product type classification rules to select EXACT enum value
5. Select 2-4 learning outcomes from the allowed list
6. Determine content length based on PRODUCT TYPE GUIDELINES above
7. Generate content based on these determined values and length guidelines

CRITICAL DATA STRUCTURE REQUIREMENTS:
The JSON response will be saved in specific database fields. Follow these rules EXACTLY:

DATABASE FIELD MAPPING:
- enhancedDescription → saves to Product.description field
- metaTitle → saves to Product.attributes.metaTitle (for SEO)
- metaDescription → saves to Product.attributes.metaDescription (for SEO)
- metaKeywords → saves to Product.attributes.metaKeywords (for SEO)
- ageGroup → saves to Product.ageGroup field (MUST be valid enum)
- stemDiscipline → saves to Product.stemDiscipline field (MUST be valid enum)
- productType → saves to Product.productType field (MUST be valid enum)
- learningOutcomes → saves to Product.learningOutcomes field (array of valid enums)
- romanianCompetencies → saves to Product.romanianCompetencies field
- romanianCurriculumAlignment → saves to Product.romanianCurriculumAlignment field
- romanianEducationalLevel → saves to Product.romanianEducationalLevel field
- romanianSubjectAreas → saves to Product.romanianSubjectAreas field

DO NOT include fields that don't exist in the database schema.
DO NOT create nested objects unless specified.
DO NOT save operational data (timestamps, tracking) - that's handled by the system.

REQUIRED OUTPUT FORMAT:
{
  "enhancedDescription": "Detailed product description in ${useRomanian ? "Romanian" : "English"}",
  "metaTitle": "SEO-optimized title (60-70 characters) - goes to attributes.metaTitle",
  "metaDescription": "SEO description (150-160 characters) - goes to attributes.metaDescription",
  "metaKeywords": ["keyword1", "keyword2", "keyword3", ...] - goes to attributes.metaKeywords,
  "tags": ["tag1", "tag2", "tag3", ...],
  "learningOutcomes": ["PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"],
  "ageGroup": "DETERMINE_FROM_RULES_ABOVE - saves to ageGroup field",
  "stemDiscipline": "DETERMINE_FROM_RULES_ABOVE - saves to stemDiscipline field",
  "productType": "DETERMINE_FROM_RULES_ABOVE - saves to productType field",
  "romanianCompetencies": ["competency1", ...],
  "romanianCurriculumAlignment": ["alignment1", ...],
  "romanianEducationalLevel": "DETERMINE_FROM_AGE_GROUP",
  "romanianSubjectAreas": ["area1", ...]
}

VALIDATION CHECKLIST:
- [ ] ageGroup is one of: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- [ ] stemDiscipline is one of: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- [ ] productType is one of: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- [ ] learningOutcomes contains only valid enum values
- [ ] No extra fields that don't exist in database schema
- [ ] SEO fields (metaTitle, metaDescription, metaKeywords) are properly formatted

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
    // Validate enum values before creating enhanced product
    const validatedResponse = this.validateEnumValues(aiResponse);

    return {
      ...product,
      // CRITICAL: Explicitly preserve original data that should not be changed by AI
      stockQuantity: product.stockQuantity || 0,
      price: product.price,
      sku: product.sku,
      images: product.images || [],
      // AI-enhanced fields
      enhancedDescription:
        validatedResponse.enhancedDescription ||
        validatedResponse.description ||
        product.description ||
        "",
      metaTitle: validatedResponse.metaTitle || product.name,
      metaDescription:
        validatedResponse.metaDescription ||
        validatedResponse.enhancedDescription?.substring(0, 160) ||
        "",
      metaKeywords:
        validatedResponse.metaKeywords || validatedResponse.keywords || [],
      tags: validatedResponse.tags || product.tags || [],
      learningOutcomes: validatedResponse.learningOutcomes || [
        "PROBLEM_SOLVING",
        "CREATIVITY",
      ],
      ageGroup: validatedResponse.ageGroup,
      stemDiscipline: validatedResponse.stemDiscipline,
      productType: validatedResponse.productType,
      romanianCompetencies: validatedResponse.romanianCompetencies || [],
      romanianCurriculumAlignment:
        validatedResponse.romanianCurriculumAlignment || [],
      romanianEducationalLevel: validatedResponse.romanianEducationalLevel,
      romanianSubjectAreas: validatedResponse.romanianSubjectAreas || [],
      romanianMinistryApproval:
        validatedResponse.romanianMinistryApproval || false,
      romanianEducationalCertification:
        validatedResponse.romanianEducationalCertification,
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

    // Create basic enhancement with validated enum values
    const metaTitleBase = useRomanian
      ? `${product.name} - Kit Educational STEM`
      : `${product.name} - Educational STEM Kit`;

    const basicEnhancement = {
      enhancedDescription: enhancedDescription,
      metaTitle: metaTitleBase.substring(0, 70),
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
    };

    // Validate the enhancement
    const validatedEnhancement = this.validateEnumValues(basicEnhancement);

    return {
      ...product,
      // CRITICAL: Explicitly preserve original data that should not be changed by AI
      stockQuantity: product.stockQuantity || 0,
      price: product.price,
      sku: product.sku,
      images: product.images || [],
      // AI-enhanced fields with validated values
      enhancedDescription: validatedEnhancement.enhancedDescription,
      metaTitle: validatedEnhancement.metaTitle,
      metaDescription: validatedEnhancement.metaDescription,
      metaKeywords: validatedEnhancement.metaKeywords,
      tags: validatedEnhancement.tags,
      learningOutcomes: validatedEnhancement.learningOutcomes,
      ageGroup: validatedEnhancement.ageGroup,
      stemDiscipline: validatedEnhancement.stemDiscipline,
      productType: validatedEnhancement.productType,
      romanianCompetencies: validatedEnhancement.romanianCompetencies,
      romanianCurriculumAlignment:
        validatedEnhancement.romanianCurriculumAlignment,
      romanianEducationalLevel: validatedEnhancement.romanianEducationalLevel,
      romanianSubjectAreas: validatedEnhancement.romanianSubjectAreas,
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

CRITICAL DATABASE SCHEMA REQUIREMENTS (MUST FOLLOW EXACTLY):
- ageGroup: ONE OF: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- stemDiscipline: ONE OF: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- productType: ONE OF: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- learningOutcomes: ARRAY FROM: "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
- romanianEducationalLevel: ONE OF: "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"

AGE GROUP DETERMINATION RULES (ANALYZE ORIGINAL DESCRIPTION):
- If description contains "ages 12+", "ages 12-16", "ages 13+", "adolescents", "teens", "teenagers" → "TEENS_13_PLUS"
- If description contains "ages 9-12", "ages 10-14", "middle school", "ages 9+", "ages 10+" → "MIDDLE_SCHOOL_9_12"
- If description contains "ages 6-8", "ages 6-12", "elementary", "ages 6+", "primary school" → "ELEMENTARY_6_8"
- If description contains "ages 3-5", "preschool", "ages 3-6" → "PRESCHOOL_3_5"
- If description contains "ages 1-3", "toddlers", "ages 1-4" → "TODDLERS_1_3"
- DEFAULT: "ELEMENTARY_6_8" (most common for STEM toys)

STEM DISCIPLINE CLASSIFICATION RULES:
- SCIENCE: Chemistry, biology, physics, geology, astronomy, fossils, experiments, nature study, scientific methods
- TECHNOLOGY: Programming, coding, electronics, circuits, computers, digital, software, apps, robotics
- ENGINEERING: Building, construction, design, mechanics, structures, problem-solving, invention
- MATHEMATICS: Numbers, patterns, logic puzzles, geometry, calculations, mathematical thinking
- GENERAL: Mixed disciplines or unclear from description

PRODUCT TYPE CLASSIFICATION RULES:
- ROBOTICS: Robots, programmable robots, robot kits, robot building
- PUZZLES: Logic puzzles, brain teasers, problem-solving puzzles
- CONSTRUCTION_SETS: Building sets, construction toys, building blocks, model kits
- EXPERIMENT_KITS: Science experiments, chemistry sets, electronic kits, discovery kits
- BOARD_GAMES: Strategy games, educational games, learning games on boards

ANALYSIS STEPS (FOLLOW EXACTLY):
1. Read the original product description carefully
2. Apply age group determination rules to select EXACT enum value
3. Apply STEM discipline classification rules to select EXACT enum value
4. Apply product type classification rules to select EXACT enum value
5. Select 2-4 learning outcomes from the allowed list
6. Determine content length based on PRODUCT TYPE GUIDELINES above
7. Generate content based on these determined values and length guidelines

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

3. Apply the exact classification rules above:
   - Age groups using AGE GROUP DETERMINATION RULES
   - STEM disciplines using STEM DISCIPLINE CLASSIFICATION RULES
   - Product types using PRODUCT TYPE CLASSIFICATION RULES
   - Learning outcomes from the allowed list

4. ${useRomanian ? "Romanian market optimization:" : "If applicable, include Romanian market optimization:"}
   - Curriculum alignment with Romanian education system
   - Key competencies developed
   - Educational level determined from age group
   - Subject area connections

DATABASE SCHEMA CONSTRAINTS (CRITICAL):
- Use ONLY the exact enum values listed above
- Invalid values will cause database insertion failures
- All enum fields must use the specified values exactly
- Double-check all enum values before finalizing response

CRITICAL DATA STRUCTURE REQUIREMENTS:
The JSON response will be saved in specific database fields. Follow these rules EXACTLY:

DATABASE FIELD MAPPING:
- enhancedDescription → saves to Product.description field
- metaTitle → saves to Product.attributes.metaTitle (for SEO)
- metaDescription → saves to Product.attributes.metaDescription (for SEO)
- metaKeywords → saves to Product.attributes.metaKeywords (for SEO)
- ageGroup → saves to Product.ageGroup field (MUST be valid enum)
- stemDiscipline → saves to Product.stemDiscipline field (MUST be valid enum)
- productType → saves to Product.productType field (MUST be valid enum)
- learningOutcomes → saves to Product.learningOutcomes field (array of valid enums)
- romanianCompetencies → saves to Product.romanianCompetencies field
- romanianCurriculumAlignment → saves to Product.romanianCurriculumAlignment field
- romanianEducationalLevel → saves to Product.romanianEducationalLevel field
- romanianSubjectAreas → saves to Product.romanianSubjectAreas field

DO NOT include fields that don't exist in the database schema.
DO NOT create nested objects unless specified.
DO NOT save operational data (timestamps, tracking) - that's handled by the system.

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

CRITICAL DATABASE SCHEMA REQUIREMENTS (MUST FOLLOW EXACTLY):
- ageGroup: ONE OF: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- stemDiscipline: ONE OF: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- productType: ONE OF: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- learningOutcomes: ARRAY FROM: "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
- romanianEducationalLevel: ONE OF: "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"

AGE GROUP DETERMINATION RULES (ANALYZE ORIGINAL DESCRIPTION):
- If description contains "ages 12+", "ages 12-16", "ages 13+", "adolescents", "teens", "teenagers" → "TEENS_13_PLUS"
- If description contains "ages 9-12", "ages 10-14", "middle school", "ages 9+", "ages 10+" → "MIDDLE_SCHOOL_9_12"
- If description contains "ages 6-8", "ages 6-12", "elementary", "ages 6+", "primary school" → "ELEMENTARY_6_8"
- If description contains "ages 3-5", "preschool", "ages 3-6" → "PRESCHOOL_3_5"
- If description contains "ages 1-3", "toddlers", "ages 1-4" → "TODDLERS_1_3"
- DEFAULT: "ELEMENTARY_6_8" (most common for STEM toys)

STEM DISCIPLINE CLASSIFICATION RULES:
- SCIENCE: Chemistry, biology, physics, geology, astronomy, fossils, experiments, nature study, scientific methods
- TECHNOLOGY: Programming, coding, electronics, circuits, computers, digital, software, apps, robotics
- ENGINEERING: Building, construction, design, mechanics, structures, problem-solving, invention
- MATHEMATICS: Numbers, patterns, logic puzzles, geometry, calculations, mathematical thinking
- GENERAL: Mixed disciplines or unclear from description

PRODUCT TYPE CLASSIFICATION RULES:
- ROBOTICS: Robots, programmable robots, robot kits, robot building
- PUZZLES: Logic puzzles, brain teasers, problem-solving puzzles
- CONSTRUCTION_SETS: Building sets, construction toys, building blocks, model kits
- EXPERIMENT_KITS: Science experiments, chemistry sets, electronic kits, discovery kits
- BOARD_GAMES: Strategy games, educational games, learning games on boards

ANALYSIS STEPS (FOLLOW EXACTLY):
1. Read the original product description carefully
2. Apply age group determination rules to select EXACT enum value
3. Apply STEM discipline classification rules to select EXACT enum value
4. Apply product type classification rules to select EXACT enum value
5. Select 2-4 learning outcomes from the allowed list
6. Determine content length based on PRODUCT TYPE GUIDELINES above
7. Generate content based on these determined values and length guidelines

Please follow these guidelines:

1. Create a detailed, engaging product description (300-500 words) ${useRomanian ? "in Romanian language" : ""}
2. Generate SEO metadata (title, description, keywords) ${useRomanian ? "in Romanian language" : ""}
3. Identify appropriate tags and categories ${useRomanian ? "in Romanian language" : ""}
4. Apply the exact AGE GROUP DETERMINATION RULES above
5. Apply the exact STEM DISCIPLINE CLASSIFICATION RULES above
6. Apply the exact PRODUCT TYPE CLASSIFICATION RULES above
7. Select appropriate learning outcomes from the allowed list
8. ${useRomanian ? "Ensure full optimization for Romanian market and curriculum alignment" : "If needed, optimize for Romanian market and curriculum alignment"}

CRITICAL DATA STRUCTURE REQUIREMENTS:
The JSON response will be saved in specific database fields. Follow these rules EXACTLY:

DATABASE FIELD MAPPING:
- enhancedDescription → saves to Product.description field
- metaTitle → saves to Product.attributes.metaTitle (for SEO)
- metaDescription → saves to Product.attributes.metaDescription (for SEO)
- metaKeywords → saves to Product.attributes.metaKeywords (for SEO)
- ageGroup → saves to Product.ageGroup field (MUST be valid enum)
- stemDiscipline → saves to Product.stemDiscipline field (MUST be valid enum)
- productType → saves to Product.productType field (MUST be valid enum)
- learningOutcomes → saves to Product.learningOutcomes field (array of valid enums)
- romanianCompetencies → saves to Product.romanianCompetencies field
- romanianCurriculumAlignment → saves to Product.romanianCurriculumAlignment field
- romanianEducationalLevel → saves to Product.romanianEducationalLevel field
- romanianSubjectAreas → saves to Product.romanianSubjectAreas field

DO NOT include fields that don't exist in the database schema.
DO NOT create nested objects unless specified.
DO NOT save operational data (timestamps, tracking) - that's handled by the system.

REQUIRED OUTPUT FORMAT:
{
  "name": "Product Name",
  "enhancedDescription": "Detailed product description...",
  "metaTitle": "SEO-optimized title (60-70 characters) - goes to attributes.metaTitle",
  "metaDescription": "SEO-optimized description (150-160 characters) - goes to attributes.metaDescription",
  "metaKeywords": ["keyword1", "keyword2", ...] - goes to attributes.metaKeywords,
  "tags": ["tag1", "tag2", ...],
  "learningOutcomes": ["PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"],
  "ageGroup": "DETERMINE_FROM_RULES_ABOVE - saves to ageGroup field",
  "stemDiscipline": "DETERMINE_FROM_RULES_ABOVE - saves to stemDiscipline field",
  "productType": "DETERMINE_FROM_RULES_ABOVE - saves to productType field",
  "romanianCompetencies": ["competency1", ...],
  "romanianCurriculumAlignment": ["alignment1", ...],
  "romanianEducationalLevel": "DETERMINE_FROM_AGE_GROUP",
  "romanianSubjectAreas": ["area1", ...]
}

VALIDATION CHECKLIST:
- [ ] ageGroup is one of: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- [ ] stemDiscipline is one of: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- [ ] productType is one of: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- [ ] learningOutcomes contains only valid enum values
- [ ] No extra fields that don't exist in database schema
- [ ] SEO fields (metaTitle, metaDescription, metaKeywords) are properly formatted

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

CRITICAL DATABASE SCHEMA REQUIREMENTS (MUST FOLLOW EXACTLY):
- ageGroup: ONE OF: "TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"
- stemDiscipline: ONE OF: "SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"
- productType: ONE OF: "ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"
- learningOutcomes: ARRAY FROM: "PROBLEM_SOLVING", "CREATIVITY", "CRITICAL_THINKING", "MOTOR_SKILLS", "LOGIC"
- romanianEducationalLevel: ONE OF: "GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"

AGE GROUP DETERMINATION RULES (VERIFY AGAINST ORIGINAL DESCRIPTION):
- If original description contains "ages 12+", "ages 12-16", "ages 13+", "adolescents", "teens", "teenagers" → MUST BE "TEENS_13_PLUS"
- If original description contains "ages 9-12", "ages 10-14", "middle school", "ages 9+", "ages 10+" → MUST BE "MIDDLE_SCHOOL_9_12"
- If original description contains "ages 6-8", "ages 6-12", "elementary", "ages 6+", "primary school" → MUST BE "ELEMENTARY_6_8"
- If original description contains "ages 3-5", "preschool", "ages 3-6" → MUST BE "PRESCHOOL_3_5"
- If original description contains "ages 1-3", "toddlers", "ages 1-4" → MUST BE "TODDLERS_1_3"
- DEFAULT: "ELEMENTARY_6_8" (most common for STEM toys)

STEM DISCIPLINE CLASSIFICATION RULES (VERIFY AGAINST PRODUCT CONTENT):
- SCIENCE: Chemistry, biology, physics, geology, astronomy, fossils, experiments, nature study, scientific methods
- TECHNOLOGY: Programming, coding, electronics, circuits, computers, digital, software, apps, robotics
- ENGINEERING: Building, construction, design, mechanics, structures, problem-solving, invention
- MATHEMATICS: Numbers, patterns, logic puzzles, geometry, calculations, mathematical thinking
- GENERAL: Mixed disciplines or unclear from description

PRODUCT TYPE CLASSIFICATION RULES (VERIFY AGAINST PRODUCT NATURE):
- ROBOTICS: Robots, programmable robots, robot kits, robot building
- PUZZLES: Logic puzzles, brain teasers, problem-solving puzzles
- CONSTRUCTION_SETS: Building sets, construction toys, building blocks, model kits
- EXPERIMENT_KITS: Science experiments, chemistry sets, electronic kits, discovery kits
- BOARD_GAMES: Strategy games, educational games, learning games on boards

VALIDATION STEPS (FOLLOW EXACTLY):
1. Review original product description and current AI output
2. Verify ageGroup matches AGE GROUP DETERMINATION RULES - CORRECT if wrong
3. Verify stemDiscipline matches STEM DISCIPLINE CLASSIFICATION RULES - CORRECT if wrong
4. Verify productType matches PRODUCT TYPE CLASSIFICATION RULES - CORRECT if wrong
5. Verify learningOutcomes contain only valid enum values - CORRECT if wrong
6. Verify romanianEducationalLevel is valid - CORRECT if wrong

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
    ? "- DATABASE COMPATIBILITY: Ensure all field formats match required database schema (correct data types, valid enum values, etc.). PRIORITY: Fix any invalid enum values."
    : ""
}

REQUIRED OUTPUT FORMAT:
Return your improved version as a valid JSON object with the same structure as the original, plus a "refinements" array listing your key improvements:

{
  [all product fields with improvements],
  "refinements": [
    "Database Schema: Corrected ageGroup from invalid value to TEENS_13_PLUS based on 'ages 12+' in description",
    "Database Schema: Corrected stemDiscipline from TECHNOLOGY to SCIENCE for fossil dig kit",
    "SEO: Enhanced keywords for better search visibility",
    etc.
  ]
}

CRITICAL FIELD MAPPING REMINDER:
When making corrections, remember the database field mapping:
- metaTitle, metaDescription, metaKeywords → Product.attributes (SEO fields)
- ageGroup, stemDiscipline, productType → Individual Product fields (enums)
- enhancedDescription → Product.description field
- learningOutcomes → Product.learningOutcomes field (array)
- Romanian fields → Individual Product fields

DO NOT change the field structure - only correct invalid enum values and improve content quality.
If you find any invalid enum values, list the correction as the FIRST item in refinements array.
Focus on substantial improvements rather than minor stylistic changes. Be especially careful with technical details and educational claims.`;
  }

  /**
   * Validate and filter enum values to ensure database compatibility
   */
  private validateEnumValues(enhancement: any): any {
    const validated = { ...enhancement };

    // Validate ageGroup
    const validAgeGroups = [
      "TODDLERS_1_3",
      "PRESCHOOL_3_5",
      "ELEMENTARY_6_8",
      "MIDDLE_SCHOOL_9_12",
      "TEENS_13_PLUS",
    ];
    if (validated.ageGroup && !validAgeGroups.includes(validated.ageGroup)) {
      console.warn(
        `Invalid ageGroup "${validated.ageGroup}", removing from enhancement`
      );
      delete validated.ageGroup;
    }

    // Validate stemDiscipline
    const validStemDisciplines = [
      "SCIENCE",
      "TECHNOLOGY",
      "ENGINEERING",
      "MATHEMATICS",
      "GENERAL",
    ];
    if (
      validated.stemDiscipline &&
      !validStemDisciplines.includes(validated.stemDiscipline)
    ) {
      console.warn(
        `Invalid stemDiscipline "${validated.stemDiscipline}", removing from enhancement`
      );
      delete validated.stemDiscipline;
    }

    // Validate productType
    const validProductTypes = [
      "ROBOTICS",
      "PUZZLES",
      "CONSTRUCTION_SETS",
      "EXPERIMENT_KITS",
      "BOARD_GAMES",
    ];
    if (
      validated.productType &&
      !validProductTypes.includes(validated.productType)
    ) {
      console.warn(
        `Invalid productType "${validated.productType}", removing from enhancement`
      );
      delete validated.productType;
    }

    // Validate learningOutcomes
    const validLearningOutcomes = [
      "PROBLEM_SOLVING",
      "CREATIVITY",
      "CRITICAL_THINKING",
      "MOTOR_SKILLS",
      "LOGIC",
    ];
    if (
      validated.learningOutcomes &&
      Array.isArray(validated.learningOutcomes)
    ) {
      validated.learningOutcomes = validated.learningOutcomes.filter(
        (outcome: string) => {
          if (!validLearningOutcomes.includes(outcome)) {
            console.warn(`Invalid learningOutcome "${outcome}", filtering out`);
            return false;
          }
          return true;
        }
      );
      // Ensure at least one valid learning outcome
      if (validated.learningOutcomes.length === 0) {
        validated.learningOutcomes = ["PROBLEM_SOLVING"];
      }
    } else {
      validated.learningOutcomes = ["PROBLEM_SOLVING"];
    }

    // Validate romanianEducationalLevel
    const validEducationalLevels = [
      "GRADINITA",
      "PRIMAR",
      "GIMNAZIU",
      "LICEU",
      "UNIVERSITATE",
    ];
    if (
      validated.romanianEducationalLevel &&
      !validEducationalLevels.includes(validated.romanianEducationalLevel)
    ) {
      console.warn(
        `Invalid romanianEducationalLevel "${validated.romanianEducationalLevel}", removing from enhancement`
      );
      delete validated.romanianEducationalLevel;
    }

    return validated;
  }

  /**
   * Normalize response to EnhancedProduct format with validation
   */
  private normalizeToEnhancedProduct(
    originalProduct: BasicProduct,
    enhancement: any
  ): EnhancedProduct {
    // Validate enum values before processing
    const validatedEnhancement = this.validateEnumValues(enhancement);

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
        validatedEnhancement.enhancedDescription ||
        validatedEnhancement.description ||
        originalProduct.description ||
        "",
      metaTitle: validatedEnhancement.metaTitle || originalProduct.name,
      metaDescription:
        validatedEnhancement.metaDescription ||
        originalProduct.description?.substring(0, 160) ||
        "",
      metaKeywords: validatedEnhancement.metaKeywords || [],
      tags: validatedEnhancement.tags || originalProduct.tags || [],
      learningOutcomes: validatedEnhancement.learningOutcomes || [
        "PROBLEM_SOLVING",
      ],
    };

    // Add optional fields if present and valid in enhancement
    if (validatedEnhancement.ageGroup)
      enhancedProduct.ageGroup = validatedEnhancement.ageGroup;
    if (validatedEnhancement.stemDiscipline)
      enhancedProduct.stemDiscipline = validatedEnhancement.stemDiscipline;
    if (validatedEnhancement.productType)
      enhancedProduct.productType = validatedEnhancement.productType;

    // Romanian-specific fields
    if (validatedEnhancement.romanianCompetencies)
      enhancedProduct.romanianCompetencies =
        validatedEnhancement.romanianCompetencies;
    if (validatedEnhancement.romanianCurriculumAlignment)
      enhancedProduct.romanianCurriculumAlignment =
        validatedEnhancement.romanianCurriculumAlignment;
    if (validatedEnhancement.romanianEducationalLevel)
      enhancedProduct.romanianEducationalLevel =
        validatedEnhancement.romanianEducationalLevel;
    if (validatedEnhancement.romanianSubjectAreas)
      enhancedProduct.romanianSubjectAreas =
        validatedEnhancement.romanianSubjectAreas;
    if (validatedEnhancement.romanianMinistryApproval !== undefined)
      enhancedProduct.romanianMinistryApproval =
        validatedEnhancement.romanianMinistryApproval;
    if (validatedEnhancement.romanianEducationalCertification)
      enhancedProduct.romanianEducationalCertification =
        validatedEnhancement.romanianEducationalCertification;

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
          metaTitle: product.name.substring(0, 70),
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
