import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating/updating email templates
const EmailTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()).default([]),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category too long"),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// GET /api/admin/email-templates - List all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get templates with pagination
    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          subject: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          variables: true,
          metadata: true,
        },
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailTemplateSchema.parse(body);

    // Check if slug already exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the template
    const template = await prisma.emailTemplate.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}
