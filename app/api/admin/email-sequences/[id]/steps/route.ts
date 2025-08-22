import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating/updating sequence steps
const EmailSequenceStepSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  order: z.number().min(1, "Order must be at least 1"),
  delayHours: z
    .number()
    .min(0, "Delay cannot be negative")
    .max(168, "Maximum 1 week delay"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long")
    .optional(),
  content: z.string().optional(),
  conditions: z.record(z.any()).optional(),
});

// GET /api/admin/email-sequences/[id]/steps - List all steps for a sequence
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if sequence exists
    const sequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Email sequence not found" },
        { status: 404 }
      );
    }

    // Get all steps for the sequence
    const steps = await prisma.emailSequenceStep.findMany({
      where: { sequenceId: params.id },
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
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("Error fetching sequence steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch sequence steps" },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-sequences/[id]/steps - Add step to sequence
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailSequenceStepSchema.parse(body);

    // Check if sequence exists
    const sequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Email sequence not found" },
        { status: 404 }
      );
    }

    // Check if template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { id: validatedData.templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 400 }
      );
    }

    // Check if order already exists
    const existingStep = await prisma.emailSequenceStep.findFirst({
      where: {
        sequenceId: params.id,
        order: validatedData.order,
      },
    });

    if (existingStep) {
      return NextResponse.json(
        { error: "Step with this order already exists" },
        { status: 400 }
      );
    }

    // Create the step
    const step = await prisma.emailSequenceStep.create({
      data: {
        ...validatedData,
        sequenceId: params.id,
      },
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

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating sequence step:", error);
    return NextResponse.json(
      { error: "Failed to create sequence step" },
      { status: 500 }
    );
  }
}
