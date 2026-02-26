import type { OrderStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { deriveOrderFulfillmentSummary } from "@/lib/utils/supplier-fulfillment";

type SyncSource =
  | "order-processor"
  | "dropshipping-tracker"
  | "admin-supplier-order-update"
  | "supplier-order-update"
  | "unknown";

export async function syncParentOrderFromSupplierOrders(
  orderId: string,
  source: SyncSource = "unknown"
) {
  const [order, supplierOrders] = await Promise.all([
    db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        trackingNumber: true,
        carrier: true,
        shippedAt: true,
        deliveredAt: true,
      },
    }),
    db.supplierOrder.findMany({
      where: { orderId },
      select: {
        id: true,
        supplierId: true,
        status: true,
        trackingNumber: true,
        carrier: true,
        shippedAt: true,
        supplierOrderId: true,
      },
    }),
  ]);

  if (!order || supplierOrders.length === 0) {
    return null;
  }

  const summary = deriveOrderFulfillmentSummary(supplierOrders);

  // Preserve manual terminal status unless the derived state is equally terminal.
  if (order.status === "COMPLETED") {
    return { updated: false, orderId, summary, preservedStatus: "COMPLETED" };
  }
  if (order.status === "CANCELLED" && summary.dbOrderStatus !== "CANCELLED") {
    return { updated: false, orderId, summary, preservedStatus: "CANCELLED" };
  }

  const nextStatus = summary.dbOrderStatus as OrderStatus;
  const updateData: Partial<{
    status: OrderStatus;
    trackingNumber: string | null;
    carrier: string | null;
    shippedAt: Date;
    deliveredAt: Date;
  }> = {};

  if (order.status !== nextStatus) {
    updateData.status = nextStatus;
    if (nextStatus === "SHIPPED" && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (nextStatus === "DELIVERED" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
  }

  const uniqueTrackingEntries = Array.from(
    new Map(
      supplierOrders
        .filter(so => so.trackingNumber?.trim())
        .map(so => [
          `${so.trackingNumber!.trim()}::${(so.carrier || "").trim().toUpperCase()}`,
          {
            trackingNumber: so.trackingNumber!.trim(),
            carrier: so.carrier?.trim() || null,
          },
        ])
    ).values()
  );

  if (uniqueTrackingEntries.length === 1) {
    const only = uniqueTrackingEntries[0];
    if (order.trackingNumber !== only.trackingNumber) {
      updateData.trackingNumber = only.trackingNumber;
    }
    if ((order.carrier || null) !== (only.carrier || null)) {
      updateData.carrier = only.carrier;
    }
  }

  let updated = false;
  if (Object.keys(updateData).length > 0) {
    await db.order.update({
      where: { id: orderId },
      data: updateData,
    });
    updated = true;
  }

  if (order.status !== nextStatus) {
    await db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status as OrderStatus,
        toStatus: nextStatus,
        reason: "Status updated based on supplier order progress",
        notes: `Source=${source}; fulfillment=${summary.displayStatus}; counts=${JSON.stringify(summary.byPhase)}`,
      },
    });
  }

  return {
    updated,
    orderId,
    summary,
    nextStatus,
  };
}
