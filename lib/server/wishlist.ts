import { db } from "@/lib/db";

import { auth } from "./auth";

type WishlistListItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  inStock: boolean;
  dateAdded: string;
};

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
    const formattedItems: WishlistListItem[] = wishlistItems.flatMap(item => {
      if (!item.productId || !item.product) {
        return [];
      }

      return [
        {
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images?.[0] || "/images/product-placeholder.jpg",
          slug: item.product.slug,
          inStock: item.product.stockQuantity > 0,
          dateAdded: item.createdAt.toISOString(),
        },
      ];
    });

    return formattedItems;
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return [];
  }
}
