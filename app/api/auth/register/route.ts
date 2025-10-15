import { randomBytes } from "crypto";

import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  sendUserVerificationEmails,
  sendWelcomeEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { withRateLimit } from "@/lib/rate-limit";
import { EmailTriggerService } from "@/lib/services/email-trigger-service";

// Registration schema
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Define a function that handles the POST request
async function handleRegistration(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Check if this is a Google-authenticated user (empty password)
      const isGoogleUser = existingUser.password === "";

      return NextResponse.json(
        {
          error: isGoogleUser
            ? "This email is already registered with Google. Please sign in with Google instead."
            : "An account with this email already exists. Please use a different email or try logging in.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex");

    // Create user with verification token using transaction
    // Set segment to NEW and emailVerified to null to trigger email automation
    const newUser = await db.$transaction(async tx =>
      tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verificationToken,
          isActive: false,
          segment: "NEW", // Set segment for email triggers
          emailVerified: null, // Required for verification trigger conditions
        },
      })
    );

    console.log(`✅ User created: ${newUser.id} (${email})`);

    // Trigger email automation via EmailTriggerService
    // This will process all active triggers for NEW segment users
    try {
      const emailTriggerService = new EmailTriggerService(db);
      await emailTriggerService.processSegmentTriggers(
        newUser.id,
        "NEW",
        undefined
      );
      console.log(`🎯 Email triggers processed for segment: NEW`);
    } catch (triggerError) {
      console.error("⚠️ Failed to process email triggers:", triggerError);
      // We don't fail the registration if trigger processing fails
      // The fallback direct calls below will still work
    }

    // Fallback: Direct welcome email call (in case triggers fail)
    try {
      await sendWelcomeEmail(email, name);
      console.log(`🎉 Welcome email sent directly (fallback) to ${email}`);
    } catch (welcomeError) {
      console.error("⚠️ Failed to send welcome email directly:", welcomeError);
      // We don't fail the registration if welcome email fails
    }

    // Fallback: Direct verification email call (in case triggers fail)
    // This ensures verification emails are sent even if automation fails
    if (process.env.NODE_ENV === "development") {
      console.log(`\n------- VERIFICATION DETAILS -------`);
      console.log(`Email: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Token: ${verificationToken}`);

      // Generate the verification link for easy testing
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const verificationLink = `${baseUrl}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      console.log(`\n🔗 Verification Link (click or copy/paste):`);
      console.log(verificationLink);
      console.log(`---------------------------------------\n`);

      // In development, still try to send the email for testing
      try {
        const emailSent = await sendVerificationEmail(
          email,
          name || "User",
          verificationToken
        );
        console.log(
          `📧 Verification email ${emailSent ? "sent directly (fallback)" : "failed to send"} to ${email}`
        );
      } catch (emailError) {
        console.error(
          "⚠️ Failed to send verification email directly:",
          emailError
        );
        // We don't fail the registration if email sending fails
      }
    } else {
      // In production, send the verification email as fallback
      try {
        const emailSent = await sendVerificationEmail(
          email,
          name || "User",
          verificationToken
        );
        console.log(
          `📧 Verification email ${emailSent ? "sent directly (fallback)" : "failed to send"} to ${email}`
        );
      } catch (emailError) {
        console.error(
          "⚠️ Failed to send verification email directly:",
          emailError
        );
        // We don't fail the registration if email sending fails
      }
    }

    console.log(`\n✨ Registration completed for ${email}`);
    console.log(`   - User ID: ${newUser.id}`);
    console.log(`   - Segment: NEW`);
    console.log(`   - Email triggers: Processed`);
    console.log(`   - Direct emails: Sent as fallback\n`);

    return NextResponse.json(
      {
        message:
          "Registration successful. Please check your email to verify your account.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          // Do not include sensitive fields
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the registration endpoint
// Limit to 5 requests per IP address per 15 minutes
export const POST = withRateLimit(handleRegistration, {
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});
