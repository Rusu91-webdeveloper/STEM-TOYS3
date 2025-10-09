import * as fs from "fs";
import * as path from "path";

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const prisma = new PrismaClient();

async function main() {
  console.log("Checking supplier account details...\n");

  try {
    // Find the supplier user
    const supplierUser = await prisma.user.findUnique({
      where: { email: "supplier@demo.com" },
      include: {
        suppliers: true,
      },
    });

    if (!supplierUser) {
      console.log("❌ Supplier user not found!");
      process.exit(1);
    }

    console.log("✅ Supplier User Found:");
    console.log(`   ID: ${supplierUser.id}`);
    console.log(`   Email: ${supplierUser.email}`);
    console.log(`   Role: ${supplierUser.role}`);
    console.log(`   Active: ${supplierUser.isActive}`);
    console.log(`   Email Verified: ${supplierUser.emailVerified ? "Yes" : "No"}`);

    console.log("\n📋 Supplier Profiles:");
    if (supplierUser.suppliers && supplierUser.suppliers.length > 0) {
      supplierUser.suppliers.forEach((supplier, index) => {
        console.log(`\n   Profile ${index + 1}:`);
        console.log(`   - ID: ${supplier.id}`);
        console.log(`   - Name: ${supplier.name}`);
        console.log(`   - Email: ${supplier.email}`);
        console.log(`   - Status: ${supplier.status}`);
        console.log(`   - Active: ${supplier.isActive}`);
        console.log(`   - User ID Link: ${supplier.userId}`);
      });
    } else {
      console.log("   ❌ No supplier profiles found!");
    }

    // Also check VISITOR account
    console.log("\n\n✅ Checking VISITOR account...");
    const visitorUser = await prisma.user.findUnique({
      where: { email: "visitor@demo.com" },
    });

    if (visitorUser) {
      console.log(`   ID: ${visitorUser.id}`);
      console.log(`   Email: ${visitorUser.email}`);
      console.log(`   Role: ${visitorUser.role}`);
      console.log(`   Active: ${visitorUser.isActive}`);
    } else {
      console.log("   ❌ Visitor user not found!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

