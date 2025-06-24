import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const trackOrderSchema = z.object({
  email: z.string().email(),
  orderNumber: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, orderNumber } = trackOrderSchema.parse(body);

    // Find the order by order number and email
    const order = await db.order.findFirst({
      where: {
        orderNumber,
        // Check user email (works for both guest and authenticated users)
        user: {
          email,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
              },
            },
            book: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        shippingAddress: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Format the response
    const response = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderDate: order.createdAt.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      total: order.total,
      shippingAddress: order.shippingAddress,
      items: order.items.map(item => ({
        name: item.product?.name ?? item.book?.name ?? item.name,
        quantity: item.quantity,
        price: item.price,
        isBook: !!item.book,
      })),
      shippingMethod: {
        name: "Standard Shipping",
        description: order.shippingCost > 0 ? `$${order.shippingCost}` : "Free",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Guest order tracking error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
