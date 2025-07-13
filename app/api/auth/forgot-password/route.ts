import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { withRateLimit } from "@/lib/rate-limit";

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

// Schema for request validation
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Handle the forgot password request
async function handleForgotPassword(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!existingUser) {
      // For security, we don't reveal if the user exists or not
      // Return success response even if user doesn't exist
      return NextResponse.json({
        success: true,
        message:
          "If an account with this email exists, we've sent a password reset email.",
      });
    }

    // Check if user is an OAuth user (has empty password)
    const isOAuthUser = !existingUser.password || existingUser.password === "";

    if (isOAuthUser) {
      return NextResponse.json(
        {
          success: false,
          isOAuthUser: true,
          message:
            "This account uses OAuth authentication. Please use the OAuth provider to sign in.",
        },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    // Delete any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { email: existingUser.email },
    });

    // Create new reset token
    await db.passwordResetToken.create({
      data: {
        token: resetToken,
        email: existingUser.email,
        expires: expiresAt,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(existingUser.email, resetToken);

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the forgot password endpoint
// Limit to 3 requests per IP address per 30 minutes
export const POST = withRateLimit(handleForgotPassword, {
  limit: 3,
  windowMs: 30 * 60 * 1000, // 30 minutes
});
