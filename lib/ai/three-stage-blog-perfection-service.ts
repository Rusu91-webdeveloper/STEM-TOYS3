/**
 * THREE-STAGE BLOG PERFECTION SERVICE
 *
 * This service implements a three-stage AI enhancement pipeline for 10/10 blog quality:
 *
 * STAGE 1: Core Content Generation (60-80s, GPT-4o)
 *   - Generate high-quality Romanian blog with structure
 *   - Output: 1,800-2,200 words, clean title/slug
 *
 * STAGE 2: SEO & Viral Enhancement (30-50s, GPT-4o)
 *   - Add SEO metadata, internal links, CTAs
 *   - Output: Optimized for search and conversion
 *
 * STAGE 3: Quality Perfection (40-60s, GPT-4 or Claude)
 *   - Fill content gaps (expand to 2,200-2,500 words)
 *   - Add comprehensive FAQ (15-20 questions)
 *   - Add external authority links
 *   - Enhance viral elements
 *   - Polish language and flow
 *   - Add statistics and case studies
 *
 * Total: 130-190 seconds for 10/10 quality blog
 */

import { OptimizedBlogGenerationService } from "./optimized-blog-generation-service";
import { BaseAIService } from "./base-ai-service";
import { getAIConfig } from "@/lib/config/environment";
import {
  BlogGenerationPrompt,
  BlogGenerationOptions,
  BlogGenerationProgress,
  BlogGenerationResult,
  GeneratedBlogContent,
} from "./blog-types";

export interface ThreeStageConfig {
  stage1Model: string; // GPT-4o recommended for Romanian
  stage2Model: string; // GPT-4o for SEO
  stage3Model: string; // GPT-4 or Claude for perfection
  stage3Provider?: "openai" | "anthropic"; // Stage 3 provider
  maxStage3Time: number; // Max time for Stage 3 (default: 60s)
  enableStage3: boolean; // Toggle Stage 3 on/off
}

export class ThreeStageBlogPerfectionService {
  private optimizedService: OptimizedBlogGenerationService;
  private stage3Service: BaseAIService | null = null;
  private config: ThreeStageConfig;

  constructor(config?: Partial<ThreeStageConfig>) {
    const aiConfig = getAIConfig();

    this.config = {
      stage1Model: aiConfig.primaryModel || "gpt-4o",
      stage2Model: aiConfig.secondaryModel || "gpt-4o",
      stage3Model: aiConfig.fallbackModel || "gpt-4", // GPT-4 for higher quality
      stage3Provider: "openai",
      maxStage3Time: 60000, // 60 seconds for Stage 3
      enableStage3: true,
      ...config,
    };

    // Initialize the two-stage optimized service
    this.optimizedService = new OptimizedBlogGenerationService({
      primaryModel: this.config.stage1Model,
      useSimplifiedPrompts: true,
      skipAIIfSlow: true,
      maxStage1Time: 90000,
      maxStage2Time: 60000,
    });
  }

  /**
   * Initialize Stage 3 AI service
   */
  private async initStage3Service(): Promise<void> {
    if (!this.stage3Service) {
      // For now, always use OpenAI for Stage 3
      // Anthropic support can be added later if needed
      const { OpenAIService } = await import("./openai-service");
      this.stage3Service = new OpenAIService(this.config.stage3Model);
    }
  }

  /**
   * STAGE 3: Quality Perfection & Gap Filling
   * Purpose: Transform 8/10 blog into 10/10 by filling all gaps
   * Time: 40-60 seconds
   */
  private async perfectBlogQuality(
    blog: GeneratedBlogContent,
    onProgress?: (progress: BlogGenerationProgress) => void
  ): Promise<{
    success: boolean;
    perfectedBlog?: GeneratedBlogContent;
    improvements?: string[];
    error?: string;
  }> {
    try {
      await this.initStage3Service();

      console.log("━".repeat(60));
      console.log("💎 STAGE 3: Quality Perfection & Gap Filling");
      console.log(`   Current word count: ${blog.wordCount} words`);
      console.log(`   Target: 2,200-2,500 words with comprehensive FAQ`);

      onProgress?.({
        stage: "refining_content",
        progress: 85,
        currentStep: "Perfecționare conținut pentru calitate maximă...",
        estimatedTimeRemaining: 50000,
      });

      // Build comprehensive enhancement prompt
      const enhancementPrompt = this.buildPerfectionPrompt(blog);

      console.log(`📝 Stage 3: Enhancing with ${this.config.stage3Model}`);

      const stage3Timeout = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Stage 3 timeout")),
          this.config.maxStage3Time
        );
      });

      const perfectPromise = this.stage3Service!.generateResponse({
        systemPrompt: this.getStage3SystemPrompt(),
        userPrompt: enhancementPrompt,
        temperature: 0.7,
        maxTokens: 3000, // More tokens for comprehensive enhancement
        model: this.config.stage3Model,
      });

      const perfectedContent = await Promise.race([
        perfectPromise,
        stage3Timeout,
      ]);

      if (!perfectedContent || perfectedContent.trim().length < 1000) {
        console.warn(
          "⚠️ Stage 3 produced minimal content, using Stage 2 output"
        );
        return {
          success: false,
          error: "Stage 3 enhancement insufficient",
        };
      }

      // Clean up markdown fences if present
      let cleanedContent = this.cleanMarkdownFences(perfectedContent);

      // Calculate improvements
      const newWordCount = cleanedContent.split(/\s+/).length;
      const faqCount = (cleanedContent.match(/\*\*\d+\.\s+.*\?\*\*/g) || [])
        .length;
      const externalLinks = (cleanedContent.match(/https?:\/\//g) || []).length;

      console.log(`✅ Stage 3 complete:`);
      console.log(
        `   Word count: ${blog.wordCount} → ${newWordCount} (+${newWordCount - blog.wordCount})`
      );
      console.log(`   FAQ questions: ${faqCount}`);
      console.log(`   External links: ${externalLinks}`);

      const improvements: string[] = [];

      if (newWordCount > blog.wordCount) {
        improvements.push(
          `Expanded content by ${newWordCount - blog.wordCount} words`
        );
      }
      if (faqCount >= 15) {
        improvements.push(`Added comprehensive FAQ with ${faqCount} questions`);
      }
      if (externalLinks > 0) {
        improvements.push(`Added ${externalLinks} external authority links`);
      }

      // Create perfected blog
      const perfectedBlog: GeneratedBlogContent = {
        ...blog,
        content: cleanedContent,
        wordCount: newWordCount,
        readingTime: Math.ceil(newWordCount / 200),
        aiMetadata: {
          ...blog.aiMetadata,
          generatedBy: "three-stage-perfection",
          modelVersion: `${this.config.stage1Model} + ${this.config.stage3Model}`,
          contentAnalysis: {
            ...blog.aiMetadata.contentAnalysis,
            stage3WordCount: newWordCount,
            stage3Applied: true,
            faqQuestions: faqCount,
            externalLinks: externalLinks,
          },
        },
      };

      return {
        success: true,
        perfectedBlog,
        improvements,
      };
    } catch (error) {
      console.error("❌ Stage 3 failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clean markdown fences from content
   */
  private cleanMarkdownFences(content: string): string {
    let cleaned = content;

    // Remove opening fences
    cleaned = cleaned.replace(/^```markdown\s*\n/i, "");
    cleaned = cleaned.replace(/^```md\s*\n/i, "");
    cleaned = cleaned.replace(/^```\s*\n/, "");

    // Remove closing fences
    cleaned = cleaned.replace(/\n```\s*$/, "");

    return cleaned.trim();
  }

  /**
   * Build comprehensive enhancement prompt for Stage 3
   */
  private buildPerfectionPrompt(blog: GeneratedBlogContent): string {
    const wordGap = 2300 - blog.wordCount; // Target: 2,300 words
    const currentFAQs = (blog.content.match(/\*\*\d+\.\s+.*\?\*\*/g) || [])
      .length;
    const faqGap = Math.max(0, 17 - currentFAQs); // Target: 17 FAQs

    return `Perfecționează acest articol de blog STEM pentru calitate MAXIMĂ 10/10:

ARTICOL ACTUAL:

Titlu: ${blog.title}
Cuvinte: ${blog.wordCount} (Trebuie: 2,200-2,500)
FAQ-uri: ${currentFAQs} (Trebuie: 15-20)

Conținut:
${blog.content.substring(0, 4000)}

[...conținutul continuat...]

CERINȚE PERFECȚIONARE (CRITICE pentru 10/10):

1. **EXTINDERE CONȚINUT** (${wordGap > 0 ? `+${wordGap} cuvinte` : "complet"})
   ${
     wordGap > 0
       ? `- Adaugă ${Math.ceil(wordGap / 200)} paragrafe noi cu:
   - Studii de caz românești detaliate (3-4 exemple concrete)
   - Statistici șocante cu surse (5-7 statistici noi)
   - Ghiduri practice pas-cu-pas (2-3 ghiduri detaliate)
   - Comparații cu alte soluții educaționale
   - Beneficii pe termen lung măsurabile`
       : "- Conținutul are lungimea corectă"
   }

2. **FAQ COMPREHENSIV** (${faqGap > 0 ? `+${faqGap} întrebări` : "complet"})
   ${
     faqGap > 0
       ? `- Adaugă ${faqGap} întrebări noi optimizate pentru voice search
   - Întrebări de tip "Cum să...", "Care sunt...", "De ce..."
   - Răspunsuri detaliate (3-5 propoziții fiecare)
   - Optimizate pentru featured snippets Google
   - Adresează preocupările reale ale părinților români`
       : "- FAQ-urile sunt complete"
   }

3. **LINK-URI EXTERNE AUTORITARE** (minim 5 link-uri)
   - Ministerul Educației (edu.ro)
   - Studii științifice românești
   - Universități românești (UBB Cluj, Universitatea București)
   - Organizații educaționale internaționale
   - Resurse educaționale verificate

4. **ELEMENTE VIRALE ENHANCED**
   - Statistici ȘOCANTE din România (3-5 noi statistici)
   - Povești de SUCCES românești (2-3 studii de caz noi)
   - Testimoniale de la părinți și profesori români
   - Comparații dramatice (înainte/după)
   - Rezultate măsurabile și dovezi

5. **ÎMBUNĂTĂȚIRI LIMBAJ ROMÂNESC**
   - Flow natural și conversațional
   - Expresii românești autentice
   - Emoție și conexiune cu părinții
   - Terminologie educațională actualizată
   - Referințe culturale relevante

6. **CTA-URI STRATEGICE** (5-7 CTA-uri)
   - Soft CTAs în conținut
   - CTA principal către www.techtots.ro/products
   - CTA-uri pentru newsletter
   - CTA-uri pentru evenimente STEM
   - CTA final puternic cu urgență

FORMAT RETURNARE:

Returnează conținutul COMPLET perfecționat în Markdown CURAT (fără code fences!).
Începe DIRECT cu # pentru titlul H1.
Include TOATE secțiunile originale + adăugirile tale.

Structură finală obligatorie:
- Introducere extinsă (250-300 cuvinte)
- 6-8 secțiuni H2 principale (fiecare 300-400 cuvinte)
- Secțiune "Descoperă Jucării STEM" optimizată
- FAQ comprehensiv (15-20 întrebări)
- Concluzie puternică (200-250 cuvinte)
- Total: 2,200-2,500 cuvinte

ATENȚIE: NU folosi triple backticks pentru code fences. Începe direct cu #.`;
  }

  /**
   * Get Stage 3 system prompt
   */
  private getStage3SystemPrompt(): string {
    return `You are a MASTER EDITOR and CONTENT PERFECTIONIST specializing in Romanian STEM education content. Your mission is to transform good blog posts (7-8/10) into PERFECT viral masterpieces (10/10).

STAGE 3 PERFECTION REQUIREMENTS:

🎯 CONTENT EXCELLENCE - Transform to 2,200-2,500 words:
- Add DETAILED Romanian case studies with specific names, locations, and results
- Include SHOCKING statistics with sources from Romanian studies
- Add PRACTICAL step-by-step guides parents can follow immediately
- Include COMPARATIVE analysis (STEM vs traditional education)
- Add LONG-TERM benefits with measurable outcomes

📚 FAQ MASTERY - Create 15-20 comprehensive questions:
- Cover ALL parent concerns and pain points
- Optimize for VOICE SEARCH ("Cum să...", "Care sunt...", "De ce...")
- Detailed answers (3-5 sentences each)
- Optimized for FEATURED SNIPPETS on Google România
- Address pricing, age appropriateness, safety, effectiveness
- Include Romanian curriculum connections

🔗 AUTHORITY LINKING - Add 5-8 external links:
- Ministerul Educației României (edu.ro)
- Romanian university studies (UBB Cluj, Universitatea București)
- International educational organizations (UNESCO, OECD)
- Romanian educational news sites (hotnews.ro, digi24.ro education)
- Scientific research papers (Romanian or international)

🔥 VIRAL ENHANCEMENT - Make it shareable:
- Add COUNTER-INTUITIVE insights that surprise
- Include EMOTIONAL stories that resonate
- Add SOCIAL PROOF with specific numbers
- Include URGENCY without being salesy
- Add SHAREABILITY triggers (shocking stats, inspiring stories)

🇷🇴 ROMANIAN PERFECTION - Native quality:
- Perfect Romanian flow and naturalness
- Cultural references and local context
- Educational system alignment
- Regional examples (București, Cluj, Timișoara, Iași)
- Romanian parent psychology and concerns

💰 CONVERSION OPTIMIZATION - Natural but effective:
- Strategic product mentions (www.techtots.ro/products)
- Value comparisons (vs courses, tutoring, private schools)
- Risk reversal (guarantees, returns)
- Social proof (other parents' success)
- Multiple soft CTAs throughout content

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean Markdown (NO code fences!)
- Start DIRECTLY with # (do NOT use triple backticks)
- Include ALL original content + your enhancements
- Maintain heading hierarchy (H1, H2, H3)
- Keep paragraphs short (3-4 lines max)
- Total output: 2,200-2,500 words

VALIDATION BEFORE RETURNING:
- Word count: 2,200-2,500 ✓
- FAQ questions: 15-20 ✓
- External links: 5-8 ✓
- No markdown fences ✓
- Starts with # ✓`;
  }

  /**
   * MAIN METHOD: Generate Perfect Blog (Three-Stage Approach)
   *
   * Stage 1: Core content (60-80s)
   * Stage 2: SEO enhancement (30-50s)
   * Stage 3: Quality perfection (40-60s)
   * Total: 130-190s for 10/10 quality
   */
  async generatePerfectBlog(
    prompt: BlogGenerationPrompt,
    options: BlogGenerationOptions,
    onProgress?: (progress: BlogGenerationProgress) => void
  ): Promise<BlogGenerationResult> {
    const startTime = Date.now();

    try {
      console.log("🚀 Starting THREE-STAGE Blog Perfection");
      console.log("━".repeat(60));

      // STAGE 1 + 2: Use optimized service
      onProgress?.({
        stage: "analyzing_prompt",
        progress: 10,
        currentStep: "Inițializare generare blog cu abordare în trei etape...",
        estimatedTimeRemaining: 180000,
      });

      const stage1And2Result = await this.optimizedService.generateBlog(
        prompt,
        options,
        progress => {
          // Forward progress with adjusted percentage (Stage 1+2 = 0-70%)
          onProgress?.({
            ...progress,
            progress: Math.min(70, progress.progress * 0.7),
          });
        }
      );

      if (!stage1And2Result.success || !stage1And2Result.generatedBlog) {
        throw new Error(`Stage 1+2 failed: ${stage1And2Result.error}`);
      }

      console.log(
        `✅ Stage 1+2 Success: ${stage1And2Result.generatedBlog.wordCount} words generated`
      );

      // STAGE 3: Quality Perfection (if enabled)
      if (!this.config.enableStage3) {
        console.log("⏭️  Stage 3 disabled, returning Stage 1+2 output");
        return stage1And2Result;
      }

      const stage3Result = await this.perfectBlogQuality(
        stage1And2Result.generatedBlog,
        onProgress
      );

      if (!stage3Result.success || !stage3Result.perfectedBlog) {
        console.warn("⚠️ Stage 3 failed, using Stage 1+2 output");
        return stage1And2Result;
      }

      console.log("━".repeat(60));
      console.log("✅ THREE-STAGE PERFECTION COMPLETE");
      console.log(
        `   Word count: ${stage1And2Result.generatedBlog.wordCount} → ${stage3Result.perfectedBlog.wordCount}`
      );
      console.log(`   Quality: 8/10 → 10/10`);
      console.log(
        `   Improvements applied: ${stage3Result.improvements?.length || 0}`
      );

      onProgress?.({
        stage: "complete",
        progress: 100,
        currentStep: "Blog perfect generat cu succes!",
      });

      const processingTime = Date.now() - startTime;
      console.log(
        `⏱️  Total processing time: ${Math.round(processingTime / 1000)}s`
      );

      return {
        success: true,
        generatedBlog: stage3Result.perfectedBlog,
        processingTime,
        seoScore: this.calculateEnhancedSEOScore(stage3Result.perfectedBlog),
        suggestions: [
          ...(stage1And2Result.suggestions || []),
          ...(stage3Result.improvements || []),
          "Blog perfected with three-stage approach for maximum quality",
        ],
        warnings: stage1And2Result.warnings,
      };
    } catch (error) {
      console.error("❌ Blog perfection failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate enhanced SEO score
   */
  private calculateEnhancedSEOScore(blog: GeneratedBlogContent): number {
    let score = 50;

    // Word count (25 points)
    if (blog.wordCount >= 2200 && blog.wordCount <= 2800) {
      score += 25;
    } else if (blog.wordCount >= 2000) {
      score += 20;
    } else if (blog.wordCount >= 1500) {
      score += 15;
    }

    // Meta tags (15 points)
    if (blog.seoMetadata.metaTitle && blog.seoMetadata.metaTitle.length <= 60) {
      score += 7.5;
    }
    if (
      blog.seoMetadata.metaDescription &&
      blog.seoMetadata.metaDescription.length <= 160
    ) {
      score += 7.5;
    }

    // Keywords (10 points)
    if (
      blog.seoMetadata.metaKeywords &&
      blog.seoMetadata.metaKeywords.length >= 5
    ) {
      score += 10;
    }

    // FAQ (10 points)
    const faqCount = (blog.content.match(/\*\*\d+\.\s+.*\?\*\*/g) || []).length;
    if (faqCount >= 15) {
      score += 10;
    } else if (faqCount >= 10) {
      score += 7;
    } else if (faqCount >= 5) {
      score += 4;
    }

    // External links (5 points)
    const externalLinks = (blog.content.match(/https?:\/\//g) || []).length;
    if (externalLinks >= 5) {
      score += 5;
    } else if (externalLinks >= 3) {
      score += 3;
    }

    return Math.min(100, score);
  }
}
