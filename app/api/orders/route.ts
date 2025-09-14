import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  triggerNewOrderAdminEmail,
  checkAndTriggerHighValueOrderEmail,
} from "@/lib/email/email-triggers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, shippingAddressId, billingAddressId, paymentMethod, notes } =
      body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    if (!shippingAddressId) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { price: true, name: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber,
        status: "PENDING",
        total,
        shippingAddressId,
        billingAddressId: billingAddressId || shippingAddressId,
        paymentMethod: paymentMethod || "CARD",
        notes: notes || "",
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    // Trigger admin notification email
    try {
      await triggerNewOrderAdminEmail(order.id, {
        orderNumber: order.orderNumber,
        customerName:
          order.user.name || order.user.email || "Client necunoscut",
        orderTotal: order.total,
        orderItems: order.items,
      });
      console.log(`✅ New order admin email triggered for order ${order.id}`);
    } catch (emailError) {
      console.error(`❌ Failed to send new order admin email:`, emailError);
      // Don't fail the request if email fails
    }

    // Check for high value order
    try {
      await checkAndTriggerHighValueOrderEmail(order.id, order.total);
      console.log(`✅ High value order check completed for order ${order.id}`);
    } catch (emailError) {
      console.error(`❌ Failed to check high value order:`, emailError);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
