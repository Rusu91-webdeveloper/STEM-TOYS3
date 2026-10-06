import { unstable_cache } from "next/cache";

import type { Review } from "@/features/products/components/ProductReviews";
import { db } from "@/lib/db";


/** The API and server-rendered product page use the same public projection. */
export function getProductReviews(productId: string): Promise<Review[]> {
  return unstable_cache(
    async () => {
      const reviews = await db.review.findMany({
        where: { productId },
        select: {
          id: true,
          productId: true,
          userId: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          user: { select: { name: true } },
          orderItem: {
            select: {
              productId: true,
              order: { select: { userId: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reviews.map(review => ({
        id: review.id,
        productId: review.productId,
        userName: review.user?.name?.trim() || "Client",
        rating: review.rating,
        title: review.title,
        content: review.content,
        date: review.createdAt.toISOString(),
        verified:
          review.orderItem?.productId === review.productId &&
          review.orderItem?.order.userId === review.userId,
      }));
    },
    ["public-product-reviews", productId],
    { revalidate: 300, tags: [`reviews-${productId}`] }
  )();
}
