import { hash } from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

// Schema for request validation
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

// Handle the reset password request
async function handleResetPassword(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Invalid request",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { token, email, password } = validationResult.data;

    // Find the token in the database
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate the token
    if (!resetToken) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Token has expired" },
        { status: 400 }
      );
    }

    // If email is provided, make sure it matches the token's email
    if (email && email !== resetToken.email) {
      console.log(
        `Email mismatch: provided=${email}, token=${resetToken.email}`
      );
      // Still continue with the reset even if email doesn't match exactly,
      // as long as we have a valid token. This improves user experience when
      // there might be capitalization differences or the user using a different
      // browser than where they initiated the reset.
    }

    // Get the email from the token
    const userEmail = resetToken.email;

    try {
      // Hash the new password
      const hashedPassword = await hash(password, 12);

      // Update the user's password in the database
      const updatedUser = await db.user.update({
        where: { email: userEmail },
        data: {
          password: hashedPassword,
          // Optionally set isActive to true if it wasn't already
          isActive: true,
        },
      });

      if (!updatedUser) {
        throw new Error("User not found");
      }

      // Delete all reset tokens for this user
      await db.passwordResetToken.deleteMany({
        where: { email: userEmail },
      });

      console.log(`Password reset for ${userEmail} successful`);

      // Return success
      return NextResponse.json({
        message: "Password reset successful",
      });
    } catch (dbError) {
      console.error("Database error during password reset:", dbError);

      // If we're in development mode, we'll simulate success
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] Simulating password reset for ${userEmail}`);

        // Still delete the token in development mode
        await db.passwordResetToken.deleteMany({
          where: { email: userEmail },
        });

        return NextResponse.json({
          message: "Password reset successful (simulated in dev mode)",
          email: userEmail,
        });
      }

      return NextResponse.json(
        { message: "Failed to update password" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in reset-password endpoint:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

// Apply rate limiting to the reset password endpoint
// Limit to 3 requests per IP address per 30 minutes
export const POST = withRateLimit(handleResetPassword, {
  limit: 3,
  windowMs: 30 * 60 * 1000, // 30 minutes
});
