import { db } from "@/lib/db";

import { auth } from "./auth";

export async function getWishlistItems() {
  const session = await auth();
  if (!session?.user) return [];

  try {
    // Fetch user's wishlist items with product details
    const wishlistItems = await db.wishlist.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            slug: true,
            images: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format data for frontend consumption
    const formattedItems = wishlistItems.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0] || "/images/product-placeholder.jpg",
      slug: item.product.slug,
      inStock: item.product.stockQuantity > 0,
      dateAdded: item.createdAt.toISOString(),
    }));

    return formattedItems;
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return [];
  }
}
