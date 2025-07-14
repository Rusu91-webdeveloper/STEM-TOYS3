import { db } from "../lib/db";
import { OrderStatus } from "@prisma/client";

async function autoCompleteOrders() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS);

  // Find eligible orders
  const eligibleOrders = await db.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
      deliveredAt: {
        lte: cutoff,
      },
    },
    select: { id: true, orderNumber: true, deliveredAt: true },
  });

  if (eligibleOrders.length === 0) {
    console.log("No orders eligible for auto-completion.");
    process.exit(0);
  }

  // Update all eligible orders
  const updateResults = await Promise.all(
    eligibleOrders.map(order =>
      db.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED },
      })
    )
  );

  console.log(
    `Auto-completed ${updateResults.length} order(s):`,
    updateResults.map(o => o.orderNumber)
  );
  process.exit(0);
}

// Run the script
autoCompleteOrders().catch(err => {
  console.error("Error auto-completing orders:", err);
  process.exit(1);
});
