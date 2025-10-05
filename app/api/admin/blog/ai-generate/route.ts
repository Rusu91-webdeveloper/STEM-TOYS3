import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { applyStandardHeaders } from "@/lib/response-headers";
import { handleApiError, createSuccessResponse } from "@/lib/api-error-handler";
import { DualProviderBlogEnhancementService } from "@/lib/ai/dual-provider-blog-enhancement-service";
import {
  BlogGenerationRequest,
  BlogGenerationResponse,
  BlogGenerationProgress,
  BlogGenerationOptions,
  GeneratedBlogContent,
} from "@/lib/ai/blog-types";
import { StemCategory } from "@/lib/ai/types";

// Input validation schema for blog AI generation
const blogGenerationSchema = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(500, "Prompt must be less than 500 characters"),
  options: z
    .object({
      includeSEO: z.boolean().default(true),
      includeCoverImage: z.boolean().default(true),
      targetStemCategory: z
        .enum([
          "SCIENCE",
          "TECHNOLOGY",
          "ENGINEERING",
          "MATHEMATICS",
          "GENERAL",
        ])
        .optional(),
      targetAudience: z.string().optional(),
      tone: z
        .enum(["educational", "professional", "conversational", "expert"])
        .default("educational"),
      includeCallToAction: z.boolean().default(true),
      keywordFocus: z.array(z.string()).optional(),
      saveToDatabase: z.boolean().default(false),
      autoPublish: z.boolean().default(false),
    })
    .optional(),
});

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Helper function to find or create blog category
async function findOrCreateBlogCategory(stemCategory: StemCategory) {
  // Map STEM categories to category names
  const categoryNameMap: Record<StemCategory, string> = {
    SCIENCE: "Știință",
    TECHNOLOGY: "Tehnologie",
    ENGINEERING: "Inginerie",
    MATHEMATICS: "Matematică",
    GENERAL: "Educație STEM",
  };

  const categoryName = categoryNameMap[stemCategory] || "Educație STEM";

  // Try to find existing category
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: generateSlug(categoryName) },
      ],
    },
  });

  // Create category if it doesn't exist
  if (!category) {
    const slug = generateSlug(categoryName);
    category = await db.category.create({
      data: {
        name: categoryName,
        slug: slug,
        description: `${categoryName} - articole și resurse educaționale`,
        isActive: true,
      },
    });
  }

  return category;
}

// Fallback blog generation for timeout scenarios
async function generateFallbackBlog(
  prompt: BlogGenerationPrompt,
  options: BlogGenerationOptions
): Promise<BlogGenerationResult> {
  const startTime = Date.now();
  
  try {
    // Create a simple, fast blog generation using basic templates
    const title = `${prompt.prompt} - Ghid Complet pentru Părinți`;
    const slug = generateSlug(title);
    
    // Generate basic content using a simple template
    const content = `
# ${title}

## Introducere

${prompt.prompt} este un subiect important pentru educația copiilor noștri. În acest ghid complet, vom explora cele mai eficiente metode de a introduce aceste concepte în viața zilnică a familiei.

## De ce este important?

Educația STEM (Știință, Tehnologie, Inginerie, Matematică) pregătește copiii pentru viitorul digital. Cercetările arată că copiii care sunt expuși la concepte STEM de la o vârstă fragedă dezvoltă gândirea critică și creativitatea.

## Cum să începi

1. **Începe cu jocurile** - Folosește jocuri educaționale care introduc concepte STEM într-un mod distractiv
2. **Experimente simple** - Realizează experimente casnice cu copilul tău
3. **Încurajează întrebările** - Răspunde la toate întrebările copilului cu răbdare
4. **Folosește tehnologia** - Aplicațiile educaționale pot fi foarte utile

## Concluzie

${prompt.prompt} nu trebuie să fie complicat. Cu abordarea corectă și răbdare, poți transforma orice moment într-o oportunitate de învățare.

**Acțiunea ta următoare:** Începe astăzi cu un experiment simplu sau un joc educațional. Fiecare pas contează pentru viitorul copilului tău.
`;

    const excerpt = `Ghid complet despre ${prompt.prompt.toLowerCase()} pentru părinți. Învață cum să introduci concepte STEM în viața zilnică a familiei.`;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const generatedBlog: GeneratedBlogContent = {
      title,
      slug,
      excerpt,
      content,
      coverImage: undefined,
      tags: ["STEM", "educație", "copii", "părinți"],
      stemCategory: prompt.targetStemCategory ?? "GENERAL",
      readingTime,
      language: "ro",
      wordCount,
      seoMetadata: {
        metaTitle: title.substring(0, 70),
        metaDescription: excerpt.substring(0, 160),
        metaKeywords: ["STEM", "educație", "copii", prompt.prompt.toLowerCase()],
      },
      aiMetadata: {
        aiGenerated: true,
        generatedBy: "fallback-blog-generator",
        generationTimestamp: new Date().toISOString(),
        originalPrompt: prompt.prompt,
        processingTime: Date.now() - startTime,
        refinementApplied: false,
        modelVersion: "fallback",
        keywordOptimization: { primaryKeyword: prompt.prompt, secondaryKeywords: [], longTailKeywords: [], painPointKeywords: [], commercialKeywords: [] },
        contentAnalysis: { missingKeywords: [], suggestions: [] },
        socialOptimization: {},
        conversionOptimization: {},
        buyerPsychologyOptimization: {},
        viralOptimizationApplied: false,
      },
    };

    return {
      success: true,
      generatedBlog,
      processingTime: Date.now() - startTime,
      seoScore: 75, // Basic SEO score for fallback
      suggestions: ["Consider using the full AI generation for better content quality"],
      warnings: ["This is a fallback blog generated due to timeout"],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processingTime: Date.now() - startTime,
    };
  }
}

// POST - AI Blog Generation API Endpoint
export async function POST(request: NextRequest) {
  // Set up timeout handling
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Request timeout - blog generation took too long"));
    }, 240000); // 4 minutes timeout (less than Vercel's 5-minute limit)
  });

  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Not authorized",
          message:
            "You must be logged in as an admin to use AI blog generation",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = blogGenerationSchema.parse(body);

    console.log(
      `Starting AI blog generation for prompt: "${validatedData.prompt.substring(0, 50)}..."`
    );

    const startTime = Date.now();

    // Initialize blog enhancement service with optimized configuration
    const blogService = new DualProviderBlogEnhancementService({
      timeoutMs: 180000, // 3 minutes timeout for the service
      maxRetries: 2, // Reduced retries to save time
    });

    // Set up generation options
    const options: BlogGenerationOptions = {
      includeSEO: validatedData.options?.includeSEO ?? true,
      includeCoverImage: false, // Disabled to save time
      targetStemCategory: validatedData.options?.targetStemCategory,
      targetAudience: validatedData.options?.targetAudience,
      tone: validatedData.options?.tone ?? "educational",
      includeCallToAction: validatedData.options?.includeCallToAction ?? true,
      keywordFocus: validatedData.options?.keywordFocus,
      saveToDatabase: validatedData.options?.saveToDatabase ?? false,
      autoPublish: validatedData.options?.autoPublish ?? false,
    };

    // Create blog generation prompt
    const blogPrompt = {
      prompt: validatedData.prompt,
      targetStemCategory: options.targetStemCategory,
      targetAudience: options.targetAudience,
      tone: options.tone,
      includeCallToAction: options.includeCallToAction,
      keywordFocus: options.keywordFocus,
    };

    // Generate the blog with timeout protection
    let result;
    try {
      result = await Promise.race([
        blogService.generateBlog(blogPrompt, options),
        timeoutPromise
      ]);
    } catch (timeoutError) {
      // If timeout occurs, try a simplified fallback generation
      console.warn("Primary blog generation timed out, attempting fallback...");
      
      try {
        result = await generateFallbackBlog(blogPrompt, options);
      } catch (fallbackError) {
        console.error("Fallback blog generation also failed:", fallbackError);
        return NextResponse.json(
          {
            success: false,
            error: "Blog generation timeout",
            message: "The blog generation process took too long. Please try with a shorter prompt or try again later.",
            processingTime: Date.now() - startTime,
          },
          { status: 408 }
        );
      }
    }

    if (!result.success || !result.generatedBlog) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Blog generation failed",
          processingTime: result.processingTime,
        },
        { status: 500 }
      );
    }

    let savedBlog = null;

    // Save to database if requested
    if (validatedData.options?.saveToDatabase) {
      try {
        console.log(
          `Saving generated blog to database: "${result.generatedBlog.title}"`
        );

        // Find or create category
        const category = await findOrCreateBlogCategory(
          result.generatedBlog.stemCategory
        );

        // Get current admin user as author
        const authorId = session.user.id;

        // Ensure unique slug
        let slug = result.generatedBlog.slug;
        let counter = 1;
        while (await db.blog.findUnique({ where: { slug } })) {
          slug = `${result.generatedBlog.slug}-${counter}`;
          counter++;
        }

        // Create blog in database
        savedBlog = await db.blog.create({
          data: {
            title: result.generatedBlog.title,
            slug: slug,
            excerpt: result.generatedBlog.excerpt,
            content: result.generatedBlog.content,
            coverImage: result.generatedBlog.coverImage,
            categoryId: category.id,
            authorId: authorId,
            tags: result.generatedBlog.tags,
            metadata: {
              seo: result.generatedBlog.seoMetadata,
              ai: result.generatedBlog.aiMetadata,
            },
            isPublished: validatedData.options?.autoPublish ?? false,
            publishedAt: validatedData.options?.autoPublish ? new Date() : null,
            readingTime: result.generatedBlog.readingTime,
            stemCategory: result.generatedBlog.stemCategory,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        console.log(
          `✅ Successfully saved blog: "${savedBlog.title}" (ID: ${savedBlog.id})`
        );

        // Revalidate blog caches
        revalidateTag("blogs");
        revalidatePath("/blog");
        if (savedBlog.isPublished) {
          revalidatePath(`/blog/${savedBlog.slug}`);
        }
      } catch (saveError) {
        console.error("Failed to save blog to database:", saveError);
        return NextResponse.json(
          {
            success: false,
            error: `Blog generated successfully but database save failed: ${saveError instanceof Error ? saveError.message : String(saveError)}`,
            generatedBlog: result.generatedBlog,
            processingTime: result.processingTime,
          },
          { status: 500 }
        );
      }
    }

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response: BlogGenerationResponse & {
      savedBlog?: any;
      seoAnalysis?: {
        score: number;
        suggestions: string[];
        warnings: string[];
      };
    } = {
      success: true,
      generatedBlog: result.generatedBlog,
      processingTime,
      seoScore: result.seoScore,
      suggestions: result.suggestions,
      warnings: result.warnings,
      ...(savedBlog && {
        savedBlog: {
          id: savedBlog.id,
          title: savedBlog.title,
          slug: savedBlog.slug,
          isPublished: savedBlog.isPublished,
          publishedAt: savedBlog.publishedAt,
          category: savedBlog.category,
          author: savedBlog.author,
        },
      }),
      ...(result.seoScore && {
        seoAnalysis: {
          score: result.seoScore,
          suggestions: result.suggestions || [],
          warnings: result.warnings || [],
        },
      }),
    };

    console.log(
      `✅ AI blog generation completed: "${result.generatedBlog.title}" (${processingTime}ms)`
    );

    return applyStandardHeaders(NextResponse.json(response), {
      cache: "private",
    });
  } catch (error) {
    console.error("AI Blog Generation API error:", error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "Blog generation timeout",
          message: "The blog generation process took too long and was cancelled. Please try with a shorter prompt or try again later.",
          processingTime: Date.now() - Date.now(), // Will be calculated properly in the actual error
        },
        { status: 408 } // Request Timeout
      );
    }
    
    return handleApiError(error, "Failed to generate blog");
  }
}
