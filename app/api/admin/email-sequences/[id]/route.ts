import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating email sequences
const EmailSequenceUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().optional(),
  trigger: z
    .enum([
      "USER_REGISTRATION",
      "FIRST_PURCHASE",
      "ABANDONED_CART",
      "ORDER_PLACED",
      "ORDER_SHIPPED",
      "ORDER_DELIVERED",
      "INACTIVE_USER",
      "BIRTHDAY",
      "CUSTOM",
    ])
    .optional(),
  isActive: z.boolean().optional(),
  maxEmails: z
    .number()
    .min(1, "At least 1 email required")
    .max(20, "Maximum 20 emails")
    .optional(),
  delayBetweenEmails: z
    .number()
    .min(1, "Minimum 1 hour delay")
    .max(168, "Maximum 1 week delay")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/admin/email-sequences/[id] - Get specific email sequence
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
      include: {
        steps: {
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
        },
        _count: {
          select: {
            steps: true,
            users: true,
          },
        },
      },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Email sequence not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sequence);
  } catch (error) {
    console.error("Error fetching email sequence:", error);
    return NextResponse.json(
      { error: "Failed to fetch email sequence" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-sequences/[id] - Update email sequence
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailSequenceUpdateSchema.parse(body);

    // Check if sequence exists
    const existingSequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
    });

    if (!existingSequence) {
      return NextResponse.json(
        { error: "Email sequence not found" },
        { status: 404 }
      );
    }

    // Update the sequence
    const updatedSequence = await prisma.emailSequence.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        steps: {
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
        },
        _count: {
          select: {
            steps: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating email sequence:", error);
    return NextResponse.json(
      { error: "Failed to update email sequence" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-sequences/[id] - Delete email sequence
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if sequence exists and get usage info
    const existingSequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
      include: {
        steps: true,
        users: true,
      },
    });

    if (!existingSequence) {
      return NextResponse.json(
        { error: "Email sequence not found" },
        { status: 404 }
      );
    }

    // Check if sequence is being used
    if (existingSequence.users.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete sequence that has active users",
          activeUsersCount: existingSequence.users.length,
        },
        { status: 400 }
      );
    }

    // Delete the sequence and its steps (cascade)
    await prisma.emailSequence.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Email sequence deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting email sequence:", error);
    return NextResponse.json(
      { error: "Failed to delete email sequence" },
      { status: 500 }
    );
  }
}
