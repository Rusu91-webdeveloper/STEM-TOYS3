import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Validation schema for creating coupons
const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(50)
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code must contain only uppercase letters, numbers, hyphens, and underscores"
      ),
    name: z.string().min(1).max(100),
    description: z.string().optional().or(z.literal("")),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.coerce.number().positive("Value must be greater than 0"),
    minimumOrderValue: z.coerce
      .number()
      .positive()
      .optional()
      .or(z.literal(""))
      .or(z.undefined()),
    maxDiscountAmount: z.coerce
      .number()
      .positive()
      .optional()
      .or(z.literal(""))
      .or(z.undefined()),
    maxUses: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal(""))
      .or(z.undefined()),
    maxUsesPerUser: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal(""))
      .or(z.undefined()),
    startsAt: z.string().optional().or(z.literal("")).or(z.undefined()),
    expiresAt: z.string().optional().or(z.literal("")).or(z.undefined()),
    isInfluencer: z.boolean().default(false),
    influencerName: z.string().optional().or(z.literal("")),
    image: z.string().url().optional().or(z.literal("")),
    showAsPopup: z.boolean().default(false),
    popupPriority: z.coerce.number().int().min(0).default(0),
  })
  .transform(data => ({
    ...data,
    description: data.description === "" ? undefined : data.description,
    minimumOrderValue:
      data.minimumOrderValue === "" ? undefined : data.minimumOrderValue,
    maxDiscountAmount:
      data.maxDiscountAmount === "" ? undefined : data.maxDiscountAmount,
    maxUses: data.maxUses === "" ? undefined : data.maxUses,
    maxUsesPerUser:
      data.maxUsesPerUser === "" ? undefined : data.maxUsesPerUser,
    startsAt: data.startsAt === "" ? undefined : data.startsAt,
    expiresAt: data.expiresAt === "" ? undefined : data.expiresAt,
    influencerName:
      data.influencerName === "" ? undefined : data.influencerName,
    image: data.image === "" ? undefined : data.image,
  }));

// GET /api/admin/coupons - List all coupons
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const isInfluencer = searchParams.get("isInfluencer");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { influencerName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (isInfluencer !== null && isInfluencer !== undefined) {
      where.isInfluencer = isInfluencer === "true";
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              orders: true,
              usages: true,
            },
          },
        },
      }),
      db.coupon.count({ where }),
    ]);

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create a new coupon
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCouponSchema.parse(body);

    // Check if coupon code already exists
    const existingCoupon = await db.coupon.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    // Validate dates
    if (validatedData.startsAt && validatedData.expiresAt) {
      const startsAt = new Date(validatedData.startsAt);
      const expiresAt = new Date(validatedData.expiresAt);

      if (startsAt >= expiresAt) {
        return NextResponse.json(
          { error: "Start date must be before expiry date" },
          { status: 400 }
        );
      }
    }

    // Validate percentage coupons
    if (validatedData.type === "PERCENTAGE" && validatedData.value > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        ...validatedData,
        startsAt: validatedData.startsAt
          ? new Date(validatedData.startsAt)
          : null,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        createdBy: session.user.id,
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
