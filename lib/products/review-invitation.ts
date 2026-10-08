import "server-only";

import { db } from "@/lib/db";

import { productPublicPath } from "./public-slug";

/** Resolve eligibility and recipient from persisted delivery/purchase evidence. */
export async function getReviewInvitation(orderId: string, email: string) {
  if (!orderId || !email) return null;
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      userId: true,
      user: { select: { email: true, isActive: true, anonymized: true } },
      items: {
        select: {
          id: true,
          productId: true,
          product: { select: { name: true, slug: true } },
          reviews: { select: { userId: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (
    !order ||
    order.status !== "DELIVERED" ||
    !order.user.isActive ||
    order.user.anonymized ||
    order.user.email?.trim().toLowerCase() !== email.trim().toLowerCase()
  )
    return null;
  const item = order.items.find(
    item =>
      item.productId &&
      item.product &&
      !item.reviews.some(review => review.userId === order.userId)
  );
  if (!item?.product || !item.productId) return null;
  const path = `/account/orders/${encodeURIComponent(order.id)}/review?${new URLSearchParams(
    {
      itemId: item.id,
      productId: item.productId,
    }
  )}`;
  return {
    email: order.user.email!,
    orderNumber: order.orderNumber,
    productName: item.product.name,
    productUrl: `https://www.techtots.ro${productPublicPath(item.product.slug)}`,
    // Sign-in preserves the exact callback for signed-out customers.
    reviewUrl: `https://www.techtots.ro/auth/login?${new URLSearchParams({ callbackUrl: path })}`,
  };
}
