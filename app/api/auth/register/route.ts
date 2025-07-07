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
    const newUser = await db.$transaction(async (tx) => tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verificationToken,
          isActive: false,
        },
      }));

    // In a production environment, we would send verification email here
    // For demo purposes, we'll simulate a successful email delivery
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
          `📧 Verification email ${emailSent ? "sent" : "failed to send"} to ${email}`
        );
      } catch (emailError) {
        console.error("⚠️ Failed to send verification email:", emailError);
        // We don't fail the registration if email sending fails
      }
    } else {
      // In production, send an actual email
      try {
        const emailSent = await sendVerificationEmail(
          email,
          name || "User",
          verificationToken
        );
        console.log(
          `📧 Verification email ${emailSent ? "sent" : "failed to send"} to ${email}`
        );
      } catch (emailError) {
        console.error("⚠️ Failed to send verification email:", emailError);
        // We don't fail the registration if email sending fails
      }
    }

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
