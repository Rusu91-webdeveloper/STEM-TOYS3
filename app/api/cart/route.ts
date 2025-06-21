import { NextResponse } from "next/server";
import { type CartItem } from "@/features/cart";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { withRateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/security";
import {
  getCartFromCache,
  setCartInCache,
  invalidateCartCache,
} from "@/lib/redis";
import { db } from "@/lib/db";

// Mock database for cart storage - replace with Prisma in production
const CART_STORAGE = new Map<string, CartItem[]>();

// Schema for validating incoming cart data
const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});

const cartSchema = z.array(cartItemSchema);

// Generate a unique guest ID for anonymous users
async function getGuestId(): Promise<string> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    // Note: In an actual implementation, you would use the cookies API to set the cookie
    // but since we're using a mock for demonstration, we'll pretend the cookie is set
  }

  return guestId;
}

// Helper function to validate cart data
function isValidCartData(data: any): data is CartItem[] {
  if (!Array.isArray(data)) {
    return false;
  }

  // Simple validation to check if it's an array of objects with required cart item properties
  return data.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.quantity === "number"
  );
}

async function cleanupInvalidCartItems(items: CartItem[]): Promise<CartItem[]> {
  const validItems: CartItem[] = [];

  for (const item of items) {
    // Skip items with "(Deleted)" in the name
    if (item.name.includes("(Deleted)")) {
      // Removing deleted item from cart
      continue;
    }

    // Check if it's marked as a book
    if (item.isBook) {
      // For books, item.productId is the book ID
      const book = await db.book.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, isActive: true },
      });

      if (book && book.isActive) {
        validItems.push(item);
      } else {
        // Removing invalid/inactive book from cart
      }
    } else {
      // Check if it's a book by trying to find it in the books table (fallback detection)
      const book = await db.book.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, isActive: true },
      });

      if (book) {
        // It's a book - check if it's still active
        if (book.isActive) {
          validItems.push(item);
        } else {
          // Removing inactive book from cart
        }
      } else {
        // It's a regular product - check if it exists and is active
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, isActive: true },
        });

        if (product && product.isActive) {
          validItems.push(item);
        } else {
          console.log(
            `Removing invalid/inactive product from cart: ${item.name}`
          );
        }
      }
    }
  }

  return validItems;
}

// GET /api/cart - Retrieve the user's cart
export const GET = withRateLimit(
  async (request) => {
    try {
      // Check if user is authenticated
      const session = await auth();
      let cartId: string;

      if (session?.user?.email) {
        // User is logged in, use their email as cart ID
        cartId = session.user.email;
      } else {
        // Anonymous user, use guest ID from cookie
        cartId = await getGuestId();
      }

      // Try to get cart from Redis cache first
      try {
        console.log(`Fetching cart for ${cartId} from cache...`);
        const cachedCart = await getCartFromCache(cartId);

        if (cachedCart) {
          console.log(`Cart for ${cartId} found in cache`);
          try {
            // Try to parse the cached cart
            const parsedCart =
              typeof cachedCart === "string"
                ? JSON.parse(cachedCart)
                : cachedCart;

            // Validate the parsed cart data
            if (isValidCartData(parsedCart)) {
              console.log(
                `Returning cached cart for ${cartId} with ${parsedCart.length} items`
              );
              // Clean up invalid items
              const cleanedCart = await cleanupInvalidCartItems(parsedCart);

              // If items were removed, update the cache
              if (cleanedCart.length !== parsedCart.length) {
                console.log(
                  `Cleaned cart: removed ${parsedCart.length - cleanedCart.length} invalid items`
                );
                await setCartInCache(cartId, cleanedCart);
              }

              return NextResponse.json({
                success: true,
                message: "Cart fetched from cache",
                data: cleanedCart,
                user: session?.user?.email || null,
                fromCache: true,
              });
            } else {
              console.error(
                "Invalid cart data in cache, falling back to storage"
              );
              // If data is invalid, invalidate the cache
              await invalidateCartCache(cartId);
            }
          } catch (parseError) {
            console.error("Failed to parse cached cart:", parseError);
            // If parsing fails, invalidate the bad cache entry
            await invalidateCartCache(cartId);
          }
        } else {
          console.log(`No cached cart found for ${cartId}`);
        }
      } catch (cacheError) {
        // Log cache error but continue with database fetch
        console.error("Cache error (continuing with fallback):", cacheError);
      }

      // Get cart from storage (or return empty array if not found)
      const cart = CART_STORAGE.get(cartId) || [];

      // Cache the cart with 10-minute expiration
      try {
        await setCartInCache(cartId, cart);
      } catch (cacheError) {
        console.error("Failed to cache cart:", cacheError);
      }

      return NextResponse.json({
        success: true,
        message: "Cart fetched successfully",
        data: cart,
        user: session?.user?.email || null,
      });
    } catch (error) {
      console.error("Failed to get cart:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to get cart",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
  {
    limit: 50, // 50 requests
    windowMs: 60000, // per minute
  }
);

// POST /api/cart - Update the user's cart
export const POST = withRateLimit(
  async (request) => {
    try {
      const body = await request.json();

      // Sanitize input (for string values)
      const sanitizedBody = Array.isArray(body)
        ? body.map((item) => ({
            ...item,
            name: item.name ? sanitizeInput(item.name) : item.name,
            image: item.image ? sanitizeInput(item.image) : item.image,
          }))
        : body;

      // Validate the cart data
      const validatedCart = cartSchema.parse(sanitizedBody);

      // Check if user is authenticated
      const session = await auth();
      let cartId: string;

      if (session?.user?.email) {
        // User is logged in, use their email as cart ID
        cartId = session.user.email;
      } else {
        // Anonymous user, use guest ID from cookie
        cartId = await getGuestId();
      }

      // Add IDs to cart items if they don't already have them
      const cartWithIds: CartItem[] = validatedCart.map((item) => {
        // Check if item already has an ID
        if ("id" in item) {
          return item as CartItem;
        }

        // Generate an ID based on product and variant
        const id = item.variantId
          ? `${item.productId}_${item.variantId}`
          : `${item.productId}`;

        return {
          ...item,
          id,
        };
      });

      // Update cart in storage
      CART_STORAGE.set(cartId, cartWithIds);

      // Invalidate cart cache on update
      try {
        await invalidateCartCache(cartId);
        // Cache the new cart
        await setCartInCache(cartId, cartWithIds);
      } catch (cacheError) {
        console.error("Cache operation failed:", cacheError);
      }

      return NextResponse.json({
        success: true,
        message: "Cart updated successfully",
        data: cartWithIds,
        user: session?.user?.email || null,
      });
    } catch (error) {
      console.error("Failed to update cart:", error);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid cart data",
            error: error.errors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to update cart",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
  {
    limit: 20, // 20 requests
    windowMs: 60000, // per minute
  }
);
