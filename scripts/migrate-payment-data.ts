import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migratePaymentData() {
  console.log("Starting payment data migration from Stripe to Netopia...");

  try {
    // Get all orders with Stripe payment intent IDs
    const ordersWithStripeData = await prisma.order.findMany({
      where: {
        stripePaymentIntentId: {
          not: null,
        },
      },
      select: {
        id: true,
        stripePaymentIntentId: true,
        orderNumber: true,
        paymentStatus: true,
      },
    });

    console.log(
      `Found ${ordersWithStripeData.length} orders with Stripe payment data`
    );

    let migratedCount = 0;
    let skippedCount = 0;

    for (const order of ordersWithStripeData) {
      try {
        // Skip if Netopia fields are already populated
        const existingOrder = await prisma.order.findUnique({
          where: { id: order.id },
          select: {
            netopiaTransactionId: true,
            netopiaInvoiceId: true,
          },
        });

        if (
          existingOrder?.netopiaTransactionId ||
          existingOrder?.netopiaInvoiceId
        ) {
          console.log(
            `Skipping order ${order.orderNumber} - already has Netopia data`
          );
          skippedCount++;
          continue;
        }

        // Create Netopia placeholder data from Stripe data
        const netopiaTransactionId = `migrated_${order.stripePaymentIntentId}`;
        const netopiaInvoiceId = `invoice_${order.id}`;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            netopiaTransactionId,
            netopiaInvoiceId,
            // Keep the Stripe data for backward compatibility
            // Add a note that this was migrated
            notes: order.notes
              ? `${order.notes}\n[MIGRATED FROM STRIPE: ${order.stripePaymentIntentId}]`
              : `[MIGRATED FROM STRIPE: ${order.stripePaymentIntentId}]`,
          },
        });

        console.log(
          `Migrated order ${order.orderNumber}: ${order.stripePaymentIntentId} -> ${netopiaTransactionId}`
        );
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate order ${order.id}:`, error);
      }
    }

    // Generate migration report
    console.log("\n=== MIGRATION REPORT ===");
    console.log(
      `Total orders with Stripe data: ${ordersWithStripeData.length}`
    );
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already migrated): ${skippedCount}`);
    console.log(
      `Failed: ${ordersWithStripeData.length - migratedCount - skippedCount}`
    );

    // Validate migration
    const validationResult = await validateMigration();
    console.log("\n=== VALIDATION RESULTS ===");
    console.log(
      `Orders with Netopia data: ${validationResult.ordersWithNetopiaData}`
    );
    console.log(
      `Orders still missing Netopia data: ${validationResult.ordersMissingNetopiaData}`
    );
    console.log(
      `Data integrity check: ${validationResult.dataIntegrity ? "PASSED" : "FAILED"}`
    );
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function validateMigration() {
  const totalOrders = await prisma.order.count();
  const ordersWithNetopiaData = await prisma.order.count({
    where: {
      OR: [
        { netopiaTransactionId: { not: null } },
        { netopiaInvoiceId: { not: null } },
      ],
    },
  });

  const ordersWithStripeData = await prisma.order.count({
    where: {
      stripePaymentIntentId: { not: null },
    },
  });

  // Check data integrity - all orders with Stripe data should have Netopia placeholders
  const ordersMissingNetopiaData = await prisma.order.count({
    where: {
      stripePaymentIntentId: { not: null },
      OR: [{ netopiaTransactionId: null }, { netopiaInvoiceId: null }],
    },
  });

  return {
    totalOrders,
    ordersWithNetopiaData,
    ordersWithStripeData,
    ordersMissingNetopiaData,
    dataIntegrity: ordersMissingNetopiaData === 0,
  };
}

// Run migration if this script is executed directly
if (require.main === module) {
  migratePaymentData()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migratePaymentData, validateMigration };
