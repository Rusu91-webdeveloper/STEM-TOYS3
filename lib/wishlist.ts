import "server-only";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Define the type for the joined wishlist item
type WishlistItemWithProduct = Prisma.WishlistGetPayload<{
  include: { product: true };
}>;

export async function getWishlistItems() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const wishlistItems: WishlistItemWithProduct[] = await db.wishlist.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return wishlistItems.map(({ product, createdAt, id }) => ({
    id, // Use the wishlist entry id
    productId: product.id,
    name: product.name,
    price: product.price,
    image: product.images?.[0] || "/placeholder.png",
    slug: product.slug,
    inStock: product.stockQuantity > 0,
    dateAdded: createdAt.toISOString(),
  }));
}
