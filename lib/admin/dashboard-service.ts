import { dashboardRange } from "@/lib/admin/dashboard-metrics";
import type {
  DashboardData,
  DashboardSummary,
  TopProduct,
} from "@/lib/admin/dashboard-types";
import { db } from "@/lib/db";

async function orderSummary(start: Date, end: Date, includeEnd = false) {
  const rows = await db.$queryRaw<DashboardSummary[]>`
    SELECT COUNT(*)::int AS "orders",
      COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS "cancelledOrders",
      COUNT(DISTINCT CASE WHEN "status" <> 'CANCELLED' THEN "userId" END)::int AS "customers",
      COUNT(*) FILTER (WHERE "paymentStatus" IN ('PAID', 'COMPLETED')
        AND "status" <> 'CANCELLED' AND UPPER("currency") = 'RON')::int AS "paidOrders",
      COALESCE(SUM(CASE WHEN "paymentStatus" IN ('PAID', 'COMPLETED')
        AND "status" <> 'CANCELLED' AND UPPER("currency") = 'RON'
        THEN "total" ELSE 0 END), 0)::float8 AS "paidOrderValue"
    FROM "Order" WHERE "createdAt" >= ${start}
      AND ("createdAt" < ${end} OR (${includeEnd} AND "createdAt" = ${end}))
  `;
  return rows[0];
}

export async function getOwnerDashboard(
  days: number,
  now = new Date()
): Promise<DashboardData> {
  const range = dashboardRange(days, now);
  const [
    summary,
    previous,
    activeProducts,
    activeSuppliers,
    awaitingPayment,
    shippingReview,
    openReturns,
    outOfStock,
    recentOrders,
    topProducts,
    daily,
  ] = await Promise.all([
    orderSummary(range.start, range.end, true),
    orderSummary(range.previousStart, range.start),
    db.product.count({ where: { isActive: true } }),
    db.supplier.count({ where: { isActive: true } }),
    db.order.count({
      where: {
        status: { not: "CANCELLED" },
        paymentStatus: { in: ["PENDING", "PROCESSING"] },
      },
    }),
    db.order.count({
      where: {
        manualShippingReviewRequired: true,
        status: { notIn: ["CANCELLED", "COMPLETED", "DELIVERED"] },
      },
    }),
    db.return.count({
      where: { status: { in: ["PENDING", "APPROVED", "RECEIVED"] } },
    }),
    db.product.count({
      where: {
        isActive: true,
        stockQuantity: { lte: db.product.fields.reservedQuantity },
      },
    }),
    db.order.findMany({
      take: 6,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        createdAt: true,
        total: true,
        currency: true,
        status: true,
        paymentStatus: true,
        user: { select: { name: true } },
        shippingAddress: { select: { fullName: true } },
      },
    }),
    db.$queryRaw<TopProduct[]>`
      SELECT p."id", p."name", SUM(i."quantity")::int AS "sales",
        SUM(i."price" * i."quantity")::float8 AS "revenue"
      FROM "OrderItem" i JOIN "Order" o ON o."id" = i."orderId"
      JOIN "Product" p ON p."id" = i."productId"
      WHERE o."createdAt" >= ${range.start} AND o."createdAt" <= ${range.end}
        AND o."paymentStatus" IN ('PAID', 'COMPLETED') AND o."status" <> 'CANCELLED'
        AND UPPER(o."currency") = 'RON' AND i."isDigital" = false
      GROUP BY p."id", p."name" ORDER BY "sales" DESC, "revenue" DESC, p."id" ASC LIMIT 5
    `,
    db.$queryRaw<Array<{ date: string; value: number }>>`
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Bucharest', 'YYYY-MM-DD') AS "date",
        SUM("total")::float8 AS "value" FROM "Order"
      WHERE "createdAt" >= ${range.start} AND "createdAt" <= ${range.end}
        AND "paymentStatus" IN ('PAID', 'COMPLETED') AND "status" <> 'CANCELLED'
        AND UPPER("currency") = 'RON'
      GROUP BY "date" ORDER BY "date"
    `,
  ]);
  const values = new Map(daily.map(day => [day.date, day.value]));
  return {
    summary,
    previous,
    catalog: { activeProducts, activeSuppliers },
    attention: { awaitingPayment, shippingReview, openReturns, outOfStock },
    recentOrders: recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.userId,
      customer: order.shippingAddress.fullName || order.user.name || "Client",
      date: order.createdAt.toISOString(),
      amount: order.total,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
    })),
    topProducts,
    salesByDay: range.dates.map(date => ({
      date,
      value: values.get(date) ?? 0,
    })),
    metadata: {
      generatedAt: now.toISOString(),
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      previousStart: range.previousStart.toISOString(),
      days,
      currency: "RON",
      timezone: "Europe/Bucharest",
    },
  };
}
