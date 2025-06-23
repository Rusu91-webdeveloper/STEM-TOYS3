import { NextResponse } from "next/server";
import { type CartItem } from "@/features/cart";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { withRateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/security";
import { getCached, cache, CacheKeys } from "@/lib/cache";
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
  if (items.length === 0) return [];

  // Extract product IDs and book IDs
  const productIds = items
    .filter(item => !item.isBook)
    .map(item => item.productId)
    .filter(Boolean);
  
  const bookIds = items
    .filter(item => item.isBook)
    .map(item => item.productId)
    .filter(Boolean);

  // Also check for items that might be books but not marked as such
  const allIds = items.map(item => item.productId).filter(Boolean);

  // Batch fetch all products and books in parallel to avoid N+1 queries
  const [products, books, potentialBooks] = await Promise.all([
    productIds.length > 0 
      ? db.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true, name: true, isActive: true }
        })
      : [],
    bookIds.length > 0 
      ? db.book.findMany({
          where: { id: { in: bookIds }, isActive: true },
          select: { id: true, name: true, isActive: true }
        })
      : [],
    // Check all IDs against books table for fallback detection
    allIds.length > 0
      ? db.book.findMany({
          where: { id: { in: allIds }, isActive: true },
          select: { id: true, name: true, isActive: true }
        })
      : []
  ]);

  // Create lookup maps for efficient O(1) access
  const productMap = new Map(products.map(p => [p.id, p]));
  const bookMap = new Map(books.map(b => [b.id, b]));
  const potentialBookMap = new Map(potentialBooks.map(b => [b.id, b]));

  // Filter valid items using the lookup maps
  const validItems = items.filter(item => {
    // Skip items with "(Deleted)" in the name
    if (item.name.includes("(Deleted)")) {
      return false;
    }

    // Check if it's marked as a book
    if (item.isBook) {
      return bookMap.has(item.productId);
    }

    // Check if it's a book by looking in the potential books map
    if (potentialBookMap.has(item.productId)) {
      return true;
    }

    // Check if it's a valid product
    return productMap.has(item.productId);
  });

  // Log cleanup statistics
  const removedCount = items.length - validItems.length;
  if (removedCount > 0) {
    console.log(`Cart cleanup: removed ${removedCount} invalid items out of ${items.length} total items`);
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

      // Try to get cart from cache first
      const cacheKey = CacheKeys.cart(cartId);
      console.log(`Fetching cart for ${cartId} from cache...`);
      
      const cachedCart = await cache.get(cacheKey);
      if (cachedCart && isValidCartData(cachedCart)) {
        console.log(`Cart for ${cartId} found in cache with ${cachedCart.length} items`);
        
        // Clean up invalid items
        const cleanedCart = await cleanupInvalidCartItems(cachedCart);

        // If items were removed, update the cache
        if (cleanedCart.length !== cachedCart.length) {
          console.log(
            `Cleaned cart: removed ${cachedCart.length - cleanedCart.length} invalid items`
          );
          await cache.set(cacheKey, cleanedCart);
        }

        return NextResponse.json({
          success: true,
          message: "Cart fetched from cache",
          data: cleanedCart,
          user: session?.user?.email || null,
          fromCache: true,
        });
      }

      // Get cart from storage (or return empty array if not found)
      const cart = CART_STORAGE.get(cartId) || [];

      // Cache the cart with 10-minute expiration
      const storageCacheKey = CacheKeys.cart(cartId);
      await cache.set(storageCacheKey, cart, 10 * 60 * 1000); // 10 minutes

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

      // Update cart cache
      const updateCacheKey = CacheKeys.cart(cartId);
      await cache.set(updateCacheKey, cartWithIds, 10 * 60 * 1000); // 10 minutes

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
