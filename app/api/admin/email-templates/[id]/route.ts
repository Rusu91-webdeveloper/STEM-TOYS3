import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating email templates
const EmailTemplateUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long")
    .optional(),
  content: z.string().min(1, "Content is required").optional(),
  variables: z.array(z.string()).optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category too long")
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/admin/email-templates/[id] - Get specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailTemplateUpdateSchema.parse(body);

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    // If slug is being updated, check if it already exists
    if (validatedData.slug && validatedData.slug !== existingTemplate.slug) {
      const slugExists = await prisma.emailTemplate.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Template with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update the template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-templates/[id] - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
      include: {
        campaigns: true,
        sequenceSteps: true,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    // Check if template is being used
    if (
      existingTemplate.campaigns.length > 0 ||
      existingTemplate.sequenceSteps.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete template that is being used by campaigns or sequences",
          campaignsCount: existingTemplate.campaigns.length,
          sequencesCount: existingTemplate.sequenceSteps.length,
        },
        { status: 400 }
      );
    }

    // Delete the template
    await prisma.emailTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Email template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    );
  }
}
