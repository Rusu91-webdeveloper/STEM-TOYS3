import type { OrderStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { deriveOrderFulfillmentSummary } from "@/lib/utils/supplier-fulfillment";
import { releaseCodGuaranteeHoldIfNeeded } from "@/lib/utils/order-status-management";

type SyncSource =
  | "order-processor"
  | "dropshipping-tracker"
  | "admin-supplier-order-update"
  | "supplier-order-update"
  | "courier-status-sync"
  | "courier-status-sync-direct"
  | "unknown";

type OrderSyncState = {
  id: string;
  status: OrderStatus;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
};

const isCodPaymentMethod = (paymentMethod?: string | null) =>
  paymentMethod === "cash_on_delivery" || paymentMethod === "cod";

export async function applyDerivedOrderUpdate(params: {
  order: OrderSyncState;
  nextStatus: OrderStatus;
  reason: string;
  notes: string;
  trackingNumber?: string | null;
  carrier?: string | null;
}) {
  const { order, nextStatus, reason, notes, trackingNumber, carrier } = params;

  const updateData: Partial<{
    status: OrderStatus;
    trackingNumber: string | null;
    carrier: string | null;
    shippedAt: Date;
    deliveredAt: Date;
    paymentStatus: "PAID";
  }> = {};

  if (order.status !== nextStatus) {
    updateData.status = nextStatus;
    if (nextStatus === "SHIPPED" && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (nextStatus === "DELIVERED" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    if (
      nextStatus === "DELIVERED" &&
      isCodPaymentMethod(order.paymentMethod) &&
      order.paymentStatus !== "PAID"
    ) {
      updateData.paymentStatus = "PAID";
    }
  }

  if (typeof trackingNumber !== "undefined" && order.trackingNumber !== trackingNumber) {
    updateData.trackingNumber = trackingNumber;
  }

  if (typeof carrier !== "undefined" && (order.carrier || null) !== (carrier || null)) {
    updateData.carrier = carrier || null;
  }

  let updated = false;
  if (Object.keys(updateData).length > 0) {
    await db.order.update({
      where: { id: order.id },
      data: updateData,
    });
    updated = true;
  }

  if (order.status !== nextStatus) {
    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        reason,
        notes,
      },
    });

    if (nextStatus === "DELIVERED" && isCodPaymentMethod(order.paymentMethod)) {
      await releaseCodGuaranteeHoldIfNeeded({
        orderId: order.id,
        notes: order.notes,
      });
    }
  }

  return { updated };
}

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
        paymentMethod: true,
        paymentStatus: true,
        notes: true,
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
    const result = await applyDerivedOrderUpdate({
      order,
      nextStatus,
      reason: "Status updated based on supplier order progress",
      notes: `Source=${source}; fulfillment=${summary.displayStatus}; counts=${JSON.stringify(summary.byPhase)}`,
      trackingNumber: only.trackingNumber,
      carrier: only.carrier,
    });
    return {
      updated: result.updated,
      orderId,
      summary,
      nextStatus,
    };
  } else {
    const result = await applyDerivedOrderUpdate({
      order,
      nextStatus,
      reason: "Status updated based on supplier order progress",
      notes: `Source=${source}; fulfillment=${summary.displayStatus}; counts=${JSON.stringify(summary.byPhase)}`,
    });
    return {
      updated: result.updated,
      orderId,
      summary,
      nextStatus,
    };
  }
}
