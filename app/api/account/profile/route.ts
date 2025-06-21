import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mockUsers } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { z } from "zod";

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional()
    .nullable(),
});

// PUT - Update user profile
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate request body
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, newPassword } = result.data;

    // Check if email already exists for another user
    if (email !== session.user.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use by another account" },
          { status: 409 }
        );
      }
    }

    // Force mock data mode if not explicitly set
    const useMockData =
      process.env.USE_MOCK_DATA === "true" ||
      process.env.NODE_ENV === "development";

    let updatedUser;

    // If we're in development mode, check if this is a mock user and update it
    if (useMockData) {
      const mockUserIndex = mockUsers.findIndex(
        (user) =>
          user.id === session.user.id || user.email === session.user.email
      );

      if (mockUserIndex >= 0) {
        // Update the mock user
        const mockUser = mockUsers[mockUserIndex];
        mockUsers[mockUserIndex] = {
          ...mockUser,
          name,
          email,
          password: newPassword
            ? await hash(newPassword, 12)
            : mockUser.password,
        };

        // Return the updated mock user
        const { password, ...userWithoutPassword } = mockUsers[mockUserIndex];
        updatedUser = userWithoutPassword;

        // User profile updated
      }
    }

    // If not a mock user or not in development mode, update the database
    if (!updatedUser) {
      // Prepare update data
      const updateData: any = {
        name,
        email,
      };

      // If new password is provided, hash it
      const hashedPassword = newPassword
        ? await hash(newPassword, 12)
        : undefined;

      // If password is being updated, hash it
      if (hashedPassword) {
        updateData.password = hashedPassword;
      }

      // Use transaction to ensure atomicity
      updatedUser = await db.$transaction(async (tx) => {
        // Update the user in the database
        return tx.user.update({
          where: {
            id: session.user.id,
          },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            // Do not include password in response
          },
        });
      });
    }

    return NextResponse.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
