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
      timeoutMs: 240000, // 4 minutes for comprehensive quality generation
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
   * Generate a complete blog post from a prompt - COMPREHENSIVE QUALITY VERSION
   * Prioritizes quality over speed like the successful Blog 1 approach
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
        currentStep:
          "Analyzing prompt and preparing comprehensive content generation",
        estimatedTimeRemaining: 120000,
      });

      // COMPREHENSIVE APPROACH: Use full keyword optimization and content research
      const keywordOptimization =
        RomanianKeywordService.selectKeywordsForPrompt(prompt);

      // Use comprehensive content research for quality
      const shockingStatistics = getHighImpactStatistics()
        .slice(0, 5)
        .map(stat => stat.statistic)
        .join("; ");

      const successStories = getHighImpactStories()
        .slice(0, 3)
        .map(story => `${story.hero}: ${story.challenge} → ${story.results}`)
        .join("; ");

      const socialProof = getHighImpactTestimonials()
        .slice(0, 3)
        .map(t => `${t.name}: "${t.testimonial.substring(0, 80)}..."`)
        .join("; ");

      const trustBadges = getAllTrustBadges()
        .slice(0, 3)
        .map(badge => badge.displayText)
        .join("; ");

      onProgress?.({
        stage: "generating_title",
        progress: 20,
        currentStep: "Generating viral title optimized for Romanian market",
        estimatedTimeRemaining: 100000,
      });

      // COMPREHENSIVE APPROACH: Generate viral title first for better content structure
      const titleResult = await this.generateViralTitle(prompt);
      if (!titleResult.success) {
        throw new Error(`Title generation failed: ${titleResult.error}`);
      }

      onProgress?.({
        stage: "generating_content",
        progress: 40,
        currentStep:
          "Generating comprehensive blog content with full structure",
        estimatedTimeRemaining: 80000,
      });

      // COMPREHENSIVE APPROACH: Generate content with improved viral structure
      const contentResult = await this.generateContentWithImprovedPrompts(
        prompt,
        titleResult.title!,
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
        stage: "generating_seo",
        progress: 60,
        currentStep: "Generating comprehensive SEO metadata",
        estimatedTimeRemaining: 60000,
      });

      // COMPREHENSIVE APPROACH: Generate full SEO metadata
      const seoResult = await this.generateSEOMetadata(
        prompt,
        titleResult.title!,
        contentResult.content!
      );

      if (!seoResult.success) {
        throw new Error(`SEO generation failed: ${seoResult.error}`);
      }

      onProgress?.({
        stage: "generating_excerpt",
        progress: 70,
        currentStep: "Generating viral excerpt for social sharing",
        estimatedTimeRemaining: 40000,
      });

      // COMPREHENSIVE APPROACH: Generate viral excerpt
      const excerpt = await this.generateViralExcerpt(
        prompt,
        titleResult.title!,
        contentResult.content!
      );

      onProgress?.({
        stage: "refining_content",
        progress: 80,
        currentStep:
          "Refining content with Romanian optimization and viral elements",
        estimatedTimeRemaining: 20000,
      });

      // COMPREHENSIVE APPROACH: Refine content for maximum quality
      const refinedContent = await this.refineContent(
        titleResult.title!,
        contentResult.content!,
        seoResult.metadata
      );

      // Prepare complete blog result
      const completeBlogResult = {
        success: true,
        title: titleResult.title!,
        content: refinedContent,
        excerpt: excerpt || refinedContent.substring(0, 200) + "...",
      };

      onProgress?.({
        stage: "finalizing",
        progress: 90,
        currentStep: "Finalizing blog post and calculating metrics",
        estimatedTimeRemaining: 10000,
      });

      // Calculate final metrics
      const wordCount = this.calculateWordCount(completeBlogResult.content);
      const readingTime = Math.ceil(wordCount / 200);
      const slug = this.generateSlug(completeBlogResult.title);

      // Use comprehensive SEO metadata from dedicated generation
      const seoMetadata = seoResult.metadata;

      // Generate static social optimization (no API call)
      const socialMediaUrl = `https://techtots.ro/blog/${slug}`;
      const publishedDate = new Date().toISOString();
      const socialOptimization =
        RomanianOpenGraphOptimizer.generateCompleteSocialOptimization(
          completeBlogResult.title,
          completeBlogResult.excerpt ||
            completeBlogResult.content.substring(0, 200),
          keywordOptimization.secondaryKeywords.slice(0, 5),
          socialMediaUrl,
          publishedDate
        );

      // Generate static conversion optimization (no API call)
      const contentLength =
        wordCount > 2000 ? "long" : wordCount > 1000 ? "medium" : "short";
      const audienceType = this.determineAudienceType(prompt.prompt);
      const conversionOptimization =
        RomanianUrgencyScarcityOptimizer.generateConversionOptimization(
          contentLength,
          prompt.prompt.split(" ")[0],
          audienceType,
          "high"
        );

      const buyerPsychologyOptimization =
        RomanianBuyerPsychologyOptimizer.generateConversionPsychology(
          audienceType,
          prompt.prompt.split(" ")[0],
          ["prea_scap", "nu_stiu_daca_merge"]
        );

      // Assemble final blog
      const generatedBlog: GeneratedBlogContent = {
        title: completeBlogResult.title,
        slug,
        excerpt:
          completeBlogResult.excerpt ??
          completeBlogResult.content.substring(0, 200) + "...",
        content: completeBlogResult.content,
        coverImage: undefined, // Skip cover image generation to save time
        tags: this.extractTags(prompt, completeBlogResult.content),
        stemCategory: prompt.targetStemCategory ?? "GENERAL",
        readingTime,
        language: "ro",
        wordCount,
        seoMetadata,
        aiMetadata: {
          aiGenerated: true,
          generatedBy: "dual-provider-blog-viral", // Use viral approach like Blog 1
          generationTimestamp: new Date().toISOString(),
          originalPrompt: prompt.prompt,
          processingTime: Date.now() - startTime,
          refinementApplied: true, // Apply refinement for quality like Blog 1
          modelVersion: `${this.config!.primaryModel}/${this.config!.secondaryModel}`,
          keywordOptimization: keywordOptimization,
          contentAnalysis: {
            missingKeywords: [],
            suggestions: [
              "Content generated with comprehensive quality approach",
            ],
            keywordDensity: {
              primary: 1.2,
              secondary: 0.8,
              commercial: 0.6,
            },
          },
          socialOptimization: socialOptimization,
          conversionOptimization: conversionOptimization,
          buyerPsychologyOptimization: buyerPsychologyOptimization,
          viralOptimizationApplied: true,
        },
      };

      // Validate the generated blog
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

      // Track performance metrics
      const result = {
        success: true,
        generatedBlog,
        processingTime,
        seoScore: this.calculateSEOScore(generatedBlog),
        suggestions: validation.warnings,
        warnings: validation.warnings,
      };

      // Track performance metrics for monitoring
      this.trackPerformanceMetrics(result, processingTime, validation.score);

      return result;
    } catch (error) {
      console.error("Blog generation failed:", error);

      const processingTime = Date.now() - startTime;

      // Track failed generation for performance monitoring
      const failedResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      };

      // Track performance metrics for failed generation
      this.trackPerformanceMetrics(failedResult, processingTime, 0);

      return failedResult;
    }
  }

  /**
   * OPTIMIZATION: Generate complete blog in one API call instead of multiple calls
   */
  private async generateCompleteBlogInOneCall(
    prompt: BlogGenerationPrompt,
    keywordOptimization: KeywordOptimization,
    shockingStatistics: string,
    successStories: string,
    socialProof: string,
    trustBadges: string
  ): Promise<{
    success: boolean;
    title?: string;
    content?: string;
    excerpt?: string;
    error?: string;
  }> {
    try {
      // Use the updated prompt system from blog-generation-prompts.ts
      const { getBlogPromptTemplates, formatBlogPrompt } = await import(
        "./prompts/blog-generation-prompts"
      );
      const templates = getBlogPromptTemplates();

      // Format the user prompt using our updated system
      const formattedUserPrompt = formatBlogPrompt(templates.content.user, {
        prompt: prompt.prompt,
        keywords: keywordOptimization.primaryKeyword,
        statistics: shockingStatistics,
        stories: successStories,
        socialProof: socialProof,
        trustBadges: trustBadges,
      });

      let response;
      try {
        response = await this.primaryService!.generateResponse({
          systemPrompt: templates.content.system,
          userPrompt: formattedUserPrompt,
          temperature: 0.8,
          maxTokens: 2000, // EMERGENCY: Reduced for faster generation
          model: this.config!.primaryModel,
        });

        // Check if GPT-5-mini returned empty content
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - triggering fallback for complete blog generation"
          );

          // Create a fresh OpenAI service instance for fallback with GPT-4o
          const { OpenAIService } = await import("./openai-service");
          const fallbackService = new OpenAIService(
            getAIConfig().fallbackModel
          );

          response = await fallbackService.generateResponse({
            systemPrompt: templates.content.system,
            userPrompt: formattedUserPrompt,
            temperature: 0.8,
            maxTokens: 2000, // EMERGENCY: Reduced for faster generation
            model: getAIConfig().fallbackModel,
          });
        }
      } catch (primaryError) {
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
          systemPrompt: templates.content.system,
          userPrompt: formattedUserPrompt,
          temperature: 0.8,
          maxTokens: 2000, // EMERGENCY: Reduced for faster generation
          model: getAIConfig().fallbackModel,
        });
      }

      if (!response || response.trim().length === 0) {
        return {
          success: false,
          error:
            "Complete blog generation failed - both primary and fallback models returned empty content",
        };
      }

      // Parse the response to extract title, content, and excerpt
      // The new format generates content directly with headers, so we need to parse it differently
      const lines = response
        .split("\n")
        .map(line => line.trim())
        .filter(line => line);
      let title = "";
      let content = "";
      let excerpt = "";

      console.log("🔍 Debug: AI Response lines:", lines.slice(0, 5)); // Debug first 5 lines

      // Look for the title in the first few lines or in a specific format
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        // Check if this line looks like a title (not a header, not too long, not empty)
        if (
          line &&
          !line.startsWith("#") &&
          !line.startsWith("**") &&
          !line.startsWith("-") &&
          !line.startsWith("*") &&
          line.length > 5 &&
          line.length < 150 &&
          !line.includes(":") &&
          !line.includes("http") &&
          !line.includes("www")
        ) {
          title = line.replace(/^["']|["']$/g, "").trim(); // Remove quotes if present
          if (title.length > 5) {
            break;
          }
        }
      }

      // If still no title found, look for any line that could be a title
      if (!title || title.length < 5) {
        for (const line of lines) {
          if (
            line &&
            !line.startsWith("#") &&
            !line.startsWith("**") &&
            !line.startsWith("-") &&
            !line.startsWith("*") &&
            line.length > 5 &&
            line.length < 200 &&
            !line.includes("http") &&
            !line.includes("www")
          ) {
            title = line.replace(/^["']|["']$/g, "").trim();
            if (title.length > 5) {
              break;
            }
          }
        }
      }

      // Extract content - everything except the title
      const contentLines = lines.filter(line => line !== title);
      content = contentLines.join("\n").trim();

      // Generate excerpt from content if not provided
      if (content) {
        // Extract first paragraph or first 150 characters
        const firstParagraph =
          content.split("\n\n")[0] || content.substring(0, 150);
        excerpt =
          firstParagraph.length > 160
            ? firstParagraph.substring(0, 157) + "..."
            : firstParagraph;
      }

      console.log("🔍 Debug: Extracted title:", title); // Debug extracted title

      // Validate the parsed content
      if (!title || title.length < 5) {
        // Fallback: try to extract title from first header
        const firstHeader = lines.find(line => line.startsWith("#"));
        if (firstHeader) {
          title = firstHeader.replace(/^#+\s*\**|\**$/g, "").trim();
          console.log("🔍 Debug: Fallback title from header:", title);
        }

        if (!title || title.length < 5) {
          console.log(
            "❌ Debug: Title validation failed. Title:",
            title,
            "Length:",
            title?.length
          );
          console.log("❌ Debug: All lines:", lines.slice(0, 10)); // Debug first 10 lines
          return {
            success: false,
            error: "Generated title is too short or empty",
          };
        }
      }

      if (!content || content.length < 200) {
        return {
          success: false,
          error: "Generated content is too short or empty",
        };
      }

      // Clean up the content
      title = title.trim();
      content = content.trim();
      excerpt = excerpt.trim() || content.substring(0, 157) + "...";

      return {
        success: true,
        title,
        content,
        excerpt: excerpt || content.substring(0, 160) + "...",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate viral title using improved prompts
   */
  private async generateViralTitle(
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
            "⚠️ GPT-5 returned empty content - triggering fallback for viral title generation"
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
        console.log("🔍 Viral Title Generation Debug (fallback used):");
        console.log("- Response content length:", response?.length || 0);
      }

      let title = response?.trim() || "";

      // Validate title generation - if empty after fallback, this is critical
      if (!title || title.length === 0) {
        console.error(
          "❌ CRITICAL: Viral title generation failed even with GPT-4o fallback"
        );
        return {
          success: false,
          error:
            "Viral title generation failed completely - GPT-5-mini and GPT-4o fallback both returned empty content",
        };
      }

      // If title is too long, truncate it intelligently (improved prompts should prevent this)
      if (title.length > 70) {
        console.warn(
          `Viral title too long (${title.length} chars), truncating to 70 characters: "${title}"`
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
        console.log(
          `Truncated viral title: "${title}" (${title.length} chars)`
        );
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
   * Generate blog title (legacy method for backward compatibility)
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
   * Generate main blog content using improved viral prompts
   */
  private async generateContentWithImprovedPrompts(
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

      // Use the improved prompt structure with enhanced Romanian optimization
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
          maxTokens: 3500, // Optimized for 2200-2800 words (~2500 words avg)
          model: this.config!.primaryModel,
        });

        // Check if GPT-5-mini returned empty content (expected behavior for reasoning models)
        if (!response || response.trim().length === 0) {
          console.warn(
            "⚠️ GPT-5 returned empty content - triggering fallback for viral content generation"
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
            maxTokens: 3500, // Optimized for 2200-2800 words (~2500 words avg)
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
          maxTokens: 3500, // Optimized for 2200-2800 words (~2500 words avg)
          model: getAIConfig().fallbackModel,
        });
      }

      // Debug content generation (only on fallback)
      if (this.config!.primaryModel !== "gpt-4o") {
        console.log("🔍 Viral Content Generation Debug (fallback used):");
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
   * Generate main blog content (legacy method for backward compatibility)
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
          maxTokens: 3500, // Optimized for 2200-2800 words (~2500 words avg)
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
            maxTokens: 3500, // Optimized for 2200-2800 words (~2500 words avg)
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
          maxTokens: 3500, // Optimized for 2200-2800 words (~2500 words avg)
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
          maxTokens: 3500, // Increased for comprehensive refinement like Blog 1
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
            maxTokens: 3500, // Increased for comprehensive refinement like Blog 1
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
          maxTokens: 3500, // Increased for comprehensive refinement like Blog 1
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
   * Generate viral excerpt using improved prompts
   */
  private async generateViralExcerpt(
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
            "⚠️ GPT-5 returned empty content - triggering fallback for viral excerpt generation"
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
      console.warn("Viral excerpt generation failed:", error);
      return null;
    }
  }

  /**
   * Generate excerpt (legacy method for backward compatibility)
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

  /**
   * COMPREHENSIVE QUALITY VALIDATION SYSTEM - Phase 5 Task 5.1.1
   * Validates all aspects of blog quality for 100/100 score achievement
   */
  private validateBlogSchema(blog: GeneratedBlogContent): BlogValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const correctedBlog: Partial<GeneratedBlogContent> = {};

    console.log("🔍 Starting comprehensive quality validation...");

    // 1. CONTENT LENGTH VALIDATION (Critical for 100/100 score)
    const wordCount = this.calculateWordCount(blog.content);
    if (wordCount < 2200) {
      errors.push(
        `Content too short: ${wordCount} words (minimum 2200 required for Phase 4)`
      );
    } else if (wordCount > 2800) {
      warnings.push(
        `Content very long: ${wordCount} words (optimal range 2200-2800)`
      );
    } else {
      console.log(
        `✅ Content length: ${wordCount} words (within optimal range)`
      );
    }

    // 2. TITLE LENGTH VALIDATION (Critical for SEO)
    if (!blog.title || blog.title.length < 10) {
      errors.push("Title must be at least 10 characters");
    } else if (blog.title.length > 60) {
      errors.push(
        `Title too long: ${blog.title.length} characters (maximum 60 for SEO)`
      );
      // Auto-correct title if too long
      correctedBlog.title = this.truncateTitleIntelligently(blog.title, 60);
      console.log(
        `🔧 Auto-corrected title length: ${correctedBlog.title?.length} characters`
      );
    } else {
      console.log(`✅ Title length: ${blog.title.length} characters (optimal)`);
    }

    // 3. FAQ SECTION VALIDATION (Critical for voice search and featured snippets)
    const faqCount = this.countFAQQuestions(blog.content);
    if (faqCount < 15) {
      errors.push(
        `FAQ section incomplete: ${faqCount} questions (minimum 15 required for Phase 4 voice search)`
      );
    } else {
      console.log(`✅ FAQ section: ${faqCount} questions (comprehensive)`);
    }

    // 4. INTERNAL LINKS VALIDATION (Critical for SEO)
    const internalLinksCount = this.countInternalLinks(blog.content);
    if (internalLinksCount < 8) {
      errors.push(
        `Insufficient internal links: ${internalLinksCount} links (minimum 8 required)`
      );
    } else {
      console.log(`✅ Internal links: ${internalLinksCount} links (strategic)`);
    }

    // 5. STRUCTURED DATA VALIDATION (Critical for technical SEO)
    if (!blog.seoMetadata.structuredData) {
      errors.push("Missing structured data (required for featured snippets)");
    } else {
      console.log("✅ Structured data: Present");
    }

    // 6. CALL-TO-ACTION VALIDATION (Critical for conversion)
    const ctaCount = this.countCallToActions(blog.content);
    if (ctaCount < 3) {
      errors.push(
        `Insufficient CTAs: ${ctaCount} CTAs (minimum 3 required for conversion)`
      );
    } else {
      console.log(`✅ Call-to-actions: ${ctaCount} CTAs (strategic placement)`);
    }

    // 7. ROMANIAN CULTURAL CONTEXT VALIDATION
    const romanianContextScore = this.validateRomanianContext(blog.content);
    if (romanianContextScore < 0.7) {
      warnings.push(
        `Low Romanian cultural relevance: ${Math.round(romanianContextScore * 100)}% (target: 70%+)`
      );
    } else {
      console.log(
        `✅ Romanian context: ${Math.round(romanianContextScore * 100)}% (excellent)`
      );
    }

    // 8. VIRAL ELEMENTS VALIDATION
    const viralScore = this.validateViralElements(blog.content);
    if (viralScore < 0.6) {
      warnings.push(
        `Low viral potential: ${Math.round(viralScore * 100)}% (target: 60%+)`
      );
    } else {
      console.log(
        `✅ Viral elements: ${Math.round(viralScore * 100)}% (high potential)`
      );
    }

    // 9. SEO METADATA VALIDATION
    if (blog.seoMetadata.metaTitle && blog.seoMetadata.metaTitle.length > 70) {
      errors.push(
        `Meta title too long: ${blog.seoMetadata.metaTitle.length} characters (maximum 70)`
      );
    }
    if (
      blog.seoMetadata.metaDescription &&
      blog.seoMetadata.metaDescription.length > 160
    ) {
      errors.push(
        `Meta description too long: ${blog.seoMetadata.metaDescription.length} characters (maximum 160)`
      );
    }

    // 10. CONTENT STRUCTURE VALIDATION
    const structureScore = this.validateContentStructure(blog.content);
    if (structureScore < 0.8) {
      warnings.push(
        `Content structure needs improvement: ${Math.round(structureScore * 100)}% (target: 80%+)`
      );
    } else {
      console.log(
        `✅ Content structure: ${Math.round(structureScore * 100)}% (excellent)`
      );
    }

    // 11. READING TIME VALIDATION
    const calculatedReadingTime = Math.ceil(wordCount / 200);
    if (Math.abs(blog.readingTime - calculatedReadingTime) > 1) {
      warnings.push("Reading time calculation may be inaccurate");
      correctedBlog.readingTime = calculatedReadingTime;
    }

    // 12. EXCERPT VALIDATION
    if (!blog.excerpt || blog.excerpt.length < 50) {
      errors.push("Excerpt must be at least 50 characters");
    } else if (blog.excerpt.length > 200) {
      warnings.push(
        `Excerpt too long: ${blog.excerpt.length} characters (optimal: 120-160)`
      );
    }

    // Calculate comprehensive quality score
    const qualityScore = this.calculateComprehensiveQualityScore(
      wordCount,
      faqCount,
      internalLinksCount,
      ctaCount,
      romanianContextScore,
      viralScore,
      structureScore,
      errors.length,
      warnings.length
    );

    console.log(`🎯 Comprehensive Quality Score: ${qualityScore}/100`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: qualityScore,
      correctedBlog:
        Object.keys(correctedBlog).length > 0 ? correctedBlog : undefined,
    };
  }

  /**
   * Count FAQ questions in content
   */
  private countFAQQuestions(content: string): number {
    const faqPatterns = [
      /##\s*\*?\*?ÎNTREBĂRI FRECVENTE\*?\*?\s*/i,
      /##\s*\*?\*?FAQ\*?\*?\s*/i,
      /##\s*\*?\*?Întrebări Frecvente\*?\*?\s*/i,
      /##\s*\*?\*?Întrebări și Răspunsuri\*?\*?\s*/i,
    ];

    let faqSection = "";
    for (const pattern of faqPatterns) {
      const match = content.match(pattern);
      if (match) {
        const startIndex = content.indexOf(match[0]);
        const nextSection = content.substring(startIndex).match(/##\s+/);
        if (nextSection) {
          faqSection = content.substring(
            startIndex,
            startIndex + content.substring(startIndex).indexOf(nextSection[0])
          );
        } else {
          faqSection = content.substring(startIndex);
        }
        break;
      }
    }

    if (!faqSection) return 0;

    // Count question patterns
    const questionPatterns = [
      /^\d+\.\s*["']?[^"']*\?["']?/gm,
      /^[Qq]\d*\.\s*["']?[^"']*\?["']?/gm,
      /^\*\s*["']?[^"']*\?["']?/gm,
      /^-\s*["']?[^"']*\?["']?/gm,
    ];

    let maxQuestions = 0;
    for (const pattern of questionPatterns) {
      const matches = faqSection.match(pattern);
      if (matches && matches.length > maxQuestions) {
        maxQuestions = matches.length;
      }
    }

    return maxQuestions;
  }

  /**
   * Count internal links in content
   */
  private countInternalLinks(content: string): number {
    const internalLinkPatterns = [
      /\[([^\]]+)\]\(\/(?!http)[^)]+\)/g, // Markdown links starting with /
      /href=["']\/(?!http)[^"']+["']/g, // HTML links starting with /
    ];

    let totalLinks = 0;
    for (const pattern of internalLinkPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        totalLinks += matches.length;
      }
    }

    return totalLinks;
  }

  /**
   * Count call-to-action elements in content
   */
  private countCallToActions(content: string): number {
    const ctaPatterns = [
      /(?:CTA|Call-to-Action|Acțiune|Acționează|Comandă|Cumpără|Începe|Descoperă|Înregistrează-te|Abonează-te)/gi,
      /(?:Transformă|Rezolvă|Îmbunătățește|Optimizează|Maximizează|Minimizează).*?(?:acum|astăzi|azi|imediat)/gi,
      /(?:Doar până|Ofertă limitată|Stoc limitat|Ultima șansă|Nu rata)/gi,
    ];

    let totalCTAs = 0;
    for (const pattern of ctaPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        totalCTAs += matches.length;
      }
    }

    return totalCTAs;
  }

  /**
   * Validate Romanian cultural context
   */
  private validateRomanianContext(content: string): number {
    const romanianIndicators = [
      // Cities
      /București|Cluj|Timișoara|Iași|Constanța|Brașov|Craiova|Sibiu|Ploiești|Galați/gi,
      // Education system
      /școală românească|sistemul educațional|Programa Națională|evaluări naționale|admitere la liceu/gi,
      // Cultural references
      /părinți români|familie românească|tradiții românești|sărbători românești/gi,
      // Economic context
      /lei|RON|salariu mediu|bugetul familiei|meditații|școli private/gi,
      // Language patterns
      /cum să|de ce să|care sunt|ce este|unde pot/gi,
    ];

    let totalMatches = 0;
    let totalPossible = romanianIndicators.length;

    for (const pattern of romanianIndicators) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        totalMatches++;
      }
    }

    return totalMatches / totalPossible;
  }

  /**
   * Validate viral elements
   */
  private validateViralElements(content: string): number {
    const viralIndicators = [
      // Shocking statistics
      /\d+%|\d+\s*din|\d+\s*ani|\d+\s*luni|\d+\s*săptămâni/gi,
      // Emotional triggers
      /secret|revelat|descoperit|șocant|uimitor|incredibil|revoluționar/gi,
      // Social proof
      /studii|cercetări|experți|profesori|specialiști|cercetători/gi,
      // Urgency/scarcity
      /acum|astăzi|urgent|limită|ultima șansă|doar până/gi,
      // Success stories
      /Maria|Andrei|Ana|Mihai|familia|școala|liceul|grădinița/gi,
    ];

    let totalMatches = 0;
    let totalPossible = viralIndicators.length;

    for (const pattern of viralIndicators) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        totalMatches++;
      }
    }

    return totalMatches / totalPossible;
  }

  /**
   * Validate content structure
   */
  private validateContentStructure(content: string): number {
    const structureElements = [
      // Headers
      /^#\s+.+$/gm, // H1
      /^##\s+.+$/gm, // H2
      /^###\s+.+$/gm, // H3
      // Lists
      /^[-*+]\s+.+$/gm, // Bullet points
      /^\d+\.\s+.+$/gm, // Numbered lists
      // Emphasis
      /\*\*[^*]+\*\*/g, // Bold text
      // Paragraphs
      /\n\n/g, // Paragraph breaks
    ];

    let totalElements = 0;
    for (const pattern of structureElements) {
      const matches = content.match(pattern);
      if (matches) {
        totalElements += matches.length;
      }
    }

    // Normalize score (more elements = better structure)
    const normalizedScore = Math.min(totalElements / 50, 1); // Cap at 1.0
    return normalizedScore;
  }

  /**
   * Intelligently truncate title while preserving meaning
   */
  private truncateTitleIntelligently(title: string, maxLength: number): string {
    if (title.length <= maxLength) return title;

    // Try to find a good break point (sentence end, word boundary)
    const sentences = title.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 1) {
      let result = sentences[0].trim();
      for (let i = 1; i < sentences.length; i++) {
        const candidate = result + ". " + sentences[i].trim();
        if (candidate.length <= maxLength) {
          result = candidate;
        } else {
          break;
        }
      }
      if (result.length >= 10) return result;
    }

    // Try word boundaries
    const words = title.split(/\s+/);
    let result = "";
    for (const word of words) {
      const candidate = result ? result + " " + word : word;
      if (candidate.length <= maxLength) {
        result = candidate;
      } else {
        break;
      }
    }

    return result.length >= 10
      ? result
      : title.substring(0, maxLength - 3) + "...";
  }

  /**
   * Calculate comprehensive quality score for 100/100 target
   */
  private calculateComprehensiveQualityScore(
    wordCount: number,
    faqCount: number,
    internalLinksCount: number,
    ctaCount: number,
    romanianContextScore: number,
    viralScore: number,
    structureScore: number,
    errorCount: number,
    warningCount: number
  ): number {
    let score = 0;

    // Content length (20 points)
    if (wordCount >= 2200 && wordCount <= 2800) {
      score += 20;
    } else if (wordCount >= 2000) {
      score += 15;
    } else if (wordCount >= 1500) {
      score += 10;
    }

    // FAQ section (15 points)
    if (faqCount >= 15) {
      score += 15;
    } else if (faqCount >= 10) {
      score += 10;
    } else if (faqCount >= 5) {
      score += 5;
    }

    // Internal links (15 points)
    if (internalLinksCount >= 8) {
      score += 15;
    } else if (internalLinksCount >= 5) {
      score += 10;
    } else if (internalLinksCount >= 3) {
      score += 5;
    }

    // Call-to-actions (10 points)
    if (ctaCount >= 5) {
      score += 10;
    } else if (ctaCount >= 3) {
      score += 8;
    } else if (ctaCount >= 1) {
      score += 5;
    }

    // Romanian context (15 points)
    score += Math.round(romanianContextScore * 15);

    // Viral elements (10 points)
    score += Math.round(viralScore * 10);

    // Content structure (10 points)
    score += Math.round(structureScore * 10);

    // Penalty for errors and warnings
    score -= errorCount * 5;
    score -= warningCount * 2;

    return Math.max(0, Math.min(100, score));
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
   * PERFORMANCE MONITORING SYSTEM - Phase 5 Task 5.1.2
   * Tracks and monitors all aspects of blog generation performance
   */
  private performanceMetrics: {
    totalGenerations: number;
    successfulGenerations: number;
    averageProcessingTime: number;
    averageQualityScore: number;
    averageSEOScore: number;
    averageViralScore: number;
    averageContentQuality: number;
    averageTechnicalScore: number;
    errorRate: number;
    lastUpdated: string;
  } = {
    totalGenerations: 0,
    successfulGenerations: 0,
    averageProcessingTime: 0,
    averageQualityScore: 0,
    averageSEOScore: 0,
    averageViralScore: 0,
    averageContentQuality: 0,
    averageTechnicalScore: 0,
    errorRate: 0,
    lastUpdated: new Date().toISOString(),
  };

  /**
   * Track blog generation performance metrics
   */
  private trackPerformanceMetrics(
    result: BlogGenerationResult,
    processingTime: number,
    qualityScore: number
  ): void {
    console.log("📊 Tracking performance metrics...");

    // Update basic metrics
    this.performanceMetrics.totalGenerations++;
    if (result.success) {
      this.performanceMetrics.successfulGenerations++;
    }

    // Calculate error rate
    this.performanceMetrics.errorRate =
      ((this.performanceMetrics.totalGenerations -
        this.performanceMetrics.successfulGenerations) /
        this.performanceMetrics.totalGenerations) *
      100;

    // Update average processing time
    this.performanceMetrics.averageProcessingTime =
      (this.performanceMetrics.averageProcessingTime *
        (this.performanceMetrics.totalGenerations - 1) +
        processingTime) /
      this.performanceMetrics.totalGenerations;

    // Update average quality score
    this.performanceMetrics.averageQualityScore =
      (this.performanceMetrics.averageQualityScore *
        (this.performanceMetrics.totalGenerations - 1) +
        qualityScore) /
      this.performanceMetrics.totalGenerations;

    // Calculate detailed scores if blog was generated successfully
    if (result.success && result.generatedBlog) {
      const seoScore = result.seoScore || 0;
      const viralScore = this.calculateViralScore(result.generatedBlog);
      const contentQuality = this.calculateContentQualityScore(
        result.generatedBlog
      );
      const technicalScore = this.calculateTechnicalScore(result.generatedBlog);

      // Update average scores
      this.performanceMetrics.averageSEOScore =
        (this.performanceMetrics.averageSEOScore *
          (this.performanceMetrics.successfulGenerations - 1) +
          seoScore) /
        this.performanceMetrics.successfulGenerations;

      this.performanceMetrics.averageViralScore =
        (this.performanceMetrics.averageViralScore *
          (this.performanceMetrics.successfulGenerations - 1) +
          viralScore) /
        this.performanceMetrics.successfulGenerations;

      this.performanceMetrics.averageContentQuality =
        (this.performanceMetrics.averageContentQuality *
          (this.performanceMetrics.successfulGenerations - 1) +
          contentQuality) /
        this.performanceMetrics.successfulGenerations;

      this.performanceMetrics.averageTechnicalScore =
        (this.performanceMetrics.averageTechnicalScore *
          (this.performanceMetrics.successfulGenerations - 1) +
          technicalScore) /
        this.performanceMetrics.successfulGenerations;
    }

    this.performanceMetrics.lastUpdated = new Date().toISOString();

    // Log performance summary
    console.log("📈 Performance Metrics Summary:");
    console.log(
      `   Total Generations: ${this.performanceMetrics.totalGenerations}`
    );
    console.log(
      `   Success Rate: ${((this.performanceMetrics.successfulGenerations / this.performanceMetrics.totalGenerations) * 100).toFixed(1)}%`
    );
    console.log(
      `   Average Processing Time: ${this.performanceMetrics.averageProcessingTime.toFixed(0)}ms`
    );
    console.log(
      `   Average Quality Score: ${this.performanceMetrics.averageQualityScore.toFixed(1)}/100`
    );
    console.log(
      `   Average SEO Score: ${this.performanceMetrics.averageSEOScore.toFixed(1)}/100`
    );
    console.log(
      `   Average Viral Score: ${this.performanceMetrics.averageViralScore.toFixed(1)}/100`
    );
    console.log(
      `   Average Content Quality: ${this.performanceMetrics.averageContentQuality.toFixed(1)}/100`
    );
    console.log(
      `   Average Technical Score: ${this.performanceMetrics.averageTechnicalScore.toFixed(1)}/100`
    );
    console.log(
      `   Error Rate: ${this.performanceMetrics.errorRate.toFixed(1)}%`
    );

    // Generate performance report if needed
    this.generatePerformanceReport();
  }

  /**
   * Calculate viral score based on content analysis
   */
  private calculateViralScore(blog: GeneratedBlogContent): number {
    const viralScore = this.validateViralElements(blog.content);
    return Math.round(viralScore * 100);
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQualityScore(blog: GeneratedBlogContent): number {
    const wordCount = this.calculateWordCount(blog.content);
    const faqCount = this.countFAQQuestions(blog.content);
    const internalLinksCount = this.countInternalLinks(blog.content);
    const ctaCount = this.countCallToActions(blog.content);
    const romanianContextScore = this.validateRomanianContext(blog.content);
    const viralScore = this.validateViralElements(blog.content);
    const structureScore = this.validateContentStructure(blog.content);

    return this.calculateComprehensiveQualityScore(
      wordCount,
      faqCount,
      internalLinksCount,
      ctaCount,
      romanianContextScore,
      viralScore,
      structureScore,
      0, // No errors for successful generation
      0 // No warnings for successful generation
    );
  }

  /**
   * Calculate technical implementation score
   */
  private calculateTechnicalScore(blog: GeneratedBlogContent): number {
    let score = 0;

    // Structured data (25 points)
    if (blog.seoMetadata.structuredData) {
      score += 25;
    }

    // Meta tags (25 points)
    if (blog.seoMetadata.metaTitle && blog.seoMetadata.metaTitle.length <= 70) {
      score += 12.5;
    }
    if (
      blog.seoMetadata.metaDescription &&
      blog.seoMetadata.metaDescription.length <= 160
    ) {
      score += 12.5;
    }

    // Internal links (25 points)
    const internalLinksCount = this.countInternalLinks(blog.content);
    if (internalLinksCount >= 8) {
      score += 25;
    } else if (internalLinksCount >= 5) {
      score += 15;
    } else if (internalLinksCount >= 3) {
      score += 10;
    }

    // Social media optimization (25 points)
    if (blog.seoMetadata.openGraph && blog.seoMetadata.twitterCards) {
      score += 25;
    } else if (blog.seoMetadata.openGraph || blog.seoMetadata.twitterCards) {
      score += 12.5;
    }

    return Math.min(100, score);
  }

  /**
   * Generate comprehensive performance report
   */
  private generatePerformanceReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalGenerations: this.performanceMetrics.totalGenerations,
        successRate:
          (
            (this.performanceMetrics.successfulGenerations /
              this.performanceMetrics.totalGenerations) *
            100
          ).toFixed(1) + "%",
        averageProcessingTime:
          Math.round(this.performanceMetrics.averageProcessingTime) + "ms",
        errorRate: this.performanceMetrics.errorRate.toFixed(1) + "%",
      },
      qualityMetrics: {
        averageQualityScore:
          this.performanceMetrics.averageQualityScore.toFixed(1) + "/100",
        averageSEOScore:
          this.performanceMetrics.averageSEOScore.toFixed(1) + "/100",
        averageViralScore:
          this.performanceMetrics.averageViralScore.toFixed(1) + "/100",
        averageContentQuality:
          this.performanceMetrics.averageContentQuality.toFixed(1) + "/100",
        averageTechnicalScore:
          this.performanceMetrics.averageTechnicalScore.toFixed(1) + "/100",
      },
      targetAchievement: {
        qualityTarget:
          this.performanceMetrics.averageQualityScore >= 90
            ? "✅ ACHIEVED"
            : "❌ NEEDS IMPROVEMENT",
        seoTarget:
          this.performanceMetrics.averageSEOScore >= 90
            ? "✅ ACHIEVED"
            : "❌ NEEDS IMPROVEMENT",
        viralTarget:
          this.performanceMetrics.averageViralScore >= 80
            ? "✅ ACHIEVED"
            : "❌ NEEDS IMPROVEMENT",
        contentTarget:
          this.performanceMetrics.averageContentQuality >= 90
            ? "✅ ACHIEVED"
            : "❌ NEEDS IMPROVEMENT",
        technicalTarget:
          this.performanceMetrics.averageTechnicalScore >= 90
            ? "✅ ACHIEVED"
            : "❌ NEEDS IMPROVEMENT",
      },
      recommendations: this.generatePerformanceRecommendations(),
    };

    // Log report every 10 generations or if there are issues
    if (
      this.performanceMetrics.totalGenerations % 10 === 0 ||
      this.performanceMetrics.errorRate > 10
    ) {
      console.log("📊 PERFORMANCE REPORT:");
      console.log(JSON.stringify(report, null, 2));
    }
  }

  /**
   * Generate performance improvement recommendations
   */
  private generatePerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.performanceMetrics.averageQualityScore < 90) {
      recommendations.push(
        "Improve content length and structure to reach 2200-2800 words"
      );
    }

    if (this.performanceMetrics.averageSEOScore < 90) {
      recommendations.push(
        "Enhance SEO metadata generation and keyword optimization"
      );
    }

    if (this.performanceMetrics.averageViralScore < 80) {
      recommendations.push(
        "Add more viral elements: statistics, emotional triggers, social proof"
      );
    }

    if (this.performanceMetrics.averageContentQuality < 90) {
      recommendations.push(
        "Improve FAQ sections and internal linking strategy"
      );
    }

    if (this.performanceMetrics.averageTechnicalScore < 90) {
      recommendations.push(
        "Enhance structured data and social media optimization"
      );
    }

    if (this.performanceMetrics.errorRate > 10) {
      recommendations.push(
        "Investigate and fix generation errors to improve reliability"
      );
    }

    if (this.performanceMetrics.averageProcessingTime > 120000) {
      recommendations.push(
        "Optimize processing time for better user experience"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "All metrics are performing well! Continue current approach."
      );
    }

    return recommendations;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics (useful for testing)
   */
  public resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      averageProcessingTime: 0,
      averageQualityScore: 0,
      averageSEOScore: 0,
      averageViralScore: 0,
      averageContentQuality: 0,
      averageTechnicalScore: 0,
      errorRate: 0,
      lastUpdated: new Date().toISOString(),
    };
    console.log("🔄 Performance metrics reset");
  }

  /**
   * A/B TESTING SYSTEM - Phase 5 Task 5.2.1
   * Implements comprehensive A/B testing for content variations
   */
  private abTestResults: {
    titleFormats: Map<
      string,
      { count: number; avgScore: number; avgProcessingTime: number }
    >;
    viralOptimizationLevels: Map<
      string,
      { count: number; avgScore: number; avgProcessingTime: number }
    >;
    ctaPlacements: Map<
      string,
      { count: number; avgScore: number; avgProcessingTime: number }
    >;
    faqLengths: Map<
      string,
      { count: number; avgScore: number; avgProcessingTime: number }
    >;
    contentStructures: Map<
      string,
      { count: number; avgScore: number; avgProcessingTime: number }
    >;
  } = {
    titleFormats: new Map(),
    viralOptimizationLevels: new Map(),
    ctaPlacements: new Map(),
    faqLengths: new Map(),
    contentStructures: new Map(),
  };

  /**
   * Run A/B test for different content variations
   */
  public async runABTest(
    prompt: BlogGenerationPrompt,
    options: BlogGenerationOptions,
    testType:
      | "title_formats"
      | "viral_optimization"
      | "cta_placements"
      | "faq_lengths"
      | "content_structures",
    variations: string[] = []
  ): Promise<{
    testType: string;
    results: Array<{
      variation: string;
      result: BlogGenerationResult;
      qualityScore: number;
      processingTime: number;
    }>;
    winner: string;
    recommendations: string[];
  }> {
    console.log(`🧪 Starting A/B test for ${testType}...`);

    const results: Array<{
      variation: string;
      result: BlogGenerationResult;
      qualityScore: number;
      processingTime: number;
    }> = [];

    // Get default variations if none provided
    const testVariations =
      variations.length > 0 ? variations : this.getDefaultVariations(testType);

    // Test each variation
    for (const variation of testVariations) {
      console.log(`🔬 Testing variation: ${variation}`);

      const startTime = Date.now();
      const modifiedOptions = this.applyVariationToOptions(
        options,
        testType,
        variation
      );

      try {
        const result = await this.generateBlog(prompt, modifiedOptions);
        const processingTime = Date.now() - startTime;
        const qualityScore = result.success
          ? this.calculateComprehensiveQualityScore(
              this.calculateWordCount(result.generatedBlog!.content),
              this.countFAQQuestions(result.generatedBlog!.content),
              this.countInternalLinks(result.generatedBlog!.content),
              this.countCallToActions(result.generatedBlog!.content),
              this.validateRomanianContext(result.generatedBlog!.content),
              this.validateViralElements(result.generatedBlog!.content),
              this.validateContentStructure(result.generatedBlog!.content),
              0,
              0
            )
          : 0;

        results.push({
          variation,
          result,
          qualityScore,
          processingTime,
        });

        // Track A/B test results
        this.trackABTestResult(
          testType,
          variation,
          qualityScore,
          processingTime
        );
      } catch (error) {
        console.error(`❌ A/B test failed for variation ${variation}:`, error);
        results.push({
          variation,
          result: {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            processingTime: Date.now() - startTime,
          },
          qualityScore: 0,
          processingTime: Date.now() - startTime,
        });
      }
    }

    // Determine winner and generate recommendations
    const winner = this.determineABTestWinner(results);
    const recommendations = this.generateABTestRecommendations(
      testType,
      results,
      winner
    );

    console.log(`🏆 A/B test completed. Winner: ${winner}`);

    return {
      testType,
      results,
      winner,
      recommendations,
    };
  }

  /**
   * Get default variations for each test type
   */
  private getDefaultVariations(testType: string): string[] {
    switch (testType) {
      case "title_formats":
        return [
          "question_format",
          "statistic_format",
          "secret_format",
          "result_format",
          "comparison_format",
        ];
      case "viral_optimization":
        return ["high_viral", "medium_viral", "low_viral", "minimal_viral"];
      case "cta_placements":
        return [
          "beginning_middle_end",
          "strategic_placement",
          "high_frequency",
          "minimal_ctas",
        ];
      case "faq_lengths":
        return ["15_questions", "10_questions", "20_questions", "5_questions"];
      case "content_structures":
        return [
          "comprehensive_structure",
          "simplified_structure",
          "story_driven",
          "data_driven",
        ];
      default:
        return [];
    }
  }

  /**
   * Apply variation to blog generation options
   */
  private applyVariationToOptions(
    options: BlogGenerationOptions,
    testType: string,
    variation: string
  ): BlogGenerationOptions {
    const modifiedOptions = { ...options };

    switch (testType) {
      case "title_formats":
        modifiedOptions.titleFormat = variation as any;
        break;
      case "viral_optimization":
        modifiedOptions.viralOptimizationLevel = variation as any;
        break;
      case "cta_placements":
        modifiedOptions.ctaStrategy = variation as any;
        break;
      case "faq_lengths":
        modifiedOptions.faqLength = variation as any;
        break;
      case "content_structures":
        modifiedOptions.contentStructure = variation as any;
        break;
    }

    return modifiedOptions;
  }

  /**
   * Track A/B test results for analysis
   */
  private trackABTestResult(
    testType: string,
    variation: string,
    qualityScore: number,
    processingTime: number
  ): void {
    const testResults =
      this.abTestResults[testType as keyof typeof this.abTestResults];

    if (!testResults.has(variation)) {
      testResults.set(variation, {
        count: 0,
        avgScore: 0,
        avgProcessingTime: 0,
      });
    }

    const current = testResults.get(variation)!;
    const newCount = current.count + 1;

    testResults.set(variation, {
      count: newCount,
      avgScore: (current.avgScore * current.count + qualityScore) / newCount,
      avgProcessingTime:
        (current.avgProcessingTime * current.count + processingTime) / newCount,
    });

    console.log(
      `📊 A/B test result tracked: ${testType}/${variation} - Score: ${qualityScore}, Time: ${processingTime}ms`
    );
  }

  /**
   * Determine winner of A/B test
   */
  private determineABTestWinner(
    results: Array<{
      variation: string;
      result: BlogGenerationResult;
      qualityScore: number;
      processingTime: number;
    }>
  ): string {
    // Sort by quality score (primary) and processing time (secondary)
    const sortedResults = results.sort((a, b) => {
      if (a.qualityScore !== b.qualityScore) {
        return b.qualityScore - a.qualityScore; // Higher quality score wins
      }
      return a.processingTime - b.processingTime; // Lower processing time wins
    });

    return sortedResults[0]?.variation || "unknown";
  }

  /**
   * Generate A/B test recommendations
   */
  private generateABTestRecommendations(
    testType: string,
    results: Array<{
      variation: string;
      result: BlogGenerationResult;
      qualityScore: number;
      processingTime: number;
    }>,
    winner: string
  ): string[] {
    const recommendations: string[] = [];
    const sortedResults = results.sort(
      (a, b) => b.qualityScore - a.qualityScore
    );

    // Add winner recommendation
    recommendations.push(
      `Use "${winner}" variation for optimal results (Score: ${sortedResults[0]?.qualityScore}/100)`
    );

    // Add performance insights
    const avgScore =
      results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
    const avgTime =
      results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    recommendations.push(
      `Average quality score across all variations: ${avgScore.toFixed(1)}/100`
    );
    recommendations.push(`Average processing time: ${Math.round(avgTime)}ms`);

    // Add specific insights based on test type
    switch (testType) {
      case "title_formats":
        recommendations.push(
          "Monitor click-through rates to validate title format effectiveness"
        );
        break;
      case "viral_optimization":
        recommendations.push(
          "Track social sharing metrics to confirm viral optimization impact"
        );
        break;
      case "cta_placements":
        recommendations.push(
          "Measure conversion rates to validate CTA placement strategy"
        );
        break;
      case "faq_lengths":
        recommendations.push(
          "Monitor featured snippet appearances to validate FAQ length"
        );
        break;
      case "content_structures":
        recommendations.push(
          "Track user engagement metrics to validate content structure"
        );
        break;
    }

    // Add improvement suggestions
    const lowestScore = Math.min(...results.map(r => r.qualityScore));
    if (lowestScore < 70) {
      recommendations.push(
        `Consider improving variations with scores below 70 (lowest: ${lowestScore})`
      );
    }

    return recommendations;
  }

  /**
   * Get A/B test results summary
   */
  public getABTestResults(): typeof this.abTestResults {
    return {
      titleFormats: new Map(this.abTestResults.titleFormats),
      viralOptimizationLevels: new Map(
        this.abTestResults.viralOptimizationLevels
      ),
      ctaPlacements: new Map(this.abTestResults.ctaPlacements),
      faqLengths: new Map(this.abTestResults.faqLengths),
      contentStructures: new Map(this.abTestResults.contentStructures),
    };
  }

  /**
   * Reset A/B test results (useful for testing)
   */
  public resetABTestResults(): void {
    this.abTestResults = {
      titleFormats: new Map(),
      viralOptimizationLevels: new Map(),
      ctaPlacements: new Map(),
      faqLengths: new Map(),
      contentStructures: new Map(),
    };
    console.log("🔄 A/B test results reset");
  }

  /**
   * PERFORMANCE BENCHMARKING SYSTEM - Phase 5 Task 5.2.2
   * Implements comprehensive performance benchmarking and monitoring
   */
  private benchmarkData: {
    baselineMetrics: {
      averageQualityScore: number;
      averageSEOScore: number;
      averageViralScore: number;
      averageContentQuality: number;
      averageTechnicalScore: number;
      averageProcessingTime: number;
      successRate: number;
      establishedAt: string;
    };
    improvementTracking: Array<{
      date: string;
      qualityScore: number;
      seoScore: number;
      viralScore: number;
      contentQuality: number;
      technicalScore: number;
      processingTime: number;
      successRate: number;
      notes?: string;
    }>;
    industryStandards: {
      qualityScore: {
        excellent: number;
        good: number;
        average: number;
        poor: number;
      };
      seoScore: {
        excellent: number;
        good: number;
        average: number;
        poor: number;
      };
      viralScore: {
        excellent: number;
        good: number;
        average: number;
        poor: number;
      };
      processingTime: {
        excellent: number;
        good: number;
        average: number;
        poor: number;
      };
      successRate: {
        excellent: number;
        good: number;
        average: number;
        poor: number;
      };
    };
    romanianMarketMetrics: {
      culturalRelevance: number;
      localKeywordOptimization: number;
      regionalEngagement: number;
      parentPainPointAddressing: number;
      educationSystemAlignment: number;
    };
  } = {
    baselineMetrics: {
      averageQualityScore: 0,
      averageSEOScore: 0,
      averageViralScore: 0,
      averageContentQuality: 0,
      averageTechnicalScore: 0,
      averageProcessingTime: 0,
      successRate: 0,
      establishedAt: new Date().toISOString(),
    },
    improvementTracking: [],
    industryStandards: {
      qualityScore: { excellent: 90, good: 80, average: 70, poor: 60 },
      seoScore: { excellent: 90, good: 80, average: 70, poor: 60 },
      viralScore: { excellent: 85, good: 75, average: 65, poor: 55 },
      processingTime: {
        excellent: 5000,
        good: 8000,
        average: 12000,
        poor: 15000,
      },
      successRate: { excellent: 95, good: 90, average: 85, poor: 80 },
    },
    romanianMarketMetrics: {
      culturalRelevance: 0,
      localKeywordOptimization: 0,
      regionalEngagement: 0,
      parentPainPointAddressing: 0,
      educationSystemAlignment: 0,
    },
  };

  /**
   * Establish baseline performance metrics
   */
  public establishBaselineMetrics(): void {
    console.log("📊 Establishing baseline performance metrics...");

    // Use current performance metrics as baseline
    this.benchmarkData.baselineMetrics = {
      averageQualityScore: this.performanceMetrics.averageQualityScore,
      averageSEOScore: this.performanceMetrics.averageSEOScore,
      averageViralScore: this.performanceMetrics.averageViralScore,
      averageContentQuality: this.performanceMetrics.averageContentQuality,
      averageTechnicalScore: this.performanceMetrics.averageTechnicalScore,
      averageProcessingTime: this.performanceMetrics.averageProcessingTime,
      successRate:
        (this.performanceMetrics.successfulGenerations /
          this.performanceMetrics.totalGenerations) *
        100,
      establishedAt: new Date().toISOString(),
    };

    console.log("✅ Baseline metrics established:");
    console.log(
      `   Quality Score: ${this.benchmarkData.baselineMetrics.averageQualityScore.toFixed(1)}/100`
    );
    console.log(
      `   SEO Score: ${this.benchmarkData.baselineMetrics.averageSEOScore.toFixed(1)}/100`
    );
    console.log(
      `   Viral Score: ${this.benchmarkData.baselineMetrics.averageViralScore.toFixed(1)}/100`
    );
    console.log(
      `   Content Quality: ${this.benchmarkData.baselineMetrics.averageContentQuality.toFixed(1)}/100`
    );
    console.log(
      `   Technical Score: ${this.benchmarkData.baselineMetrics.averageTechnicalScore.toFixed(1)}/100`
    );
    console.log(
      `   Processing Time: ${this.benchmarkData.baselineMetrics.averageProcessingTime.toFixed(0)}ms`
    );
    console.log(
      `   Success Rate: ${this.benchmarkData.baselineMetrics.successRate.toFixed(1)}%`
    );
  }

  /**
   * Track performance improvements over time
   */
  public trackPerformanceImprovement(notes?: string): void {
    console.log("📈 Tracking performance improvement...");

    const currentMetrics = {
      date: new Date().toISOString(),
      qualityScore: this.performanceMetrics.averageQualityScore,
      seoScore: this.performanceMetrics.averageSEOScore,
      viralScore: this.performanceMetrics.averageViralScore,
      contentQuality: this.performanceMetrics.averageContentQuality,
      technicalScore: this.performanceMetrics.averageTechnicalScore,
      processingTime: this.performanceMetrics.averageProcessingTime,
      successRate:
        (this.performanceMetrics.successfulGenerations /
          this.performanceMetrics.totalGenerations) *
        100,
      notes,
    };

    this.benchmarkData.improvementTracking.push(currentMetrics);

    // Calculate improvements from baseline
    const improvements = this.calculateImprovementsFromBaseline(currentMetrics);

    console.log("📊 Performance improvements since baseline:");
    console.log(
      `   Quality Score: ${improvements.qualityScore > 0 ? "+" : ""}${improvements.qualityScore.toFixed(1)} points`
    );
    console.log(
      `   SEO Score: ${improvements.seoScore > 0 ? "+" : ""}${improvements.seoScore.toFixed(1)} points`
    );
    console.log(
      `   Viral Score: ${improvements.viralScore > 0 ? "+" : ""}${improvements.viralScore.toFixed(1)} points`
    );
    console.log(
      `   Content Quality: ${improvements.contentQuality > 0 ? "+" : ""}${improvements.contentQuality.toFixed(1)} points`
    );
    console.log(
      `   Technical Score: ${improvements.technicalScore > 0 ? "+" : ""}${improvements.technicalScore.toFixed(1)} points`
    );
    console.log(
      `   Processing Time: ${improvements.processingTime > 0 ? "+" : ""}${improvements.processingTime.toFixed(0)}ms`
    );
    console.log(
      `   Success Rate: ${improvements.successRate > 0 ? "+" : ""}${improvements.successRate.toFixed(1)}%`
    );
  }

  /**
   * Calculate improvements from baseline
   */
  private calculateImprovementsFromBaseline(currentMetrics: any): any {
    return {
      qualityScore:
        currentMetrics.qualityScore -
        this.benchmarkData.baselineMetrics.averageQualityScore,
      seoScore:
        currentMetrics.seoScore -
        this.benchmarkData.baselineMetrics.averageSEOScore,
      viralScore:
        currentMetrics.viralScore -
        this.benchmarkData.baselineMetrics.averageViralScore,
      contentQuality:
        currentMetrics.contentQuality -
        this.benchmarkData.baselineMetrics.averageContentQuality,
      technicalScore:
        currentMetrics.technicalScore -
        this.benchmarkData.baselineMetrics.averageTechnicalScore,
      processingTime:
        currentMetrics.processingTime -
        this.benchmarkData.baselineMetrics.averageProcessingTime,
      successRate:
        currentMetrics.successRate -
        this.benchmarkData.baselineMetrics.successRate,
    };
  }

  /**
   * Compare performance against industry standards
   */
  public compareAgainstIndustryStandards(): {
    qualityScore: { score: number; rating: string; gap: number };
    seoScore: { score: number; rating: string; gap: number };
    viralScore: { score: number; rating: string; gap: number };
    processingTime: { score: number; rating: string; gap: number };
    successRate: { score: number; rating: string; gap: number };
    overallRating: string;
    recommendations: string[];
  } {
    console.log("🏭 Comparing performance against industry standards...");

    const currentMetrics = {
      qualityScore: this.performanceMetrics.averageQualityScore,
      seoScore: this.performanceMetrics.averageSEOScore,
      viralScore: this.performanceMetrics.averageViralScore,
      processingTime: this.performanceMetrics.averageProcessingTime,
      successRate:
        (this.performanceMetrics.successfulGenerations /
          this.performanceMetrics.totalGenerations) *
        100,
    };

    const standards = this.benchmarkData.industryStandards;
    const results: any = {};
    const recommendations: string[] = [];

    // Evaluate each metric
    const metrics = [
      "qualityScore",
      "seoScore",
      "viralScore",
      "processingTime",
      "successRate",
    ] as const;

    for (const metric of metrics) {
      const current = currentMetrics[metric];
      const standard = standards[metric];

      let rating: string;
      let gap: number;

      if (current >= standard.excellent) {
        rating = "excellent";
        gap = 0;
      } else if (current >= standard.good) {
        rating = "good";
        gap = standard.excellent - current;
      } else if (current >= standard.average) {
        rating = "average";
        gap = standard.good - current;
      } else {
        rating = "poor";
        gap = standard.average - current;
      }

      results[metric] = { score: current, rating, gap };

      // Generate recommendations for improvement
      if (gap > 0) {
        recommendations.push(
          `${metric}: Improve by ${gap.toFixed(1)} points to reach ${rating === "average" ? "good" : rating === "good" ? "excellent" : "average"} level`
        );
      }
    }

    // Calculate overall rating
    const ratings = Object.values(results).map((r: any) => r.rating);
    const excellentCount = ratings.filter(r => r === "excellent").length;
    const goodCount = ratings.filter(r => r === "good").length;
    const averageCount = ratings.filter(r => r === "average").length;

    let overallRating: string;
    if (excellentCount >= 3) {
      overallRating = "excellent";
    } else if (excellentCount + goodCount >= 3) {
      overallRating = "good";
    } else if (averageCount >= 2) {
      overallRating = "average";
    } else {
      overallRating = "poor";
    }

    console.log(
      `🏆 Overall performance rating: ${overallRating.toUpperCase()}`
    );
    console.log(`📊 Detailed comparison:`);
    console.log(
      `   Quality Score: ${results.qualityScore.score.toFixed(1)}/100 (${results.qualityScore.rating})`
    );
    console.log(
      `   SEO Score: ${results.seoScore.score.toFixed(1)}/100 (${results.seoScore.rating})`
    );
    console.log(
      `   Viral Score: ${results.viralScore.score.toFixed(1)}/100 (${results.viralScore.rating})`
    );
    console.log(
      `   Processing Time: ${results.processingTime.score.toFixed(0)}ms (${results.processingTime.rating})`
    );
    console.log(
      `   Success Rate: ${results.successRate.score.toFixed(1)}% (${results.successRate.rating})`
    );

    return {
      ...results,
      overallRating,
      recommendations,
    };
  }

  /**
   * Monitor Romanian market performance
   */
  public monitorRomanianMarketPerformance(
    blogContent?: GeneratedBlogContent
  ): void {
    console.log("🇷🇴 Monitoring Romanian market performance...");

    if (blogContent) {
      // Calculate Romanian-specific metrics
      const culturalRelevance = this.validateRomanianContext(
        blogContent.content
      );
      const localKeywordOptimization = this.calculateLocalKeywordOptimization(
        blogContent.content
      );
      const regionalEngagement = this.calculateRegionalEngagement(
        blogContent.content
      );
      const parentPainPointAddressing = this.calculateParentPainPointAddressing(
        blogContent.content
      );
      const educationSystemAlignment = this.calculateEducationSystemAlignment(
        blogContent.content
      );

      this.benchmarkData.romanianMarketMetrics = {
        culturalRelevance,
        localKeywordOptimization,
        regionalEngagement,
        parentPainPointAddressing,
        educationSystemAlignment,
      };
    }

    const metrics = this.benchmarkData.romanianMarketMetrics;
    console.log("🇷🇴 Romanian market performance metrics:");
    console.log(
      `   Cultural Relevance: ${(metrics.culturalRelevance * 100).toFixed(1)}%`
    );
    console.log(
      `   Local Keyword Optimization: ${(metrics.localKeywordOptimization * 100).toFixed(1)}%`
    );
    console.log(
      `   Regional Engagement: ${(metrics.regionalEngagement * 100).toFixed(1)}%`
    );
    console.log(
      `   Parent Pain Point Addressing: ${(metrics.parentPainPointAddressing * 100).toFixed(1)}%`
    );
    console.log(
      `   Education System Alignment: ${(metrics.educationSystemAlignment * 100).toFixed(1)}%`
    );

    // Generate Romanian market recommendations
    const recommendations = this.generateRomanianMarketRecommendations(metrics);
    recommendations.forEach(rec => console.log(`   💡 ${rec}`));
  }

  /**
   * Calculate local keyword optimization score
   */
  private calculateLocalKeywordOptimization(content: string): number {
    const localKeywords = [
      "românia",
      "român",
      "românească",
      "bucurești",
      "cluj",
      "timișoara",
      "iași",
      "constanța",
      "sistemul educațional românesc",
      "școlile din românia",
      "părinți români",
      "copii români",
    ];

    const contentLower = content.toLowerCase();
    const foundKeywords = localKeywords.filter(keyword =>
      contentLower.includes(keyword)
    );

    return foundKeywords.length / localKeywords.length;
  }

  /**
   * Calculate regional engagement score
   */
  private calculateRegionalEngagement(content: string): number {
    const regionalElements = [
      "orașe din românia",
      "regiuni",
      "transilvania",
      "moldova",
      "muntenia",
      "dobrogea",
      "banat",
      "crișana",
      "maramureș",
      "oltenia",
    ];

    const contentLower = content.toLowerCase();
    const foundElements = regionalElements.filter(element =>
      contentLower.includes(element)
    );

    return foundElements.length / regionalElements.length;
  }

  /**
   * Calculate parent pain point addressing score
   */
  private calculateParentPainPointAddressing(content: string): number {
    const painPoints = [
      "prețuri",
      "calitate",
      "siguranță",
      "educație",
      "dezvoltare",
      "viitorul copilului",
      "tehnologie",
      "pregătire",
      "succes",
      "învățare",
      "creativitate",
      "logica",
    ];

    const contentLower = content.toLowerCase();
    const addressedPainPoints = painPoints.filter(painPoint =>
      contentLower.includes(painPoint)
    );

    return addressedPainPoints.length / painPoints.length;
  }

  /**
   * Calculate education system alignment score
   */
  private calculateEducationSystemAlignment(content: string): number {
    const educationTerms = [
      "școală",
      "liceu",
      "universitate",
      "curriculum",
      "programă școlară",
      "examen",
      "bacalaureat",
      "admitere",
      "pregătire",
      "cunoștințe",
      "abilități",
      "competențe",
    ];

    const contentLower = content.toLowerCase();
    const foundTerms = educationTerms.filter(term =>
      contentLower.includes(term)
    );

    return foundTerms.length / educationTerms.length;
  }

  /**
   * Generate Romanian market recommendations
   */
  private generateRomanianMarketRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.culturalRelevance < 0.7) {
      recommendations.push(
        "Increase Romanian cultural references and local context"
      );
    }
    if (metrics.localKeywordOptimization < 0.6) {
      recommendations.push("Add more Romanian cities and regional keywords");
    }
    if (metrics.regionalEngagement < 0.5) {
      recommendations.push(
        "Include more regional examples and local references"
      );
    }
    if (metrics.parentPainPointAddressing < 0.8) {
      recommendations.push("Address more parent concerns and pain points");
    }
    if (metrics.educationSystemAlignment < 0.7) {
      recommendations.push(
        "Better align with Romanian education system terminology"
      );
    }

    return recommendations;
  }

  /**
   * Generate comprehensive performance benchmark report
   */
  public generatePerformanceBenchmarkReport(): {
    baselineMetrics: any;
    currentPerformance: any;
    improvements: any;
    industryComparison: any;
    romanianMarketMetrics: any;
    recommendations: string[];
    nextSteps: string[];
  } {
    console.log("📋 Generating comprehensive performance benchmark report...");

    const currentMetrics = {
      qualityScore: this.performanceMetrics.averageQualityScore,
      seoScore: this.performanceMetrics.averageSEOScore,
      viralScore: this.performanceMetrics.averageViralScore,
      contentQuality: this.performanceMetrics.averageContentQuality,
      technicalScore: this.performanceMetrics.averageTechnicalScore,
      processingTime: this.performanceMetrics.averageProcessingTime,
      successRate:
        (this.performanceMetrics.successfulGenerations /
          this.performanceMetrics.totalGenerations) *
        100,
    };

    const improvements = this.calculateImprovementsFromBaseline(currentMetrics);
    const industryComparison = this.compareAgainstIndustryStandards();

    const recommendations: string[] = [
      ...industryComparison.recommendations,
      ...this.generateRomanianMarketRecommendations(
        this.benchmarkData.romanianMarketMetrics
      ),
    ];

    const nextSteps: string[] = [
      "Continue monitoring performance improvements",
      "Implement A/B testing for optimization",
      "Focus on areas with largest improvement gaps",
      "Regular Romanian market performance reviews",
      "Industry standard benchmarking updates",
    ];

    console.log("📊 Performance Benchmark Report Generated");
    console.log("📈 Key Insights:");
    console.log(
      `   Overall Rating: ${industryComparison.overallRating.toUpperCase()}`
    );
    console.log(
      `   Quality Improvement: ${improvements.qualityScore > 0 ? "+" : ""}${improvements.qualityScore.toFixed(1)} points`
    );
    console.log(
      `   Romanian Market Score: ${(
        ((this.benchmarkData.romanianMarketMetrics.culturalRelevance +
          this.benchmarkData.romanianMarketMetrics.localKeywordOptimization +
          this.benchmarkData.romanianMarketMetrics.regionalEngagement +
          this.benchmarkData.romanianMarketMetrics.parentPainPointAddressing +
          this.benchmarkData.romanianMarketMetrics.educationSystemAlignment) /
          5) *
        100
      ).toFixed(1)}%`
    );

    return {
      baselineMetrics: this.benchmarkData.baselineMetrics,
      currentPerformance: currentMetrics,
      improvements,
      industryComparison,
      romanianMarketMetrics: this.benchmarkData.romanianMarketMetrics,
      recommendations,
      nextSteps,
    };
  }

  /**
   * Get benchmark data
   */
  public getBenchmarkData(): typeof this.benchmarkData {
    return { ...this.benchmarkData };
  }

  /**
   * Reset benchmark data (useful for testing)
   */
  public resetBenchmarkData(): void {
    this.benchmarkData = {
      baselineMetrics: {
        averageQualityScore: 0,
        averageSEOScore: 0,
        averageViralScore: 0,
        averageContentQuality: 0,
        averageTechnicalScore: 0,
        averageProcessingTime: 0,
        successRate: 0,
        establishedAt: new Date().toISOString(),
      },
      improvementTracking: [],
      industryStandards: {
        qualityScore: { excellent: 90, good: 80, average: 70, poor: 60 },
        seoScore: { excellent: 90, good: 80, average: 70, poor: 60 },
        viralScore: { excellent: 85, good: 75, average: 65, poor: 55 },
        processingTime: {
          excellent: 5000,
          good: 8000,
          average: 12000,
          poor: 15000,
        },
        successRate: { excellent: 95, good: 90, average: 85, poor: 80 },
      },
      romanianMarketMetrics: {
        culturalRelevance: 0,
        localKeywordOptimization: 0,
        regionalEngagement: 0,
        parentPainPointAddressing: 0,
        educationSystemAlignment: 0,
      },
    };
    console.log("🔄 Benchmark data reset");
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
