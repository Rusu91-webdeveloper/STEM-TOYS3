import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating/updating email sequences
const EmailSequenceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  trigger: z.enum([
    "USER_REGISTRATION",
    "FIRST_PURCHASE",
    "ABANDONED_CART",
    "ORDER_PLACED",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "INACTIVE_USER",
    "BIRTHDAY",
    "CUSTOM",
  ]),
  isActive: z.boolean().default(true),
  maxEmails: z
    .number()
    .min(1, "At least 1 email required")
    .max(20, "Maximum 20 emails"),
  delayBetweenEmails: z
    .number()
    .min(1, "Minimum 1 hour delay")
    .max(168, "Maximum 1 week delay"), // in hours
  metadata: z.record(z.any()).optional(),
});

// GET /api/admin/email-sequences - List all email sequences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get("trigger");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (trigger) {
      where.trigger = trigger;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get sequences with pagination and step count
    const [sequences, total] = await Promise.all([
      prisma.emailSequence.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          steps: {
            select: {
              id: true,
              order: true,
              templateId: true,
              delayHours: true,
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
      }),
      prisma.emailSequence.count({ where }),
    ]);

    return NextResponse.json({
      sequences,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email sequences:", error);
    return NextResponse.json(
      { error: "Failed to fetch email sequences" },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-sequences - Create new email sequence
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailSequenceSchema.parse(body);

    // Create the sequence
    const sequence = await prisma.emailSequence.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
      include: {
        steps: {
          select: {
            id: true,
            order: true,
            templateId: true,
            delayHours: true,
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

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating email sequence:", error);
    return NextResponse.json(
      { error: "Failed to create email sequence" },
      { status: 500 }
    );
  }
}
