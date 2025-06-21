require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("../app/generated/prisma");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function updateAdmin() {
  try {
    console.log("===== UPDATING ADMIN USER =====");

    // Get credentials from .env.local
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminName = process.env.ADMIN_NAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminName || !adminPassword) {
      console.error("Admin credentials not found in .env.local");
      return;
    }

    console.log(
      `Using admin credentials from .env.local: ${adminName} (${adminEmail})`
    );

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Delete all existing admin users
    console.log("\nDeleting existing admin users...");
    const deletedAdmins = await prisma.user.deleteMany({
      where: {
        role: "ADMIN",
      },
    });
    console.log(`Deleted ${deletedAdmins.count} existing admin users`);

    // Create new admin user with credentials from .env.local
    console.log("\nCreating new admin user from .env.local credentials...");
    const newAdmin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
      },
    });
    console.log(`Created new admin user: ${newAdmin.name} (${newAdmin.email})`);

    console.log("\n===== ADMIN USER UPDATED =====");
  } catch (error) {
    console.error("Error updating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin().then(() => {
  console.log("\nChecking database after admin update...");
  require("./check-database");
});
