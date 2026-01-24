import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateSamedayOrder } from "@/lib/shipping/sameday-validation";

const requestSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = requestSchema.parse(await request.json());
    const order = await db.order.findUnique({
      where: { id: body.orderId },
      include: {
        items: true,
        user: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const productIds = order.items
      .filter(item => item.isDigital !== true)
      .map(item => item.productId)
      .filter(Boolean) as string[];
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, weight: true, dimensions: true },
    });
    const productMap = new Map(products.map(product => [product.id, product]));

    const shippingItems = order.items
      .filter(item => item.isDigital !== true)
      .map(item => {
        const product = item.productId ? productMap.get(item.productId) : null;
        if (!product) return null;
        return {
          quantity: item.quantity,
          weightKg: product.weight,
          dimensions: product.dimensions as Record<string, unknown>,
        };
      })
      .filter(Boolean) as Array<{
      quantity: number;
      weightKg?: number | null;
      dimensions?: Record<string, unknown> | null;
    }>;

    const validation = await validateSamedayOrder({
      order: {
        id: order.id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        codAmount: order.codAmount,
        shippingMethod: order.shippingMethod,
        lockerId: order.lockerId,
        user: order.user,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
      },
      shippingItems,
    });

    return NextResponse.json(validation);
  } catch (error) {
    console.error("Sameday validation failed:", error);
    return NextResponse.json(
      { error: "Failed to validate order" },
      { status: 500 }
    );
  }
}
