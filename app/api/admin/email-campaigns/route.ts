import { NextRequest } from "next/server";
import { z } from "zod";

import {
  emailJson as privateJson,
  parseEmailListQuery,
} from "@/lib/admin/email-api";
import { getServerSession } from "@/lib/auth/server";
import { db as prisma } from "@/lib/db";

const emailJson = (body: unknown, options?: { status: number }) =>
  privateJson(body, options?.status);

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
  status: z.enum(["DRAFT"]).default("DRAFT"),
  scheduledAt: z.string().datetime().nullish(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/admin/email-campaigns - List all email campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return emailJson({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, search } = parseEmailListQuery(searchParams);
    const status = searchParams.get("status");
    if (
      status &&
      status !== "all" &&
      ![
        "DRAFT",
        "SCHEDULED",
        "SENDING",
        "SENT",
        "PAUSED",
        "CANCELLED",
      ].includes(status)
    )
      return emailJson({ error: "Stare invalidă" }, { status: 400 });

    // Build where clause
    const where: any = {};

    if (status && status !== "all") {
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
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
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

    return emailJson({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return emailJson(
        { error: "Date invalide", details: error.errors },
        { status: 400 }
      );
    console.error("Error fetching email campaigns:", error);
    return emailJson(
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
      return emailJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailCampaignSchema.parse(body);

    // Check if template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { id: validatedData.templateId },
    });

    if (!template) {
      return emailJson({ error: "Email template not found" }, { status: 400 });
    }

    if (validatedData.scheduledAt)
      return emailJson(
        {
          error:
            "Programarea automată nu este disponibilă. Salvează campania ca draft.",
        },
        { status: 400 }
      );

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

    return emailJson(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return emailJson(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating email campaign:", error);
    return emailJson(
      { error: "Failed to create email campaign" },
      { status: 500 }
    );
  }
}
