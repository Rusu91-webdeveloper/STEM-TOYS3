/**
 * Script to fix COD orders that are DELIVERED but still have PENDING payment status
 * 
 * This script updates the paymentStatus to PAID for all COD orders that are marked as DELIVERED
 * since in real-world business logic, payment is collected when the order is delivered.
 * 
 * Usage:
 *   pnpm tsx scripts/fix-cod-payment-status.ts [--dry-run]
 * 
 * Options:
 *   --dry-run: Preview changes without actually updating the database
 */

import { db } from "@/lib/db";

async function fixCODPaymentStatus(dryRun: boolean = false) {
  console.log("🔍 Searching for COD orders with DELIVERED status and PENDING payment...\n");

  try {
    // Find all COD orders that are delivered but payment is still pending
    const affectedOrders = await db.order.findMany({
      where: {
        AND: [
          {
            OR: [
              { paymentMethod: "cash_on_delivery" },
              { paymentMethod: "cod" },
            ],
          },
          { status: "DELIVERED" },
          { paymentStatus: "PENDING" },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        total: true,
        deliveredAt: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deliveredAt: "desc",
      },
    });

    if (affectedOrders.length === 0) {
      console.log("✅ No orders found that need fixing!");
      console.log("All COD orders that are delivered already have PAID payment status.\n");
      return;
    }

    console.log(`📊 Found ${affectedOrders.length} orders that need fixing:\n`);

    // Display affected orders
    affectedOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderNumber}`);
      console.log(`   Customer: ${order.user?.name || "N/A"} (${order.user?.email || "N/A"})`);
      console.log(`   Payment Method: ${order.paymentMethod}`);
      console.log(`   Order Status: ${order.status}`);
      console.log(`   Payment Status: ${order.paymentStatus} → PAID`);
      console.log(`   Total: ${order.total.toFixed(2)} RON`);
      console.log(`   Delivered At: ${order.deliveredAt?.toISOString() || "N/A"}`);
      console.log("");
    });

    if (dryRun) {
      console.log("🚫 DRY RUN MODE - No changes were made to the database.");
      console.log(`Would have updated ${affectedOrders.length} orders.\n`);
      return;
    }

    // Confirm before proceeding
    console.log("⚠️  About to update payment status to PAID for these orders.");
    console.log("Press Ctrl+C to cancel, or waiting 5 seconds to proceed...\n");
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update all affected orders
    const orderIds = affectedOrders.map(order => order.id);

    const result = await db.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        paymentStatus: "PAID",
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Successfully updated ${result.count} orders!`);
    console.log(`Payment status changed from PENDING to PAID for all COD delivered orders.\n`);

    // Display summary
    const totalAmount = affectedOrders.reduce((sum, order) => sum + order.total, 0);
    console.log("📈 Summary:");
    console.log(`   Orders Updated: ${result.count}`);
    console.log(`   Total Order Value: ${totalAmount.toFixed(2)} RON`);
    console.log("");

  } catch (error) {
    console.error("❌ Error fixing COD payment status:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (dryRun) {
    console.log("🔍 Running in DRY RUN mode - no changes will be made\n");
  }

  await fixCODPaymentStatus(dryRun);

  console.log("✨ Script completed successfully!");
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
