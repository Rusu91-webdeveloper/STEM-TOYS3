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

    const { email } = validationResult.data;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, return success for security (prevents enumeration)
    if (!user) {
      return NextResponse.json({ message: "Password reset instructions sent" });
    }

    // Check if this is an OAuth user (empty password indicates OAuth user)
    if (user.password === "") {
      return NextResponse.json(
        {
          message:
            "This account uses Google sign-in. Please use the 'Sign in with Google' button instead of resetting your password.",
          isOAuthUser: true,
        },
        { status: 400 }
      );
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRY);

    // Delete any existing tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { email },
    });

    // Store the token in the database
    await db.passwordResetToken.create({
      data: {
        token,
        email,
        expires,
      },
    });

    // Log token for development purposes
    if (process.env.NODE_ENV === "development") {
      console.log(`Password reset token for ${email}: ${token}`);
    }

    // Send password reset email
    try {
      // In development mode, always send to the Resend account owner's email
      // This is a workaround for Resend's testing mode restrictions
      const isDev = process.env.NODE_ENV === "development";
      const resendAccountEmail =
        process.env.RESEND_ACCOUNT_EMAIL || "webira.rem.srl@gmail.com";

      // In development, we'll send the test email to the account owner
      // but still store the reset token for the actual user
      const emailRecipient = isDev ? resendAccountEmail : email;

      await sendPasswordResetEmail(emailRecipient, token);

      // In development mode, log the reset link to console
      if (isDev) {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        console.log("\n------- FOR TESTING: PASSWORD RESET LINK -------");
        console.log(resetLink);
        console.log("--------------------------------------------------\n");
      }
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Continue even if email fails
    }

    // Return success for regular users
    return NextResponse.json({ message: "Password reset instructions sent" });
  } catch (error) {
    console.error("Error in forgot-password endpoint:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

// Apply rate limiting to the forgot password endpoint
// Limit to 3 requests per IP address per 30 minutes
export const POST = withRateLimit(handleForgotPassword, {
  limit: 3,
  windowMs: 30 * 60 * 1000, // 30 minutes
});
