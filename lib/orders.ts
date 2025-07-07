import "server-only";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getOrders() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const orders = await db.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      shippingAddress: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString(),
    status: order.status.toLowerCase() as
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled",
    total: order.total,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.name,
      productSlug: item.product?.slug || "",
      price: item.price,
      quantity: item.quantity,
      image: item.product?.images?.[0] || "/placeholder.png",
      hasReviewed: false, // This needs to be implemented
      isDigital: item.isDigital,
    })),
    shippingAddress: {
      name: order.shippingAddress.fullName,
      street: order.shippingAddress.addressLine1,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zipCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
    },
  }));
}
