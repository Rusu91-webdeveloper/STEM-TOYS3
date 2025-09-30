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

// POST - AI Blog Generation API Endpoint
export async function POST(request: NextRequest) {
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

    // Initialize blog enhancement service with viral capabilities
    const blogService = new DualProviderBlogEnhancementService();

    // Set up generation options
    const options: BlogGenerationOptions = {
      includeSEO: validatedData.options?.includeSEO ?? true,
      includeCoverImage: validatedData.options?.includeCoverImage ?? true,
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

    // Generate the blog
    const result = await blogService.generateBlog(blogPrompt, options);

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
    return handleApiError(error, "Failed to generate blog");
  }
}
