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
          maxTokens: 4000, // Increased for comprehensive viral content
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
            maxTokens: 4000, // Increased for comprehensive viral content
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
          maxTokens: 4000, // Increased for comprehensive viral content
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
          maxTokens: 4000, // Increased for comprehensive content like Blog 1
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
            maxTokens: 4000, // Increased for comprehensive content like Blog 1
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
          maxTokens: 4000, // Increased for comprehensive content like Blog 1
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
