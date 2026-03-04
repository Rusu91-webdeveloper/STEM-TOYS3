/**
 * COD (Cash on Delivery) Analytics
 *
 * Tracks COD order performance, rejection rates, and related metrics
 */

import { db } from "@/lib/db";
import { PaymentStatus, OrderStatus } from "@prisma/client";

export interface CODAnalyticsResult {
  /** Total COD orders */
  totalCODOrders: number;
  /** COD orders that were successfully delivered and paid */
  successfulCODOrders: number;
  /** COD orders that were rejected (customer refused to pay) */
  rejectedCODOrders: number;
  /** COD orders pending delivery */
  pendingCODOrders: number;
  /** COD rejection rate (percentage) */
  rejectionRate: number;
  /** Total COD amount collected */
  totalCODCollected: number;
  /** Total COD amount rejected */
  totalCODRejected: number;
  /** Average COD order value */
  averageCODOrderValue: number;
  /** COD orders by status */
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export interface CODRejectionReason {
  reason: string;
  count: number;
  percentage: number;
}

/**
 * Get COD analytics for a date range
 *
 * @param startDate - Start date (defaults to 30 days ago)
 * @param endDate - End date (defaults to now)
 * @returns COD analytics result
 */
export async function getCODAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<CODAnalyticsResult> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  // Get all COD orders in the date range
  const codOrders = await db.order.findMany({
    where: {
      paymentMethod: "cash_on_delivery",
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      total: true,
      status: true,
      paymentStatus: true,
      notes: true,
      deliveredAt: true,
      cancelledAt: true,
    },
  });

  const totalCODOrders = codOrders.length;

  // Categorize orders
  const successfulCODOrders = codOrders.filter(
    order =>
      order.paymentStatus === "PAID" &&
      (order.status === "DELIVERED" || order.status === "COMPLETED")
  ).length;

  // Rejected orders: cancelled after being shipped/processing, or notes contain "rejected"
  const rejectedCODOrders = codOrders.filter(order => {
    const isCancelledAfterProcessing =
      order.status === "CANCELLED" &&
      (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");
    const hasRejectionNote =
      order.notes?.toLowerCase().includes("rejected") ||
      order.notes?.toLowerCase().includes("refused") ||
      order.notes?.toLowerCase().includes("cod rejected");
    return isCancelledAfterProcessing || hasRejectionNote;
  }).length;

  const pendingCODOrders = codOrders.filter(
    order =>
      order.paymentStatus === "PENDING" &&
      order.status !== "CANCELLED" &&
      order.status !== "DELIVERED"
  ).length;

  // Calculate rejection rate
  const completedOrders = successfulCODOrders + rejectedCODOrders;
  const rejectionRate =
    completedOrders > 0 ? (rejectedCODOrders / completedOrders) * 100 : 0;

  // Calculate totals
  const totalCODCollected = codOrders
    .filter(
      order =>
        order.paymentStatus === "PAID" &&
        (order.status === "DELIVERED" || order.status === "COMPLETED")
    )
    .reduce((sum, order) => sum + order.total, 0);

  const totalCODRejected = codOrders
    .filter(order => {
      const isCancelledAfterProcessing =
        order.status === "CANCELLED" &&
        (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");
      const hasRejectionNote =
        order.notes?.toLowerCase().includes("rejected") ||
        order.notes?.toLowerCase().includes("refused");
      return isCancelledAfterProcessing || hasRejectionNote;
    })
    .reduce((sum, order) => sum + order.total, 0);

  const averageCODOrderValue =
    totalCODOrders > 0
      ? codOrders.reduce((sum, order) => sum + order.total, 0) / totalCODOrders
      : 0;

  // Orders by status
  const ordersByStatus = {
    pending: codOrders.filter(order => order.status === "PROCESSING").length,
    processing: codOrders.filter(order => order.status === "PROCESSING").length,
    shipped: codOrders.filter(order => order.status === "SHIPPED").length,
    delivered: codOrders.filter(
      order => order.status === "DELIVERED" || order.status === "COMPLETED"
    ).length,
    cancelled: codOrders.filter(order => order.status === "CANCELLED").length,
  };

  return {
    totalCODOrders,
    successfulCODOrders,
    rejectedCODOrders,
    pendingCODOrders,
    rejectionRate: Math.round(rejectionRate * 100) / 100,
    totalCODCollected: Math.round(totalCODCollected * 100) / 100,
    totalCODRejected: Math.round(totalCODRejected * 100) / 100,
    averageCODOrderValue: Math.round(averageCODOrderValue * 100) / 100,
    ordersByStatus,
  };
}

/**
 * Mark a COD order as rejected
 *
 * @param orderId - Order ID
 * @param reason - Rejection reason
 * @param notes - Additional notes
 */
export async function markCODOrderAsRejected(
  orderId: string,
  reason: string,
  notes?: string
): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true, notes: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.paymentMethod !== "cash_on_delivery") {
    throw new Error(`Order ${orderId} is not a COD order`);
  }

  const rejectionNote = `COD REJECTED - Reason: ${reason}${
    notes ? ` | ${notes}` : ""
  }`;
  const mergedNotes = [order.notes, rejectionNote].filter(Boolean).join(" | ");

  // Update order status and notes
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "FAILED",
      status: "CANCELLED",
      notes: mergedNotes || null,
    },
  });
}

/**
 * Get COD rejection reasons (parsed from notes)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of rejection reasons with counts
 */
export async function getCODRejectionReasons(
  startDate?: Date,
  endDate?: Date
): Promise<CODRejectionReason[]> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const rejectedOrders = await db.order.findMany({
    where: {
      paymentMethod: "cash_on_delivery",
      status: "CANCELLED",
      paymentStatus: "FAILED",
      createdAt: {
        gte: start,
        lte: end,
      },
      notes: {
        contains: "COD REJECTED",
      },
    },
    select: {
      notes: true,
    },
  });

  // Parse reasons from notes
  const reasonCounts: Record<string, number> = {};
  rejectedOrders.forEach(order => {
    const reasonMatch = order.notes?.match(/Reason: ([^|]+)/);
    if (reasonMatch) {
      const reason = reasonMatch[1].trim();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    } else {
      reasonCounts["Unknown"] = (reasonCounts["Unknown"] || 0) + 1;
    }
  });

  const total = rejectedOrders.length;
  const reasons: CODRejectionReason[] = Object.entries(reasonCounts).map(
    ([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
    })
  );

  return reasons.sort((a, b) => b.count - a.count);
}

/**
 * Get COD performance metrics for dashboard
 */
export async function getCODPerformanceMetrics(): Promise<{
  today: CODAnalyticsResult;
  week: CODAnalyticsResult;
  month: CODAnalyticsResult;
  rejectionTrend: Array<{ date: string; rate: number }>;
}> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayMetrics, weekMetrics, monthMetrics] = await Promise.all([
    getCODAnalytics(today, now),
    getCODAnalytics(weekAgo, now),
    getCODAnalytics(monthAgo, now),
  ]);

  // Calculate rejection trend (last 7 days)
  const rejectionTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayMetrics = await getCODAnalytics(dayStart, dayEnd);
    rejectionTrend.push({
      date: dayStart.toISOString().split("T")[0],
      rate: dayMetrics.rejectionRate,
    });
  }

  return {
    today: todayMetrics,
    week: weekMetrics,
    month: monthMetrics,
    rejectionTrend,
  };
}
