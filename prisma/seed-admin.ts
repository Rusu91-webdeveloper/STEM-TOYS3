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
  console.log("Starting admin user seeding...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
    console.error(
      "Admin credentials not properly set in environment variables"
    );
    console.error(
      "Please set ADMIN_EMAIL, ADMIN_NAME, and either ADMIN_PASSWORD or ADMIN_PASSWORD_HASH"
    );
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
      // Use existing hash if available, otherwise hash the password
      let hashedPassword: string;
      if (adminPasswordHash) {
        hashedPassword = adminPasswordHash;
        console.log("Using pre-hashed password from ADMIN_PASSWORD_HASH");
      } else {
        hashedPassword = await hash(adminPassword!, 12);
        console.log("Hashing password from ADMIN_PASSWORD");
      }

      // Create the admin user
      const admin = await prisma.user.create({
        data: {
          name: adminName || "Admin User",
          email: adminEmail,
          password: hashedPassword,
          isActive: true,
          role: "ADMIN",
          emailVerified: new Date(),
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
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
