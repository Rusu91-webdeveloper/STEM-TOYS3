import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { applyStandardHeaders } from "@/lib/response-headers";
import { handleApiError, createSuccessResponse } from "@/lib/api-error-handler";
import { OptimizedBlogGenerationService } from "@/lib/ai/optimized-blog-generation-service";
import {
  BlogGenerationRequest,
  BlogGenerationResponse,
  BlogGenerationProgress,
  BlogGenerationOptions,
  GeneratedBlogContent,
} from "@/lib/ai/blog-types";
import { StemCategory } from "@prisma/client";

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
      usePerfectionMode: z.boolean().default(false), // Enable 3-stage perfection
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
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = blogGenerationSchema.parse(body);

    console.log(
      `Creating AI blog generation job for prompt: "${validatedData.prompt.substring(0, 50)}..."`
    );

    // Create job record
    const job = await db.aiJob.create({
      data: {
        type: "BLOG_GENERATION",
        status: "PENDING",
        userId: session.user.id,
        input: JSON.stringify({
          prompt: validatedData.prompt,
          options: validatedData.options,
        }),
      },
    });

    // Import and trigger Inngest job (returns immediately!)
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "blog/generate.requested",
      data: {
        userId: session.user.id,
        prompt: validatedData.prompt,
        options: validatedData.options,
        jobId: job.id,
      },
    });

    console.log(`✅ Blog generation job created: ${job.id}`);

    // Return job ID immediately (< 1 second!)
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "PENDING",
      message: "Blog generation started. Poll status endpoint for progress.",
    });
  } catch (error) {
    console.error("AI Blog Generation API error:", error);
    return handleApiError(error);
  }
}
