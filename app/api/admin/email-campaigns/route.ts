import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating/updating email campaigns
const EmailCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  templateId: z.string().min(1, "Template ID is required"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
  status: z
    .enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED", "CANCELLED"])
    .default("DRAFT"),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/admin/email-campaigns - List all email campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get campaigns with pagination and template info
    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch email campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-campaigns - Create new email campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailCampaignSchema.parse(body);

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

    // Create the campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating email campaign:", error);
    return NextResponse.json(
      { error: "Failed to create email campaign" },
      { status: 500 }
    );
  }
}
