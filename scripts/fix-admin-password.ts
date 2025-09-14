#!/usr/bin/env tsx

/**
 * Script to fix admin user password
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log("🔧 Fixing admin user password...");

    // Find the admin user that doesn't have the right password
    const adminUser = await prisma.user.findUnique({
      where: { email: "rusu.emanuel.webdeveloper@gmail.com" },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!adminUser) {
      console.log("❌ Admin user not found");
      return;
    }

    console.log(
      `\\n📧 Found admin user: ${adminUser.name} (${adminUser.email})`
    );
    console.log(
      `   Current password hash: ${adminUser.password?.substring(0, 20)}...`
    );

    // Hash the new password
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    console.log(`\\n🔐 Setting new password: ${newPassword}`);
    console.log(`   New password hash: ${hashedPassword.substring(0, 20)}...`);

    // Update the password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    console.log("\\n✅ Password updated successfully!");

    // Verify the new password
    const verifyPassword = await bcrypt.compare(newPassword, hashedPassword);
    console.log(
      `\\n🧪 Password verification: ${verifyPassword ? "SUCCESS" : "FAILED"}`
    );
  } catch (error) {
    console.error("❌ Error fixing admin password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
