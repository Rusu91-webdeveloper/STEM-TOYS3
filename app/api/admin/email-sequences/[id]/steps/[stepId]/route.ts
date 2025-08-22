import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating sequence steps
const EmailSequenceStepUpdateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required").optional(),
  order: z.number().min(1, "Order must be at least 1").optional(),
  delayHours: z
    .number()
    .min(0, "Delay cannot be negative")
    .max(168, "Maximum 1 week delay")
    .optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long")
    .optional(),
  content: z.string().optional(),
  conditions: z.record(z.any()).optional(),
});

// PUT /api/admin/email-sequences/[id]/steps/[stepId] - Update sequence step
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailSequenceStepUpdateSchema.parse(body);

    // Check if step exists
    const existingStep = await prisma.emailSequenceStep.findUnique({
      where: { id: params.stepId },
    });

    if (!existingStep) {
      return NextResponse.json(
        { error: "Sequence step not found" },
        { status: 404 }
      );
    }

    // Check if step belongs to the sequence
    if (existingStep.sequenceId !== params.id) {
      return NextResponse.json(
        { error: "Step does not belong to this sequence" },
        { status: 400 }
      );
    }

    // If template is being updated, check if it exists
    if (validatedData.templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: validatedData.templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Email template not found" },
          { status: 400 }
        );
      }
    }

    // If order is being updated, check for conflicts
    if (validatedData.order && validatedData.order !== existingStep.order) {
      const conflictingStep = await prisma.emailSequenceStep.findFirst({
        where: {
          sequenceId: params.id,
          order: validatedData.order,
          id: { not: params.stepId },
        },
      });

      if (conflictingStep) {
        return NextResponse.json(
          { error: "Step with this order already exists" },
          { status: 400 }
        );
      }
    }

    // Update the step
    const updatedStep = await prisma.emailSequenceStep.update({
      where: { id: params.stepId },
      data: validatedData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            subject: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedStep);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating sequence step:", error);
    return NextResponse.json(
      { error: "Failed to update sequence step" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-sequences/[id]/steps/[stepId] - Delete sequence step
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if step exists
    const existingStep = await prisma.emailSequenceStep.findUnique({
      where: { id: params.stepId },
    });

    if (!existingStep) {
      return NextResponse.json(
        { error: "Sequence step not found" },
        { status: 404 }
      );
    }

    // Check if step belongs to the sequence
    if (existingStep.sequenceId !== params.id) {
      return NextResponse.json(
        { error: "Step does not belong to this sequence" },
        { status: 400 }
      );
    }

    // Delete the step
    await prisma.emailSequenceStep.delete({
      where: { id: params.stepId },
    });

    return NextResponse.json({ message: "Sequence step deleted successfully" });
  } catch (error) {
    console.error("Error deleting sequence step:", error);
    return NextResponse.json(
      { error: "Failed to delete sequence step" },
      { status: 500 }
    );
  }
}
