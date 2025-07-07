import { NextResponse } from "next/server";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";

import { SESSION_CART_STORAGE, getCartId } from "@/lib/cart-storage";

// Schema for validating quantity updates
const updateSchema = z.object({
  quantity: z.number().int().positive(),
});

// PATCH /api/cart/items/[itemId] - Update item quantity
export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    // Need to await params before accessing properties
    const itemParams = await Promise.resolve(params);
    const itemId = itemParams.itemId;

    console.log(`🛒 [ITEMS PATCH] Attempting to update item: ${itemId}`);
    const body = await request.json();

    // Validate the update data
    const { quantity } = updateSchema.parse(body);

    // Get the cart ID and cart
    const cartId = await getCartId(request);
    const cart = SESSION_CART_STORAGE.get(cartId) || [];

    console.log(
      `📦 [ITEMS PATCH] Current cart for ${cartId}:`,
      cart.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // Find the item in the cart - look for exact match or as part of a product ID
    const itemIndex = cart.findIndex(
      item =>
        item.id === itemId ||
        (item.productId && item.productId === itemId) ||
        (item.id && item.id.includes(itemId))
    );

    if (itemIndex === -1) {
      console.error(
        `❌ [ITEMS PATCH] Item ${itemId} not found in cart. Available items:`,
        cart.map(item => ({ id: item.id, productId: item.productId }))
      );

      return NextResponse.json(
        {
          success: false,
          message: `Item ${itemId} not found in cart`,
          data: { itemId, quantity },
        },
        { status: 404 }
      );
    }

    // --- STOCK VALIDATION ---
    const productId = cart[itemIndex].productId;
    if (productId) {
      // Dynamically import db to avoid circular deps if any
      const { db } = (await import("@/lib/db")) as { db: PrismaClient };
      const product = await db.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found." },
          { status: 404 }
        );
      }
      if (quantity > product.stockQuantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough stock. Only ${product.stockQuantity} left.`,
          },
          { status: 400 }
        );
      }
    }
    // --- END STOCK VALIDATION ---

    // Update the item quantity
    cart[itemIndex] = {
      ...cart[itemIndex],
      quantity,
    };

    // Save the updated cart
    SESSION_CART_STORAGE.set(cartId, cart);
    console.log(
      `✅ [ITEMS PATCH] Cart updated for ${cartId}:`,
      cart.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    return NextResponse.json({
      success: true,
      message: "Item quantity updated successfully",
      data: { itemId, quantity },
      ephemeral: true,
    });
  } catch (error) {
    console.error(
      `❌ [ITEMS PATCH] Failed to update item ${params.itemId}:`,
      error
    );

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid update data",
          error: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update item",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items/[itemId] - Remove an item from the cart
export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    // Need to await params before accessing
    const itemParams = await Promise.resolve(params);
    const itemId = itemParams.itemId;

    console.log(
      `🛒 [ITEMS DELETE] Attempting to remove item with ID: ${itemId}`
    );

    // Get the cart ID and cart
    const cartId = await getCartId(request);
    const cart = SESSION_CART_STORAGE.get(cartId) || [];

    console.log(`📦 [ITEMS DELETE] Current cart for ${cartId}:`, cart);

    // Check if cart is empty
    if (cart.length === 0) {
      console.log(`📭 [ITEMS DELETE] Cart is empty for user ${cartId}`);
      return NextResponse.json({
        success: true,
        message: "Cart is already empty",
        data: { itemId },
        ephemeral: true,
      });
    }

    // Find the item in the cart with more flexible matching
    const itemToRemove = cart.find(
      item =>
        item.id === itemId ||
        item.id === `cart_${itemId}` ||
        (item.productId && item.productId === itemId) ||
        (item.id && item.id.includes(itemId)) ||
        (itemId && itemId.includes(item.id))
    );

    // If item not found, we'll look for partial matches or similar items
    if (!itemToRemove) {
      console.log(
        `❌ [ITEMS DELETE] Item ${itemId} not found in cart. Available items:`,
        cart.map(item => item.id)
      );

      // Return success even if item not found to prevent errors
      return NextResponse.json({
        success: true,
        message: "Item not in cart or already removed",
        data: { itemId },
        ephemeral: true,
      });
    }

    console.log(`✅ [ITEMS DELETE] Found item to remove:`, itemToRemove);

    // Remove the item from the cart
    const updatedCart = cart.filter(item => item.id !== itemToRemove.id);

    // Save the updated cart
    SESSION_CART_STORAGE.set(cartId, updatedCart);
    console.log(`📦 [ITEMS DELETE] Updated cart after removal:`, updatedCart);

    return NextResponse.json({
      success: true,
      message: "Item removed from cart successfully",
      data: { itemId },
      ephemeral: true,
    });
  } catch (error) {
    console.error(
      `❌ [ITEMS DELETE] Failed to remove item ${params.itemId}:`,
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove item from cart",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
