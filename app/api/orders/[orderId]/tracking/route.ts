import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deriveOrderFulfillmentSummary } from "@/lib/utils/supplier-fulfillment";

/** Build courier tracking URL when we have AWB and known carrier. */
function getTrackingUrl(
  trackingNumber: string | null,
  carrier: string | null
): string | null {
  if (!trackingNumber?.trim() || !carrier?.trim()) return null;
  const awb = encodeURIComponent(trackingNumber.trim());
  const c = carrier.toUpperCase();
  if (c === "FANCOURIER") {
    return `https://www.fancourier.ro/awb-tracking?awb=${awb}`;
  }
  if (c === "SAMEDAY") {
    return `https://sameday.ro/awb-tracking?awb=${awb}`;
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    const { orderId } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch order with tracking and shipments (real AWB may be on Shipment if not yet on Order)
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
        trackingNumber: true,
        carrier: true,
        estimatedDelivery: true,
        shipments: {
          where: { awbNumber: { not: null } },
          select: { awbNumber: true, courier: true },
          orderBy: { createdAt: "desc" },
        },
        supplierOrders: {
          where: { trackingNumber: { not: null } },
          select: {
            id: true,
            status: true,
            trackingNumber: true,
            carrier: true,
            supplierId: true,
            supplier: {
              select: {
                id: true,
                name: true,
                companyName: true,
              },
            },
          },
        },
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

    const trackingPackages = Array.from(
      new Map(
        [
          ...(order.shipments || []).map(shipment => ({
            source: "shipment" as const,
            trackingNumber: shipment.awbNumber?.trim() || "",
            carrier: shipment.courier?.trim() || null,
            supplierName: null,
            status: null,
          })),
          ...((order.supplierOrders || []).map(supplierOrder => ({
            source: "supplier_order" as const,
            trackingNumber: supplierOrder.trackingNumber?.trim() || "",
            carrier: supplierOrder.carrier?.trim() || null,
            supplierName:
              supplierOrder.supplier?.name || supplierOrder.supplier?.companyName || null,
            status: supplierOrder.status || null,
          })) || []),
        ]
          .filter(entry => entry.trackingNumber)
          .map(entry => [
            `${entry.trackingNumber}::${(entry.carrier || "").toUpperCase()}`,
            entry,
          ])
      ).values()
    );

    // Preserve backward-compatible single tracking fields for the first package.
    const firstPackage = trackingPackages[0];
    const trackingNumber =
      order.trackingNumber ??
      firstPackage?.trackingNumber ??
      order.shipments?.[0]?.awbNumber ??
      null;
    const resolvedCarrier =
      order.carrier ?? firstPackage?.carrier ?? order.shipments?.[0]?.courier ?? null;
    const trackingAvailable = Boolean(trackingNumber);
    const carrier = trackingAvailable ? resolvedCarrier : null;
    const trackingUrl = trackingAvailable
      ? getTrackingUrl(trackingNumber, carrier)
      : null;
    const fulfillmentSummary = deriveOrderFulfillmentSummary(order.supplierOrders || []);

    // Generate tracking events based on order status
    const trackingEvents = generateTrackingEvents(order, shippingAddress);

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentStatus:
          order.supplierOrders && order.supplierOrders.length > 0
            ? fulfillmentSummary.displayStatus
            : order.status,
        trackingAvailable,
        trackingNumber: trackingAvailable ? trackingNumber : null,
        carrier,
        trackingUrl,
        trackingPackages: trackingPackages.map(pkg => ({
          source: pkg.source,
          trackingNumber: pkg.trackingNumber,
          carrier: pkg.carrier,
          trackingUrl: getTrackingUrl(pkg.trackingNumber, pkg.carrier),
          supplierName: pkg.supplierName,
          status: pkg.status,
        })),
        estimatedDelivery: order.estimatedDelivery ?? null,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt,
        shippingAddress,
        trackingStatusMessage: trackingAvailable
          ? trackingPackages.length > 1
            ? "Tracking is available. This order may arrive in multiple packages."
            : "Tracking is available."
          : "Tracking is not available yet. It will appear once AWB is created.",
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
