#!/usr/bin/env tsx

/**
 * Script to set up admin credentials for testing
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function setupAdminCredentials() {
  try {
    console.log("🔐 Setting up admin credentials...");

    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    console.log(`\n👑 Found ${adminUsers.length} admin users:`);

    for (const user of adminUsers) {
      console.log(
        `\n📧 Setting up credentials for: ${user.name} (${user.email})`
      );

      // Check if user already has a password
      if (user.password && user.password.length > 0) {
        console.log(`   ✅ User already has a password set`);
        continue;
      }

      // Set a temporary password for testing
      const tempPassword = "admin123";
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log(`   🔑 Set temporary password: ${tempPassword}`);
      console.log(`   ⚠️  Remember to change this password after testing!`);
    }

    console.log(`\n✅ Admin credentials setup complete!`);
    console.log(`\n🔑 You can now log in with:`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. Email: ${user.email}`);
      console.log(`      Password: admin123`);
    });

    console.log(`\n📝 To test:`);
    console.log(`   1. Go to http://localhost:3000/auth/login`);
    console.log(`   2. Use the credentials above`);
    console.log(
      `   3. Navigate to http://localhost:3000/admin/email-templates`
    );
  } catch (error) {
    console.error("💥 Error setting up admin credentials:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminCredentials().catch(console.error);
