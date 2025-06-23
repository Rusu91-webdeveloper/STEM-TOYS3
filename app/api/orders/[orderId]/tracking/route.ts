import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    const { orderId } = params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch order with tracking information
    const order = await db.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        shippingAddressId: true,
      },
    });

    // Fetch shipping address separately
    let shippingAddress = null;
    if (order?.shippingAddressId) {
      shippingAddress = await db.address.findUnique({
        where: { id: order.shippingAddressId },
        select: {
          fullName: true,
          addressLine1: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate tracking events based on order status
    const trackingEvents = generateTrackingEvents(order, shippingAddress);

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: `TRK${order.orderNumber}${Math.random().toString(36).substr(2, 4).toUpperCase()}`, // Generate mock tracking number
        carrier: "Standard Shipping",
        estimatedDelivery: null,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt,
        shippingAddress,
      },
      trackingEvents,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching tracking information:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking information" },
      { status: 500 }
    );
  }
}

function generateTrackingEvents(order: any, shippingAddress: any) {
  const events = [];
  const baseDate = new Date(order.createdAt);

  // Order confirmed
  events.push({
    id: "confirmed",
    status: "CONFIRMED",
    description: "Order confirmed and payment processed",
    location: "Online",
    timestamp: baseDate.toISOString(),
    completed: true,
  });

  // Processing
  if (
    [
      "PROCESSING",
      "SHIPPED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ].includes(order.status)
  ) {
    const processingDate = new Date(baseDate);
    processingDate.setHours(baseDate.getHours() + 2);
    events.push({
      id: "processing",
      status: "PROCESSING",
      description: "Order is being prepared for shipment",
      location: "Fulfillment Center",
      timestamp: processingDate.toISOString(),
      completed: true,
    });
  }

  // Shipped
  if (
    ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
      order.status
    )
  ) {
    const shippedDate = new Date(baseDate);
    shippedDate.setDate(baseDate.getDate() + 1);
    events.push({
      id: "shipped",
      status: "SHIPPED",
      description: "Package shipped",
      location: "Fulfillment Center",
      timestamp: shippedDate.toISOString(),
      completed: true,
    });
  }

  // In Transit
  if (["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
    const transitDate = new Date(baseDate);
    transitDate.setDate(baseDate.getDate() + 1);
    transitDate.setHours(transitDate.getHours() + 6);
    events.push({
      id: "in_transit",
      status: "IN_TRANSIT",
      description: "Package is in transit",
      location: "Distribution Center",
      timestamp: transitDate.toISOString(),
      completed: true,
    });
  }

  // Out for Delivery
  if (["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
    const deliveryDate = new Date(baseDate);
    deliveryDate.setDate(baseDate.getDate() + 2);
    deliveryDate.setHours(8, 0, 0, 0);
    events.push({
      id: "out_for_delivery",
      status: "OUT_FOR_DELIVERY",
      description: "Package is out for delivery",
      location: `Local Facility - ${shippingAddress?.city || "Unknown"}`,
      timestamp: deliveryDate.toISOString(),
      completed: true,
    });
  }

  // Delivered
  if (order.status === "DELIVERED") {
    const deliveredDate = order.deliveredAt
      ? new Date(order.deliveredAt)
      : new Date(baseDate);
    if (!order.deliveredAt) {
      deliveredDate.setDate(baseDate.getDate() + 2);
      deliveredDate.setHours(14, 30, 0, 0);
    }
    events.push({
      id: "delivered",
      status: "DELIVERED",
      description: "Package has been delivered",
      location: shippingAddress?.addressLine1 || "Delivery address",
      timestamp: deliveredDate.toISOString(),
      completed: true,
    });
  }

  // Future estimated events - Generate estimated delivery date
  if (!["DELIVERED", "CANCELLED"].includes(order.status)) {
    const estimatedDate = new Date(baseDate);
    estimatedDate.setDate(baseDate.getDate() + 5); // 5 days from order
    events.push({
      id: "estimated_delivery",
      status: "ESTIMATED_DELIVERY",
      description: "Estimated delivery",
      location: shippingAddress?.addressLine1 || "Delivery address",
      timestamp: estimatedDate.toISOString(),
      completed: false,
      estimated: true,
    });
  }

  return events;
}
