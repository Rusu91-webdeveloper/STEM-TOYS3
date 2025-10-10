/**
 * Individual Product Enhancement API
 * Starts AI enhancement job for a single product
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { z } from "zod";

const enhancementSchema = z.object({
  aiEnhancement: z.object({
    options: z.object({
      includeRomanianOptimization: z.boolean().optional(),
      includeLearningOutcomes: z.boolean().optional(),
      includeStemDiscipline: z.boolean().optional(),
      includeAgeGroup: z.boolean().optional(),
      includeProductType: z.boolean().optional(),
    }),
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    // Validate request body
    const body = await request.json();
    const validatedData = enhancementSchema.parse(body);

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, status: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create AI Job record
    const aiJob = await db.aiJob.create({
      data: {
        type: "PRODUCT_ENHANCEMENT",
        status: "PENDING",
        userId: session.user.id,
        input: JSON.stringify({
          productId,
          productName: product.name,
          enhancementOptions: validatedData.aiEnhancement.options,
        }),
      },
    });

    // Trigger Inngest event
    await inngest.send({
      name: "products/single-product-enhancement.requested",
      data: {
        productId,
        aiEnhancement: validatedData.aiEnhancement,
        jobId: aiJob.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: aiJob.id,
      status: "PENDING",
      message:
        "Product enhancement started. Poll status endpoint for progress.",
    });
  } catch (error) {
    console.error("Enhancement API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to start enhancement" },
      { status: 500 }
    );
  }
}
