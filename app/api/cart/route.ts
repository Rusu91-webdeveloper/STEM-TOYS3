import { NextResponse } from "next/server";
import { z } from "zod";

import { type CartItem } from "@/features/cart";
import { SESSION_CART_STORAGE, getCartId } from "@/lib/cart-storage";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/security";

// Schema for validating incoming cart data
const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
  isBook: z.boolean().optional(),
  selectedLanguage: z.string().optional(),
});

const cartSchema = z.array(cartItemSchema);

// GET /api/cart - Retrieve the user's cart (session-only)
export const GET = withRateLimit(
  async request => {
    try {
      // Get the cart ID using shared logic
      const cartId = await getCartId(request);

      console.log(`🛒 [GET] Fetching ephemeral cart for session: ${cartId}`);
      console.log(
        `📊 [GET] Current session storage has ${SESSION_CART_STORAGE.size} sessions`
      );

      // Get cart from session storage only (no persistence)
      const cart = SESSION_CART_STORAGE.get(cartId) || [];
      console.log(`📦 [GET] Found ${cart.length} items for session ${cartId}`);

      return NextResponse.json({
        success: true,
        message: "Cart fetched from session",
        data: cart,
        user: cartId.includes("@") ? cartId : null, // If cartId is email, use it as user
        ephemeral: true,
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
    limit: 100, // Increased from 50 to 100 requests
    windowMs: 60000, // per minute
  }
);

// POST /api/cart - Update the user's cart (session-only)
export const POST = withRateLimit(
  async request => {
    try {
      const body = await request.json();

      // Sanitize input (for string values)
      const sanitizedBody = Array.isArray(body)
        ? body.map(item => ({
            ...item,
            name: item.name ? sanitizeInput(item.name) : item.name,
            image: item.image ? sanitizeInput(item.image) : item.image,
          }))
        : body;

      // Validate the cart data
      const validatedCart = cartSchema.parse(sanitizedBody);

      // Get the cart ID using shared logic
      const cartId = await getCartId(request);

      // Add IDs to cart items if they don't already have them
      const cartWithIds: CartItem[] = [];
      for (const item of validatedCart) {
        let entity: any = null;

        if (item.isBook) {
          entity = await db.book.findUnique({
            where: { id: item.productId, isActive: true },
          });
          if (!entity) {
            console.warn(
              `Book with ID ${item.productId} not found or inactive. Skipping.`
            );
            continue;
          }
        } else {
          entity = await db.product.findUnique({
            where: { id: item.productId, isActive: true },
          });
          if (!entity) {
            console.warn(
              `Product with ID ${item.productId} not found or inactive. Skipping.`
            );
            continue;
          }
        }

        // Create cart item with proper ID
        const cartItemId = item.variantId
          ? `${item.productId}_${item.variantId}`
          : item.selectedLanguage
            ? `${item.productId}_${item.selectedLanguage}`
            : item.productId;

        cartWithIds.push({
          ...item,
          id: cartItemId,
        });
      }

      // Store in session storage
      SESSION_CART_STORAGE.set(cartId, cartWithIds);

      console.log(
        `🛒 [POST] Updated ephemeral cart for session: ${cartId} with ${cartWithIds.length} items`
      );
      console.log(
        `📊 [POST] Current session storage has ${SESSION_CART_STORAGE.size} sessions`
      );

      return NextResponse.json({
        success: true,
        message: "Cart updated successfully",
        data: cartWithIds,
        user: cartId.includes("@") ? cartId : null,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Failed to update cart:", error);
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
    limit: 200, // Increased from 50 to 200 requests for POST operations
    windowMs: 60000, // per minute
  }
);
