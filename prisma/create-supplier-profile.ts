import * as fs from "fs";
import * as path from "path";

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables from .env.local file
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("Loaded environment variables from .env.local");
} else {
  dotenv.config();
  console.log("Loaded environment variables from .env (fallback)");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Creating supplier profile for existing supplier user...");

  try {
    // Find the supplier user
    const supplierUser = await prisma.user.findUnique({
      where: { email: "supplier@demo.com" },
      include: {
        suppliers: true,
      },
    });

    if (!supplierUser) {
      console.log(
        "❌ Supplier user not found. Please run seed-roles.ts first."
      );
      process.exit(1);
    }

    console.log(`✅ Found supplier user: ${supplierUser.email}`);

    // Check if supplier profile already exists
    if (supplierUser.suppliers && supplierUser.suppliers.length > 0) {
      console.log(
        `✅ Supplier profile already exists (ID: ${supplierUser.suppliers[0].id})`
      );
      console.log("   Status:", supplierUser.suppliers[0].status);
      process.exit(0);
    }

    // Create supplier profile with minimal required fields
    const supplierProfile = await prisma.supplier.create({
      data: {
        name: "Demo Supplier",
        email: "supplier@demo.com",
        phone: "+40712345678",
        user: {
          connect: { id: supplierUser.id },
        },
      },
    });

    console.log(`\n✅ Supplier profile created successfully!`);
    console.log(`   Profile ID: ${supplierProfile.id}`);
    console.log(`   Company: ${supplierProfile.companyName}`);
    console.log(`   Status: ${supplierProfile.status}`);
    console.log(`\n🎉 Supplier account is now fully configured!`);
  } catch (error) {
    console.error("❌ Error creating supplier profile:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
