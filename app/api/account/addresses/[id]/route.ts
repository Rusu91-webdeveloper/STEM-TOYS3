import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validations";
import { z } from "zod";

// Extended schema for updating an address
const updateAddressSchema = addressSchema.extend({
  name: z.string().min(1, "Address nickname is required"),
  isDefault: z.boolean().default(false),
});

// GET - Get a specific address
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: addressId } = await params;

    // Handle special case for environment-based admin accounts
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
      }
    }

    // Fetch the address and ensure it belongs to the current user
    const address = await db.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
}

// PUT - Update an address
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: addressId } = await params;
    const body = await req.json();

    // Validate request body
    const result = updateAddressSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle special case for environment-based admin accounts
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
      }
    }

    // Check if the address exists and belongs to the user
    const existingAddress = await db.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const { isDefault, ...addressData } = result.data;

    // Use transaction to ensure all operations are atomic
    const updatedAddress = await db.$transaction(async (tx) => {
      // If this is being set as the default address, unset any existing default addresses
      if (isDefault && !existingAddress.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: userId, // Use the resolved userId which handles admin_env
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update the address
      return tx.address.update({
        where: {
          id: addressId,
        },
        data: {
          ...addressData,
          isDefault,
        },
      });
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an address
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: addressId } = await params;

    // Handle special case for environment-based admin accounts
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
      }
    }

    // Check if the address exists and belongs to the user
    const existingAddress = await db.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Use transaction to ensure all operations are atomic
    await db.$transaction(async (tx) => {
      // Delete the address
      await tx.address.delete({
        where: {
          id: addressId,
        },
      });

      // If the deleted address was the default, set another address as default if available
      if (existingAddress.isDefault) {
        const anotherAddress = await tx.address.findFirst({
          where: {
            userId: userId, // Use the resolved userId which handles admin_env
          },
        });

        if (anotherAddress) {
          await tx.address.update({
            where: {
              id: anotherAddress.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }
    });

    return NextResponse.json(
      { message: "Address deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
