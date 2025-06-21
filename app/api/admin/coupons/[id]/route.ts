import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating coupons
const updateCouponSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  value: z.number().positive().optional(),
  minimumOrderValue: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  maxUses: z.number().positive().optional(),
  maxUsesPerUser: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  influencerName: z.string().optional(),
  image: z.string().url().optional(),
  showAsPopup: z.boolean().optional(),
  popupPriority: z.number().int().min(0).optional(),
});

// GET /api/admin/coupons/[id] - Get a specific coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const coupon = await db.coupon.findUnique({
      where: { id },
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
        usages: {
          take: 10,
          orderBy: { usedAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coupons/[id] - Update a coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const validatedData = updateCouponSchema.parse(body);

    // Check if coupon exists
    const existingCoupon = await db.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Validate dates if provided
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
    if (
      existingCoupon.type === "PERCENTAGE" &&
      validatedData.value &&
      validatedData.value > 100
    ) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    const updatedCoupon = await db.coupon.update({
      where: { id },
      data: {
        ...validatedData,
        startsAt: validatedData.startsAt
          ? new Date(validatedData.startsAt)
          : undefined,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : undefined,
      },
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
    });

    return NextResponse.json({ coupon: updatedCoupon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete a coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if coupon exists and if it has been used
    const coupon = await db.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // If coupon has been used, deactivate instead of delete
    if (coupon._count.orders > 0 || coupon._count.usages > 0) {
      const deactivatedCoupon = await db.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Coupon has been deactivated (cannot delete used coupons)",
        coupon: deactivatedCoupon,
      });
    }

    // Delete coupon if it hasn't been used
    await db.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
