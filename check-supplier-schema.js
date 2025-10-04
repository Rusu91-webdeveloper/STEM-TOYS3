const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkSupplierSchema() {
  try {
    // Get the current supplier table structure
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Supplier'
      ORDER BY ordinal_position;
    `;

    console.log("Current Supplier table structure:");
    console.log(result);

    // Check if there are any suppliers
    const supplierCount = await prisma.supplier.count();
    console.log(`Total suppliers in database: ${supplierCount}`);

    if (supplierCount > 0) {
      const sampleSupplier = await prisma.supplier.findFirst();
      console.log("Sample supplier:", JSON.stringify(sampleSupplier, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSupplierSchema();
