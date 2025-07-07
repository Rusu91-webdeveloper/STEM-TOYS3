import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/orders/[orderId] - Get a single order for the authenticated user
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const resolvedParams = await params;
    const { orderId } = resolvedParams;
    // Fetch the order for the user
    const order = await db.order.findFirst({
      where: {
        id: orderId,
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
          },
        },
        shippingAddress: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // Format data for frontend consumption
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      deliveredAt: (order as any).deliveredAt || null,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product?.name || item.name || "Product no longer available",
        price: item.price,
        quantity: item.quantity,
        isDigital: (item as any).isDigital || false,
        returnStatus: item.returnStatus,
        product: item.product
          ? {
              id: item.productId,
              name: item.product.name,
              slug: item.product.slug,
              images: item.product.images,
            }
          : {
              id: item.productId,
              name: item.name || "Product no longer available",
              slug: null,
              images: [],
            },
      })),
      shippingAddress: order.shippingAddress,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      total: order.total,
      discountAmount: order.discountAmount || 0,
      couponCode: order.couponCode || null,
    };
    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
