import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { applyStandardHeaders } from "@/lib/response-headers";
import { handleApiError, createSuccessResponse } from "@/lib/api-error-handler";
import { DualProviderEnhancementService } from "@/lib/ai/dual-provider-enhancement-service";
import {
  AIConfig,
  type BasicProduct,
  type EnhancementOptions,
  type AIEnhancementResponse,
} from "@/lib/ai";

// Input validation schema
const dualEnhancementSchema = z.object({
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
  config: z
    .object({
      primaryProvider: z
        .enum(["gemini", "openai", "anthropic"])
        .default("gemini"),
      primaryModel: z.string().default("gemini-1.5-pro"),
      secondaryProvider: z
        .enum(["openai", "gemini", "anthropic"])
        .default("openai"),
      secondaryModel: z.string().default("gpt-4o-mini"),
      refinementOptions: z
        .object({
          validateContent: z.boolean().default(true),
          improveSEO: z.boolean().default(true),
          fixGrammar: z.boolean().default(true),
          ensureDbCompatibility: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),
});

// POST - Dual AI Enhancement API Endpoint
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

    // Check if primary and secondary providers are configured
    const primaryProvider =
      request.nextUrl.searchParams.get("primaryProvider") || "gemini";
    const secondaryProvider =
      request.nextUrl.searchParams.get("secondaryProvider") || "openai";

    // Check API keys for both providers
    if (primaryProvider === "gemini" && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Primary provider not configured",
          message: "Gemini API key is not configured",
          details: "Please set GEMINI_API_KEY in your environment variables",
        },
        { status: 503 }
      );
    }

    if (secondaryProvider === "openai" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "Secondary provider not configured",
          message: "OpenAI API key is not configured",
          details: "Please set OPENAI_API_KEY in your environment variables",
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = dualEnhancementSchema.parse(body);

    const startTime = Date.now();

    // Initialize dual-provider enhancement service
    const dualService = new DualProviderEnhancementService(
      validatedData.config
    );

    // Track progress
    let progress = {
      total: validatedData.products.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      fallbackUsed: 0,
    };

    // Process products
    const enhancedProducts = await dualService.enhanceProducts(
      validatedData.products,
      validatedData.options,
      currentProgress => {
        progress = currentProgress;
        console.log(
          `Dual-Provider Enhancement Progress: ${progress.processed}/${progress.total} (${Math.round(
            (progress.processed / progress.total) * 100
          )}%)${progress.fallbackUsed ? ` - Fallback used: ${progress.fallbackUsed}` : ""}`
        );
      }
    );

    const processingTime = Date.now() - startTime;

    // Count products that used fallback
    const fallbackCount = enhancedProducts.filter(
      p => p.fallbackUsed || p.generatedByFallback
    ).length;

    // Prepare response
    const response: AIEnhancementResponse = {
      success: true,
      enhancedProducts: enhancedProducts.filter(product => !product.error),
      processingTime,
      errors: progress.errors,
      summary: {
        total: progress.total,
        successful: progress.successful,
        failed: progress.failed,
        successRate: `${((progress.successful / progress.total) * 100).toFixed(1)}%`,
        fallbackUsed: fallbackCount,
      },
      dualProviderInfo: {
        primaryProvider: dualService.getConfig().primaryProvider,
        secondaryProvider: dualService.getConfig().secondaryProvider,
        refinementApplied: progress.successful > 0 && fallbackCount === 0,
        fallbackToSecondary: fallbackCount > 0,
        fallbackCount: fallbackCount,
      },
    };

    // Revalidate caches
    revalidateTag("products");
    revalidatePath("/admin/products");

    return applyStandardHeaders(NextResponse.json(response), {
      cache: "private",
    });
  } catch (error) {
    console.error("Dual AI Enhancement API error:", error);

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
          message: "Failed to enhance products with dual AI providers",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}

// GET - Dual AI Enhancement Status
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

    // Check providers configuration
    const primaryProvider = AIConfig.getProvider() || "gemini";
    const secondaryProvider = "openai"; // Default secondary provider

    // Get status
    const status = {
      dualMode: {
        available: !!(
          primaryProvider === "gemini" &&
          process.env.GEMINI_API_KEY &&
          secondaryProvider === "openai" &&
          process.env.OPENAI_API_KEY
        ),
        primaryProvider: {
          name: primaryProvider,
          configured:
            primaryProvider === "gemini"
              ? !!process.env.GEMINI_API_KEY
              : !!process.env.OPENAI_API_KEY,
          model:
            primaryProvider === "gemini" ? "gemini-1.5-pro" : "gpt-3.5-turbo",
        },
        secondaryProvider: {
          name: secondaryProvider,
          configured:
            secondaryProvider === "openai"
              ? !!process.env.OPENAI_API_KEY
              : !!process.env.GEMINI_API_KEY,
          model:
            secondaryProvider === "openai" ? "gpt-3.5-turbo" : "gemini-1.5-pro",
        },
      },
      enhancementEnabled: AIConfig.isEnhancementEnabled(),
    };

    return applyStandardHeaders(
      NextResponse.json({
        success: true,
        data: status,
      }),
      { cache: "private" }
    );
  } catch (error) {
    console.error("Dual AI Enhancement status check error:", error);

    return applyStandardHeaders(
      NextResponse.json(
        {
          error: "Status check failed",
          message: "Failed to check dual AI enhancement status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      { cache: "private" }
    );
  }
}
