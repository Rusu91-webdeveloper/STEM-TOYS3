import { NextResponse } from "next/server";

import {
  withErrorHandling,
  badRequest,
  notFound,
  handleZodError,
  handleUnexpectedError,
} from "@/lib/api-error";
import { auth } from "@/lib/auth";
import {
  getCached,
  CacheKeys,
  invalidateCache,
  invalidateCachePattern,
} from "@/lib/cache";
import { db } from "@/lib/db";
import { applyStandardHeaders } from "@/lib/response-headers";

// GET /api/account/orders - Get orders for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // --- Caching logic start ---
    const cacheKey = `${CacheKeys.user(session.user.id)}:orders`;
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
    const orders = await getCached(
      cacheKey,
      async () => {
        try {
          // @ts-ignore - Ignore TypeScript errors for dynamic schema access
          const ordersExist = (await db.order) !== undefined;
          if (!ordersExist) {
            return [];
          }
          // @ts-ignore - Ignore TypeScript errors for dynamic schema access
          const orders = await db.order.findMany({
            where: {
              userId: session.user.id,
            },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                      images: true,
                      slug: true,
                    },
                  },
                  // @ts-ignore - TypeScript doesn't recognize book relationship
                  book: {
                    select: {
                      name: true,
                      author: true,
                      slug: true,
                      coverImage: true,
                    },
                  },
                  // REMOVE reviews include here
                },
              },
              shippingAddress: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          // Batch fetch all reviews for these items
          const allItemIds = orders.flatMap(order =>
            order.items.map(item => item.id)
          );
          const allReviews = await db.review.findMany({
            where: {
              orderItemId: { in: allItemIds },
              userId: session.user.id,
            },
            select: { id: true, orderItemId: true },
          });
          // Map reviews to items
          const reviewsByItemId = new Map();
          allReviews.forEach(r => {
            if (!reviewsByItemId.has(r.orderItemId))
              reviewsByItemId.set(r.orderItemId, []);
            reviewsByItemId.get(r.orderItemId).push({ id: r.id });
          });
          // Attach reviews to items
          for (const order of orders) {
            for (const item of order.items) {
              (item as any).reviews = reviewsByItemId.get(item.id) || [];
            }
          }
          return orders;
        } catch (error) {
          console.error("Database query error:", error);
          throw error;
        }
      },
      CACHE_TTL
    );
    // --- Caching logic end ---

    // Format data for frontend consumption
    // @ts-ignore - TypeScript doesn't recognize include relationships properly
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: new Date(order.createdAt).toISOString(),
      deliveredAt: order.deliveredAt
        ? new Date(order.deliveredAt).toISOString()
        : undefined,
      status: order.status.toLowerCase(),
      total: order.total,
      items: order.items.map((item: any) => {
        // Handle both products and books
        const isBook = !!item.book;
        const name = isBook ? item.book!.name : item.product?.name || item.name;
        const slug = isBook ? item.book!.slug : item.product?.slug || "";
        const image = isBook
          ? item.book!.coverImage || "/images/book-placeholder.jpg"
          : item.product?.images?.[0] || "/images/product-placeholder.jpg";

        return {
          id: item.id,
          productId: item.productId,
          bookId: item.bookId,
          productName: name,
          productSlug: slug,
          price: item.price,
          quantity: item.quantity,
          image,
          hasReviewed: item.reviews.length > 0,
          isDigital: item.isDigital,
          type: isBook ? "book" : "product",
          ...(isBook && {
            author: item.book!.author,
            downloadCount: item.downloadCount,
            maxDownloads: item.maxDownloads,
            downloadExpiresAt: item.downloadExpiresAt
              ? new Date(item.downloadExpiresAt).toISOString()
              : undefined,
          }),
        };
      }),
      shippingAddress: {
        name: order.shippingAddress.fullName,
        street: order.shippingAddress.addressLine1,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
    }));

    return applyStandardHeaders(NextResponse.json(formattedOrders), {
      cache: "private",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return applyStandardHeaders(
      NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 }),
      { cache: "private" }
    );
  }
}

// After any order mutation (POST, PUT, DELETE), add:
// await invalidateCachePattern('order:');
// await invalidateCachePattern('orders:');
