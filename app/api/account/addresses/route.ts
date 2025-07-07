import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validations";

// Extended schema for creating an address
const createAddressSchema = addressSchema.extend({
  name: z.string().min(1, "Address nickname is required"),
  isDefault: z.boolean().default(false),
});

// GET - Get all addresses for the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Special handling for environment-based admin accounts
    // These have a userId of "admin_env" but need to access addresses by email
    let addresses: any[] = [];

    if (session.user.id === "admin_env" && session.user.email) {
      // First, try to find the real user ID by email
      const realUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (realUser) {
        // If a real user with this email exists, use their ID to find addresses
        addresses = await db.address.findMany({
          where: {
            userId: realUser.id,
          },
          orderBy: {
            isDefault: "desc", // Default addresses first
          },
        });
      } else {
        // If no real user found, return empty array
        addresses = [];
      }
    } else {
      // Regular case - get addresses for the current user ID
      addresses = await db.address.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          isDefault: "desc", // Default addresses first
        },
      });
    }

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST - Create a new address
export async function POST(req: Request) {
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
    const result = createAddressSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { isDefault, ...addressData } = result.data;

    // Handle the special case for environment-based admin accounts
    let userId = session.user.id;

    if (userId === "admin_env" && session.user.email) {
      // Try to find the real user ID by email
      const realUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (realUser) {
        // Use the real user ID instead
        userId = realUser.id;
      } else {
        return NextResponse.json(
          {
            error:
              "Cannot create address for environment-based admin. Please sign in with Google.",
          },
          { status: 400 }
        );
      }
    }

    // Use transaction to ensure operations are atomic
    const newAddress = await db.$transaction(async (tx) => {
      // If this is the default address, unset any existing default addresses
      if (isDefault) {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create the new address
      return tx.address.create({
        data: {
          ...addressData,
          isDefault,
          userId,
        },
      });
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
