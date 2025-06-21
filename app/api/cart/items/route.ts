import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { CartItem } from "@/features/cart";

// Mock database for cart storage - reference the same one from route.ts
// In a real app, this would use Prisma
const CART_STORAGE = new Map<string, CartItem[]>();

// Generate a unique guest ID for anonymous users - same as in route.ts
async function getGuestId(): Promise<string> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }

  return guestId;
}

// Helper function to get the cart ID (either user email or guest ID)
async function getCartId(): Promise<string> {
  const session = await auth();

  if (session?.user?.email) {
    return session.user.email;
  }

  return await getGuestId();
}

// Schema for validating incoming cart item data
const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});

// POST /api/cart/items - Add an item to the cart
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the item data
    const validatedItem = cartItemSchema.parse(body);
    const cartId = await getCartId();

    // Get the current cart or initialize a new one
    const cart = CART_STORAGE.get(cartId) || [];

    // Generate a unique ID for the cart item
    const itemId = `${validatedItem.productId}${
      validatedItem.variantId ? `_${validatedItem.variantId}` : ""
    }`;

    // Check if the item already exists in the cart
    const existingItemIndex = cart.findIndex((item) => item.id === itemId);

    if (existingItemIndex >= 0) {
      // Update the existing item
      cart[existingItemIndex] = {
        ...cart[existingItemIndex],
        quantity: cart[existingItemIndex].quantity + validatedItem.quantity,
      };
    } else {
      // Add the new item
      cart.push({
        id: itemId,
        ...validatedItem,
      });
    }

    // Save the updated cart
    CART_STORAGE.set(cartId, cart);

    return NextResponse.json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        id: itemId,
        ...validatedItem,
      },
    });
  } catch (error) {
    console.error("Failed to add item to cart:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid item data",
          error: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item to cart",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
