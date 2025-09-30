/**
 * Dual Provider Blog Enhancement Service
 *
 * This service implements a two-stage AI enhancement pipeline for blog generation:
 * 1. Use OpenAI (primary) for initial blog content generation
 * 2. Use OpenAI (secondary) for refinement, SEO optimization, and Romanian language enhancement
 *
 * This approach ensures high-quality, SEO-optimized Romanian blog content for STEM education.
 */

import { AIServiceFactory } from "./ai-service-factory";
import { BaseAIService } from "./base-ai-service";
import { AIConfig } from "./config";
import { getAIConfig } from "@/lib/config/environment";
import { simpleAIMonitoring } from "./monitoring-simple";
import {
  RomanianKeywordService,
  KeywordOptimization,
} from "./keywords/romanian-keyword-service";
import {
  getStatisticsForTopic,
  getHighImpactStatistics,
} from "./viral-content/romanian-shocking-statistics";
import {
  getStoriesForTopic,
  getHighImpactStories,
} from "./viral-content/romanian-success-stories";
import {
  getTestimonialsForTopic,
  getHighImpactTestimonials,
  getAllTrustBadges,
} from "./viral-content/romanian-social-proof";
import { RomanianOpenGraphOptimizer } from "./social-media/romanian-open-graph-optimizer";
import { RomanianUrgencyScarcityOptimizer } from "./conversion-optimization/romanian-urgency-scarcity";
import { RomanianBuyerPsychologyOptimizer } from "./conversion-optimization/romanian-buyer-psychology";

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

export class DualProviderBlogEnhancementService {
  private primaryService: BaseAIService | null = null;
  private secondaryService: BaseAIService | null = null;

  constructor(private config?: Partial<BlogEnhancementConfig>) {
    // Get global AI configuration
    const globalProvider = AIConfig.getProvider();
    const globalModel = AIConfig.getModel();

    // Dynamic configuration from environment variables
    const dynamicDefaults: BlogEnhancementConfig = {
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
      timeoutMs: 120000, // 2 minutes
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
   * Generate a complete blog post from a prompt
   */
  async generateBlog(
    prompt: BlogGenerationPrompt,
    options: BlogGenerationOptions,
    onProgress?: (progress: BlogGenerationProgress) => void
  ): Promise<BlogGenerationResult> {
    const startTime = Date.now();

    try {
      // Initialize services
      await this.initServices();

      // Update progress
      onProgress?.({
        stage: "analyzing_prompt",
        progress: 10,
        currentStep: "Analyzing prompt and selecting optimal Romanian keywords",
        estimatedTimeRemaining: 30000,
      });

      // Select optimal keywords for this prompt
      const keywordOptimization =
        RomanianKeywordService.selectKeywordsForPrompt(prompt);

      // Get shocking statistics for viral content
      const topicStats = getStatisticsForTopic(prompt.prompt);
      const shockingStatistics =
        topicStats.length > 0
          ? topicStats
              .slice(0, 3)
              .map(stat => stat.statistic)
              .join("; ")
          : getHighImpactStatistics()
              .slice(0, 3)
              .map(stat => stat.statistic)
              .join("; ");

      // Get success stories for emotional storytelling
      const topicStories = getStoriesForTopic(prompt.prompt);
      const successStories =
        topicStories.length > 0
          ? topicStories
              .slice(0, 2)
              .map(
                story => `${story.hero}: ${story.challenge} → ${story.results}`
              )
              .join("; ")
          : getHighImpactStories()
              .slice(0, 2)
              .map(
                story => `${story.hero}: ${story.challenge} → ${story.results}`
              )
              .join("; ");

      // Get social proof testimonials and trust badges
      const topicTestimonials = getTestimonialsForTopic(prompt.prompt);
      const socialProof =
        topicTestimonials.length > 0
          ? topicTestimonials
              .slice(0, 2)
              .map(
                t =>
                  `${t.name} (${t.location}): "${t.testimonial.substring(0, 100)}..."`
              )
              .join("; ")
          : getHighImpactTestimonials()
              .slice(0, 2)
              .map(
                t =>
                  `${t.name} (${t.location}): "${t.testimonial.substring(0, 100)}..."`
              )
              .join("; ");

      const trustBadges = getAllTrustBadges()
        .slice(0, 3)
        .map(badge => badge.displayText)
        .join("; ");

      // Step 1: Generate title
      const titleResult = await this.generateTitle(prompt);
      if (
        !titleResult.success ||
        !titleResult.title ||
        titleResult.title.trim().length === 0
      ) {
        throw new Error(
          `Title generation failed: ${titleResult.error || "Empty title returned"}`
        );
      }

      onProgress?.({
        stage: "generating_content",
        progress: 20,
        currentStep: "Generating main blog content",
        estimatedTimeRemaining: 60000,
      });

      // Step 2: Generate main content with keyword optimization
      const contentResult = await this.generateContent(
        prompt,
        titleResult.title,
        keywordOptimization,
        shockingStatistics,
        successStories,
        socialProof,
        trustBadges
      );
      if (!contentResult.success) {
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }

      onProgress?.({
        stage: "optimizing_seo",
        progress: 60,
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
        progress: 80,
        currentStep: "Refining Romanian language and cultural context",
        estimatedTimeRemaining: 20000,
      });

      // Step 4: Apply Romanian optimization
      const refinedContent = await this.refineContent(
        titleResult.title!,
        contentResult.content!,
        seoResult.metadata ?? null
      );

      // Step 5: Analyze and optimize keywords in the final content
      const contentAnalysis = RomanianKeywordService.analyzeContentKeywords(
        refinedContent,
        keywordOptimization
      );

      // Optimize content with missing keywords if needed
      let finalContent = refinedContent;
      if (contentAnalysis.missingKeywords.length > 0) {
        finalContent = RomanianKeywordService.optimizeContentKeywords(
          refinedContent,
          contentAnalysis,
          keywordOptimization
        );
      }

      // Step 6: Calculate reading time and final metrics
      const wordCount = this.calculateWordCount(finalContent);
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      const slug = this.generateSlug(titleResult.title!);

      // Step 7: Generate excerpt if not provided
      const excerpt = await this.generateExcerpt(
        prompt,
        titleResult.title!,
        finalContent
      );

      // Step 8: Generate social media optimization
      const socialMediaUrl = `https://techtots.ro/blog/${slug}`;
      const publishedDate = new Date().toISOString();
      const socialOptimization =
        RomanianOpenGraphOptimizer.generateCompleteSocialOptimization(
          titleResult.title!,
          excerpt || finalContent.substring(0, 200),
          keywordOptimization.secondaryKeywords.slice(0, 5),
          socialMediaUrl,
          publishedDate
        );

      // Step 9: Generate urgency and scarcity optimization for conversion
      const contentLength =
        wordCount > 2000 ? "long" : wordCount > 1000 ? "medium" : "short";
      const audienceType = this.determineAudienceType(prompt.prompt);
      const conversionOptimization =
        RomanianUrgencyScarcityOptimizer.generateConversionOptimization(
          contentLength,
          prompt.prompt.split(" ")[0], // Use first word as topic
          audienceType,
          "high" // High intensity for viral content
        );

      // Step 10: Generate buyer psychology optimization
      const buyerPsychologyOptimization =
        RomanianBuyerPsychologyOptimizer.generateConversionPsychology(
          audienceType,
          prompt.prompt.split(" ")[0], // Use first word as topic
          ["prea_scap", "nu_stiu_daca_merge"] // Common Romanian objections
        );

      onProgress?.({
        stage: "finalizing",
        progress: 95,
        currentStep: "Finalizing blog post with conversion optimization",
        estimatedTimeRemaining: 5000,
      });

      // Assemble final blog
      const generatedBlog: GeneratedBlogContent = {
        title: titleResult.title,
        slug,
        excerpt: excerpt ?? finalContent.substring(0, 200) + "...",
        content: finalContent,
        coverImage: await this.generateCoverImageSuggestion(prompt),
        tags: this.extractTags(prompt, finalContent),
        stemCategory: prompt.targetStemCategory ?? "GENERAL",
        readingTime,
        language: "ro",
        wordCount,
        seoMetadata: seoResult.metadata ?? {
          metaTitle: titleResult.title.substring(0, 70),
          metaDescription:
            excerpt?.substring(0, 160) ?? refinedContent.substring(0, 160),
          metaKeywords: this.extractKeywords(refinedContent),
        },
        aiMetadata: {
          aiGenerated: true,
          generatedBy: "dual-provider-blog-viral",
          generationTimestamp: new Date().toISOString(),
          originalPrompt: prompt.prompt,
          processingTime: Date.now() - startTime,
          refinementApplied: true,
          modelVersion: `gpt-5-mini/gpt-5-mini`,
          keywordOptimization: keywordOptimization,
          contentAnalysis: contentAnalysis,
          socialOptimization: socialOptimization,
          conversionOptimization: conversionOptimization,
          buyerPsychologyOptimization: buyerPsychologyOptimization,
          viralOptimizationApplied: true,
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

      let response;
      try {
        response = await this.primaryService!.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.7,
          maxTokens: 100,
          model: this.config!.primaryModel,
        });

        // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - this will trigger fallback logic in blog service"
          );

          // Create a fresh OpenAI service instance for fallback with GPT-4o
          const { OpenAIService } = await import("./openai-service");
          const fallbackService = new OpenAIService(
            getAIConfig().fallbackModel
          );

          response = await fallbackService.generateResponse({
            systemPrompt: template.system,
            userPrompt,
            temperature: 0.7,
            maxTokens: 100,
            model: getAIConfig().fallbackModel,
          });
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

        response = await fallbackService.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.7,
          maxTokens: 100,
          model: getAIConfig().fallbackModel,
        });
      }

      // Debug title generation (only on fallback)
      if (this.config!.primaryModel !== "gpt-4o") {
        console.log("🔍 Title Generation Debug (fallback used):");
        console.log("- Response content length:", response?.length || 0);
      }

      let title = response?.trim() || "";

      // Validate title generation - if empty after fallback, this is critical
      if (!title || title.length === 0) {
        console.error(
          "❌ CRITICAL: Title generation failed even with GPT-4o fallback"
        );
        return {
          success: false,
          error:
            "Title generation failed completely - GPT-5-mini and GPT-4o fallback both returned empty content",
        };
      }

      // If title is too long, truncate it intelligently
      if (title.length > 70) {
        console.warn(
          `Title too long (${title.length} chars), truncating to 70 characters: "${title}"`
        );
        // Try to truncate at word boundary if possible
        const truncatedAtWord = title.substring(0, 67);
        const lastSpaceIndex = truncatedAtWord.lastIndexOf(" ");
        if (lastSpaceIndex > 50) {
          // Only truncate at word boundary if we have a reasonable word
          title = truncatedAtWord.substring(0, lastSpaceIndex) + "...";
        } else {
          title = title.substring(0, 67) + "...";
        }
        console.log(`Truncated title: "${title}" (${title.length} chars)`);
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
    title: string,
    keywordOptimization: KeywordOptimization,
    shockingStatistics: string,
    successStories: string,
    socialProof: string,
    trustBadges: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const template = getBlogPromptTemplates().content;

      // Enhance the user prompt with selected keywords, shocking statistics, and success stories for viral SEO optimization
      const enhancedPromptData = {
        prompt: prompt.prompt,
        title,
        primaryKeyword: keywordOptimization.primaryKeyword,
        secondaryKeywords: keywordOptimization.secondaryKeywords.join(", "),
        longTailKeywords: keywordOptimization.longTailKeywords
          .slice(0, 5)
          .join(", "),
        painPointKeywords: keywordOptimization.painPointKeywords.join(", "),
        commercialKeywords: keywordOptimization.commercialKeywords.join(", "),
        shockingStatistics,
        successStories,
        socialProof,
        trustBadges,
      };

      const userPrompt = formatBlogPrompt(template.user, enhancedPromptData);

      let response;
      try {
        response = await this.primaryService!.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.8,
          maxTokens: 3000,
          model: this.config!.primaryModel,
        });

        // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - triggering fallback for content generation"
          );

          // Create a fresh OpenAI service instance for fallback with GPT-4o
          const { OpenAIService } = await import("./openai-service");
          const fallbackService = new OpenAIService(
            getAIConfig().fallbackModel
          );

          response = await fallbackService.generateResponse({
            systemPrompt: template.system,
            userPrompt,
            temperature: 0.8,
            maxTokens: 3000,
            model: getAIConfig().fallbackModel,
          });
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

        response = await fallbackService.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.8,
          maxTokens: 3000,
          model: getAIConfig().fallbackModel,
        });
      }

      // Debug content generation (only on fallback)
      if (this.config!.primaryModel !== "gpt-4o") {
        console.log("🔍 Content Generation Debug (fallback used):");
        console.log("- Response content length:", response?.length || 0);
      }

      return { success: true, content: response || "" };
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

      let response;
      try {
        response = await this.secondaryService!.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.3,
          maxTokens: 800,
          model: this.config!.secondaryModel,
        });

        // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - triggering fallback for SEO metadata"
          );

          // Create a fresh OpenAI service instance for fallback with GPT-4o
          const { OpenAIService } = await import("./openai-service");
          const fallbackService = new OpenAIService(
            getAIConfig().fallbackModel
          );

          response = await fallbackService.generateResponse({
            systemPrompt: template.system,
            userPrompt,
            temperature: 0.3,
            maxTokens: 800,
            model: getAIConfig().fallbackModel,
          });
        }
      } catch (secondaryError) {
        // If secondary service throws an error (not just empty content), try GPT-4o as fallback
        console.warn(
          "⚠️ Secondary model threw error, trying GPT-4o fallback:",
          secondaryError instanceof Error
            ? secondaryError.message
            : String(secondaryError)
        );

        // Create a fresh OpenAI service instance for fallback with GPT-4o
        const { OpenAIService } = await import("./openai-service");
        const fallbackService = new OpenAIService(getAIConfig().fallbackModel);

        response = await fallbackService.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.3,
          maxTokens: 800,
          model: getAIConfig().fallbackModel,
        });
      }

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

      let response;
      try {
        response = await this.secondaryService!.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.6,
          maxTokens: 2500,
          model: this.config!.secondaryModel,
        });

        // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - triggering fallback for content refinement"
          );

          // Create a fresh OpenAI service instance for fallback with GPT-4o
          const { OpenAIService } = await import("./openai-service");
          const fallbackService = new OpenAIService(
            getAIConfig().fallbackModel
          );

          response = await fallbackService.generateResponse({
            systemPrompt: template.system,
            userPrompt,
            temperature: 0.6,
            maxTokens: 2500,
            model: getAIConfig().fallbackModel,
          });
        }
      } catch (secondaryError) {
        // If secondary service throws an error (not just empty content), try GPT-4o as fallback
        console.warn(
          "⚠️ Secondary model threw error, trying GPT-4o fallback:",
          secondaryError instanceof Error
            ? secondaryError.message
            : String(secondaryError)
        );

        // Create a fresh OpenAI service instance for fallback with GPT-4o
        const { OpenAIService } = await import("./openai-service");
        const fallbackService = new OpenAIService(getAIConfig().fallbackModel);

        response = await fallbackService.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.6,
          maxTokens: 2500,
          model: getAIConfig().fallbackModel,
        });
      }

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

      let response;
      try {
        response = await this.secondaryService!.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.7,
          maxTokens: 200,
          model: this.config!.secondaryModel,
        });

        // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - triggering fallback for excerpt generation"
          );

          // Create a fresh OpenAI service instance for fallback with GPT-4o
          const { OpenAIService } = await import("./openai-service");
          const fallbackService = new OpenAIService(
            getAIConfig().fallbackModel
          );

          response = await fallbackService.generateResponse({
            systemPrompt: template.system,
            userPrompt,
            temperature: 0.7,
            maxTokens: 200,
            model: getAIConfig().fallbackModel,
          });
        }
      } catch (secondaryError) {
        // If secondary service throws an error (not just empty content), try GPT-4o as fallback
        console.warn(
          "⚠️ Secondary model threw error, trying GPT-4o fallback:",
          secondaryError instanceof Error
            ? secondaryError.message
            : String(secondaryError)
        );

        // Create a fresh OpenAI service instance for fallback with GPT-4o
        const { OpenAIService } = await import("./openai-service");
        const fallbackService = new OpenAIService(getAIConfig().fallbackModel);

        response = await fallbackService.generateResponse({
          systemPrompt: template.system,
          userPrompt,
          temperature: 0.7,
          maxTokens: 200,
          model: getAIConfig().fallbackModel,
        });
      }

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
    if (!title || title.trim().length === 0) {
      console.error("❌ Cannot generate slug for empty title");
      return "untitled-blog-" + Date.now();
    }

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

  /**
   * Determine audience type based on prompt content for conversion optimization
   */
  private determineAudienceType(
    prompt: string
  ):
    | "anxious_parents"
    | "practical_parents"
    | "status_conscious"
    | "social_comparers" {
    const promptLower = prompt.toLowerCase();

    // Anxious parents: fear-based keywords
    if (
      promptLower.includes("îngrijorat") ||
      promptLower.includes("teamă") ||
      promptLower.includes("în urmă") ||
      promptLower.includes("urgent")
    ) {
      return "anxious_parents";
    }

    // Practical parents: economic keywords
    if (
      promptLower.includes("preț") ||
      promptLower.includes("economic") ||
      promptLower.includes("investiție") ||
      promptLower.includes("valoare")
    ) {
      return "practical_parents";
    }

    // Status conscious: social keywords
    if (
      promptLower.includes("statut") ||
      promptLower.includes("succes") ||
      promptLower.includes("prestigiu") ||
      promptLower.includes("educație")
    ) {
      return "status_conscious";
    }

    // Social comparers: comparison keywords
    if (
      promptLower.includes("ceilalți") ||
      promptLower.includes("comparație") ||
      promptLower.includes("vecini") ||
      promptLower.includes("familie")
    ) {
      return "social_comparers";
    }

    // Default based on Romanian parent psychology research
    return "anxious_parents"; // Most common trigger for Romanian parents
  }
}
