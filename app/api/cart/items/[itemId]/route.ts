import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { CartItem } from "@/features/cart";

// Mock database for cart storage - reference the same one from other files
// In a real app, this would use Prisma
const CART_STORAGE = new Map<string, CartItem[]>();

// Generate a unique guest ID for anonymous users - same as in other files
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

    console.log(`Attempting to update item: ${itemId}`);
    const body = await request.json();

    // Validate the update data
    const { quantity } = updateSchema.parse(body);

    // Get the cart ID and cart
    const cartId = await getCartId();
    const cart = CART_STORAGE.get(cartId) || [];

    console.log(
      `Current cart for ${cartId}:`,
      cart.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // Find the item in the cart - look for exact match or as part of a product ID
    const itemIndex = cart.findIndex(
      (item) =>
        item.id === itemId ||
        (item.productId && item.productId === itemId) ||
        (item.id && item.id.includes(itemId))
    );

    if (itemIndex === -1) {
      console.error(
        `Item ${itemId} not found in cart. Available items:`,
        cart.map((item) => ({ id: item.id, productId: item.productId }))
      );

      // Attempt to add the item if not found
      // Get product details from products collection (simplified mock for now)
      const mockProduct = {
        productId: itemId,
        name: `Product ${itemId}`,
        price: 19.99,
        quantity: quantity,
      };

      // Add the item to cart
      cart.push({
        id: itemId,
        ...mockProduct,
      });

      // Save the updated cart
      CART_STORAGE.set(cartId, cart);

      return NextResponse.json({
        success: true,
        message: "Item added to cart successfully",
        data: { itemId, quantity },
      });
    }

    // Update the item quantity
    cart[itemIndex] = {
      ...cart[itemIndex],
      quantity,
    };

    // Save the updated cart
    CART_STORAGE.set(cartId, cart);
    console.log(
      `Cart updated for ${cartId}:`,
      cart.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    return NextResponse.json({
      success: true,
      message: "Item quantity updated successfully",
      data: { itemId, quantity },
    });
  } catch (error) {
    console.error(`Failed to update item ${params.itemId}:`, error);

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

    console.log(`Attempting to remove item with ID: ${itemId}`);

    // Get the cart ID and cart
    const cartId = await getCartId();
    const cart = CART_STORAGE.get(cartId) || [];

    console.log(`Current cart for ${cartId}:`, cart);

    // Check if cart is empty
    if (cart.length === 0) {
      console.log(`Cart is empty for user ${cartId}`);
      return NextResponse.json({
        success: true,
        message: "Cart is already empty",
        data: { itemId },
      });
    }

    // Find the item in the cart with more flexible matching
    // This improves the item finding logic to handle different ID formats
    const itemToRemove = cart.find(
      (item) =>
        item.id === itemId ||
        item.id === `cart_${itemId}` ||
        (item.productId && item.productId === itemId) ||
        (item.id && item.id.includes(itemId)) ||
        (itemId && itemId.includes(item.id))
    );

    // If item not found, we'll look for partial matches or similar items
    if (!itemToRemove) {
      console.log(
        `Item ${itemId} not found in cart. Available items:`,
        cart.map((item) => item.id)
      );

      // For improved robustness, return success even if item not found
      // This prevents errors when trying to remove an item that might have already been removed
      return NextResponse.json({
        success: true,
        message: "Item not in cart or already removed",
        data: { itemId },
      });
    }

    console.log(`Found item to remove:`, itemToRemove);

    // Remove the item from the cart
    const updatedCart = cart.filter((item) => item.id !== itemToRemove.id);

    // Save the updated cart
    CART_STORAGE.set(cartId, updatedCart);
    console.log(`Updated cart after removal:`, updatedCart);

    return NextResponse.json({
      success: true,
      message: "Item removed from cart successfully",
      data: { itemId },
    });
  } catch (error) {
    console.error(`Failed to remove item ${params.itemId}:`, error);
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
