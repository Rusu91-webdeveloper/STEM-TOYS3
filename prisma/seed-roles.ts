import * as fs from "fs";
import * as path from "path";

import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import * as dotenv from "dotenv";

// Load environment variables from .env.local file
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("Loaded environment variables from .env.local");
} else {
  dotenv.config(); // Fallback to .env if .env.local doesn't exist
  console.log("Loaded environment variables from .env (fallback)");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Starting VISITOR and SUPPLIER user seeding...");

  try {
    // Create VISITOR user for demo mode
    const visitorEmail = "visitor@demo.com";
    const visitorPassword = "Visitor123!";

    const existingVisitor = await prisma.user.findUnique({
      where: { email: visitorEmail },
    });

    if (existingVisitor) {
      console.log(
        `Visitor user with email ${visitorEmail} already exists. Skipping creation.`
      );
    } else {
      const hashedVisitorPassword = await hash(visitorPassword, 12);

      const visitor = await prisma.user.create({
        data: {
          name: "Demo Visitor",
          email: visitorEmail,
          password: hashedVisitorPassword,
          isActive: true,
          role: "VISITOR",
          emailVerified: new Date(),
        },
      });

      console.log(`✅ Visitor user created: ${visitor.email}`);
      console.log(`   Email: ${visitorEmail}`);
      console.log(`   Password: ${visitorPassword}`);
      console.log(`   Role: VISITOR (Read-Only Demo Mode)`);
    }

    // Create SUPPLIER user with approved supplier profile
    const supplierEmail = "supplier@demo.com";
    const supplierPassword = "Supplier123!";

    const existingSupplier = await prisma.user.findUnique({
      where: { email: supplierEmail },
    });

    if (existingSupplier) {
      console.log(
        `Supplier user with email ${supplierEmail} already exists. Skipping creation.`
      );
    } else {
      const hashedSupplierPassword = await hash(supplierPassword, 12);

      // Create the supplier user
      const supplier = await prisma.user.create({
        data: {
          name: "Demo Supplier",
          email: supplierEmail,
          password: hashedSupplierPassword,
          isActive: true,
          role: "SUPPLIER",
          emailVerified: new Date(),
        },
      });

      // Create supplier profile
      const supplierProfile = await prisma.supplier.create({
        data: {
          userId: supplier.id,
          name: "Demo Supplier",
          companyName: "Demo Supplier Company",
          email: supplierEmail,
          phone: "+40712345678",
          address: {
            street: "Str. Demo 123",
            city: "Bucharest",
            country: "RO",
          },
          businessAddress: "Str. Demo 123",
          businessCity: "Bucharest",
          businessCountry: "RO",
          businessWebsite: "https://demo-supplier.com",
          taxId: "RO12345678",
          registrationNumber: "J40/1234/2024",
          contactPersonName: "Demo Contact",
          contactPersonEmail: supplierEmail,
          contactPersonPhone: "+40712345678",
          commissionRate: 15,
          status: "APPROVED", // Important: Set as approved so supplier can access dashboard
          description:
            "Demo supplier for testing and showcasing supplier features",
        },
      });

      console.log(`✅ Supplier user created: ${supplier.email}`);
      console.log(`   Email: ${supplierEmail}`);
      console.log(`   Password: ${supplierPassword}`);
      console.log(`   Role: SUPPLIER`);
      console.log(`   Supplier Profile ID: ${supplierProfile.id}`);
      console.log(`   Status: APPROVED`);
    }

    console.log(
      "\n🎉 VISITOR and SUPPLIER user seeding completed successfully!"
    );
    console.log("\n📝 Test Accounts:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("VISITOR Account (Demo Mode - Read Only):");
    console.log(`  Email: ${visitorEmail}`);
    console.log(`  Password: Visitor123!`);
    console.log("  Access: Admin Dashboard + Supplier Dashboard (Read Only)");
    console.log("\nSUPPLIER Account:");
    console.log(`  Email: ${supplierEmail}`);
    console.log(`  Password: Supplier123!`);
    console.log("  Access: Supplier Dashboard (Full Access)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Error seeding VISITOR/SUPPLIER users:", error);
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
