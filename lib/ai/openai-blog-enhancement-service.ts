/**
 * AI Blog Enhancement Service
 *
 * This service uses the configured AI provider (OpenAI, Gemini, etc.) for comprehensive blog generation with Romanian optimization.
 * Respects global AI provider configuration for consistent service usage.
 */

import { AIServiceFactory } from "./ai-service-factory";
import { BaseAIService } from "./base-ai-service";
import { simpleAIMonitoring } from "./monitoring-simple";

import {
  BlogGenerationPrompt,
  BlogGenerationOptions,
  BlogGenerationProgress,
  BlogGenerationResult,
  GeneratedBlogContent,
  BlogValidationResult,
} from "./blog-types";
import {
  getBlogPromptTemplates,
  formatBlogPrompt,
} from "./prompts/blog-generation-prompts";

/**
 * Configuration for the blog generation pipeline
 */
export interface BlogEnhancementConfig {
  provider: "openai";
  model: string;
  romanianOptimization: boolean;
  seoOptimization: boolean;
  contentQualityChecks: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export class AIBlogEnhancementService {
  private service: BaseAIService | null = null;

  private defaultConfig: BlogEnhancementConfig = {
    provider: AIConfig.getProvider(), // Use global AI provider configuration
    model: AIConfig.getModel(),
    romanianOptimization: true,
    seoOptimization: true,
    contentQualityChecks: true,
    maxRetries: 3,
    timeoutMs: 120000, // 2 minutes
  };

  constructor(private config?: Partial<BlogEnhancementConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Initialize the OpenAI service
   */
  private initService() {
    if (!this.service) {
      try {
        // Use global AI provider configuration instead of hardcoding OpenAI
        const globalProvider = AIConfig.getProvider();
        console.log(
          `Initializing ${globalProvider} service for blog generation: ${this.config!.model}`
        );

        this.service = AIServiceFactory.getService(globalProvider);

        // Override the model to ensure we use the configured model
        if (this.service && "model" in this.service) {
          (this.service as any).model = this.config!.model;
        }

        console.log(
          `${globalProvider} service initialized successfully for blog generation`
        );
      } catch (error) {
        console.error(
          `Failed to initialize AI service for blog generation:`,
          error
        );
        throw new Error(
          `Failed to initialize AI service: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Generate a complete blog post from a prompt
   */
  async generateBlog(
    prompt: BlogGenerationPrompt,
    options: BlogGenerationOptions,
    onProgress?: (progress: BlogGenerationProgress) => void
  ): Promise<BlogGenerationResult> {
    const startTime = Date.now();

    try {
      // Initialize service
      this.initService();

      // Update progress
      onProgress?.({
        stage: "analyzing_prompt",
        progress: 10,
        currentStep: "Analyzing prompt and preparing content structure",
        estimatedTimeRemaining: 30000,
      });

      // Step 1: Generate title
      const titleResult = await this.generateTitle(prompt);
      if (!titleResult.success) {
        throw new Error(`Title generation failed: ${titleResult.error}`);
      }

      onProgress?.({
        stage: "generating_content",
        progress: 25,
        currentStep: "Generating main blog content",
        estimatedTimeRemaining: 60000,
      });

      // Step 2: Generate main content
      const contentResult = await this.generateContent(
        prompt,
        titleResult.title!
      );
      if (!contentResult.success) {
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }

      onProgress?.({
        stage: "optimizing_seo",
        progress: 50,
        currentStep: "Optimizing SEO metadata",
        estimatedTimeRemaining: 30000,
      });

      // Step 3: Generate SEO metadata
      const seoResult = await this.generateSEOMetadata(
        prompt,
        titleResult.title!,
        contentResult.content!
      );
      if (!seoResult.success) {
        console.warn(
          "SEO metadata generation failed, using defaults:",
          seoResult.error
        );
      }

      onProgress?.({
        stage: "refining_language",
        progress: 75,
        currentStep: "Refining Romanian language and cultural context",
        estimatedTimeRemaining: 20000,
      });

      // Step 4: Apply Romanian optimization
      const refinedContent = await this.refineContent(
        titleResult.title!,
        contentResult.content!,
        seoResult.metadata ?? null
      );

      // Step 5: Calculate reading time and final metrics
      const wordCount = this.calculateWordCount(refinedContent);
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      const slug = this.generateSlug(titleResult.title!);

      // Step 6: Generate excerpt if not provided
      const excerpt = await this.generateExcerpt(
        prompt,
        titleResult.title!,
        refinedContent
      );

      onProgress?.({
        stage: "finalizing",
        progress: 95,
        currentStep: "Finalizing blog post",
        estimatedTimeRemaining: 5000,
      });

      // Assemble final blog
      const generatedBlog: GeneratedBlogContent = {
        title: titleResult.title!,
        slug,
        excerpt: excerpt ?? refinedContent.substring(0, 200) + "...",
        content: refinedContent,
        coverImage: await this.generateCoverImageSuggestion(prompt),
        tags: this.extractTags(prompt, refinedContent),
        stemCategory: prompt.targetStemCategory ?? "GENERAL",
        readingTime,
        language: "ro",
        wordCount,
        seoMetadata: seoResult.metadata ?? {
          metaTitle: titleResult.title!.substring(0, 70),
          metaDescription:
            excerpt?.substring(0, 160) ?? refinedContent.substring(0, 160),
          metaKeywords: this.extractKeywords(refinedContent),
        },
        aiMetadata: {
          aiGenerated: true,
          generatedBy: "openai-blog",
          generationTimestamp: new Date().toISOString(),
          originalPrompt: prompt.prompt,
          processingTime: Date.now() - startTime,
          refinementApplied: true,
          modelVersion: this.config!.model,
        },
      };

      // Step 7: Validate the generated blog
      const validation = this.validateBlogSchema(generatedBlog);
      if (!validation.isValid && validation.correctedBlog) {
        Object.assign(generatedBlog, validation.correctedBlog);
      }

      onProgress?.({
        stage: "complete",
        progress: 100,
        currentStep: "Blog generation completed successfully",
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        generatedBlog,
        processingTime,
        seoScore: this.calculateSEOScore(generatedBlog),
        suggestions: validation.warnings,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error("Blog generation failed:", error);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      };
    }
  }

  /**
   * Generate blog title
   */
  private async generateTitle(
    prompt: BlogGenerationPrompt
  ): Promise<{ success: boolean; title?: string; error?: string }> {
    try {
      const template = getBlogPromptTemplates().title;
      const userPrompt = formatBlogPrompt(template.user, {
        prompt: prompt.prompt,
      });

      const response = await this.service!.generateResponse({
        systemPrompt: template.system,
        userPrompt,
        temperature: 0.7,
        maxTokens: 100,
        model: this.config!.model, // Force OpenAI model
      });

      const title = response.trim();
      if (title.length > 70) {
        return { success: false, error: "Generated title too long" };
      }

      return { success: true, title };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate main blog content
   */
  private async generateContent(
    prompt: BlogGenerationPrompt,
    title: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const template = getBlogPromptTemplates().content;
      const userPrompt = formatBlogPrompt(template.user, {
        prompt: prompt.prompt,
        title,
      });

      const response = await this.service!.generateResponse({
        systemPrompt: template.system,
        userPrompt,
        temperature: 0.8,
        maxTokens: 3000,
        model: this.config!.model, // Force OpenAI model
      });

      return { success: true, content: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate SEO metadata
   */
  private async generateSEOMetadata(
    prompt: BlogGenerationPrompt,
    title: string,
    content: string
  ): Promise<{ success: boolean; metadata?: any; error?: string }> {
    try {
      const template = getBlogPromptTemplates().seo;
      const userPrompt = formatBlogPrompt(template.user, {
        prompt: prompt.prompt,
        title,
        content: content.substring(0, 500), // Limit content for SEO generation
      });

      const response = await this.service!.generateResponse({
        systemPrompt: template.system,
        userPrompt,
        temperature: 0.3,
        maxTokens: 800,
        model: this.config!.model, // Force OpenAI model
      });

      // Parse the SEO response
      const metadata = this.parseSEOResponse(response);
      return { success: true, metadata };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Refine content with Romanian optimization
   */
  private async refineContent(
    title: string,
    content: string,
    seoMetadata: any
  ): Promise<string> {
    try {
      const template = getBlogPromptTemplates().refinement;
      const userPrompt = formatBlogPrompt(template.user, {
        title,
        content,
        focusKeywords: seoMetadata?.focusKeyword ?? "",
      });

      const response = await this.service!.generateResponse({
        systemPrompt: template.system,
        userPrompt,
        temperature: 0.6,
        maxTokens: 2500,
        model: this.config!.model, // Force OpenAI model
      });

      return response;
    } catch (error) {
      console.warn("Content refinement failed, using original content:", error);
      return content;
    }
  }

  /**
   * Generate excerpt
   */
  private async generateExcerpt(
    prompt: BlogGenerationPrompt,
    title: string,
    _content: string
  ): Promise<string | null> {
    try {
      const template = getBlogPromptTemplates().excerpt;
      const userPrompt = formatBlogPrompt(template.user, {
        prompt: prompt.prompt,
        title,
      });

      const response = await this.service!.generateResponse({
        systemPrompt: template.system,
        userPrompt,
        temperature: 0.7,
        maxTokens: 200,
        model: this.config!.model, // Force OpenAI model
      });

      return response;
    } catch (error) {
      console.warn("Excerpt generation failed:", error);
      return null;
    }
  }

  /**
   * Generate cover image suggestion
   */
  private generateCoverImageSuggestion(
    _prompt: BlogGenerationPrompt
  ): string | undefined {
    // For now, return a placeholder. In production, this could use DALL-E or similar
    // to generate actual images based on the prompt
    return undefined; // Will be handled by default stock images
  }

  /**
   * Utility methods
   */
  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .substring(0, 100);
  }

  private extractTags(prompt: BlogGenerationPrompt, content: string): string[] {
    // Extract relevant STEM tags from content
    const stemTags = ["STEM", "educație", "învățare", "copii", "școală"];
    const contentLower = content.toLowerCase();

    const relevantTags = stemTags.filter(tag =>
      contentLower.includes(tag.toLowerCase())
    );

    return [...new Set(relevantTags)].slice(0, 10);
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) ?? [];
    const wordCount: Record<string, number> = {};

    words.forEach(word => {
      if (
        !["care", "pentru", "este", "sunt", "fiind", "avea", "face"].includes(
          word
        )
      ) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private parseSEOResponse(response: string): any {
    // Parse the structured SEO response
    const lines = response.split("\n");
    const metadata: any = {};

    for (const line of lines) {
      if (line.startsWith("Meta Title:")) {
        metadata.metaTitle = line.replace("Meta Title:", "").trim();
      } else if (line.startsWith("Meta Description:")) {
        metadata.metaDescription = line.replace("Meta Description:", "").trim();
      } else if (line.startsWith("Focus Keyword:")) {
        metadata.focusKeyword = line.replace("Focus Keyword:", "").trim();
      } else if (line.startsWith("Secondary Keywords:")) {
        metadata.secondaryKeywords = line
          .replace("Secondary Keywords:", "")
          .trim()
          .split(",")
          .map((k: string) => k.trim());
      } else if (line.startsWith("Long-tail Keywords:")) {
        metadata.longTailKeywords = line
          .replace("Long-tail Keywords:", "")
          .trim()
          .split(",")
          .map((k: string) => k.trim());
      }
    }

    // Combine keywords
    const allKeywords = [];
    if (metadata.focusKeyword) allKeywords.push(metadata.focusKeyword);
    if (metadata.secondaryKeywords)
      allKeywords.push(...metadata.secondaryKeywords);
    if (metadata.longTailKeywords)
      allKeywords.push(...metadata.longTailKeywords);

    metadata.metaKeywords = allKeywords.slice(0, 20);

    return metadata;
  }

  private validateBlogSchema(blog: GeneratedBlogContent): BlogValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!blog.title || blog.title.length < 10) {
      errors.push("Title must be at least 10 characters");
    }
    if (!blog.content || blog.content.length < 500) {
      errors.push("Content must be at least 500 characters");
    }
    if (!blog.excerpt || blog.excerpt.length < 50) {
      errors.push("Excerpt must be at least 50 characters");
    }

    // SEO validation
    if (blog.seoMetadata.metaTitle && blog.seoMetadata.metaTitle.length > 70) {
      warnings.push("Meta title exceeds 70 characters");
    }
    if (
      blog.seoMetadata.metaDescription &&
      blog.seoMetadata.metaDescription.length > 160
    ) {
      warnings.push("Meta description exceeds 160 characters");
    }

    // Reading time validation
    const calculatedReadingTime = Math.ceil(blog.wordCount / 200);
    if (Math.abs(blog.readingTime - calculatedReadingTime) > 1) {
      warnings.push("Reading time calculation may be inaccurate");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - errors.length * 20 - warnings.length * 5),
    };
  }

  private calculateSEOScore(blog: GeneratedBlogContent): number {
    let score = 50; // Base score

    // Title optimization
    if (blog.seoMetadata.metaTitle && blog.seoMetadata.metaTitle.length <= 70) {
      score += 10;
    }

    // Description optimization
    if (
      blog.seoMetadata.metaDescription &&
      blog.seoMetadata.metaDescription.length <= 160
    ) {
      score += 10;
    }

    // Keywords
    if (
      blog.seoMetadata.metaKeywords &&
      blog.seoMetadata.metaKeywords.length >= 5
    ) {
      score += 10;
    }

    // Content length
    if (blog.wordCount >= 1200) {
      score += 10;
    }

    // Tags
    if (blog.tags && blog.tags.length >= 3) {
      score += 5;
    }

    // Reading time
    if (blog.readingTime >= 5 && blog.readingTime <= 10) {
      score += 5;
    }

    return Math.min(100, score);
  }
}
