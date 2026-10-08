import { randomBytes } from "crypto";

import { hash } from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCustomerList } from "@/lib/admin/customer-list";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).default("CUSTOMER"),
  isActive: z.boolean().optional(),
});

function generateRandomPassword(length = 12) {
  // Generate a URL-safe random string
  return randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Not authorized" },
          { status: 403, headers: { "Cache-Control": "private, no-store" } }
        );
      }

      return NextResponse.json(
        await getCustomerList(request.nextUrl.searchParams),
        {
          headers: { "Cache-Control": "private, no-store" },
        }
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 }
);

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const body = await request.json();
      const result = createCustomerSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0]?.message ?? "Invalid request data" },
          { status: 400 }
        );
      }

      const { name, email, password, role, isActive } = result.data;

      // Check if a user with this email already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please use a different email.",
          },
          { status: 409 }
        );
      }

      const plainPassword = password || generateRandomPassword();
      const hashedPassword = await hash(plainPassword, 12);

      const now = new Date();

      const newUser = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          isActive: isActive ?? true,
          emailVerified: now, // Admin-created accounts are considered verified
          verificationToken: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        {
          message: "Customer account created successfully",
          user: newUser,
          // Only return the generated password if the admin didn't supply one
          password: password ? undefined : plainPassword,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating customer:", error);
      return NextResponse.json(
        { error: "Failed to create customer account" },
        { status: 500 }
      );
    }
  },
  { limit: 20, windowMs: 10 * 60 * 1000 }
);
