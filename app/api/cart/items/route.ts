import { NextResponse } from "next/server";
import { z } from "zod";

import { SESSION_CART_STORAGE, getCartId } from "@/lib/cart-storage";
import { db } from "@/lib/db";

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
    const cartId = await getCartId(request);

    // --- STOCK VALIDATION ---
    const product = await db.product.findUnique({
      where: { id: validatedItem.productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const stockQuantity = product.stockQuantity;
    // --- END STOCK VALIDATION ---

    console.log(`🛒 [ITEMS POST] Adding item to cart for session: ${cartId}`);

    // Get the current cart or initialize a new one
    const cart = SESSION_CART_STORAGE.get(cartId) || [];

    // Generate a unique ID for the cart item
    const itemId = `${validatedItem.productId}${
      validatedItem.variantId ? `_${validatedItem.variantId}` : ""
    }`;

    // Check if the item already exists in the cart
    const existingItemIndex = cart.findIndex(item => item.id === itemId);

    let newQuantity = validatedItem.quantity;
    if (existingItemIndex >= 0) {
      newQuantity += cart[existingItemIndex].quantity;
    }

    if (stockQuantity < newQuantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Not enough stock. Only ${stockQuantity} left.`,
        },
        { status: 400 }
      );
    }

    if (existingItemIndex >= 0) {
      // Update the existing item
      cart[existingItemIndex] = {
        ...cart[existingItemIndex],
        quantity: newQuantity,
      };
      console.log(
        `📦 [ITEMS POST] Updated existing item ${itemId}, new quantity: ${cart[existingItemIndex].quantity}`
      );
    } else {
      // Add the new item
      cart.push({
        id: itemId,
        ...validatedItem,
      });
      console.log(
        `📦 [ITEMS POST] Added new item ${itemId} with quantity: ${validatedItem.quantity}`
      );
    }

    // Save the updated cart
    SESSION_CART_STORAGE.set(cartId, cart);
    console.log(
      `📊 [ITEMS POST] Session storage now has ${SESSION_CART_STORAGE.size} sessions, cart has ${cart.length} items`
    );

    return NextResponse.json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        id: itemId,
        ...validatedItem,
      },
      ephemeral: true,
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
