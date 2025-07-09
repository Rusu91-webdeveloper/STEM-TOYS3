import { auth } from "./auth";
import { db } from "../db";
import type { Order, OrderItem, Address, Review } from "@prisma/client";

/**
 * Fetches all orders for the currently authenticated user, including items, products/books, reviews, and shipping address.
 * Returns an array of orders formatted for frontend consumption.
 */
export async function getOrders() {
  const session = await auth();
  if (!session?.user) return [];

  // Check if the order table exists (for dev environments)
  // @ts-ignore
  const ordersExist = (await db.order) !== undefined;
  if (!ordersExist) return [];

  // Fetch orders with related data
  // @ts-ignore
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
          book: true,
          reviews: true,
        },
      },
      shippingAddress: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Format for frontend
  return orders.map(
    (
      order: Order & {
        items: (OrderItem & { product: any; book: any; reviews: Review[] })[];
        shippingAddress: Address;
      }
    ) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      status: order.status.toLowerCase() as any,
      total: order.total,
      items: order.items.map(item => {
        const typedItem = item as OrderItem & {
          product: any;
          book: any;
          reviews: Review[];
        };
        const isBook = !!typedItem.book;
        const name = isBook
          ? typedItem.book!.name
          : typedItem.product?.name || typedItem.name;
        const slug = isBook
          ? typedItem.book!.slug
          : typedItem.product?.slug || "";
        const image = isBook
          ? typedItem.book!.coverImage || "/images/book-placeholder.jpg"
          : typedItem.product?.images?.[0] || "/images/product-placeholder.jpg";
        return {
          id: typedItem.id,
          productId: typedItem.productId,
          bookId: typedItem.bookId,
          productName: name,
          productSlug: slug,
          price: typedItem.price,
          quantity: typedItem.quantity,
          image,
          hasReviewed: typedItem.reviews && typedItem.reviews.length > 0,
          isDigital: typedItem.isDigital,
          type: isBook ? "book" : "product",
          ...(isBook && {
            author: typedItem.book!.author,
            downloadCount: typedItem.downloadCount,
            maxDownloads: typedItem.maxDownloads,
            downloadExpiresAt: typedItem.downloadExpiresAt?.toISOString(),
          }),
        };
      }),
      shippingAddress: order.shippingAddress
        ? {
            name: order.shippingAddress.fullName,
            street: order.shippingAddress.addressLine1,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zipCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          }
        : null,
    })
  ) as any;
}
