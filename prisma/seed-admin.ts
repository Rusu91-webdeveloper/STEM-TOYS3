import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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
  console.log("Starting admin user seeding...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      "Admin credentials not properly set in environment variables"
    );
    console.error("Please set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD");
    process.exit(1);
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
    });

    if (existingAdmin) {
      console.log(
        `Admin user with email ${adminEmail} already exists. Skipping creation.`
      );
    } else {
      // Hash the admin password
      const hashedPassword = await hash(adminPassword, 12);

      // Create the admin user
      const admin = await prisma.user.create({
        data: {
          name: adminName || "Admin User",
          email: adminEmail,
          password: hashedPassword,
          isActive: true,
          role: "ADMIN",
        },
      });

      console.log(`Admin user created: ${admin.email}`);
    }

    console.log("Admin user seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
