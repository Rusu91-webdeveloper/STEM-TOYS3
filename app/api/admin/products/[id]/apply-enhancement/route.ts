/**
 * Apply Product Enhancement API
 * Applies the AI-enhanced preview to the actual product
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const applySchema = z.object({
  jobId: z.string(),
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
    const { jobId } = applySchema.parse(body);

    // Fetch AI Job with enhancement preview
    const aiJob = await db.aiJob.findUnique({
      where: { id: jobId },
    });

    if (!aiJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (aiJob.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Job is not completed yet" },
        { status: 400 }
      );
    }

    // Parse result from JSON string
    const result = aiJob.result ? JSON.parse(aiJob.result) : null;
    if (!result?.success || !result?.preview?.enhanced) {
      return NextResponse.json(
        { error: "No enhancement data available" },
        { status: 400 }
      );
    }

    const enhanced = result.preview.enhanced;

    // Get existing product to preserve metadata
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
    });

    // Update product with enhanced data
    // Store fields in metadata that aren't direct columns
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        description: enhanced.description,
        tags: enhanced.tags,
        ageGroup: enhanced.ageGroup,
        stemDiscipline: enhanced.stemDiscipline,
        metadata: {
          ...((existingProduct?.metadata as any) || {}),
          ...enhanced.metadata,
          productType: enhanced.productType,
          learningOutcomes: enhanced.learningOutcomes,
          romanianCompetencies: enhanced.romanianCompetencies,
          romanianSubjectAreas: enhanced.romanianSubjectAreas,
          romanianCurriculumAlignment: enhanced.romanianCurriculumAlignment,
          romanianParentGuides: enhanced.romanianParentGuides,
          romanianTeacherResources: enhanced.romanianTeacherResources,
          enhancedViaAI: true,
          enhancedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Job already marked as COMPLETED, no need to update

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Enhancement applied successfully",
    });
  } catch (error) {
    console.error("Apply enhancement error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to apply enhancement" },
      { status: 500 }
    );
  }
}
