import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
// import { withRateLimit } from "@/lib/rate-limit";

// Validation schema for role updates
const updateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "SUPPLIER", "VISITOR"]),
});

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get the user ID from route params
    const { id: userId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    // Get the current user to check if they exist
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent changing your own role
    if (currentUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // If changing to SUPPLIER, check if user already has a supplier record
    if (role === "SUPPLIER") {
      const existingSupplier = await db.supplier.findUnique({
        where: { userId: userId },
      });

      if (!existingSupplier) {
        // Create a basic supplier record for the user
        await db.supplier.create({
          data: {
            userId: userId,
            name: currentUser.name || "Supplier Business",
            email: currentUser.email,
            phone: "",
            status: "PENDING", // New suppliers start as pending
            commissionRate: 15.0, // Default commission rate
          },
        });
      }
    }

    // Update the user's role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
};
