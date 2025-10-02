require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkTables() {
  console.log("🔍 Checking database tables...\n");

  try {
    // Check what tables exist by trying to query them (from schema.prisma)
    const tables = [
      "User",
      "PasswordResetToken",
      "Address",
      "PaymentCard",
      "Category",
      "Product",
      "Wishlist",
      "Supplier",
      "Blog",
      "Book",
      "DigitalFile",
      "Language",
      "Order",
      "OrderStatusHistory",
      "OrderItem",
      "StoreSettings",
      "PerformanceMetric",
      "ConversionLog",
      "Campaign",
      "CampaignApplication",
      "AutomationWorkflow",
      "SupplierOrder",
      "SupplierInvoice",
      "SupplierMessage",
      "SupplierNotification",
      "SupplierSupportTicket",
      "SupplierTicketResponse",
      "SupplierAnnouncement",
      "Return",
      "Review",
      "Newsletter",
      "EmailTemplate",
      "EmailCampaign",
      "EmailSequence",
      "EmailSequenceStep",
      "EmailSequenceUser",
      "EmailEvent",
      "DigitalDownload",
      "Coupon",
      "CouponUsage",
      "ContentVersion",
      "Session",
      "ImageMetadata",
      "ImageProcessingLog",
    ];

    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ ${table}: ${count} records`);
      } catch (error) {
        console.log(
          `❌ ${table}: Table doesn't exist or error - ${error.message}`
        );
      }
    }

    console.log("\n✅ Table check complete");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
