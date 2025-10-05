require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabaseIndexes() {
  console.log("🔍 Checking database indexes directly...\n");

  try {
    // Check what indexes exist on the User table
    const indexes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'User'
      ORDER BY indexname;
    `;

    console.log("📊 User table indexes in database:");
    console.log("===================================");

    if (indexes.length === 0) {
      console.log("❌ No indexes found on User table");
    } else {
      indexes.forEach((index, i) => {
        console.log(`${i + 1}. ${index.indexname}: ${index.indexdef}`);
      });
    }

    // Check table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `;

    console.log("\n📋 User table columns:");
    console.log("======================");
    tableInfo.forEach((col, i) => {
      console.log(
        `${i + 1}. ${col.column_name}: ${col.data_type} ${col.is_nullable === "YES" ? "(nullable)" : "(required)"} ${col.column_default ? `default: ${col.column_default}` : ""}`
      );
    });
  } catch (error) {
    console.error("❌ Index check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseIndexes();
