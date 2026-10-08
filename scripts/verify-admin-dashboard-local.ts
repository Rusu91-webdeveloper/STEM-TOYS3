import assert from "node:assert/strict";
import { config } from "dotenv";
import { seedAdminDashboardFixture } from "./admin-dashboard-local-fixture";

async function main() {
  config({ path: ".env.local" });
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    url.hostname !== "localhost" ||
    url.port !== "55434" ||
    url.pathname !== "/stemtoys_admin_dev"
  ) {
    throw new Error(
      "This fixture requires the isolated localhost:55434/stemtoys_admin_dev database."
    );
  }
  const { db } = await import("@/lib/db");
  const { getOwnerDashboard } = await import("@/lib/admin/dashboard-service");
  try {
    if (!process.argv.includes("--verify-only"))
      await seedAdminDashboardFixture(db);
    const anchor = await db.order.findUniqueOrThrow({
      where: { orderNumber: "DEMO-1001" },
      select: { createdAt: true },
    });
    const result = await getOwnerDashboard(30, anchor.createdAt);
    assert.equal(result.summary.paidOrderValue, 420);
    assert.equal(result.summary.paidOrders, 3);
    assert.equal(result.summary.orders, 7);
    assert.equal(result.summary.cancelledOrders, 1);
    assert.equal(result.summary.customers, 2);
    assert.equal(result.previous.paidOrderValue, 30);
    assert.equal(result.attention.awaitingPayment, 1);
    assert.equal(result.attention.openReturns, 1);
    assert.equal(result.attention.outOfStock, 1);
    assert.equal(result.topProducts[0].id, "dashboard-robot");
    assert.equal(result.topProducts[0].sales, 2);
    assert.equal(result.topProducts[0].revenue, 240);
    assert.ok(
      !result.topProducts.some(product => product.id === "dashboard-unsold")
    );
    assert.equal(result.salesByDay.length, 30);
    assert.equal(
      result.salesByDay.reduce((sum, day) => sum + day.value, 0),
      420
    );
    assert.ok(
      result.recentOrders.every(record => record.id !== record.orderNumber)
    );
    const { getCustomerList } = await import("@/lib/admin/customer-list");
    const high = await getCustomerList(
      new URLSearchParams("limit=1&sortBy=spent-high")
    );
    assert.equal(high.pagination.total, 2);
    assert.equal(high.pagination.pages, 2);
    assert.equal(high.customers[0].id, "dashboard-guest");
    assert.equal(high.customers[0].spent, 330);
    const second = await getCustomerList(
      new URLSearchParams("page=2&limit=1&sortBy=spent-high")
    );
    assert.equal(second.customers[0].id, "dashboard-customer");
    assert.equal(second.customers[0].spent, 120);
    const active = await getCustomerList(
      new URLSearchParams("status=active&sortBy=spent-high")
    );
    assert.equal(active.pagination.total, 1);
    assert.equal(active.customers[0].id, "dashboard-customer");
    const pattern = await getCustomerList(
      new URLSearchParams("search=%25&sortBy=spent-high")
    );
    assert.equal(pattern.customers.length, pattern.pagination.total);
    assert.equal(pattern.pagination.total, 2);
    console.log(
      "Local PostgreSQL verification passed: payment/cancellation/refund/currency exclusions, guest customers, actual product ranking, reserved stock, prior period and daily totals."
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
