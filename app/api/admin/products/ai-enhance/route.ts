import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { applyStandardHeaders } from "@/lib/response-headers";
import { handleApiError, createSuccessResponse } from "@/lib/api-error-handler";
import {
  BatchEnhancementService,
  AIConfig,
  type BasicProduct,
  type EnhancementOptions,
  type AIEnhancementRequest,
  type AIEnhancementResponse,
} from "@/lib/ai";

// Input validation schema
const aiEnhancementSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string().min(1, "Product name is required"),
        price: z.number().positive("Price must be positive"),
        category: z.string().min(1, "Category is required"),
        images: z.array(z.string().url()).optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        stockQuantity: z.number().int().min(0).optional(),
        weight: z.number().positive().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .min(1, "At least one product is required")
    .max(100, "Cannot enhance more than 100 products at once"),
  options: z
    .object({
      includeRomanianOptimization: z.boolean().default(true),
      includeSEOMetadata: z.boolean().default(true),
      includeLearningOutcomes: z.boolean().default(true),
      includeAgeGroup: z.boolean().default(true),
      includeStemDiscipline: z.boolean().default(true),
      includeProductType: z.boolean().default(true),
    })
    .optional(),
});

// POST - AI Enhancement API Endpoint
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        {
          error: "Not authorized",
          message: "You must be logged in as an admin to use AI enhancement",
        },
        { status: 403 }
      );
    }

    // Check if AI enhancement is enabled
    if (!AIConfig.isEnhancementEnabled()) {
      return NextResponse.json(
        {
          error: "AI enhancement disabled",
          message: "AI enhancement is currently disabled",
          details:
            "Set AI_ENHANCEMENT_ENABLED=true in your environment variables",
        },
        { status: 503 }
      );
    }

    // Check if AI service is configured
    if (!AIConfig.isConfigured()) {
      return NextResponse.json(
        {
          error: "AI service not configured",
          message: "AI service is not properly configured",
          details:
            "Please set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in your environment variables",
          help: {
            openai:
              "Get your API key from https://platform.openai.com/api-keys",
            anthropic: "Get your API key from https://console.anthropic.com/",
            gemini:
              "Get your API key from https://makersuite.google.com/app/apikey",
          },
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = aiEnhancementSchema.parse(body);

    const startTime = Date.now();

    // Initialize batch enhancement service
    const batchService = new BatchEnhancementService();

    // Enhance products with progress tracking
    const result = await batchService.enhanceProductsBatch(
      validatedData.products,
      validatedData.options,
      progress => {
        // Log progress (in production, you might want to use WebSockets or Server-Sent Events)
        console.log(
          `AI Enhancement Progress: ${progress.processed}/${progress.total} (${Math.round((progress.processed / progress.total) * 100)}%)`
        );
      }
    );

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response: AIEnhancementResponse = {
      success: true,
      enhancedProducts: result.results
        .filter(r => r.success && r.enhancedProduct)
        .map(r => r.enhancedProduct!),
      processingTime,
      errors: result.results
        .filter(r => !r.success)
        .map(r => ({
          product: "Unknown", // We don't have the original product name in the error
          error: r.error || "Unknown error",
        })),
      summary: {
        total: result.summary.total,
        successful: result.summary.successful,
        failed: result.summary.failed,
        successRate: `${result.summary.successRate.toFixed(1)}%`,
      },
    };

    // Revalidate caches
    revalidateTag("products");
    revalidatePath("/admin/products");

    return applyStandardHeaders(NextResponse.json(response), {
      cache: "private",
    });
  } catch (error) {
    console.error("AI Enhancement API error:", error);

    if (error instanceof z.ZodError) {
      return applyStandardHeaders(
        NextResponse.json(
          {
            error: "Validation error",
            message: "Invalid product data",
            details: error.errors,
          },
          { status: 400 }
        ),
        { cache: "private" }
      );
    }

    return applyStandardHeaders(
      NextResponse.json(
        {
          error: "Enhancement failed",
          message: "Failed to enhance products with AI",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}

// GET - AI Enhancement Status
export async function GET() {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        {
          error: "Not authorized",
          message:
            "You must be logged in as an admin to check AI enhancement status",
        },
        { status: 403 }
      );
    }

    // Get AI service health
    const health = {
      configured: AIConfig.isConfigured(),
      enabled: AIConfig.isEnhancementEnabled(),
      provider: AIConfig.getProvider(),
      model: AIConfig.getModel(),
      validation: AIConfig.validateConfig(),
    };

    return applyStandardHeaders(
      NextResponse.json({
        success: true,
        data: health,
      }),
      { cache: "private" }
    );
  } catch (error) {
    console.error("AI Enhancement status check error:", error);

    return applyStandardHeaders(
      NextResponse.json(
        {
          error: "Status check failed",
          message: "Failed to check AI enhancement status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}
