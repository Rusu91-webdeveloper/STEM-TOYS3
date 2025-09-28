/**
 * AI Blog Enhancement Service
 *
 * This service uses the configured AI provider (OpenAI, Gemini, etc.) for comprehensive blog generation with Romanian optimization.
 * Respects global AI provider configuration for consistent service usage.
 */

import { AIServiceFactory } from "./ai-service-factory";
import { BaseAIService } from "./base-ai-service";
import { simpleAIMonitoring } from "./monitoring-simple";
import { AIConfig } from "./config";

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
    model: "gpt-4o",
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

      // Assemble final blog with comprehensive SEO metadata
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
        seoMetadata: {
          // Basic SEO metadata
          metaTitle:
            seoResult.metadata?.metaTitle ??
            titleResult.title!.substring(0, 70),
          metaDescription:
            seoResult.metadata?.metaDescription ??
            excerpt?.substring(0, 160) ??
            refinedContent.substring(0, 160),
          metaKeywords:
            seoResult.metadata?.metaKeywords ??
            this.extractKeywords(refinedContent),

          // Advanced SEO metadata
          focusKeyword: seoResult.metadata?.focusKeyword,
          secondaryKeywords: seoResult.metadata?.secondaryKeywords,
          longTailKeywords: seoResult.metadata?.longTailKeywords,

          // Structured Data (JSON-LD)
          structuredData: seoResult.metadata?.structuredData,

          // Social Media Optimization
          openGraph: seoResult.metadata?.openGraph,
          twitterCards: seoResult.metadata?.twitterCards,

          // Technical SEO
          canonicalUrl: seoResult.metadata?.canonicalUrl,
          mobileOptimization: seoResult.metadata?.mobileOptimization,
          internalLinks: seoResult.metadata?.internalLinks,
          externalLinks: seoResult.metadata?.externalLinks,
        },
        aiMetadata: {
          aiGenerated: true,
          generatedBy: "ai-blog-enhancement",
          generationTimestamp: new Date().toISOString(),
          originalPrompt: prompt.prompt,
          processingTime: Date.now() - startTime,
          refinementApplied: true,
          modelVersion: this.config!.model,
          seoOptimizationLevel: "enterprise", // Advanced SEO optimization
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
   * Generate blog title with fallback logic
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
        model: this.config!.model,
      });

      let title = response.trim();

      // If title is too long, try to truncate intelligently
      if (title.length > 70) {
        console.warn(
          `Generated title too long (${title.length} chars), attempting truncation`
        );

        // Try to truncate at word boundaries while keeping under 70 chars
        const truncated = this.truncateTitle(title, 70);
        if (truncated && truncated.length >= 20) {
          // Minimum reasonable title length
          title = truncated;
          console.log(
            `Successfully truncated title to ${title.length} characters`
          );
        } else {
          // If truncation fails, try regenerating with stricter constraints
          console.warn(
            "Truncation failed, regenerating title with stricter constraints"
          );
          return await this.generateTitleWithConstraints(prompt);
        }
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
   * Generate title with stricter constraints (fallback method)
   */
  private async generateTitleWithConstraints(
    prompt: BlogGenerationPrompt
  ): Promise<{ success: boolean; title?: string; error?: string }> {
    try {
      const strictPrompt = `Generează un titlu SEO optimizat în limba română pentru articolul despre: ${prompt.prompt}

Cerințe STRICTE pentru titlu:
- MAXIMUM 50 caractere românești (numără exact!)
- Include cuvânt cheie principal natural
- Creează curiozitate și urgență
- Folosește terminologie educațională românească
- NU depăși 50 de caractere sub NICI o formă

Format: Doar titlul, fără explicații suplimentare.`;

      const response = await this.service!.generateResponse({
        systemPrompt: `You are an expert in creating compelling, SEO-optimized titles for Romanian STEM education content. You MUST follow the exact character limit or the title will be rejected.`,
        userPrompt: strictPrompt,
        temperature: 0.3, // Lower temperature for more controlled output
        maxTokens: 50, // Stricter token limit
        model: this.config!.model,
      });

      const title = response.trim();

      // Final validation
      if (title.length > 70) {
        // If still too long, force truncate
        const forcedTruncated = this.forceTruncateTitle(title, 70);
        return { success: true, title: forcedTruncated };
      }

      return { success: true, title };
    } catch (error) {
      return {
        success: false,
        error: `Title generation with constraints failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Intelligently truncate title while preserving meaning
   */
  private truncateTitle(title: string, maxLength: number): string | null {
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
      return result.length >= 10 ? result : null;
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

    return result.length >= 10 ? result : null;
  }

  /**
   * Force truncate title to exact length (last resort)
   */
  private forceTruncateTitle(title: string, maxLength: number): string {
    if (title.length <= maxLength) return title;

    // Remove trailing punctuation and spaces
    let truncated = title.substring(0, maxLength).trim();

    // Remove trailing punctuation
    truncated = truncated.replace(/[.,!?;:]+$/, "");

    // Ensure it's not empty and ends properly
    if (truncated.length < 10) {
      truncated = title.substring(0, 10).trim();
    }

    return truncated;
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
    // Extract comprehensive STEM tags for maximum SEO impact
    const essentialStemTags = [
      "STEM",
      "educație",
      "copii",
      "școală",
      "învățare",
      "dezvoltare",
      "STEM toys",
      "jucării educative",
      "copii 6-12 ani",
      "educație STEM",
      "dezvoltare cognitivă",
      "jucării interactive",
      "STEM România",
      "educație timpurie",
      "copii 3-6 ani",
      "copii 12-18 ani",
      "programare copii",
      "robotica copii",
      "știință copii",
      "matematică copii",
    ];

    const contentLower = content.toLowerCase();
    const promptLower = prompt.prompt.toLowerCase();

    // Tags found in content
    const contentTags = essentialStemTags.filter(tag =>
      contentLower.includes(tag.toLowerCase())
    );

    // Tags from prompt
    const promptTags = essentialStemTags.filter(tag =>
      promptLower.includes(tag.toLowerCase())
    );

    // High-value Romanian STEM keywords that should always be considered
    const highValueTags = [
      "jucării STEM",
      "educație STEM",
      "copii inteligenți",
      "dezvoltare copil",
      "STEM toys România",
      "jucării pentru copii",
      "educație modernă",
      "copii talentați",
      "învățare distractivă",
      "STEM viitor",
    ];

    // Combine all tags
    const allTags = [...contentTags, ...promptTags, ...highValueTags];

    // Remove duplicates and limit to 15 most relevant tags
    const uniqueTags = [...new Set(allTags)].slice(0, 15);

    // Ensure we have at least some essential tags
    const minimumTags = ["STEM", "educație", "copii", "jucării educative"];
    minimumTags.forEach(tag => {
      if (!uniqueTags.includes(tag)) {
        uniqueTags.push(tag);
      }
    });

    return uniqueTags.slice(0, 15);
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
    // Parse the comprehensive SEO response with advanced metadata
    // Handle AI hallucinations and clean up malformed responses
    const sections = response.split("\n\n");
    const metadata: any = {};

    for (const section of sections) {
      const lines = section
        .split("\n")
        .map(line => line.trim())
        .filter(line => line);

      // Parse each section based on its header
      if (lines[0]?.startsWith("Meta Title:")) {
        let title = lines[0].replace("Meta Title:", "").trim();
        // Clean up character count indicators and malformed text
        title = title.replace(/\(\d+\)$/, "").trim();
        metadata.metaTitle = title;
      } else if (lines[0]?.startsWith("Meta Description:")) {
        let description = lines[0].replace("Meta Description:", "").trim();
        // Clean up character count indicators
        description = description.replace(/\(\d+\)$/, "").trim();
        metadata.metaDescription = description;
      } else if (lines[0]?.startsWith("Focus Keyword:")) {
        metadata.focusKeyword = lines[0].replace("Focus Keyword:", "").trim();
      } else if (lines[0]?.startsWith("Secondary Keywords:")) {
        const keywordsText = lines.slice(1).join(" ");
        // Clean up numbered lists and split properly
        const cleanKeywords = keywordsText
          .replace(/\d+\.\s*/g, "") // Remove numbering like "1. "
          .split(/[,\n]/)
          .map((k: string) => k.trim())
          .filter(k => k && k.length > 2); // Filter out empty/short keywords
        metadata.secondaryKeywords = cleanKeywords;
      } else if (lines[0]?.startsWith("Long-tail Keywords:")) {
        const keywordsText = lines.slice(1).join(" ");
        // Clean up numbered lists and split properly
        const cleanKeywords = keywordsText
          .replace(/\d+\.\s*/g, "") // Remove numbering like "1. "
          .split(/[,\n]/)
          .map((k: string) => k.trim())
          .filter(k => k && k.length > 2); // Filter out empty/short keywords
        metadata.longTailKeywords = cleanKeywords;
      } else if (lines[0]?.startsWith("Structured Data:")) {
        // Parse JSON-LD structured data
        const jsonText = lines.slice(1).join("\n");
        try {
          // Clean up markdown code blocks and formatting issues
          let cleanJson = jsonText
            .replace(/```json\s*/g, "") // Remove markdown code blocks
            .replace(/```\s*$/g, "") // Remove closing code blocks
            .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
            .trim();

          metadata.structuredData = JSON.parse(cleanJson);
        } catch (e) {
          console.warn(
            "Failed to parse structured data JSON after cleanup:",
            e
          );
          // Generate default structured data if parsing fails
          metadata.structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Jucării STEM pentru copii cu autism",
            author: {
              "@type": "Organization",
              name: "STEM Toys",
            },
            publisher: {
              "@type": "Organization",
              name: "STEM Toys",
              logo: {
                "@type": "ImageObject",
                url: "https://stem-toys.ro/logo.png",
              },
            },
            datePublished: new Date().toISOString(),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://stem-toys.ro/blog/jucarii-stem-autism",
            },
          };
        }
      } else if (lines[0]?.startsWith("Open Graph:")) {
        // Parse and clean Open Graph metadata
        metadata.openGraph = {};
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].replace(/^- /, "").trim(); // Remove "- " prefix and trim
          if (line.includes(":")) {
            const [key, ...valueParts] = line.split(":");
            if (key && valueParts.length > 0) {
              const cleanKey = key.replace(/^og:/, "").trim(); // Remove og: prefix if present
              const value = valueParts.join(":").trim();
              // Skip malformed entries
              if (cleanKey && value && !cleanKey.includes("og")) {
                metadata.openGraph[`og:${cleanKey}`] = value;
              }
            }
          }
        }
        // Ensure required Open Graph fields
        if (!metadata.openGraph["og:title"]) {
          metadata.openGraph["og:title"] =
            metadata.metaTitle || "Jucării STEM 2025";
        }
        if (!metadata.openGraph["og:description"]) {
          metadata.openGraph["og:description"] =
            metadata.metaDescription ||
            "Descoperă jucăriile STEM care revoluționează educația copiilor";
        }
        if (!metadata.openGraph["og:image"]) {
          metadata.openGraph["og:image"] =
            "https://stem-toys.ro/images/stem-toys-2025.jpg";
        }
        if (!metadata.openGraph["og:url"]) {
          metadata.openGraph["og:url"] =
            "https://stem-toys.ro/blog/jucarii-stem-2025";
        }
        if (!metadata.openGraph["og:type"]) {
          metadata.openGraph["og:type"] = "article";
        }
      } else if (lines[0]?.startsWith("Twitter Cards:")) {
        // Parse and clean Twitter Card metadata
        metadata.twitterCards = {};
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].replace(/^- /, "").trim(); // Remove "- " prefix and trim
          if (line.includes(":")) {
            const [key, ...valueParts] = line.split(":");
            if (key && valueParts.length > 0) {
              const cleanKey = key.replace(/^twitter:/, "").trim(); // Remove twitter: prefix if present
              const value = valueParts.join(":").trim();
              // Skip malformed entries
              if (cleanKey && value && !cleanKey.includes("twitter")) {
                metadata.twitterCards[`twitter:${cleanKey}`] = value;
              }
            }
          }
        }
        // Ensure required Twitter Card fields
        if (!metadata.twitterCards["twitter:card"]) {
          metadata.twitterCards["twitter:card"] = "summary_large_image";
        }
        if (!metadata.twitterCards["twitter:title"]) {
          metadata.twitterCards["twitter:title"] =
            metadata.metaTitle || "Jucării STEM 2025";
        }
        if (!metadata.twitterCards["twitter:description"]) {
          metadata.twitterCards["twitter:description"] =
            metadata.metaDescription ||
            "Descoperă jucăriile STEM care revoluționează educația copiilor";
        }
        if (!metadata.twitterCards["twitter:image"]) {
          metadata.twitterCards["twitter:image"] =
            "https://stem-toys.ro/images/stem-toys-2025.jpg";
        }
      } else if (lines[0]?.startsWith("Canonical URL:")) {
        metadata.canonicalUrl = lines[0].replace("Canonical URL:", "").trim();
      } else if (lines[0]?.startsWith("Mobile Optimization:")) {
        metadata.mobileOptimization = lines.slice(1).join(" ");
      } else if (lines[0]?.startsWith("Internal Links:")) {
        metadata.internalLinks = lines.slice(1).join(" ");
      } else if (lines[0]?.startsWith("External Links:")) {
        metadata.externalLinks = lines.slice(1).join(" ");
      }
    }

    // Clean up and combine all keywords for metaKeywords
    const allKeywords = [];

    // Add focus keyword
    if (metadata.focusKeyword) allKeywords.push(metadata.focusKeyword);

    // Add secondary keywords (cleaned)
    if (
      metadata.secondaryKeywords &&
      Array.isArray(metadata.secondaryKeywords)
    ) {
      allKeywords.push(
        ...metadata.secondaryKeywords.filter(k => k && k.length > 2)
      );
    }

    // Add long-tail keywords (cleaned)
    if (metadata.longTailKeywords && Array.isArray(metadata.longTailKeywords)) {
      allKeywords.push(
        ...metadata.longTailKeywords.filter(k => k && k.length > 2)
      );
    }

    // Add high-value Romanian STEM keywords if missing (context-aware)
    const baseKeywords = [
      "jucării STEM",
      "educație STEM",
      "copii 6-12 ani",
      "dezvoltare cognitivă",
      "jucării educative",
      "STEM toys România",
      "jucării pentru copii",
      "educație timpurie",
      "dezvoltare copil",
      "jucării interactive",
    ];

    // Add autism-specific keywords if content is about autism
    const contentLower = response.toLowerCase();
    const isAutismContent =
      contentLower.includes("autism") || contentLower.includes("autist");

    const autismKeywords = isAutismContent
      ? [
          "copii cu autism",
          "jucării pentru autism",
          "educație autism",
          "terapie autism",
          "dezvoltare autism",
          "STEM autism",
          "jucării terapeutice",
          "copii speciali",
          "învățare autism",
          "jucării senzoriale",
          "comunicare autism",
          "abilități sociale autism",
        ]
      : [];

    const essentialKeywords = [...baseKeywords, ...autismKeywords];

    // Ensure we have at least some essential keywords
    essentialKeywords.forEach(keyword => {
      if (!allKeywords.some(k => k.includes(keyword.split(" ")[0]))) {
        allKeywords.push(keyword);
      }
    });

    metadata.metaKeywords = [...new Set(allKeywords)].slice(0, 30); // Remove duplicates and limit

    // Ensure required fields have defaults
    if (!metadata.metaTitle || metadata.metaTitle.length < 10) {
      metadata.metaTitle =
        "Jucării STEM 2025: Revoluția educației copiilor tăi";
    }
    if (!metadata.metaDescription || metadata.metaDescription.length < 50) {
      metadata.metaDescription =
        "Descoperă cum jucăriile STEM transformă educația copiilor în 2025. Alege cele mai bune jucării pentru dezvoltare cognitivă și succes școlar.";
    }
    if (!metadata.metaKeywords || metadata.metaKeywords.length === 0) {
      metadata.metaKeywords = essentialKeywords;
    }

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
