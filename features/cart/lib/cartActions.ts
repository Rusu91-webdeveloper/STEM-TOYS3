/**
 * Server-side cart helper functions
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { CartItem } from "../context/CartContext";

/**
 * Get a user's cart from server storage or database
 * This is a server-side function for use in API routes
 */
export async function getCart(userId: string): Promise<{ items: CartItem[] }> {
  try {
    // In a real implementation, this would fetch the cart from the database
    // For now, we'll attempt to find products in the database based on IDs

    // Get cart items from the database
    // For demo purposes, we'll fetch a few active products from the database
    const products = await db.product.findMany({
      where: {
        isActive: true,
      },
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!products || products.length === 0) {
      console.warn("No products found in database, using fallback products");
      // Fallback to ensure we have something to show
      return {
        items: [
          {
            id: "product-1",
            productId: "product-1",
            name: "Robot Constructor",
            quantity: 1,
            price: 149.99,
            image: "/images/products/robot-kit.jpg",
          },
          {
            id: "product-2",
            productId: "product-2",
            name: "Microscop Digital",
            quantity: 1,
            price: 79.99,
            image: "/images/products/microscope.jpg",
          },
        ],
      };
    }

    // Map database products to cart items
    const cartItems: CartItem[] = products.map(product => ({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1, // Default quantity
      image:
        product.images && product.images.length > 0
          ? product.images[0]
          : undefined,
    }));

    return { items: cartItems };
  } catch (error) {
    console.error("Error retrieving cart from database:", error);
    return { items: [] };
  }
}
